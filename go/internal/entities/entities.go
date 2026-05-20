package entities

import (
	"encoding/json"
	"time"
)

// Order represents an order in the PostgreSQL database.
type Order struct {
	ID          int32     `json:"id" db:"id"`
	OrderID     string    `json:"order_id" db:"order_id"`
	Symbol      string    `json:"symbol" db:"symbol"`
	Side        string    `json:"side" db:"side"`
	OrderType   string    `json:"order_type" db:"order_type"`
	Quantity    float64   `json:"quantity" db:"quantity"`
	Price       *float64  `json:"price" db:"price"`
	Status      string    `json:"status" db:"status"`
	SubmittedAt time.Time `json:"submitted_at" db:"submitted_at"`
}

// RiskEvent represents a system event or risk violation logged in the PostgreSQL database.
type RiskEvent struct {
	ID         int32           `json:"id" db:"id"`
	EventType  string          `json:"event_type" db:"event_type"`
	Severity   string          `json:"severity" db:"severity"`
	Message    string          `json:"message" db:"message"`
	Metadata   json.RawMessage `json:"metadata" db:"metadata"`
	OccurredAt time.Time       `json:"occurred_at" db:"occurred_at"`
}
