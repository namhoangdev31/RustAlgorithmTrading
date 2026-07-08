package usecases

import (
	"context"
	"trading/control-gateway/internal/domain/entities"
)

// TradeUseCase defines application business rules for trades and execution.
type TradeUseCase interface {
	GetTrades(limit, offset int, symbol, side string) ([]map[string]interface{}, error)
	GetTradeByID(tradeID string) (map[string]interface{}, bool, error)
	GetStatsSummary(symbol, timeRange string) (map[string]interface{}, error)
	GetExecutionQuality() (map[string]interface{}, error)
}

// AlertUseCase defines application business rules for managing incidents and alerts escalation.
type AlertUseCase interface {
	CreateIncident(alert map[string]interface{}) entities.Incident
	AcknowledgeIncident(id, owner string) (entities.Incident, error)
	ResolveIncident(id, evidence string) (entities.Incident, error)
	ListIncidents() map[string]entities.Incident
	AcknowledgeAlert(alertID string) (map[string]interface{}, error)
}

// MetricUseCase defines application business rules for accessing telemetry and metrics.
type MetricUseCase interface {
	GetCurrentMetrics(userID string) (map[string]interface{}, error)
	GetMetricsHistory(userID string, timeRange, startTime, endTime, interval string, metricTypes []string) (map[string]interface{}, error)
	GetSymbols() ([]string, error)
	GetSummary(userID string) (map[string]interface{}, error)
}

// AlpacaUseCase defines application business rules for trading and market data feeds.
type AlpacaUseCase interface {
	GetAccount(ctx context.Context) (entities.AlpacaAccount, error)
	GetPositions(ctx context.Context) ([]entities.AlpacaPosition, error)
	PlaceMarketOrder(ctx context.Context, symbol string, qty float64, side string, tif string) (entities.OrderResponse, error)
	PlaceLimitOrder(ctx context.Context, symbol string, qty float64, side string, limitPrice float64, tif string) (entities.OrderResponse, error)
	GetOrders(ctx context.Context, status string) ([]map[string]any, error)
	CancelOrder(ctx context.Context, orderID string) error
	CancelAllOrders(ctx context.Context) error
	CloseAllPositions(ctx context.Context) ([]map[string]any, error)
	GetBars(ctx context.Context, symbol, start, end, timeframe string) (map[string]any, error)
}

// SystemUseCase defines application business rules for querying component status and performance.
type SystemUseCase interface {
	GetPerformance(userID string) ([]map[string]interface{}, error)
	GetComponents() map[string]interface{}
	GetLogs(userID string, level string, limit int) ([]map[string]interface{}, error)
	GetStats() map[string]interface{}
	ValidateIntegrity(metrics entities.Metrics) entities.Report
}

// RiskLimitsUseCase defines the application business rules for managing risk limits.
type RiskLimitsUseCase interface {
	GetRiskLimits(ctx context.Context, accountID *string) (*entities.RiskLimits, error)
	UpdateRiskLimits(ctx context.Context, limits *entities.RiskLimits, username string) error
}
