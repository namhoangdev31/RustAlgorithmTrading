package entities

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// OrderIntent represents a client intent to place an order.
type OrderIntent struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AccountID uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	Symbol    string    `json:"symbol" gorm:"type:varchar(50);not null"`
	Side      OrderSide `json:"side" gorm:"type:order_side;not null"`
	Type      OrderType `json:"type" gorm:"type:order_type;not null"`
	Quantity  float64   `json:"quantity" gorm:"type:numeric(20,8);not null"`
	Price     *float64  `json:"price" gorm:"type:numeric(20,8)"`
	CreatedAt time.Time `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for OrderIntent.
func (OrderIntent) TableName() string {
	return "order_intents"
}

// OrderPreview represents validation and estimation outcomes for intents.
type OrderPreview struct {
	ID               uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	IntentID         uuid.UUID       `json:"intent_id" gorm:"type:uuid;not null;uniqueIndex"`
	EstimatedMargin  float64         `json:"estimated_margin" gorm:"type:numeric(20,8);not null"`
	EstimatedFees    float64         `json:"estimated_fees" gorm:"type:numeric(20,8);not null"`
	IsValid          bool            `json:"is_valid" gorm:"not null;default:true"`
	ValidationErrors json.RawMessage `json:"validation_errors" gorm:"type:jsonb"`
}

// TableName overrides the default table name for OrderPreview.
func (OrderPreview) TableName() string {
	return "order_previews"
}

// Order represents an order record in the database.
type Order struct {
	ID                uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AccountID         uuid.UUID      `json:"account_id" gorm:"type:uuid;not null"`
	Symbol            string         `json:"symbol" gorm:"type:varchar(50);not null"`
	ClientOrderID     string         `json:"client_order_id" gorm:"type:varchar(100);not null"`
	Side              OrderSide      `json:"side" gorm:"type:order_side;not null"`
	Type              OrderType      `json:"type" gorm:"type:order_type;not null"`
	Price             *float64       `json:"price" gorm:"type:numeric(20,8)"`
	Quantity          float64        `json:"quantity" gorm:"type:numeric(20,8);not null"`
	FilledQuantity    float64        `json:"filled_quantity" gorm:"type:numeric(20,8);not null;default:0"`
	RemainingQuantity float64        `json:"remaining_quantity" gorm:"->;column:remaining_quantity;type:numeric(20,8)"` // generated column
	Status            OrderStatus    `json:"status" gorm:"type:order_status;not null;default:received"`
	TimeInForce       string         `json:"time_in_force" gorm:"type:varchar(20);not null;default:GTC"`
	Version           int64          `json:"version" gorm:"type:bigint;not null;default:1"`
	SubmittedAt       time.Time      `json:"submitted_at" gorm:"not null;default:now()"`
	UpdatedAt         time.Time      `json:"updated_at" gorm:"not null;default:now()"`
	DeletedAt         gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// TableName overrides the default table name for Order.
func (Order) TableName() string {
	return "orders"
}

// OrderTransition logs state transitions of an order.
type OrderTransition struct {
	ID            uuid.UUID   `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OrderID       uuid.UUID   `json:"order_id" gorm:"type:uuid;not null"`
	FromStatus    OrderStatus `json:"from_status" gorm:"type:order_status;not null"`
	ToStatus      OrderStatus `json:"to_status" gorm:"type:order_status;not null"`
	Source        string      `json:"source" gorm:"type:varchar(100);not null"`
	CorrelationID uuid.UUID   `json:"correlation_id" gorm:"type:uuid;not null"`
	ReasonCode    *string     `json:"reason_code" gorm:"type:varchar(100)"`
	CreatedAt     time.Time   `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for OrderTransition.
func (OrderTransition) TableName() string {
	return "order_transitions"
}

// OrderRejection logs rejected orders details.
type OrderRejection struct {
	OrderID       uuid.UUID       `json:"order_id" gorm:"type:uuid;primaryKey"`
	ReasonCode    string          `json:"reason_code" gorm:"type:varchar(100);not null"`
	Message       string          `json:"message" gorm:"type:text;not null"`
	RejectedBy    string          `json:"rejected_by" gorm:"type:varchar(100);not null"`
	ErrorEnvelope json.RawMessage `json:"error_envelope" gorm:"type:jsonb;not null"`
}

// TableName overrides the default table name for OrderRejection.
func (OrderRejection) TableName() string {
	return "order_rejections"
}

// OrderRoute holds latency and gateway routing details.
type OrderRoute struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OrderID   uuid.UUID `json:"order_id" gorm:"type:uuid;not null"`
	RouteName string    `json:"route_name" gorm:"type:varchar(100);not null"`
	LatencyMs *int      `json:"latency_ms"`
}

// TableName overrides the default table name for OrderRoute.
func (OrderRoute) TableName() string {
	return "order_routes"
}

// BrokerOrder maps gateway orders to broker references.
type BrokerOrder struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OrderID      uuid.UUID `json:"order_id" gorm:"type:uuid;not null"`
	BrokerName   string    `json:"broker_name" gorm:"type:varchar(100);not null"`
	BrokerRefID  string    `json:"broker_ref_id" gorm:"type:varchar(100);not null;uniqueIndex"`
	BrokerStatus string    `json:"broker_status" gorm:"type:varchar(50);not null"`
}

// TableName overrides the default table name for BrokerOrder.
func (BrokerOrder) TableName() string {
	return "broker_orders"
}

// BrokerOrderEvent logs raw responses from brokers.
type BrokerOrderEvent struct {
	ID            uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	BrokerOrderID uuid.UUID       `json:"broker_order_id" gorm:"type:uuid;not null"`
	RawPayload    json.RawMessage `json:"raw_payload" gorm:"type:jsonb;not null"`
	CreatedAt     time.Time       `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for BrokerOrderEvent.
