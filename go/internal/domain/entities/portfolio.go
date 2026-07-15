package entities

import (
	"time"

	"github.com/google/uuid"
)

// Account represents a database account.
type Account struct {
	ID            uuid.UUID  `json:"id"`
	UserID        uuid.UUID  `json:"user_id"`
	AccountNumber string     `json:"account_number"`
	BrokerName    string     `json:"broker_name"`
	Currency      string     `json:"currency"`
	Balance       float64    `json:"balance"`
	Status        string     `json:"status"`
	Version       int64      `json:"version"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at"`
}

// AccountConnection holds credentials and status of third party broker accounts.
type AccountConnection struct {
	ID                   uuid.UUID  `json:"id"`
	AccountID            uuid.UUID  `json:"account_id"`
	CredentialsEncrypted string     `json:"-"`
	ConnectionStatus     string     `json:"connection_status"`
	LastPingAt           *time.Time `json:"last_ping_at"`
}

// AccountPermission maps users to account authorization levels.
type AccountPermission struct {
	ID              uuid.UUID `json:"id"`
	AccountID       uuid.UUID `json:"account_id"`
	UserID          uuid.UUID `json:"user_id"`
	PermissionLevel string    `json:"permission_level"`
}

// ValuationRun represents system triggered audits or valuations.
type ValuationRun struct {
	ID          uuid.UUID  `json:"id"`
	TriggeredBy string     `json:"triggered_by"`
	StartedAt   time.Time  `json:"started_at"`
	CompletedAt *time.Time `json:"completed_at"`
	Status      string     `json:"status"`
}

// AccountSnapshot records historical account equity status.
type AccountSnapshot struct {
	ID           uuid.UUID `json:"id"`
	AccountID    uuid.UUID `json:"account_id"`
	SnapshotTime time.Time `json:"snapshot_time"`
	Balance      float64   `json:"balance"`
	BuyingPower  float64   `json:"buying_power"`
	Equity       float64   `json:"equity"`
}

// PortfolioSnapshot records historical portfolio metrics.
type PortfolioSnapshot struct {
	ID            uuid.UUID `json:"id"`
	AccountID     uuid.UUID `json:"account_id"`
	SnapshotTime  time.Time `json:"snapshot_time"`
	TotalValue    float64   `json:"total_value"`
	UnrealizedPnL float64   `json:"unrealized_pnl"`
	RealizedPnL   float64   `json:"realized_pnl"`
}

// PortfolioValuation tracks net asset values computed by valuation runs.
type PortfolioValuation struct {
	ID             uuid.UUID `json:"id"`
	AccountID      uuid.UUID `json:"account_id"`
	ValuationRunID uuid.UUID `json:"valuation_run_id"`
	PortfolioValue float64   `json:"portfolio_value"`
	CalculatedAt   time.Time `json:"calculated_at"`
}

// PortfolioEvent tracks account audit events.
type PortfolioEvent struct {
	ID          uuid.UUID `json:"id"`
	AccountID   uuid.UUID `json:"account_id"`
	EventType   string    `json:"event_type"`
	Description *string   `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

// Position represents an active asset balance.
type Position struct {
	ID                uuid.UUID `json:"id"`
	AccountID         uuid.UUID `json:"account_id"`
	Symbol            string    `json:"symbol"`
	Quantity          float64   `json:"quantity"`
	AverageEntryPrice float64   `json:"average_entry_price"`
	RealizedPnL       float64   `json:"realized_pnl"`
	Version           int64     `json:"version"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// PositionLot tracks individual tax lots for long/short positions.
type PositionLot struct {
	ID         uuid.UUID `json:"id"`
	PositionID uuid.UUID `json:"position_id"`
	Quantity   float64   `json:"quantity"`
	EntryPrice float64   `json:"entry_price"`
	EntryTime  time.Time `json:"entry_time"`
}

// PositionEvent logs history of lot creations or closes.
type PositionEvent struct {
	ID             uuid.UUID `json:"id"`
	PositionID     uuid.UUID `json:"position_id"`
	AccountID      uuid.UUID `json:"account_id"`
	ChangeQty      float64   `json:"change_qty"`
	ExecutionPrice float64   `json:"execution_price"`
	CreatedAt      time.Time `json:"created_at"`
}

// PositionValuation tracks market value of positions.
type PositionValuation struct {
	ID             uuid.UUID `json:"id"`
	PositionID     uuid.UUID `json:"position_id"`
	ValuationRunID uuid.UUID `json:"valuation_run_id"`
	MarketValue    float64   `json:"market_value"`
	UnrealizedPnL  float64   `json:"unrealized_pnl"`
}

// CashBalance tracks available and reserved cash in multiple currencies.
type CashBalance struct {
	ID             uuid.UUID `json:"id"`
	AccountID      uuid.UUID `json:"account_id"`
	Currency       string    `json:"currency"`
	Amount         float64   `json:"amount"`
	ReservedAmount float64   `json:"reserved_amount"`
}

// CashMovement tracks deposits, withdrawals, and allocations.
type CashMovement struct {
	ID        uuid.UUID `json:"id"`
	AccountID uuid.UUID `json:"account_id"`
	Currency  string    `json:"currency"`
	Amount    float64   `json:"amount"`
	Type      string    `json:"type"`
	CreatedAt time.Time `json:"created_at"`
}

// PricingSnapshot logs historical product prices utilized during runs.
type PricingSnapshot struct {
	ID             uuid.UUID `json:"id"`
	ValuationRunID uuid.UUID `json:"valuation_run_id"`
	Symbol         string    `json:"symbol"`
	Price          float64   `json:"price"`
	CapturedAt     time.Time `json:"captured_at"`
}

// MVRealtimeDailyPnL maps to the materialized view mv_realtime_daily_pnl.
type MVRealtimeDailyPnL struct {
	AccountID        uuid.UUID `json:"account_id"`
	TotalRealizedPnL float64   `json:"total_realized_pnl"`
	CalculatedAt     time.Time `json:"calculated_at"`
}
