package entities

// UserStatus represents user status values.
type UserStatus string

const (
	UserStatusActive    UserStatus = "active"
	UserStatusSuspended UserStatus = "suspended"
	UserStatusDeleted   UserStatus = "deleted"
)

// OrderSide represents side values of an order.
type OrderSide string

const (
	OrderSideBuy  OrderSide = "buy"
	OrderSideSell OrderSide = "sell"
)

// OrderType represents execution type of an order.
type OrderType string

const (
	OrderTypeMarket    OrderType = "market"
	OrderTypeLimit     OrderType = "limit"
	OrderTypeStop      OrderType = "stop"
	OrderTypeStopLimit OrderType = "stop_limit"
)

// OrderStatus represents lifecycle states of an order.
type OrderStatus string

const (
	OrderStatusReceived           OrderStatus = "received"
	OrderStatusPreviewed          OrderStatus = "previewed"
	OrderStatusAccepted           OrderStatus = "accepted"
	OrderStatusRouted             OrderStatus = "routed"
	OrderStatusBrokerAcknowledged OrderStatus = "broker_acknowledged"
	OrderStatusPartiallyFilled    OrderStatus = "partially_filled"
	OrderStatusFilled             OrderStatus = "filled"
	OrderStatusCancelRequested    OrderStatus = "cancel_requested"
	OrderStatusCanceled           OrderStatus = "canceled"
	OrderStatusRejected           OrderStatus = "rejected"
	OrderStatusExpired            OrderStatus = "expired"
	OrderStatusFailed             OrderStatus = "failed"
)

// RiskDecisionStatus represents the outcome of pre-trade risk evaluation.
type RiskDecisionStatus string

const (
	RiskDecisionApproved RiskDecisionStatus = "approved"
	RiskDecisionRejected RiskDecisionStatus = "rejected"
)
