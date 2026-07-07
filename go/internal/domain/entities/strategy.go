package entities

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// StrategyTemplate represents a blueprint or class of algorithmic strategy.
type StrategyTemplate struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name      string    `json:"name" gorm:"type:varchar(255);not null;uniqueIndex"`
	CreatedAt time.Time `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for StrategyTemplate.
func (StrategyTemplate) TableName() string {
	return "strategy_templates"
}

// Strategy represents a customized strategy instance.
type Strategy struct {
	ID         uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	TemplateID *uuid.UUID     `json:"template_id" gorm:"type:uuid"`
	UserID     uuid.UUID      `json:"user_id" gorm:"type:uuid;not null"`
	Name       string         `json:"name" gorm:"type:varchar(255);not null"`
	Status     string         `json:"status" gorm:"type:varchar(50);not null;default:inactive"`
	Version    int64          `json:"version" gorm:"type:bigint;not null;default:1"`
	CreatedAt  time.Time      `json:"created_at" gorm:"not null;default:now()"`
	DeletedAt  gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// TableName overrides the default table name for Strategy.
func (Strategy) TableName() string {
	return "strategies"
}

// StrategyDraft holds draft/in-progress configuration of a strategy.
type StrategyDraft struct {
	ID          uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	StrategyID  uuid.UUID       `json:"strategy_id" gorm:"type:uuid;not null"`
	ConfigDraft json.RawMessage `json:"config_draft" gorm:"type:jsonb;not null"`
}

// TableName overrides the default table name for StrategyDraft.
func (StrategyDraft) TableName() string {
	return "strategy_drafts"
}

// StrategyVersion tracks revisions of strategy deployments.
type StrategyVersion struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	StrategyID uuid.UUID `json:"strategy_id" gorm:"type:uuid;not null"`
	Version    string    `json:"version" gorm:"type:varchar(50);not null"`
	IsFrozen   bool      `json:"is_frozen" gorm:"not null;default:false"`
}

// TableName overrides the default table name for StrategyVersion.
func (StrategyVersion) TableName() string {
	return "strategy_versions"
}

// StrategyFormulaVersion stores strategy logic scripts/formula DSL.
type StrategyFormulaVersion struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	StrategyVersionID uuid.UUID `json:"strategy_version_id" gorm:"type:uuid;not null"`
	FormulaDSL        string    `json:"formula_dsl" gorm:"type:text;not null"`
}

// TableName overrides the default table name for StrategyFormulaVersion.
func (StrategyFormulaVersion) TableName() string {
	return "strategy_formula_versions"
}

// StrategyWeightSet tracks target asset allocations/portfolio weights.
type StrategyWeightSet struct {
	ID                uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	StrategyVersionID uuid.UUID       `json:"strategy_version_id" gorm:"type:uuid;not null"`
	Weights           json.RawMessage `json:"weights" gorm:"type:jsonb;not null"`
}

// TableName overrides the default table name for StrategyWeightSet.
func (StrategyWeightSet) TableName() string {
	return "strategy_weight_sets"
}

// StrategyUniverse contains list of symbols selected for strategy execution.
type StrategyUniverse struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	StrategyVersionID uuid.UUID `json:"strategy_version_id" gorm:"type:uuid;not null"`
	Symbols           []string  `json:"symbols" gorm:"type:varchar(50)[];not null"`
}

// TableName overrides the default table name for StrategyUniverse.
func (StrategyUniverse) TableName() string {
	return "strategy_universes"
}

// StrategyRiskProfile defines max drawdown/leverage safety settings.
type StrategyRiskProfile struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	StrategyVersionID uuid.UUID `json:"strategy_version_id" gorm:"type:uuid;not null"`
	MaxLeverage       float64   `json:"max_leverage" gorm:"type:numeric(10,4);not null"`
	MaxDrawdown       float64   `json:"max_drawdown" gorm:"type:numeric(10,4);not null"`
}

// TableName overrides the default table name for StrategyRiskProfile.
func (StrategyRiskProfile) TableName() string {
	return "strategy_risk_profiles"
}

// StrategyValidationRun logs outcomes of validation checks.
type StrategyValidationRun struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	StrategyVersionID uuid.UUID `json:"strategy_version_id" gorm:"type:uuid;not null"`
	IsValid           bool      `json:"is_valid" gorm:"not null"`
}

// TableName overrides the default table name for StrategyValidationRun.
func (StrategyValidationRun) TableName() string {
	return "strategy_validation_runs"
}

// BacktestRun represents backtesting jobs executions.
type BacktestRun struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	StrategyVersionID uuid.UUID `json:"strategy_version_id" gorm:"type:uuid;not null"`
	StartedAt         time.Time `json:"started_at" gorm:"not null;default:now()"`
	Status            string    `json:"status" gorm:"type:varchar(50);not null;default:running"`
}

// TableName overrides the default table name for BacktestRun.
func (BacktestRun) TableName() string {
	return "backtest_runs"
}

// BacktestArtifact stores paths of artifacts generated by backtests (CSV, logs, plots).
type BacktestArtifact struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	BacktestID   uuid.UUID `json:"backtest_id" gorm:"type:uuid;not null"`
	FilePath     string    `json:"file_path" gorm:"type:text;not null"`
	ArtifactType string    `json:"artifact_type" gorm:"type:varchar(100);not null"`
}

// TableName overrides the default table name for BacktestArtifact.
func (BacktestArtifact) TableName() string {
	return "backtest_artifacts"
}

// BacktestComparison stores comparison scores and metrics.
type BacktestComparison struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	BacktestID      uuid.UUID `json:"backtest_id" gorm:"type:uuid;not null"`
	ComparisonKey   string    `json:"comparison_key" gorm:"type:varchar(100);not null"`
	ComparisonValue float64   `json:"comparison_value" gorm:"type:numeric(20,8);not null"`
}

// TableName overrides the default table name for BacktestComparison.
func (BacktestComparison) TableName() string {
	return "backtest_comparisons"
}

// PaperSession represents virtual trading sessions.
type PaperSession struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	StrategyVersionID uuid.UUID `json:"strategy_version_id" gorm:"type:uuid;not null"`
	AccountID         uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	Status            string    `json:"status" gorm:"type:varchar(50);not null;default:running"`
	StartedAt         time.Time `json:"started_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for PaperSession.
