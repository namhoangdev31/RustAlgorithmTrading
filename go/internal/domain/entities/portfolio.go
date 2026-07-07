package entities

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Account represents a database account.
type Account struct {
	ID            uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID        uuid.UUID      `json:"user_id" gorm:"type:uuid;not null"`
	AccountNumber string         `json:"account_number" gorm:"type:varchar(100);not null;uniqueIndex"`
	BrokerName    string         `json:"broker_name" gorm:"type:varchar(100);not null"`
	Currency      string         `json:"currency" gorm:"type:varchar(10);not null;default:USD"`
	Balance       float64        `json:"balance" gorm:"type:numeric(20,8);not null;default:0"`
	Status        string         `json:"status" gorm:"type:varchar(50);not null;default:active"`
	Version       int64          `json:"version" gorm:"type:bigint;not null;default:1"`
	CreatedAt     time.Time      `json:"created_at" gorm:"not null;default:now()"`
	UpdatedAt     time.Time      `json:"updated_at" gorm:"not null;default:now()"`
	DeletedAt     gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// TableName overrides the default table name for Account.
func (Account) TableName() string {
	return "accounts"
}

// AccountConnection holds credentials and status of third party broker accounts.
type AccountConnection struct {
	ID                   uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AccountID            uuid.UUID  `json:"account_id" gorm:"type:uuid;not null"`
	CredentialsEncrypted string     `json:"-" gorm:"type:text;not null"`
	ConnectionStatus     string     `json:"connection_status" gorm:"type:varchar(50);not null;default:disconnected"`
	LastPingAt           *time.Time `json:"last_ping_at"`
}

// TableName overrides the default table name for AccountConnection.
func (AccountConnection) TableName() string {
	return "account_connections"
}

// AccountPermission maps users to account authorization levels.
type AccountPermission struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AccountID       uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	UserID          uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
	PermissionLevel string    `json:"permission_level" gorm:"type:varchar(50);not null;default:read_only"`
}

// TableName overrides the default table name for AccountPermission.
func (AccountPermission) TableName() string {
	return "account_permissions"
}

// ValuationRun represents system triggered audits or valuations.
type ValuationRun struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	TriggeredBy string     `json:"triggered_by" gorm:"type:varchar(100);not null"`
	StartedAt   time.Time  `json:"started_at" gorm:"not null;default:now()"`
	CompletedAt *time.Time `json:"completed_at"`
	Status      string     `json:"status" gorm:"type:varchar(50);not null;default:running"`
}

// TableName overrides the default table name for ValuationRun.
func (ValuationRun) TableName() string {
	return "valuation_runs"
}

// AccountSnapshot records historical account equity status.
type AccountSnapshot struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AccountID    uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	SnapshotTime time.Time `json:"snapshot_time" gorm:"not null"`
	Balance      float64   `json:"balance" gorm:"type:numeric(20,8);not null"`
	BuyingPower  float64   `json:"buying_power" gorm:"type:numeric(20,8);not null"`
	Equity       float64   `json:"equity" gorm:"type:numeric(20,8);not null"`
}

// TableName overrides the default table name for AccountSnapshot.
func (AccountSnapshot) TableName() string {
	return "account_snapshots"
}

// PortfolioSnapshot records historical portfolio metrics.
type PortfolioSnapshot struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AccountID    uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	SnapshotTime time.Time `json:"snapshot_time" gorm:"not null"`
	TotalValue   float64   `json:"total_value" gorm:"type:numeric(20,8);not null"`
	UnrealizedPnL float64   `json:"unrealized_pnl" gorm:"type:numeric(20,8);not null"`
	RealizedPnL   float64   `json:"realized_pnl" gorm:"type:numeric(20,8);not null"`
}

// TableName overrides the default table name for PortfolioSnapshot.
func (PortfolioSnapshot) TableName() string {
	return "portfolio_snapshots"
}

// PortfolioValuation tracks net asset values computed by valuation runs.
type PortfolioValuation struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AccountID      uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	ValuationRunID uuid.UUID `json:"valuation_run_id" gorm:"type:uuid;not null"`
	PortfolioValue float64   `json:"portfolio_value" gorm:"type:numeric(20,8);not null"`
	CalculatedAt   time.Time `json:"calculated_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for PortfolioValuation.
func (PortfolioValuation) TableName() string {
	return "portfolio_valuations"
}

// PortfolioEvent tracks account audit events.
type PortfolioEvent struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AccountID uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	EventType string    `json:"event_type" gorm:"type:varchar(100);not null"`
	Description *string  `json:"description" gorm:"type:text"`
	CreatedAt time.Time `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for PortfolioEvent.