func (BrokerOrderEvent) TableName() string {
	return "broker_order_events"
}

// Fill represents a transaction fill.
type Fill struct {
	ID            uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OrderID       uuid.UUID  `json:"order_id" gorm:"type:uuid;not null"`
	BrokerOrderID *uuid.UUID `json:"broker_order_id" gorm:"type:uuid"`
	FillID        string     `json:"fill_id" gorm:"type:varchar(100);not null;uniqueIndex"`
	Price         float64    `json:"price" gorm:"type:numeric(20,8);not null"`
	Quantity      float64    `json:"quantity" gorm:"type:numeric(20,8);not null"`
	TotalValue    float64    `json:"total_value" gorm:"->;column:total_value;type:numeric(20,8)"` // generated column
	Fee           float64    `json:"fee" gorm:"type:numeric(20,8);not null;default:0"`
	FilledAt      time.Time  `json:"filled_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for Fill.
func (Fill) TableName() string {
	return "fills"
}

// Trade holds matched fill details.
type Trade struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	FillID    uuid.UUID `json:"fill_id" gorm:"type:uuid;not null;uniqueIndex"`
	Symbol    string    `json:"symbol" gorm:"type:varchar(50);not null"`
	Price     float64   `json:"price" gorm:"type:numeric(20,8);not null"`
	Quantity  float64   `json:"quantity" gorm:"type:numeric(20,8);not null"`
	Side      OrderSide `json:"side" gorm:"type:order_side;not null"`
	MatchedAt time.Time `json:"matched_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for Trade.
func (Trade) TableName() string {
	return "trades"
}

// ExecutionQuality holds execution slippage and spread metrics.
type ExecutionQuality struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	FillID          uuid.UUID `json:"fill_id" gorm:"type:uuid;not null;uniqueIndex"`
	Slippage        float64   `json:"slippage" gorm:"type:numeric(20,8);not null"`
	EffectiveSpread float64   `json:"effective_spread" gorm:"type:numeric(20,8);not null"`
}

// TableName overrides the default table name for ExecutionQuality.
func (ExecutionQuality) TableName() string {
	return "execution_quality"
}
