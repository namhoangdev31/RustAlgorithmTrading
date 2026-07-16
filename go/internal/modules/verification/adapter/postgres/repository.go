package postgres

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"trading/control-gateway/internal/modules/verification/domain"
	"trading/control-gateway/internal/platform/database"
	shared "trading/control-gateway/internal/shared/application"
)

const consumerName = "verification-orchestrator-v1"

type Repository struct{ db *sql.DB }

func New(database *database.Postgres) *Repository { return &Repository{db: database.SQL()} }

func (r *Repository) StartRun(ctx context.Context, messageID, eventKey string, req domain.VerificationRequest) (string, bool, error) {
	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable})
	if err != nil {
		return "", false, err
	}
	defer func() { _ = tx.Rollback() }()

	inboxID := uuid.NewString()
	result, err := tx.ExecContext(ctx, `INSERT INTO verification_inbox (id, consumer, message_id, outcome, processed_at)
		VALUES ($1,$2,$3,'accepted',NOW()) ON CONFLICT (consumer,message_id) DO NOTHING`, inboxID, consumerName, messageID)
	if err != nil {
		return "", false, fmt.Errorf("insert verification inbox: %w", err)
	}
	inserted, _ := result.RowsAffected()
	if inserted == 0 {
		var runID string
		err = tx.QueryRowContext(ctx, `SELECT id::text FROM verification_runs WHERE trigger_event_key=$1`, eventKey).Scan(&runID)
		if errors.Is(err, sql.ErrNoRows) {
			return "", false, nil
		}
		return runID, false, err
	}

	var projectID, bundleID, checksum, provider, bucket, key, contentType string
	var size int64
	err = tx.QueryRowContext(ctx, `SELECT b.project_id::text, br.bundle_id::text, ba.checksum_sha256,
		ba.storage_provider, ba.storage_bucket, ba.storage_key, ba.file_size, ba.content_type
		FROM bundle_releases br JOIN bundles b ON b.id=br.bundle_id
		JOIN bundle_artifacts ba ON ba.release_id=br.id
		WHERE br.id=$1 AND ba.id=$2 AND ba.kind='full'`, req.ReleaseID, req.Artifact.ID).
		Scan(&projectID, &bundleID, &checksum, &provider, &bucket, &key, &size, &contentType)
	if err != nil {
		return "", false, fmt.Errorf("verify release artifact: %w", err)
	}
	if projectID != req.ProjectID || bundleID != req.BundleID || checksum != req.Artifact.ChecksumSHA256 || size != req.Artifact.SizeBytes {
		return "", false, errors.New("verification request artifact identity does not match canonical release")
	}

	var pipelineID, policyID string
	var definition []byte
	err = tx.QueryRowContext(ctx, `SELECT id::text, definition FROM verification_pipeline_versions
		WHERE ($1<>'' AND id::text=$1) OR ($1='' AND is_active=true) ORDER BY created_at DESC LIMIT 1`, req.PipelineVersionID).
		Scan(&pipelineID, &definition)
	if err != nil {
		return "", false, fmt.Errorf("load active verification pipeline: %w", err)
	}
	err = tx.QueryRowContext(ctx, `SELECT id::text FROM verification_policy_versions
		WHERE (($1<>'' AND id::text=$1) OR ($1='' AND is_active=true AND effective_at<=NOW())) ORDER BY effective_at DESC LIMIT 1`, req.PolicyVersionID).Scan(&policyID)
	if err != nil {
		return "", false, fmt.Errorf("load active verification policy: %w", err)
	}
	var pipeline domain.PipelineDefinition
	if err := json.Unmarshal(definition, &pipeline); err != nil || pipeline.SchemaVersion != 1 || len(pipeline.Nodes) == 0 {
		return "", false, errors.New("active verification pipeline definition is invalid")
	}

	runID := uuid.NewString()
	_, err = tx.ExecContext(ctx, `INSERT INTO verification_runs
		(id,project_id,bundle_id,release_id,artifact_id,artifact_checksum,trigger_event_key,pipeline_version_id,policy_version_id,scoring_version,status,started_at,created_at,updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'v1','running',NOW(),NOW(),NOW())`,
		runID, projectID, bundleID, req.ReleaseID, req.Artifact.ID, checksum, eventKey, pipelineID, policyID)
	if err != nil {
		return "", false, fmt.Errorf("create verification run: %w", err)
	}

	taskIDs := make(map[string]string, len(pipeline.Nodes))
	for _, node := range pipeline.Nodes {
		if node.ID == "" || node.Engine == "" {
			return "", false, errors.New("pipeline node id and engine are required")
		}
		var engineID string
		if err := tx.QueryRowContext(ctx, `SELECT id::text FROM verification_engine_versions WHERE name=$1 AND is_active=true AND revoked_at IS NULL ORDER BY approved_at DESC NULLS LAST LIMIT 1`, node.Engine).Scan(&engineID); err != nil {
			return "", false, fmt.Errorf("resolve engine %s: %w", node.Engine, err)
		}
		taskID := uuid.NewString()
		taskIDs[node.ID] = taskID
		status := "queued"
		if len(node.DependsOn) == 0 {
			status = "ready"
		}
		resourceClass := node.ResourceClass
		if resourceClass == "" {
			resourceClass = "standard"
		}
		maxAttempts := node.MaxAttempts
		if maxAttempts <= 0 {
			maxAttempts = 2
		}
		timeout := node.TimeoutSeconds
		if timeout <= 0 {
			timeout = 900
		}
		configuration := node.Configuration
		if len(configuration) == 0 {
			configuration = json.RawMessage(`{}`)
		}
		_, err = tx.ExecContext(ctx, `INSERT INTO verification_tasks
			(id,run_id,engine_version_id,node_id,resource_class,required,status,configuration,attempt,max_attempts,timeout_seconds,created_at,updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,$9,$10,NOW(),NOW())`,
			taskID, runID, engineID, node.ID, resourceClass, node.Required, status, configuration, maxAttempts, timeout)
		if err != nil {
			return "", false, fmt.Errorf("create verification task %s: %w", node.ID, err)
		}
	}
	for _, node := range pipeline.Nodes {
		for _, prerequisite := range node.DependsOn {
			prerequisiteID, ok := taskIDs[prerequisite]
			if !ok {
				return "", false, fmt.Errorf("pipeline node %s has unknown dependency %s", node.ID, prerequisite)
			}
			_, err = tx.ExecContext(ctx, `INSERT INTO verification_task_dependencies (id,task_id,prerequisite_id) VALUES ($1,$2,$3)`, uuid.NewString(), taskIDs[node.ID], prerequisiteID)
			if err != nil {
				return "", false, err
			}
		}
	}
	if err := insertOutbox(ctx, tx, "verification.run.started.v1:"+runID, "verification_run", runID, "verification.run.started.v1", map[string]any{
		"schemaVersion": 1, "projectId": projectID, "bundleId": bundleID, "releaseId": req.ReleaseID, "runId": runID,
	}); err != nil {
		return "", false, err
	}
	if err := tx.Commit(); err != nil {
		return "", false, err
	}
	return runID, true, nil
}

