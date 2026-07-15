package entities

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// RiskEvent represents a system event or risk violation logged in the PostgreSQL database.
type RiskEvent struct {
	ID         int32           `json:"id" db:"id"`
	EventType  string          `json:"event_type" db:"event_type"`
	Severity   string          `json:"severity" db:"severity"`
	Message    string          `json:"message" db:"message"`
	Metadata   json.RawMessage `json:"metadata" db:"metadata"`
	OccurredAt time.Time       `json:"occurred_at" db:"occurred_at"`
}

// RiskLimit holds global or account/user level risk definitions.
type RiskLimit struct {
	ID        uuid.UUID  `json:"id"`
	AccountID *uuid.UUID `json:"account_id"`
	UserID    *uuid.UUID `json:"user_id"`
	Name      string     `json:"name"`
	CreatedAt time.Time  `json:"created_at"`
}

// RiskLimitVersion contains thresholds for specific versions of a risk limit.
type RiskLimitVersion struct {
	ID          uuid.UUID `json:"id"`
	LimitID     uuid.UUID `json:"limit_id"`
	Version     int       `json:"version"`
	MaxNotional float64   `json:"max_notional"`
	MaxDrawdown float64   `json:"max_drawdown"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
}

// RiskDecision logs approvals or rejections of pre-trade checks.
type RiskDecision struct {
	ID             uuid.UUID          `json:"id"`
	Status         RiskDecisionStatus `json:"status"`
	DecisionReason *string            `json:"decision_reason"`
	LatencyMs      float64            `json:"latency_ms"`
	CheckedAt      time.Time          `json:"checked_at"`
}

// PreTradeCheck holds outcomes of individual checks within a decision process.
type PreTradeCheck struct {
	ID             uuid.UUID  `json:"id"`
	LimitVersionID *uuid.UUID `json:"limit_version_id"`
	DecisionID     uuid.UUID  `json:"decision_id"`
	CheckName      string     `json:"check_name"`
	Passed         bool       `json:"passed"`
}

// RiskDecisionInput logs parameters utilized during a decision run.
type RiskDecisionInput struct {
	ID         uuid.UUID       `json:"id"`
	DecisionID uuid.UUID       `json:"decision_id"`
	InputKey   string          `json:"input_key"`
	InputValue json.RawMessage `json:"input_value"`
}

// IntradayRiskSnapshot tracks real-time account risk usage.
type IntradayRiskSnapshot struct {
	ID                uuid.UUID `json:"id"`
	AccountID         uuid.UUID `json:"account_id"`
	SnapshotTime      time.Time `json:"snapshot_time"`
	CurrentDrawdown   float64   `json:"current_drawdown"`
	MarginUtilization float64   `json:"margin_utilization"`
}

// PostTradeReview audits executions for rule violations.
type PostTradeReview struct {
	ID               uuid.UUID  `json:"id"`
	TradeID          *uuid.UUID `json:"trade_id"`
	ReviewStatus     string     `json:"review_status"`
	ViolationDetails *string    `json:"violation_details"`
}

// ExposureSnapshot tracks real-time asset exposure.
type ExposureSnapshot struct {
	ID             uuid.UUID `json:"id"`
	AccountID      uuid.UUID `json:"account_id"`
	Symbol         string    `json:"symbol"`
	ExposureAmount float64   `json:"exposure_amount"`
}

// MarginCheck tracks checks of margins requirements against limits.
type MarginCheck struct {
	ID                uuid.UUID `json:"id"`
	AccountID         uuid.UUID `json:"account_id"`
	MarginRequirement float64   `json:"margin_requirement"`
	CheckedAt         time.Time `json:"checked_at"`
}

// StopLossTrigger represents set values for automated closes.
type StopLossTrigger struct {
	ID           uuid.UUID `json:"id"`
	PositionID   uuid.UUID `json:"position_id"`
	TriggerPrice float64   `json:"trigger_price"`
	IsActive     bool      `json:"is_active"`
}

// CircuitBreakerEvent logs market trading halts.
type CircuitBreakerEvent struct {
	ID        uuid.UUID  `json:"id"`
	Symbol    string     `json:"symbol"`
	EventType string     `json:"event_type"`
	StartedAt time.Time  `json:"started_at"`
	EndedAt   *time.Time `json:"ended_at"`
}

// KillSwitchEvent tracks system-wide or specific manual halts.
type KillSwitchEvent struct {
	ID          uuid.UUID `json:"id"`
	ScopeType   string    `json:"scope_type"`
	ScopeID     *string   `json:"scope_id"`
	ActivatedBy uuid.UUID `json:"activated_by"`
	Reason      string    `json:"reason"`
	ActivatedAt time.Time `json:"activated_at"`
}

// RiskRuleTemplate contains reusable rule definitions.
type RiskRuleTemplate struct {
	ID          string `json:"id"`
	Description string `json:"description"`
}
