package repositories

import (
	"context"
	"trading/control-gateway/internal/domain/entities"
)

// TradeRepository defines the data access methods for trades and executions.
type TradeRepository interface {
	QueryTrades(limit, offset int, symbol, side string) ([]map[string]interface{}, error)
	QueryTradeByID(tradeID string) (map[string]interface{}, bool, error)
	QueryTradeStatsSummary(symbol, timeRange string) (map[string]interface{}, error)
	QueryExecutionQuality() (map[string]interface{}, error)
}

// AlertRepository defines the methods for managing system alerts and incidents.
type AlertRepository interface {
	Create(alert map[string]interface{}) entities.Incident
	Acknowledge(id, owner string) (entities.Incident, error)
	Resolve(id, evidence string) (entities.Incident, error)
	List() map[string]entities.Incident
}

// MetricRepository defines the methods for retrieving metric summaries and historical data.
type MetricRepository interface {
	QueryPerformanceSummary(userID string) (map[string]interface{}, error)
	QueryCurrentMetricsSnapshot(userID string) (map[string]interface{}, error)
	QueryMetricsHistory(userID string, start, end string, metricTypes []string) ([]map[string]interface{}, error)
}

// AlpacaRepository defines direct trading methods interacting with Alpaca client.
type AlpacaRepository interface {
	GetAccount(ctx context.Context) (entities.AlpacaAccount, error)
	GetPositions(ctx context.Context) ([]entities.AlpacaPosition, error)
	GetHistoricalBars(ctx context.Context, symbol, startISO, endISO, timeframe string) (map[string]any, error)
	PlaceMarketOrder(ctx context.Context, symbol string, qty float64, side string, tif string) (entities.OrderResponse, error)
	PlaceLimitOrder(ctx context.Context, symbol string, qty float64, side string, limitPrice float64, tif string) (entities.OrderResponse, error)
	GetOrders(ctx context.Context, status string) ([]map[string]any, error)
	CancelOrder(ctx context.Context, orderID string) error
	CancelAllOrders(ctx context.Context) error
	CloseAllPositions(ctx context.Context) ([]map[string]any, error)
}

// SystemRepository defines system status and log query methods.
type SystemRepository interface {
	QueryPerformanceHistory(userID string, limit int) ([]map[string]interface{}, error)
	QueryLogs(userID string, level string, limit int) ([]map[string]interface{}, error)
	QueryLatestIntegrityReport(userID string) (map[string]interface{}, error)
}

// RiskLimitsRepository defines the data access methods for managing system risk thresholds.
type RiskLimitsRepository interface {
	GetRiskLimits(ctx context.Context, accountID *string) (*entities.RiskLimits, error)
	SaveRiskLimits(ctx context.Context, limits *entities.RiskLimits) error
}
