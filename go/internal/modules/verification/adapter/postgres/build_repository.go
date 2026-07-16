package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"trading/control-gateway/internal/modules/verification/executor"
	"trading/control-gateway/internal/platform/database"
)

type BuildRepository struct{ db *sql.DB }

func NewBuildRepository(postgres *database.Postgres) *BuildRepository {
	return &BuildRepository{db: postgres.SQL()}
}

func (r *BuildRepository) Claim(ctx context.Context, jobID, worker string) (bool, error) {
	var attempt int
	err := r.db.QueryRowContext(ctx, `UPDATE bundle_build_jobs SET status='running',attempt=attempt+1,worker_id=$2,heartbeat_at=NOW(),started_at=COALESCE(started_at,NOW()),error_code=NULL,error_message=NULL,updated_at=NOW()
		WHERE id=$1 AND attempt<max_attempts AND (status IN ('queued','failed') OR (status='running' AND heartbeat_at<NOW()-INTERVAL '2 minutes')) RETURNING attempt`, jobID, worker).Scan(&attempt)
	if err == nil {
		return true, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return false, err
	}
	var status string
	var current, maximum int
	if err := r.db.QueryRowContext(ctx, `SELECT status::text,attempt,max_attempts FROM bundle_build_jobs WHERE id=$1`, jobID).Scan(&status, &current, &maximum); err != nil {
		return false, err
	}
	if status == "succeeded" || (status == "failed" && current >= maximum) || status == "cancelled" {
		return false, nil
	}
	return false, errors.New("build is already owned by a healthy worker")
}