func (r *Repository) ClaimReady(ctx context.Context, owner string, limit int) ([]domain.Dispatch, error) {
	if limit <= 0 {
		limit = 1
	}
	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()
	rows, err := tx.QueryContext(ctx, `SELECT t.id::text,t.run_id::text,r.project_id::text,r.bundle_id::text,r.release_id::text,t.node_id,t.attempt,t.timeout_seconds,
		ev.name,ev.image_digest,COALESCE(t.configuration,'{}'::jsonb),a.id::text,a.storage_provider,a.storage_bucket,a.storage_key,a.checksum_sha256,a.file_size,a.content_type
		FROM verification_tasks t JOIN verification_runs r ON r.id=t.run_id
		JOIN verification_engine_versions ev ON ev.id=t.engine_version_id JOIN bundle_artifacts a ON a.id=r.artifact_id
		WHERE t.status='ready' AND (t.next_attempt_at IS NULL OR t.next_attempt_at<=NOW()) AND r.status='running'
		ORDER BY (SELECT COUNT(*) FROM verification_tasks active_task JOIN verification_runs active_run ON active_run.id=active_task.run_id WHERE active_run.project_id=r.project_id AND active_task.status IN ('dispatched','running')) ASC,
		t.required DESC,t.created_at FOR UPDATE OF t SKIP LOCKED LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var claimed []domain.Dispatch
	for rows.Next() {
		var taskID, runID, projectID, bundleID, releaseID, nodeID, engine, digest, artifactID, provider, bucket, key, checksum, contentType string
		var attemptNo, timeout int
		var config []byte
		var size int64
		if err := rows.Scan(&taskID, &runID, &projectID, &bundleID, &releaseID, &nodeID, &attemptNo, &timeout, &engine, &digest, &config, &artifactID, &provider, &bucket, &key, &checksum, &size, &contentType); err != nil {
			return nil, err
		}
		attemptNo++
		attemptID, leaseOwner := uuid.NewString(), owner+":"+uuid.NewString()
		deadline := time.Now().UTC().Add(time.Duration(timeout) * time.Second)
		_, err = tx.ExecContext(ctx, `INSERT INTO verification_attempts
			(id,task_id,attempt_no,status,lease_owner,leased_until,heartbeat_at,deadline_at,created_at,updated_at)
			VALUES ($1,$2,$3,'dispatched',$4,$5,NOW(),$5,NOW(),NOW())`, attemptID, taskID, attemptNo, leaseOwner, deadline)
		if err != nil {
			return nil, err
		}
		_, err = tx.ExecContext(ctx, `UPDATE verification_tasks SET status='dispatched',attempt=$2,next_attempt_at=NULL,updated_at=NOW() WHERE id=$1`, taskID, attemptNo)
		if err != nil {
			return nil, err
		}
		dispatch := domain.Dispatch{AttemptID: attemptID, TaskID: taskID, RunID: runID, ProjectID: projectID, BundleID: bundleID, ReleaseID: releaseID, NodeID: nodeID, LeaseOwner: leaseOwner, DeadlineAt: deadline, Engine: engine, EngineDigest: digest, Configuration: config,
			Artifact: domain.ArtifactIdentity{ID: artifactID, Provider: provider, Bucket: bucket, Key: key, ChecksumSHA256: checksum, SizeBytes: size, ContentType: contentType}}
		if err := insertOutbox(ctx, tx, "verification.task.dispatched.v1:"+attemptID, "verification_attempt", attemptID, "verification.task.dispatched.v1", dispatch); err != nil {
			return nil, err
		}
		claimed = append(claimed, dispatch)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return claimed, nil
}

func (r *Repository) AcceptResult(ctx context.Context, result domain.ResultEnvelope, resultDigest string) (string, bool, error) {
	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable})
	if err != nil {
		return "", false, err
	}
	defer func() { _ = tx.Rollback() }()
	var taskID, runID, projectID, bundleID, releaseID, attemptStatus, leaseOwner, engineDigest, checksum string
	var leasedUntil time.Time
	var attemptNo, maxAttempts int
	err = tx.QueryRowContext(ctx, `SELECT t.id::text,t.run_id::text,r.project_id::text,r.bundle_id::text,r.release_id::text,a.status::text,COALESCE(a.lease_owner,''),a.leased_until,
		ev.image_digest,r.artifact_checksum,a.attempt_no,t.max_attempts FROM verification_attempts a
		JOIN verification_tasks t ON t.id=a.task_id JOIN verification_runs r ON r.id=t.run_id
		JOIN verification_engine_versions ev ON ev.id=t.engine_version_id WHERE a.id=$1 FOR UPDATE OF a,t`, result.AttemptID).
		Scan(&taskID, &runID, &projectID, &bundleID, &releaseID, &attemptStatus, &leaseOwner, &leasedUntil, &engineDigest, &checksum, &attemptNo, &maxAttempts)
	if err != nil {
		return "", false, err
	}
	if attemptStatus == "succeeded" || attemptStatus == "failed" || attemptStatus == "timed_out" || attemptStatus == "cancelled" {
		var existing sql.NullString
		_ = tx.QueryRowContext(ctx, `SELECT result_digest FROM verification_attempts WHERE id=$1`, result.AttemptID).Scan(&existing)
		if existing.Valid && existing.String == resultDigest {
			return runID, false, tx.Commit()
		}
		return "", false, errors.New("attempt already has a different terminal result")
	}
	if leaseOwner != result.LeaseOwner || time.Now().UTC().After(leasedUntil) {
		return "", false, errors.New("attempt lease is invalid or expired")
	}
	if engineDigest != result.EngineDigest || checksum != result.ArtifactChecksum {
		return "", false, errors.New("engine or artifact provenance mismatch")
	}
	if result.SchemaVersion != "verification-result.v1" {
		return "", false, errors.New("unsupported verification result schema")
	}

	attemptFinal, taskFinal := "succeeded", "succeeded"
	retry := false
	switch result.Status {
	case "succeeded":
	case "bundle_failed":
		attemptFinal, taskFinal = "failed", "bundle_failed"
	case "timed_out":
		attemptFinal, taskFinal, retry = "timed_out", "timed_out", attemptNo < maxAttempts
	case "infrastructure_failed":
		attemptFinal, taskFinal, retry = "failed", "infrastructure_failed", attemptNo < maxAttempts
	case "cancelled":
		attemptFinal, taskFinal = "cancelled", "cancelled"
	default:
		return "", false, errors.New("unsupported verification result status")
	}
	metrics, _ := json.Marshal(result.Metrics)
	_, err = tx.ExecContext(ctx, `UPDATE verification_attempts SET status=$2,worker_id=$3,started_at=$4,completed_at=$5,error_code=NULLIF($6,''),error_message=NULLIF($7,''),result_digest=$8,
		metrics=$9,coverage=$10,completeness=$11,reproducibility=$12,engine_health=$13,updated_at=NOW() WHERE id=$1`,
		result.AttemptID, attemptFinal, result.LeaseOwner, nullableTime(result.StartedAt), nullableTime(result.CompletedAt), result.ErrorCode, result.ErrorMessage, resultDigest, metrics, result.Coverage, result.Completeness, result.Reproducibility, result.EngineHealth)
	if err != nil {
		return "", false, err
	}
	if retry {
		backoff := time.Now().UTC().Add(time.Duration(1<<min(attemptNo, 6)) * 15 * time.Second)
		_, err = tx.ExecContext(ctx, `UPDATE verification_tasks SET status='ready',next_attempt_at=$2,updated_at=NOW() WHERE id=$1`, taskID, backoff)
	} else {
		_, err = tx.ExecContext(ctx, `UPDATE verification_tasks SET status=$2,accepted_attempt_id=$3,updated_at=NOW() WHERE id=$1`, taskID, taskFinal, result.AttemptID)
	}
	if err != nil {
		return "", false, err
	}
	for _, finding := range result.Findings {
		location, _ := json.Marshal(finding.Location)
		_, err = tx.ExecContext(ctx, `INSERT INTO verification_findings
			(id,run_id,task_id,attempt_id,fingerprint,dimension,severity,confidence,rule_id,title,description,location,remediation,created_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NULLIF($11,''),$12,NULLIF($13,''),NOW())
			ON CONFLICT (run_id,task_id,fingerprint) DO NOTHING`, uuid.NewString(), runID, taskID, result.AttemptID, finding.Fingerprint, finding.Dimension, finding.Severity, finding.Confidence, finding.RuleID, finding.Title, finding.Description, location, finding.Remediation)
		if err != nil {
			return "", false, err
		}
	}
	for _, evidence := range result.Evidence {
		sensitivity := evidence.Sensitivity
		if sensitivity == "" {
			sensitivity = "restricted"
		}
		_, err = tx.ExecContext(ctx, `INSERT INTO verification_evidence
			(id,run_id,task_id,attempt_id,kind,storage_provider,storage_bucket,storage_key,checksum_sha256,file_size,content_type,sensitivity,created_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW()) ON CONFLICT (storage_provider,storage_bucket,storage_key) DO NOTHING`,
			uuid.NewString(), runID, taskID, result.AttemptID, evidence.Kind, evidence.Provider, evidence.Bucket, evidence.Key, evidence.ChecksumSHA256, evidence.SizeBytes, evidence.ContentType, sensitivity)
		if err != nil {
			return "", false, err
		}
	}
	if err := insertOutbox(ctx, tx, "verification.result.accepted.v1:"+result.AttemptID, "verification_attempt", result.AttemptID, "verification.result.accepted.v1", map[string]any{"schemaVersion": 1, "projectId": projectID, "bundleId": bundleID, "releaseId": releaseID, "runId": runID, "taskId": taskID, "attemptId": result.AttemptID, "status": result.Status}); err != nil {
		return "", false, err
	}
	if err := tx.Commit(); err != nil {
		return "", false, err
	}
	return runID, true, nil
}

func (r *Repository) Advance(ctx context.Context, runID string) (*domain.TerminalSnapshot, error) {
	_, err := r.db.ExecContext(ctx, `UPDATE verification_tasks t SET status='ready',updated_at=NOW()
		WHERE t.run_id=$1 AND t.status='queued' AND NOT EXISTS (
			SELECT 1 FROM verification_task_dependencies d JOIN verification_tasks p ON p.id=d.prerequisite_id
			WHERE d.task_id=t.id AND p.status<>'succeeded')`, runID)
	if err != nil {
		return nil, err
	}
	_, err = r.db.ExecContext(ctx, `UPDATE verification_tasks t SET status='bundle_failed',updated_at=NOW()
		WHERE t.run_id=$1 AND t.status='queued' AND EXISTS (
			SELECT 1 FROM verification_task_dependencies d JOIN verification_tasks p ON p.id=d.prerequisite_id
			WHERE d.task_id=t.id AND p.status IN ('bundle_failed','dead_lettered','cancelled'))`, runID)
	if err != nil {
		return nil, err
	}
	var total, terminal, succeeded, infra, requiredFailures int
	err = r.db.QueryRowContext(ctx, `SELECT COUNT(*),COUNT(*) FILTER (WHERE status IN ('succeeded','bundle_failed','infrastructure_failed','timed_out','cancelled','dead_lettered')),
		COUNT(*) FILTER (WHERE status='succeeded'),COUNT(*) FILTER (WHERE status IN ('infrastructure_failed','timed_out','dead_lettered')),
		COUNT(*) FILTER (WHERE required=true AND status<>'succeeded') FROM verification_tasks WHERE run_id=$1`, runID).
		Scan(&total, &terminal, &succeeded, &infra, &requiredFailures)
	if err != nil || total == 0 || terminal != total {
		return nil, err
	}
	var snapshot domain.TerminalSnapshot
	snapshot.RunID = runID
	err = r.db.QueryRowContext(ctx, `SELECT r.project_id::text,r.bundle_id::text,r.release_id::text,r.artifact_id::text,r.artifact_checksum,r.policy_version_id::text,r.status::text,p.definition
		FROM verification_runs r JOIN verification_policy_versions p ON p.id=r.policy_version_id WHERE r.id=$1`, runID).
		Scan(&snapshot.ProjectID, &snapshot.BundleID, &snapshot.ReleaseID, &snapshot.ArtifactID, &snapshot.ArtifactChecksum, &snapshot.PolicyVersionID, &snapshot.Status, &snapshot.PolicyDefinition)
	if err != nil {
		return nil, err
	}
	if snapshot.Status == "completed" || snapshot.Status == "incomplete" || snapshot.Status == "cancelled" {
		return nil, nil
	}
	snapshot.Findings, err = r.findings(ctx, runID)
	if err != nil {
		return nil, err
	}
	snapshot.RequiredFailure = requiredFailures > 0
	snapshot.InfrastructureFailure = infra > 0
	var coverage, completeness, reproducibility, engineHealth sql.NullFloat64
	if err := r.db.QueryRowContext(ctx, `SELECT AVG(a.coverage),AVG(a.completeness),AVG(a.reproducibility),AVG(a.engine_health)
		FROM verification_tasks t JOIN verification_attempts a ON a.id=t.accepted_attempt_id WHERE t.run_id=$1`, runID).Scan(&coverage, &completeness, &reproducibility, &engineHealth); err != nil {
		return nil, err
	}
	snapshot.Completeness = valueOr(completeness, float64(succeeded)/float64(total))
	snapshot.Dimensions, snapshot.Overall, snapshot.Confidence = domain.Score(snapshot.Findings, []float64{valueOr(coverage, 0), snapshot.Completeness, valueOr(reproducibility, 0), valueOr(engineHealth, 0)})
	return &snapshot, nil
}

func (r *Repository) Finalize(ctx context.Context, snapshot domain.TerminalSnapshot, report domain.ReportRef) error {
	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable})
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()
	dimensions, _ := json.Marshal(snapshot.Dimensions)
	input := map[string]any{"dimensions": snapshot.Dimensions, "overall": snapshot.Overall, "confidence": snapshot.Confidence, "requiredFailure": snapshot.RequiredFailure, "findings": snapshot.Findings}
	inputJSON, _ := json.Marshal(input)
	hash := sha256.Sum256(inputJSON)
	inputDigest := hex.EncodeToString(hash[:])
	status := "completed"
	var decision any = snapshot.Decision
	if snapshot.Decision == "" {
		status, decision = "incomplete", nil
	}
	_, err = tx.ExecContext(ctx, `INSERT INTO verification_scores (id,run_id,version,dimensions,overall,confidence,created_at)
		VALUES ($1,$2,'v1',$3,$4,$5,NOW()) ON CONFLICT (run_id) DO NOTHING`, uuid.NewString(), snapshot.RunID, dimensions, snapshot.Overall, snapshot.Confidence)
	if err != nil {
		return err
	}
	if snapshot.Decision != "" {
		results, _ := json.Marshal(snapshot.PolicyResults)
		_, err = tx.ExecContext(ctx, `INSERT INTO verification_policy_evaluations (id,run_id,policy_version_id,input_digest,decision,results,created_at)
			VALUES ($1,$2,$3,$4,$5,$6,NOW()) ON CONFLICT (run_id) DO NOTHING`, uuid.NewString(), snapshot.RunID, snapshot.PolicyVersionID, inputDigest, snapshot.Decision, results)
		if err != nil {
			return err
		}
	}
	_, err = tx.ExecContext(ctx, `INSERT INTO verification_reports (id,run_id,schema_version,storage_provider,storage_bucket,storage_key,checksum_sha256,created_at)
		VALUES ($1,$2,'verification-report.v1',$3,$4,$5,$6,NOW()) ON CONFLICT (run_id) DO NOTHING`, uuid.NewString(), snapshot.RunID, report.Provider, report.Bucket, report.Key, report.ChecksumSHA256)
	if err != nil {
		return err
	}
	_, err = tx.ExecContext(ctx, `UPDATE verification_runs SET status=$2,decision=$3,overall_score=$4,confidence=$5,completeness=$6,completed_at=NOW(),updated_at=NOW() WHERE id=$1 AND status NOT IN ('completed','incomplete','cancelled')`,
		snapshot.RunID, status, decision, snapshot.Overall, snapshot.Confidence, snapshot.Completeness)
	if err != nil {
		return err
	}
	projectionStatus := "incomplete"
	if snapshot.Decision == "allow" {
		projectionStatus = "approved"
	}
	if snapshot.Decision == "warn" {
		projectionStatus = "warning"
	}
	if snapshot.Decision == "review" {
		projectionStatus = "review"
	}
	if snapshot.Decision == "reject" {
		projectionStatus = "rejected"
	}
	evidence, _ := json.Marshal(map[string]any{"runId": snapshot.RunID, "artifactChecksum": snapshot.ArtifactChecksum, "decision": snapshot.Decision, "score": snapshot.Overall, "confidence": snapshot.Confidence, "policyVersionId": snapshot.PolicyVersionID, "reportId": report.Key, "source": "verification_platform"})
	_, err = tx.ExecContext(ctx, `INSERT INTO bundle_release_approvals (id,release_id,kind,status,policy_version,evidence,created_at)
		VALUES ($1,$2,'security',$3,$4,$5,NOW()) ON CONFLICT (release_id,kind) DO UPDATE SET status=EXCLUDED.status,policy_version=EXCLUDED.policy_version,evidence=EXCLUDED.evidence,created_at=NOW()`,
		uuid.NewString(), snapshot.ReleaseID, projectionStatus, snapshot.PolicyVersionID, evidence)
	if err != nil {
		return err
	}
	if snapshot.Decision == "allow" || snapshot.Decision == "warn" {
		_, err = tx.ExecContext(ctx, `UPDATE bundle_releases SET eligible_verification_run_id=$2,updated_at=NOW() WHERE id=$1`, snapshot.ReleaseID, snapshot.RunID)
	} else if snapshot.Decision == "reject" {
		_, err = tx.ExecContext(ctx, `UPDATE bundle_releases SET eligible_verification_run_id=NULL,status='rejected',updated_at=NOW() WHERE id=$1`, snapshot.ReleaseID)
	}
	if err != nil {
		return err
	}
	if err := reconcileReleasePromotion(ctx, tx, snapshot); err != nil {
		return err
	}
	payload := map[string]any{"schemaVersion": 1, "projectId": snapshot.ProjectID, "bundleId": snapshot.BundleID, "releaseId": snapshot.ReleaseID, "runId": snapshot.RunID, "status": status, "decision": snapshot.Decision, "score": snapshot.Overall, "confidence": snapshot.Confidence}
	if err := insertOutbox(ctx, tx, "verification.run.terminal.v1:"+snapshot.RunID, "verification_run", snapshot.RunID, "verification.run.terminal.v1", payload); err != nil {
		return err
	}
	if err := insertOutbox(ctx, tx, "release.eligibility_changed.v1:"+snapshot.RunID, "bundle_release", snapshot.ReleaseID, "release.eligibility_changed.v1", payload); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `INSERT INTO verification_metric_rollups (id,project_id,metric,scope,window_start,window_end,count,sum,min,max,updated_at)
		VALUES ($1,$2,'overall_score','all',date_trunc('hour',NOW()),date_trunc('hour',NOW())+INTERVAL '1 hour',1,$3,$3,$3,NOW())
		ON CONFLICT (project_id,metric,scope,window_start) DO UPDATE SET count=verification_metric_rollups.count+1,
		sum=verification_metric_rollups.sum+EXCLUDED.sum,min=LEAST(verification_metric_rollups.min,EXCLUDED.min),max=GREATEST(verification_metric_rollups.max,EXCLUDED.max),updated_at=NOW()`, uuid.NewString(), snapshot.ProjectID, snapshot.Overall); err != nil {
		return err
	}
	if status == "incomplete" || snapshot.Decision == "reject" {
		ruleID, severity := "verification_incomplete", "warning"
		if snapshot.Decision == "reject" {
			ruleID, severity = "verification_rejected", "critical"
		}
		details, _ := json.Marshal(payload)
		if _, err := tx.ExecContext(ctx, `INSERT INTO verification_alerts (id,project_id,rule_id,scope,status,severity,first_seen_at,last_seen_at,details)
			VALUES ($1,$2,$3,$4,'open',$5,NOW(),NOW(),$6) ON CONFLICT (project_id,rule_id,scope,status) DO UPDATE SET last_seen_at=NOW(),severity=EXCLUDED.severity,details=EXCLUDED.details`,
			uuid.NewString(), snapshot.ProjectID, ruleID, snapshot.ReleaseID, severity, details); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func reconcileReleasePromotion(ctx context.Context, tx *sql.Tx, snapshot domain.TerminalSnapshot) error {
	var enforcement string
	if err := tx.QueryRowContext(ctx, `SELECT p.enforcement_mode::text FROM verification_runs r JOIN verification_pipeline_versions p ON p.id=r.pipeline_version_id WHERE r.id=$1`, snapshot.RunID).Scan(&enforcement); err != nil {
		return err
	}
	if enforcement == "enforce" && snapshot.Decision != "allow" && snapshot.Decision != "warn" {
		return nil
	}
	if enforcement != "enforce" {
		var legacyOK bool
		if err := tx.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM bundle_release_approvals WHERE release_id=$1 AND kind='security' AND status='approved'
			AND evidence->>'malwarePassed'='true' AND COALESCE((evidence->>'criticalFindings')::int,1)=0 AND COALESCE(evidence->>'digest','')<>'')`, snapshot.ReleaseID).Scan(&legacyOK); err != nil || !legacyOK {
			return err
		}
	}
	var humanGates bool
	if err := tx.QueryRowContext(ctx, `SELECT COUNT(DISTINCT kind)=2 FROM bundle_release_approvals WHERE release_id=$1 AND kind IN ('privacy','moderation') AND status='approved'`, snapshot.ReleaseID).Scan(&humanGates); err != nil || !humanGates {
		return err
	}
	var bundleID, channelID, version, releaseStatus, deliveryMode string
	var buildNumber int
	if err := tx.QueryRowContext(ctx, `SELECT r.bundle_id::text,r.channel_id::text,r.version,r.build_number,r.status::text,b.active_delivery_mode::text
		FROM bundle_releases r JOIN bundles b ON b.id=r.bundle_id WHERE r.id=$1 FOR UPDATE OF r,b`, snapshot.ReleaseID).
		Scan(&bundleID, &channelID, &version, &buildNumber, &releaseStatus, &deliveryMode); err != nil {
		return err
	}
	if releaseStatus == "active" || releaseStatus == "rejected" || releaseStatus == "failed" || releaseStatus == "rolled_back" || deliveryMode != "none" {
		return nil
	}
	var artifactOK bool
	if err := tx.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM bundle_artifacts WHERE release_id=$1 AND kind='full' AND checksum_sha256=$2 AND file_size>0)`, snapshot.ReleaseID, snapshot.ArtifactChecksum).Scan(&artifactOK); err != nil || !artifactOK {
		return err
	}
	if _, err := tx.ExecContext(ctx, `UPDATE bundle_releases SET status='approved',updated_at=NOW() WHERE channel_id=$1 AND status='active' AND id<>$2`, channelID, snapshot.ReleaseID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `UPDATE bundle_channels SET current_release_id=$2,updated_at=NOW() WHERE id=$1`, channelID, snapshot.ReleaseID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `UPDATE bundle_releases SET status='active',approved_at=COALESCE(approved_at,NOW()),activated_at=NOW(),updated_at=NOW() WHERE id=$1`, snapshot.ReleaseID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `UPDATE bundles SET status='published',published_at=NOW(),version=$2,build_number=$3,updated_at=NOW() WHERE id=$1`, bundleID, version, buildNumber); err != nil {
		return err
	}
	return insertOutbox(ctx, tx, "release.promoted:"+snapshot.ReleaseID, "bundle_release", snapshot.ReleaseID, "release.promoted", map[string]any{
		"schemaVersion": 1, "projectId": snapshot.ProjectID, "bundleId": bundleID, "releaseId": snapshot.ReleaseID, "channelId": channelID, "reason": "verification_gate_completed",
	})
}

func (r *Repository) RecoverExpired(ctx context.Context) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, `WITH expired AS (
		UPDATE verification_attempts SET status='failed',error_code='LEASE_EXPIRED',error_message='worker lease expired',completed_at=NOW(),updated_at=NOW()
		WHERE status IN ('dispatched','running') AND leased_until<NOW() RETURNING task_id)
		UPDATE verification_tasks t SET status=CASE WHEN t.attempt<t.max_attempts THEN 'ready'::"VerificationTaskStatus" ELSE 'infrastructure_failed'::"VerificationTaskStatus" END,
		next_attempt_at=CASE WHEN t.attempt<t.max_attempts THEN NOW()+INTERVAL '30 seconds' ELSE NULL END,updated_at=NOW()
		FROM expired e WHERE t.id=e.task_id RETURNING DISTINCT t.run_id::text`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var runs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		runs = append(runs, id)
	}
	return runs, rows.Err()
}

func (r *Repository) Cancel(ctx context.Context, runID string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()
	if _, err = tx.ExecContext(ctx, `UPDATE verification_runs SET status='cancelled',completed_at=NOW(),updated_at=NOW() WHERE id=$1 AND status NOT IN ('completed','incomplete','cancelled')`, runID); err != nil {
		return err
	}
	if _, err = tx.ExecContext(ctx, `UPDATE verification_tasks SET status='cancelled',updated_at=NOW() WHERE run_id=$1 AND status NOT IN ('succeeded','bundle_failed','infrastructure_failed','timed_out','cancelled','dead_lettered')`, runID); err != nil {
		return err
	}
	if _, err = tx.ExecContext(ctx, `UPDATE verification_attempts SET status='cancelled',completed_at=NOW(),updated_at=NOW() WHERE task_id IN (SELECT id FROM verification_tasks WHERE run_id=$1) AND status IN ('dispatched','running')`, runID); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *Repository) Heartbeat(ctx context.Context, attemptID, leaseOwner string) error {
	result, err := r.db.ExecContext(ctx, `UPDATE verification_attempts SET status='running',worker_id=$2,heartbeat_at=NOW(),started_at=COALESCE(started_at,NOW()),updated_at=NOW()
		WHERE id=$1 AND lease_owner=$2 AND status IN ('dispatched','running') AND leased_until>NOW()`, attemptID, leaseOwner)
	if err != nil {
		return err
	}
	updated, _ := result.RowsAffected()
	if updated != 1 {
		return errors.New("attempt heartbeat lease is invalid")
	}
	return nil
}

func (r *Repository) RetryRequest(ctx context.Context, releaseID string) (domain.VerificationRequest, error) {
	var req domain.VerificationRequest
	req.SchemaVersion = 1
	err := r.db.QueryRowContext(ctx, `SELECT b.project_id::text,br.bundle_id::text,br.id::text,a.id::text,a.storage_provider,a.storage_bucket,a.storage_key,a.checksum_sha256,a.file_size,a.content_type
		FROM bundle_releases br JOIN bundles b ON b.id=br.bundle_id JOIN LATERAL (
			SELECT * FROM bundle_artifacts WHERE release_id=br.id AND kind='full' ORDER BY created_at DESC LIMIT 1
		) a ON true WHERE br.id=$1`, releaseID).Scan(&req.ProjectID, &req.BundleID, &req.ReleaseID, &req.Artifact.ID, &req.Artifact.Provider, &req.Artifact.Bucket, &req.Artifact.Key, &req.Artifact.ChecksumSHA256, &req.Artifact.SizeBytes, &req.Artifact.ContentType)
	return req, err
}

func (r *Repository) RunJSON(ctx context.Context, runID string) (json.RawMessage, error) {
	return r.queryJSON(ctx, `SELECT row_to_json(v) FROM (SELECT r.*,s.dimensions,s.overall AS score_overall,s.confidence AS score_confidence,
		p.storage_provider AS report_provider,p.storage_bucket AS report_bucket,p.storage_key AS report_key
		FROM verification_runs r LEFT JOIN verification_scores s ON s.run_id=r.id LEFT JOIN verification_reports p ON p.run_id=r.id WHERE r.id=$1) v`, runID)
}
func (r *Repository) ReleaseJSON(ctx context.Context, releaseID string) (json.RawMessage, error) {
	return r.queryJSON(ctx, `SELECT row_to_json(v) FROM (SELECT br.id AS release_id,br.status,br.eligible_verification_run_id,r.id AS run_id,r.status AS verification_status,r.decision,r.overall_score,r.confidence,r.completed_at
		FROM bundle_releases br LEFT JOIN verification_runs r ON r.id=br.eligible_verification_run_id WHERE br.id=$1) v`, releaseID)
}
func (r *Repository) TasksJSON(ctx context.Context, runID string) (json.RawMessage, error) {
	return r.queryJSON(ctx, `SELECT COALESCE(json_agg(row_to_json(v) ORDER BY v.created_at),'[]'::json) FROM (SELECT t.*,ev.name AS engine,ev.version AS engine_version FROM verification_tasks t JOIN verification_engine_versions ev ON ev.id=t.engine_version_id WHERE t.run_id=$1) v`, runID)
}
func (r *Repository) FindingsJSON(ctx context.Context, runID string) (json.RawMessage, error) {
	return r.queryJSON(ctx, `SELECT COALESCE(json_agg(row_to_json(v) ORDER BY v.created_at),'[]'::json) FROM (SELECT * FROM verification_findings WHERE run_id=$1) v`, runID)
}
func (r *Repository) ReportJSON(ctx context.Context, runID string) (json.RawMessage, error) {
	return r.queryJSON(ctx, `SELECT row_to_json(v) FROM (SELECT * FROM verification_reports WHERE run_id=$1) v`, runID)
}

func (r *Repository) findings(ctx context.Context, runID string) ([]domain.Finding, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT fingerprint,dimension,severity,confidence,rule_id,title,COALESCE(description,''),COALESCE(location,'{}'::jsonb),COALESCE(remediation,'') FROM verification_findings WHERE run_id=$1`, runID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.Finding
	for rows.Next() {
		var f domain.Finding
		var location []byte
		if err := rows.Scan(&f.Fingerprint, &f.Dimension, &f.Severity, &f.Confidence, &f.RuleID, &f.Title, &f.Description, &location, &f.Remediation); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(location, &f.Location)
		out = append(out, f)
	}
	return out, rows.Err()
}

