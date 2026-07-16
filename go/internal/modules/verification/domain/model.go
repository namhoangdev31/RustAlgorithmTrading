package domain

import (
	"encoding/json"
	"errors"
	"math"
	"regexp"
	"time"
)

var sha256Pattern = regexp.MustCompile(`^[a-f0-9]{64}$`)

const (
	StreamName        = "LEPOSHIP_EVENTS_V1"
	OrchestratorGroup = "verification-orchestrator-v1"
	ExecutorGroup     = "verification-executor-v1"
	ProjectionGroup   = "verification-projection-v1"
)

type ArtifactIdentity struct {
	ID             string `json:"id"`
	Provider       string `json:"provider"`
	Bucket         string `json:"bucket"`
	Key            string `json:"key"`
	ChecksumSHA256 string `json:"checksumSha256"`
	SizeBytes      int64  `json:"sizeBytes"`
	ContentType    string `json:"contentType"`
}

type VerificationRequest struct {
	SchemaVersion     int              `json:"schemaVersion"`
	ProjectID         string           `json:"projectId"`
	BundleID          string           `json:"bundleId"`
	ReleaseID         string           `json:"releaseId"`
	BuildJobID        string           `json:"buildJobId,omitempty"`
	Artifact          ArtifactIdentity `json:"artifact"`
	SourceCommit      string           `json:"sourceCommit,omitempty"`
	PipelineVersionID string           `json:"pipelineVersionId,omitempty"`
	PolicyVersionID   string           `json:"policyVersionId,omitempty"`
	EnforcementMode   string           `json:"enforcementMode"`
}

type PipelineDefinition struct {
	SchemaVersion int            `json:"schemaVersion"`
	Concurrency   int            `json:"concurrency"`
	Nodes         []PipelineNode `json:"nodes"`
}

type PipelineNode struct {
	ID             string          `json:"id"`
	Engine         string          `json:"engine"`
	DependsOn      []string        `json:"dependsOn"`
	ResourceClass  string          `json:"resourceClass,omitempty"`
	TimeoutSeconds int             `json:"timeoutSeconds"`
	MaxAttempts    int             `json:"maxAttempts,omitempty"`
	Required       bool            `json:"required"`
	Configuration  json.RawMessage `json:"configuration,omitempty"`
}

type Finding struct {
	Fingerprint string         `json:"fingerprint"`
	Dimension   string         `json:"dimension"`
	Severity    string         `json:"severity"`
	Confidence  float64        `json:"confidence"`
	RuleID      string         `json:"ruleId"`
	Title       string         `json:"title"`
	Description string         `json:"description,omitempty"`
	Location    map[string]any `json:"location,omitempty"`
	Remediation string         `json:"remediation,omitempty"`
	Confirmed   bool           `json:"confirmed,omitempty"`
}

type Evidence struct {
	Kind           string `json:"kind"`
	Provider       string `json:"provider"`
	Bucket         string `json:"bucket"`
	Key            string `json:"key"`
	ChecksumSHA256 string `json:"checksumSha256"`
	SizeBytes      int64  `json:"sizeBytes"`
	ContentType    string `json:"contentType"`
	Sensitivity    string `json:"sensitivity,omitempty"`
}

type ResultEnvelope struct {
	SchemaVersion    string             `json:"schemaVersion"`
	AttemptID        string             `json:"attemptId"`
	LeaseOwner       string             `json:"leaseOwner"`
	EngineDigest     string             `json:"engineDigest"`
	ArtifactChecksum string             `json:"artifactChecksum"`
	Status           string             `json:"status"`
	Findings         []Finding          `json:"findings"`
	Evidence         []Evidence         `json:"evidence"`
	Metrics          map[string]float64 `json:"metrics"`
	Coverage         float64            `json:"coverage"`
	Completeness     float64            `json:"completeness"`
	Reproducibility  float64            `json:"reproducibility"`
	EngineHealth     float64            `json:"engineHealth"`
	StartedAt        time.Time          `json:"startedAt"`
	CompletedAt      time.Time          `json:"completedAt"`
	ErrorCode        string             `json:"errorCode,omitempty"`
	ErrorMessage     string             `json:"errorMessage,omitempty"`
}