func (PortfolioEvent) TableName() string {
	return "portfolio_events"
}

// Position represents an active asset balance.
type Position struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AccountID         uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	Symbol            string    `json:"symbol" gorm:"type:varchar(50);not null"`
	Quantity          float64   `json:"quantity" gorm:"type:numeric(20,8);not null;default:0"`
	AverageEntryPrice float64   `json:"average_entry_price" gorm:"type:numeric(20,8);not null;default:0"`
	RealizedPnL       float64   `json:"realized_pnl" gorm:"type:numeric(20,8);not null;default:0"`
	Version           int64     `json:"version" gorm:"type:bigint;not null;default:1"`
	UpdatedAt         time.Time `json:"updated_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for Position.
func (Position) TableName() string {
	return "positions"
}

// PositionLot tracks individual tax lots for long/short positions.
type PositionLot struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PositionID uuid.UUID `json:"position_id" gorm:"type:uuid;not null"`
	Quantity   float64   `json:"quantity" gorm:"type:numeric(20,8);not null"`
	EntryPrice float64   `json:"entry_price" gorm:"type:numeric(20,8);not null"`
	EntryTime  time.Time `json:"entry_time" gorm:"not null"`
}

// TableName overrides the default table name for PositionLot.
func (PositionLot) TableName() string {
	return "position_lots"
}

// PositionEvent logs history of lot creations or closes.
type PositionEvent struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PositionID     uuid.UUID `json:"position_id" gorm:"type:uuid;not null"`
	AccountID      uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	ChangeQty      float64   `json:"change_qty" gorm:"type:numeric(20,8);not null"`
	ExecutionPrice float64   `json:"execution_price" gorm:"type:numeric(20,8);not null"`
	CreatedAt      time.Time `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for PositionEvent.
func (PositionEvent) TableName() string {
	return "position_events"
}

// PositionValuation tracks market value of positions.
type PositionValuation struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PositionID     uuid.UUID `json:"position_id" gorm:"type:uuid;not null"`
	ValuationRunID uuid.UUID `json:"valuation_run_id" gorm:"type:uuid;not null"`
	MarketValue    float64   `json:"market_value" gorm:"type:numeric(20,8);not null"`
	UnrealizedPnL  float64   `json:"unrealized_pnl" gorm:"type:numeric(20,8);not null"`
}

// TableName overrides the default table name for PositionValuation.
func (PositionValuation) TableName() string {
	return "position_valuations"
}

// CashBalance tracks available and reserved cash in multiple currencies.
type CashBalance struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AccountID      uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	Currency       string    `json:"currency" gorm:"type:varchar(10);not null"`
	Amount         float64   `json:"amount" gorm:"type:numeric(20,8);not null;default:0"`
	ReservedAmount float64   `json:"reserved_amount" gorm:"type:numeric(20,8);not null;default:0"`
}

// TableName overrides the default table name for CashBalance.
func (CashBalance) TableName() string {
	return "cash_balances"
}

// CashMovement tracks deposits, withdrawals, and allocations.
type CashMovement struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AccountID uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	Currency  string    `json:"currency" gorm:"type:varchar(10);not null"`
	Amount    float64   `json:"amount" gorm:"type:numeric(20,8);not null"`
	Type      string    `json:"type" gorm:"type:varchar(50);not null"`
	CreatedAt time.Time `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for CashMovement.
func (CashMovement) TableName() string {
	return "cash_movements"
}

// PricingSnapshot logs historical product prices utilized during runs.
type PricingSnapshot struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ValuationRunID uuid.UUID `json:"valuation_run_id" gorm:"type:uuid;not null"`
	Symbol         string    `json:"symbol" gorm:"type:varchar(50);not null"`
	Price          float64   `json:"price" gorm:"type:numeric(20,8);not null"`
	CapturedAt     time.Time `json:"captured_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for PricingSnapshot.
func (PricingSnapshot) TableName() string {
	return "pricing_snapshots"
}

// MVRealtimeDailyPnL maps to the materialized view mv_realtime_daily_pnl.
type MVRealtimeDailyPnL struct {
	AccountID        uuid.UUID `json:"account_id" gorm:"type:uuid;primaryKey"`
	TotalRealizedPnL float64   `json:"total_realized_pnl"`
	CalculatedAt     time.Time `json:"calculated_at"`
}

// TableName overrides the default table name for MVRealtimeDailyPnL.
func (MVRealtimeDailyPnL) TableName() string {
	return "mv_realtime_daily_pnl"
}
