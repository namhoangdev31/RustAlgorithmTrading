package application

import (
	"context"
	"time"

	domain "trading/control-gateway/internal/modules/quantant/contract"
)

type Repository interface {
	Accounts(context.Context, string) ([]domain.AccountSummary, error)
	ListInstruments(context.Context, string, int, string) ([]domain.Instrument, string, error)
	Instrument(context.Context, string) (domain.Instrument, error)
	ListOrders(context.Context, string, int, string) ([]domain.Order, string, error)
	ListPositions(context.Context, string) ([]domain.Position, error)
	ListRecords(context.Context, string, string, int, string) ([]domain.Record, string, error)
	RiskSnapshot(context.Context, string) ([]byte, string, error)
	ValidateLiveSession(context.Context, string, string, string, time.Time) (time.Time, error)
	CreateOrder(context.Context, CreateOrderParams) (domain.Order, bool, error)
	CreateSafetyCommand(context.Context, SafetyCommandParams) (domain.ExecutionCommand, error)
	PendingCommands(context.Context, int) ([]domain.ExecutionCommand, error)
	MarkPublished(context.Context, string) error
	MarkAttempt(context.Context, string) error
}

type MarketReader interface {
	Candles(context.Context, string, string, time.Time, time.Time, int) ([]domain.Candle, time.Time, error)
	Portfolio(context.Context, string, domain.TradingMode) (domain.Portfolio, time.Time, error)
	Fresh(context.Context, string, time.Time) error
}

type CommandPublisher interface {
	Publish(context.Context, domain.ExecutionCommand) error
}

type CreateOrderParams struct {
	Request        domain.CreateOrder
	OperatorID     string
	IdempotencyKey string
	RequestHash    string
	CorrelationID  string
	ClientOrderID  string
	RiskSnapshot   []byte
	RiskHash       string
	Instrument     domain.Instrument
	LiveExpiresAt  *time.Time
	Command        domain.ExecutionCommand
}

type SafetyCommandParams struct {
	Request        domain.SafetyCommand
	Type           string
	OperatorID     string
	IdempotencyKey string
	CorrelationID  string
}