func (r *Repository) queryJSON(ctx context.Context, query string, id string) (json.RawMessage, error) {
	var raw []byte
	err := r.db.QueryRowContext(ctx, query, id).Scan(&raw)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, sql.ErrNoRows
	}
	return raw, err
}

func insertOutbox(ctx context.Context, tx *sql.Tx, eventKey, aggregateType, aggregateID, eventType string, payload any) error {
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	event := shared.Event{ID: uuid.New(), EventKey: eventKey, Type: eventType, Version: 1, AggregateType: aggregateType, AggregateID: aggregateID, OccurredAt: time.Now().UTC(), Payload: payloadJSON}
	eventJSON, err := json.Marshal(event)
	if err != nil {
		return err
	}
	_, err = tx.ExecContext(ctx, `INSERT INTO bundle_outbox_events (id,event_key,aggregate_type,aggregate_id,event_type,payload,status,attempts,created_at)
		VALUES ($1,$2,$3,$4,$5,$6,'pending',0,NOW()) ON CONFLICT (event_key) DO NOTHING`, event.ID, eventKey, aggregateType, aggregateID, eventType, eventJSON)
	if err != nil {
		return err
	}
	var identity struct {
		ProjectID string `json:"projectId"`
		RunID     string `json:"runId"`
	}
	if json.Unmarshal(payloadJSON, &identity) != nil || identity.ProjectID == "" {
		return nil
	}
	if _, err := uuid.Parse(identity.ProjectID); err != nil {
		return nil
	}
	var runID any
	if _, err := uuid.Parse(identity.RunID); err == nil {
		runID = identity.RunID
	}
	_, err = tx.ExecContext(ctx, `INSERT INTO verification_telemetry_events (id,event_id,project_id,run_id,kind,correlation_id,payload,occurred_at,created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW()) ON CONFLICT (event_id) DO NOTHING`, uuid.NewString(), eventKey, identity.ProjectID, runID, eventType, event.EventKey, payloadJSON)
	return err
}

func nullableTime(value time.Time) any {
	if value.IsZero() {
		return nil
	}
	return value
}
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
func valueOr(value sql.NullFloat64, fallback float64) float64 {
	if value.Valid {
		return value.Float64
	}
	return fallback
}