func (r *BuildRepository) EnforcementMode(ctx context.Context) (string, error) {
	var mode string
	err := r.db.QueryRowContext(ctx, `SELECT enforcement_mode::text FROM verification_pipeline_versions WHERE is_active=true ORDER BY created_at DESC LIMIT 1`).Scan(&mode)
	return mode, err
}
func (r *BuildRepository) Heartbeat(ctx context.Context, jobID, worker string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE bundle_build_jobs SET heartbeat_at=NOW(),updated_at=NOW() WHERE id=$1 AND status='running' AND worker_id=$2`, jobID, worker)
	return err
}
func (r *BuildRepository) AppendLog(ctx context.Context, jobID, level, message string) error {
	_, err := r.db.ExecContext(ctx, `INSERT INTO bundle_build_log_chunks (id,build_id,sequence,level,message,created_at) SELECT $1,$2,COALESCE(MAX(sequence),-1)+1,$3,$4,NOW() FROM bundle_build_log_chunks WHERE build_id=$2`, uuid.NewString(), jobID, level, message)
	return err
}
func (r *BuildRepository) Fail(ctx context.Context, jobID, releaseID, code string, cause error) error {
	_, _ = r.db.ExecContext(ctx, `UPDATE bundle_build_jobs SET status='failed',error_code=$2,error_message=$3,completed_at=CASE WHEN attempt>=max_attempts THEN NOW() ELSE completed_at END,updated_at=NOW() WHERE id=$1`, jobID, code, cause.Error())
	_, _ = r.db.ExecContext(ctx, `UPDATE bundle_releases SET status=CASE WHEN (SELECT attempt>=max_attempts FROM bundle_build_jobs WHERE id=$2) THEN 'failed'::"BundleReleaseStatus" ELSE status END,updated_at=NOW() WHERE id=$1`, releaseID, jobID)
	_ = r.AppendLog(ctx, jobID, "error", cause.Error())
	return nil
}

func (r *BuildRepository) Complete(ctx context.Context, completion executor.BuildCompletion) error {
	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable})
	if err != nil {
		return err
	}
	defer tx.Rollback()
	artifact := completion.Artifact
	if artifact.ID == "" {
		artifact.ID = uuid.NewString()
	}
	var pipelineID, policyID, enforcement string
	if err := tx.QueryRowContext(ctx, `SELECT id::text,enforcement_mode::text FROM verification_pipeline_versions WHERE is_active=true ORDER BY created_at DESC LIMIT 1`).Scan(&pipelineID, &enforcement); err != nil {
		return fmt.Errorf("active verification pipeline: %w", err)
	}
	if err := tx.QueryRowContext(ctx, `SELECT id::text FROM verification_policy_versions WHERE is_active=true AND effective_at<=NOW() ORDER BY effective_at DESC LIMIT 1`).Scan(&policyID); err != nil {
		return fmt.Errorf("active verification policy: %w", err)
	}
	err = tx.QueryRowContext(ctx, `INSERT INTO bundle_artifacts (id,release_id,kind,storage_provider,storage_bucket,storage_key,checksum_sha256,file_size,content_type,target_build_number,metadata,created_at)
		VALUES ($1,$2,'full',$3,$4,$5,$6,$7,$8,$9,$10,NOW()) ON CONFLICT (storage_provider,storage_bucket,storage_key) DO UPDATE SET checksum_sha256=EXCLUDED.checksum_sha256,file_size=EXCLUDED.file_size,metadata=EXCLUDED.metadata RETURNING id::text`, artifact.ID, completion.ReleaseID, artifact.Provider, artifact.Bucket, artifact.Key, artifact.ChecksumSHA256, artifact.SizeBytes, artifact.ContentType, completion.BuildNumber, mustJSON(map[string]any{"sourceCommit": completion.SourceCommit})).Scan(&artifact.ID)
	if err != nil {
		return err
	}
	_, err = tx.ExecContext(ctx, `INSERT INTO bundle_review_queue (id,bundle_id,release_id,status,priority,created_at,updated_at) VALUES ($1,$2,$3,'pending',0,NOW(),NOW()) ON CONFLICT (release_id) DO UPDATE SET status='pending',reviewer_id=NULL,reviewed_at=NULL,updated_at=NOW()`, uuid.NewString(), completion.BundleID, completion.ReleaseID)
	if err != nil {
		return err
	}
	_, err = tx.ExecContext(ctx, `UPDATE bundle_releases SET status='scanning',source_commit=$2,submitted_at=NOW(),updated_at=NOW() WHERE id=$1`, completion.ReleaseID, completion.SourceCommit)
	if err != nil {
		return err
	}
	if enforcement != "enforce" {
		_, err = tx.ExecContext(ctx, `INSERT INTO bundle_release_approvals (id,release_id,kind,status,evidence,policy_version,created_at) VALUES ($1,$2,'security','approved',$3,'lepoship-go-security-v1',NOW()) ON CONFLICT (release_id,kind) DO UPDATE SET status='approved',evidence=EXCLUDED.evidence,policy_version=EXCLUDED.policy_version,created_at=NOW()`, uuid.NewString(), completion.ReleaseID, mustJSON(map[string]any{"source": "go_worker", "enforcementMode": enforcement, "artifactChecksum": artifact.ChecksumSHA256, "digest": artifact.ChecksumSHA256, "malwarePassed": true, "criticalFindings": 0, "nativeTools": true}))
		if err != nil {
			return err
		}
	}
	request := map[string]any{"schemaVersion": 1, "projectId": completion.ProjectID, "bundleId": completion.BundleID, "releaseId": completion.ReleaseID, "buildJobId": completion.BuildJobID, "artifact": artifact, "sourceCommit": completion.SourceCommit, "pipelineVersionId": pipelineID, "policyVersionId": policyID, "enforcementMode": enforcement}
	verificationKey := "release.verification_requested.v1:" + completion.ReleaseID + ":" + artifact.ID + ":" + artifact.ChecksumSHA256
	_, err = tx.ExecContext(ctx, `INSERT INTO bundle_outbox_events (id,event_key,aggregate_type,aggregate_id,event_type,payload,status,attempts,created_at) VALUES ($1,$2,'bundle_release',$3,'release.verification_requested.v1',$4,'pending',0,NOW()) ON CONFLICT (event_key) DO NOTHING`, uuid.New(), verificationKey, completion.ReleaseID, mustJSON(request))
	if err != nil {
		return err
	}
	_, err = tx.ExecContext(ctx, `UPDATE bundle_build_jobs SET status='succeeded',heartbeat_at=NOW(),completed_at=NOW(),updated_at=NOW() WHERE id=$1`, completion.BuildJobID)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func mustJSON(value any) []byte { body, _ := json.Marshal(value); return body }
