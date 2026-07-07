package entities

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// RiskEvent represents a system event or risk violation logged in the PostgreSQL database.
type RiskEvent struct {
	ID         int32           `json:"id" db:"id" gorm:"primaryKey;column:id"`
	EventType  string          `json:"event_type" db:"event_type" gorm:"column:event_type"`
	Severity   string          `json:"severity" db:"severity" gorm:"column:severity"`
	Message    string          `json:"message" db:"message" gorm:"column:message"`
	Metadata   json.RawMessage `json:"metadata" db:"metadata" gorm:"column:metadata;type:jsonb"`
	OccurredAt time.Time       `json:"occurred_at" db:"occurred_at" gorm:"column:occurred_at"`
}

// TableName overrides the default table name for RiskEvent mapping.
func (RiskEvent) TableName() string {
	return "risk_events"
}

// RiskLimit holds global or account/user level risk definitions.
type RiskLimit struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AccountID *uuid.UUID `json:"account_id" gorm:"type:uuid"`
	UserID    *uuid.UUID `json:"user_id" gorm:"type:uuid"`
	Name      string     `json:"name" gorm:"type:varchar(150);not null"`
	CreatedAt time.Time  `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for RiskLimit.
func (RiskLimit) TableName() string {
	return "risk_limits"
}

// RiskLimitVersion contains thresholds for specific versions of a risk limit.
type RiskLimitVersion struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	LimitID     uuid.UUID `json:"limit_id" gorm:"type:uuid;not null"`
	Version     int       `json:"version" gorm:"type:integer;not null"`
	MaxNotional float64   `json:"max_notional" gorm:"type:numeric(20,8);not null"`
	MaxDrawdown float64   `json:"max_drawdown" gorm:"type:numeric(20,8);not null"`
	IsActive    bool      `json:"is_active" gorm:"not null;default:true"`
	CreatedAt   time.Time `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for RiskLimitVersion.
func (RiskLimitVersion) TableName() string {
	return "risk_limit_versions"
}

// RiskDecision logs approvals or rejections of pre-trade checks.
type RiskDecision struct {
	ID             uuid.UUID          `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Status         RiskDecisionStatus `json:"status" gorm:"type:risk_decision_status;not null"`
	DecisionReason *string            `json:"decision_reason" gorm:"type:varchar(255)"`
	LatencyMs      float64            `json:"latency_ms" gorm:"type:numeric(10,4);not null"`
	CheckedAt      time.Time          `json:"checked_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for RiskDecision.
func (RiskDecision) TableName() string {
	return "risk_decisions"
}

// PreTradeCheck holds outcomes of individual checks within a decision process.
type PreTradeCheck struct {
	ID             uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	LimitVersionID *uuid.UUID `json:"limit_version_id" gorm:"type:uuid"`
	DecisionID     uuid.UUID  `json:"decision_id" gorm:"type:uuid;not null"`
	CheckName      string     `json:"check_name" gorm:"type:varchar(100);not null"`
	Passed         bool       `json:"passed" gorm:"not null"`
}

// TableName overrides the default table name for PreTradeCheck.
func (PreTradeCheck) TableName() string {
	return "pre_trade_checks"
}

// RiskDecisionInput logs parameters utilized during a decision run.
type RiskDecisionInput struct {
	ID         uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	DecisionID uuid.UUID       `json:"decision_id" gorm:"type:uuid;not null"`
	InputKey   string          `json:"input_key" gorm:"type:varchar(100);not null"`
	InputValue json.RawMessage `json:"input_value" gorm:"type:jsonb;not null"`
}

// TableName overrides the default table name for RiskDecisionInput.
func (RiskDecisionInput) TableName() string {
	return "risk_decision_inputs"
}

// IntradayRiskSnapshot tracks real-time account risk usage.
type IntradayRiskSnapshot struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AccountID         uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	SnapshotTime      time.Time `json:"snapshot_time" gorm:"not null"`
	CurrentDrawdown   float64   `json:"current_drawdown" gorm:"type:numeric(20,8);not null"`
	MarginUtilization float64   `json:"margin_utilization" gorm:"type:numeric(5,4);not null"`
}

// TableName overrides the default table name for IntradayRiskSnapshot.
func (IntradayRiskSnapshot) TableName() string {
	return "intraday_risk_snapshots"
}

// PostTradeReview audits executions for rule violations.
type PostTradeReview struct {
	ID               uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	TradeID          *uuid.UUID `json:"trade_id" gorm:"type:uuid"`
	ReviewStatus     string     `json:"review_status" gorm:"type:varchar(50);not null"`
	ViolationDetails *string    `json:"violation_details" gorm:"type:text"`
}

// TableName overrides the default table name for PostTradeReview.
func (PostTradeReview) TableName() string {
	return "post_trade_reviews"
}

// ExposureSnapshot tracks real-time asset exposure.
type ExposureSnapshot struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AccountID      uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	Symbol         string    `json:"symbol" gorm:"type:varchar(50);not null"`
	ExposureAmount float64   `json:"exposure_amount" gorm:"type:numeric(20,8);not null"`
}

// TableName overrides the default table name for ExposureSnapshot.
func (ExposureSnapshot) TableName() string {
	return "exposure_snapshots"
}

// MarginCheck tracks checks of margins requirements against limits.
type MarginCheck struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AccountID         uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	MarginRequirement float64   `json:"margin_requirement" gorm:"type:numeric(20,8);not null"`
	CheckedAt         time.Time `json:"checked_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for MarginCheck.
func (MarginCheck) TableName() string {
	return "margin_checks"
}

// StopLossTrigger represents set values for automated closes.
type StopLossTrigger struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PositionID   uuid.UUID `json:"position_id" gorm:"type:uuid;not null"`
	TriggerPrice float64   `json:"trigger_price" gorm:"type:numeric(20,8);not null"`
	IsActive     bool      `json:"is_active" gorm:"not null;default:true"`
}

// TableName overrides the default table name for StopLossTrigger.
func (StopLossTrigger) TableName() string {
	return "stop_loss_triggers"
}

// CircuitBreakerEvent logs market trading halts.
type CircuitBreakerEvent struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Symbol    string     `json:"symbol" gorm:"type:varchar(50);not null"`
	EventType string     `json:"event_type" gorm:"type:varchar(100);not null"`
	StartedAt time.Time  `json:"started_at" gorm:"not null"`
	EndedAt   *time.Time `json:"ended_at"`
}

// TableName overrides the default table name for CircuitBreakerEvent.
func (CircuitBreakerEvent) TableName() string {
	return "circuit_breaker_events"
}

// KillSwitchEvent tracks system-wide or specific manual halts.
type KillSwitchEvent struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ScopeType   string    `json:"scope_type" gorm:"type:varchar(50);not null"`
	ScopeID     *string   `json:"scope_id" gorm:"type:varchar(100)"`
	ActivatedBy uuid.UUID `json:"activated_by" gorm:"type:uuid;not null"`
	Reason      string    `json:"reason" gorm:"type:text;not null"`
	ActivatedAt time.Time `json:"activated_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for KillSwitchEvent.
func (KillSwitchEvent) TableName() string {
	return "kill_switch_events"
}

// RiskRuleTemplate contains reusable rule definitions.
type RiskRuleTemplate struct {
	ID          string `json:"id" gorm:"type:varchar(50);primaryKey"`
	Description string `json:"description" gorm:"type:text;not null"`
}

// TableName overrides the default table name for RiskRuleTemplate.
func (RiskRuleTemplate) TableName() string {
	return "risk_rule_templates"
}