func (PaperSession) TableName() string {
	return "paper_sessions"
}

// PaperSessionMetric holds tracking parameters for paper trading session performance.
type PaperSessionMetric struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SessionID uuid.UUID `json:"session_id" gorm:"type:uuid;not null"`
	PnL       float64   `json:"pnl" gorm:"type:numeric(20,8);not null"`
	Drawdown  float64   `json:"drawdown" gorm:"type:numeric(20,8);not null"`
}

// TableName overrides the default table name for PaperSessionMetric.
func (PaperSessionMetric) TableName() string {
	return "paper_session_metrics"
}

// PaperSessionSignal tracks signals triggered by paper runs.
type PaperSessionSignal struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SessionID  uuid.UUID `json:"session_id" gorm:"type:uuid;not null"`
	Timestamp  time.Time `json:"timestamp" gorm:"not null"`
	Symbol     string    `json:"symbol" gorm:"type:varchar(50);not null"`
	SignalType string    `json:"signal_type" gorm:"type:varchar(50);not null"`
}

// TableName overrides the default table name for PaperSessionSignal.
func (PaperSessionSignal) TableName() string {
	return "paper_session_signals"
}

// PaperSessionOrder maps virtual signals/trades to actual orders.
type PaperSessionOrder struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SessionID uuid.UUID `json:"session_id" gorm:"type:uuid;not null"`
	OrderID   uuid.UUID `json:"order_id" gorm:"type:uuid;not null"`
}

// TableName overrides the default table name for PaperSessionOrder.
func (PaperSessionOrder) TableName() string {
	return "paper_session_orders"
}

// SignalTrace logs detailed steps leading to trading signals.
type SignalTrace struct {
	ID         uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	BacktestID uuid.UUID       `json:"backtest_id" gorm:"type:uuid;not null"`
	Timestamp  time.Time       `json:"timestamp" gorm:"not null"`
	TraceData  json.RawMessage `json:"trace_data" gorm:"type:jsonb;not null"`
}

// TableName overrides the default table name for SignalTrace.
func (SignalTrace) TableName() string {
	return "signal_traces"
}

// RiskTraceFixture holds static JSON representations of risk check constraints.
type RiskTraceFixture struct {
	ID          uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name        string          `json:"name" gorm:"type:varchar(255);not null"`
	FixtureData json.RawMessage `json:"fixture_data" gorm:"type:jsonb;not null"`
}

// TableName overrides the default table name for RiskTraceFixture.
func (RiskTraceFixture) TableName() string {
	return "risk_trace_fixtures"
}

// ParityCheckRun tracks comparison runs between simulated vs real stats.
type ParityCheckRun struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	CheckedAt       time.Time `json:"checked_at" gorm:"not null;default:now()"`
	MismatchesFound int       `json:"mismatches_found" gorm:"type:integer;not null"`
}

// TableName overrides the default table name for ParityCheckRun.
func (ParityCheckRun) TableName() string {
	return "parity_check_runs"
}

// StrategyStabilityReport scores strategies stability.
type StrategyStabilityReport struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	StrategyVersionID uuid.UUID `json:"strategy_version_id" gorm:"type:uuid;not null"`
	Score             float64   `json:"score" gorm:"type:numeric(5,2);not null"`
}