type Dispatch struct {
	AttemptID     string           `json:"attemptId"`
	TaskID        string           `json:"taskId"`
	RunID         string           `json:"runId"`
	ProjectID     string           `json:"projectId"`
	BundleID      string           `json:"bundleId"`
	ReleaseID     string           `json:"releaseId"`
	NodeID        string           `json:"nodeId"`
	LeaseOwner    string           `json:"leaseOwner"`
	DeadlineAt    time.Time        `json:"deadlineAt"`
	Engine        string           `json:"engine"`
	EngineDigest  string           `json:"engineDigest"`
	Configuration json.RawMessage  `json:"configuration"`
	Artifact      ArtifactIdentity `json:"artifact"`
}

type TerminalSnapshot struct {
	RunID, ProjectID, BundleID, ReleaseID, ArtifactID, ArtifactChecksum, PolicyVersionID string
	PolicyDefinition                                                                     json.RawMessage
	Status                                                                               string
	Findings                                                                             []Finding
	Dimensions                                                                           map[string]float64
	Overall, Confidence, Completeness                                                    float64
	Decision                                                                             string
	PolicyResults                                                                        any
	RequiredFailure, InfrastructureFailure                                               bool
}

type ReportRef struct {
	Provider, Bucket, Key, ChecksumSHA256 string
}

func (r ResultEnvelope) Validate() error {
	if r.SchemaVersion != "verification-result.v1" || r.AttemptID == "" || r.LeaseOwner == "" || r.EngineDigest == "" || !sha256Pattern.MatchString(r.ArtifactChecksum) {
		return errors.New("verification result identity or schema is invalid")
	}
	if !between01(r.Coverage) || !between01(r.Completeness) || !between01(r.Reproducibility) || !between01(r.EngineHealth) {
		return errors.New("verification result confidence inputs must be between zero and one")
	}
	validStatus := map[string]bool{"succeeded": true, "bundle_failed": true, "infrastructure_failed": true, "timed_out": true, "cancelled": true}
	if !validStatus[r.Status] {
		return errors.New("verification result status is invalid")
	}
	if len(r.Metrics) > 1_000 {
		return errors.New("verification result exceeds metric limits")
	}
	for name, value := range r.Metrics {
		if name == "" || math.IsNaN(value) || math.IsInf(value, 0) {
			return errors.New("verification result metric is invalid")
		}
	}
	if len(r.Findings) > 10_000 || len(r.Evidence) > 1_000 {
		return errors.New("verification result exceeds finding or evidence limits")
	}
	for _, finding := range r.Findings {
		if finding.Fingerprint == "" || finding.Dimension == "" || finding.RuleID == "" || finding.Title == "" || !between01(finding.Confidence) {
			return errors.New("verification finding is invalid")
		}
	}
	for _, evidence := range r.Evidence {
		if evidence.Kind == "" || evidence.Provider == "" || evidence.Bucket == "" || evidence.Key == "" || !sha256Pattern.MatchString(evidence.ChecksumSHA256) || evidence.SizeBytes <= 0 {
			return errors.New("verification evidence is invalid")
		}
	}
	return nil
}

var DimensionWeights = map[string]float64{
	"runtime": 0.25, "security": 0.20, "performance": 0.15, "accessibility": 0.10,
	"api": 0.10, "bundle": 0.10, "visual": 0.05, "seo": 0.05,
}

func Score(findings []Finding, confidenceInputs []float64) (map[string]float64, float64, float64) {
	dimensions := make(map[string]float64, len(DimensionWeights))
	for dimension := range DimensionWeights {
		dimensions[dimension] = 100
	}
	penalty := map[string]float64{"critical": 70, "high": 35, "medium": 15, "low": 5, "info": 1}
	for _, finding := range findings {
		dimension := finding.Dimension
		if _, ok := dimensions[dimension]; !ok {
			dimension = "bundle"
		}
		p := penalty[finding.Severity]
		if p == 0 {
			p = 5
		}
		dimensions[dimension] = math.Max(0, dimensions[dimension]-p*clamp01(finding.Confidence))
	}
	logScore := 0.0
	for dimension, weight := range DimensionWeights {
		logScore += weight * math.Log(math.Max(dimensions[dimension], 1))
	}
	overall := math.Exp(logScore)
	confidence := 0.0
	if len(confidenceInputs) > 0 {
		for _, value := range confidenceInputs {
			confidence += clamp01(value)
		}
		confidence /= float64(len(confidenceInputs))
	}
	return dimensions, round(overall), round(confidence * 100)
}

func clamp01(value float64) float64 { return math.Max(0, math.Min(1, value)) }
func round(value float64) float64   { return math.Round(value*100) / 100 }
func between01(value float64) bool  { return value >= 0 && value <= 1 }
