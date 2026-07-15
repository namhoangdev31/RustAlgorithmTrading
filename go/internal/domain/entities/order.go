package entities

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// OrderIntent represents a client intent to place an order.
type OrderIntent struct {
	ID        uuid.UUID `json:"id"`
	AccountID uuid.UUID `json:"account_id"`
	Symbol    string    `json:"symbol"`
	Side      OrderSide `json:"side"`
	Type      OrderType `json:"type"`
	Quantity  float64   `json:"quantity"`
	Price     *float64  `json:"price"`
	CreatedAt time.Time `json:"created_at"`
}

// OrderPreview represents validation and estimation outcomes for intents.
type OrderPreview struct {
	ID               uuid.UUID       `json:"id"`
	IntentID         uuid.UUID       `json:"intent_id"`
	EstimatedMargin  float64         `json:"estimated_margin"`
	EstimatedFees    float64         `json:"estimated_fees"`
	IsValid          bool            `json:"is_valid"`
	ValidationErrors json.RawMessage `json:"validation_errors"`
}

// Order represents an order record in the database.
type Order struct {
	ID                uuid.UUID   `json:"id"`
	AccountID         uuid.UUID   `json:"account_id"`
	Symbol            string      `json:"symbol"`
	ClientOrderID     string      `json:"client_order_id"`
	Side              OrderSide   `json:"side"`
	Type              OrderType   `json:"type"`
	Price             *float64    `json:"price"`
	Quantity          float64     `json:"quantity"`
	FilledQuantity    float64     `json:"filled_quantity"`
	RemainingQuantity float64     `json:"remaining_quantity"` // generated column
	Status            OrderStatus `json:"status"`
	TimeInForce       string      `json:"time_in_force"`
	Version           int64       `json:"version"`
	SubmittedAt       time.Time   `json:"submitted_at"`
	UpdatedAt         time.Time   `json:"updated_at"`
	DeletedAt         *time.Time  `json:"deleted_at"`
}

// OrderTransition logs state transitions of an order.
type OrderTransition struct {
	ID            uuid.UUID   `json:"id"`
	OrderID       uuid.UUID   `json:"order_id"`
	FromStatus    OrderStatus `json:"from_status"`
	ToStatus      OrderStatus `json:"to_status"`
	Source        string      `json:"source"`
	CorrelationID uuid.UUID   `json:"correlation_id"`
	ReasonCode    *string     `json:"reason_code"`
	CreatedAt     time.Time   `json:"created_at"`
}

// OrderRejection logs rejected orders details.
type OrderRejection struct {
	OrderID       uuid.UUID       `json:"order_id"`
	ReasonCode    string          `json:"reason_code"`
	Message       string          `json:"message"`
	RejectedBy    string          `json:"rejected_by"`
	ErrorEnvelope json.RawMessage `json:"error_envelope"`
}

// OrderRoute holds latency and gateway routing details.
type OrderRoute struct {
	ID        uuid.UUID `json:"id"`
	OrderID   uuid.UUID `json:"order_id"`
	RouteName string    `json:"route_name"`
	LatencyMs *int      `json:"latency_ms"`
}

// BrokerOrder maps gateway orders to broker references.
type BrokerOrder struct {
	ID           uuid.UUID `json:"id"`
	OrderID      uuid.UUID `json:"order_id"`
	BrokerName   string    `json:"broker_name"`
	BrokerRefID  string    `json:"broker_ref_id"`
	BrokerStatus string    `json:"broker_status"`
}

// BrokerOrderEvent logs raw responses from brokers.
type BrokerOrderEvent struct {
	ID            uuid.UUID       `json:"id"`
	BrokerOrderID uuid.UUID       `json:"broker_order_id"`
	RawPayload    json.RawMessage `json:"raw_payload"`
	CreatedAt     time.Time       `json:"created_at"`
}

// Fill represents a transaction fill.
type Fill struct {
	ID            uuid.UUID  `json:"id"`
	OrderID       uuid.UUID  `json:"order_id"`
	BrokerOrderID *uuid.UUID `json:"broker_order_id"`
	FillID        string     `json:"fill_id"`
	Price         float64    `json:"price"`
	Quantity      float64    `json:"quantity"`
	TotalValue    float64    `json:"total_value"` // generated column
	Fee           float64    `json:"fee"`
	FilledAt      time.Time  `json:"filled_at"`
}

// Trade holds matched fill details.
type Trade struct {
	ID        uuid.UUID `json:"id"`
	FillID    uuid.UUID `json:"fill_id"`
	Symbol    string    `json:"symbol"`
	Price     float64   `json:"price"`
	Quantity  float64   `json:"quantity"`
	Side      OrderSide `json:"side"`
	MatchedAt time.Time `json:"matched_at"`
}

// ExecutionQuality holds execution slippage and spread metrics.
type ExecutionQuality struct {
	ID              uuid.UUID `json:"id"`
	FillID          uuid.UUID `json:"fill_id"`
	Slippage        float64   `json:"slippage"`
	EffectiveSpread float64   `json:"effective_spread"`
}