// TableName overrides the default table name for StrategyStabilityReport.
func (StrategyStabilityReport) TableName() string {
	return "strategy_stability_reports"
}

// StrategyPromotionRequest represents promotion pipeline states.
type StrategyPromotionRequest struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	StrategyVersionID uuid.UUID `json:"strategy_version_id" gorm:"type:uuid;not null"`
	RequestedBy       uuid.UUID `json:"requested_by" gorm:"type:uuid;not null"`
	Status            string    `json:"status" gorm:"type:varchar(50);not null;default:pending"`
}

// TableName overrides the default table name for StrategyPromotionRequest.
func (StrategyPromotionRequest) TableName() string {
	return "strategy_promotion_requests"
}

// StrategyLiveApproval stores reviews/approvals of promotions.
type StrategyLiveApproval struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	RequestID uuid.UUID `json:"request_id" gorm:"type:uuid;not null"`
	ApprovedBy uuid.UUID `json:"approved_by" gorm:"type:uuid;not null"`
}

// TableName overrides the default table name for StrategyLiveApproval.
func (StrategyLiveApproval) TableName() string {
	return "strategy_live_approvals"
}

// StrategyDeployment tracks strategies mapped to active live accounts.
type StrategyDeployment struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	StrategyVersionID uuid.UUID `json:"strategy_version_id" gorm:"type:uuid;not null"`
	AccountID         uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	Status            string    `json:"status" gorm:"type:varchar(50);not null;default:active"`
}

// TableName overrides the default table name for StrategyDeployment.
func (StrategyDeployment) TableName() string {
	return "strategy_deployments"
}

// StrategyActivationEvent logs activation events of deployments.
type StrategyActivationEvent struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	DeploymentID uuid.UUID `json:"deployment_id" gorm:"type:uuid;not null"`
	EventType    string    `json:"event_type" gorm:"type:varchar(100);not null"`
}

// TableName overrides the default table name for StrategyActivationEvent.
func (StrategyActivationEvent) TableName() string {
	return "strategy_activation_events"
}

// StrategyRuntimeInstance represents strategies daemon processes/tasks.
type StrategyRuntimeInstance struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	DeploymentID uuid.UUID `json:"deployment_id" gorm:"type:uuid;not null"`
	HostAddress  string    `json:"host_address" gorm:"type:varchar(255);not null"`
	Status       string    `json:"status" gorm:"type:varchar(50);not null;default:running"`
}

// TableName overrides the default table name for StrategyRuntimeInstance.
func (StrategyRuntimeInstance) TableName() string {
	return "strategy_runtime_instances"
}

// StrategyRuntimeSnapshot tracks process memory snapshots/health variables.
type StrategyRuntimeSnapshot struct {
	ID           uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	InstanceID   uuid.UUID       `json:"instance_id" gorm:"type:uuid;not null"`
	SnapshotTime time.Time       `json:"snapshot_time" gorm:"not null"`
	SnapshotData json.RawMessage `json:"snapshot_data" gorm:"type:jsonb;not null"`
}

// TableName overrides the default table name for StrategyRuntimeSnapshot.
func (StrategyRuntimeSnapshot) TableName() string {
	return "strategy_runtime_snapshots"
}

// StrategyRuntimeCheckpoint tracks transaction/event aggregate offsets.
type StrategyRuntimeCheckpoint struct {
	ID             uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	InstanceID     uuid.UUID       `json:"instance_id" gorm:"type:uuid;not null"`
	CheckpointTime time.Time       `json:"checkpoint_time" gorm:"not null"`
	CheckpointData json.RawMessage `json:"checkpoint_data" gorm:"type:jsonb;not null"`
}

// TableName overrides the default table name for StrategyRuntimeCheckpoint.
func (StrategyRuntimeCheckpoint) TableName() string {
	return "strategy_runtime_checkpoints"
}

// StrategyRuntimeLock acts as distributed locks for instances.
type StrategyRuntimeLock struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	InstanceID uuid.UUID `json:"instance_id" gorm:"type:uuid;not null"`
	LockKey    string    `json:"lock_key" gorm:"type:varchar(255);not null;uniqueIndex"`
}

// TableName overrides the default table name for StrategyRuntimeLock.
func (StrategyRuntimeLock) TableName() string {
	return "strategy_runtime_locks"
}

// StrategyExecutionParameter stores parameters passed to instances.
type StrategyExecutionParameter struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	StrategyVersionID uuid.UUID `json:"strategy_version_id" gorm:"type:uuid;not null"`
	ParameterKey      string    `json:"parameter_key" gorm:"type:varchar(100);not null"`
	ParameterValue    string    `json:"parameter_value" gorm:"type:varchar(255);not null"`
}

// TableName overrides the default table name for StrategyExecutionParameter.
func (StrategyExecutionParameter) TableName() string {
	return "strategy_execution_parameters"
}
