package application

import (
	"context"

	"trading/control-gateway/internal/modules/trading/domain"
)

type TradeRepository interface {
	QueryTrades(limit, offset int, symbol, side string) ([]Trade, error)
	QueryTradeByID(tradeID string) (Trade, bool, error)
	QueryTradeStatsSummary(symbol, timeRange string) (TradeStats, error)
	QueryExecutionQuality() (ExecutionQuality, error)
}

type AlpacaRepository interface {
	GetAccount(context.Context) (AlpacaAccount, error)
	GetPositions(context.Context) ([]AlpacaPosition, error)
	GetHistoricalBars(context.Context, string, string, string, string) (map[string]any, error)
	PlaceMarketOrder(context.Context, string, float64, string, string) (OrderResponse, error)
	PlaceLimitOrder(context.Context, string, float64, string, float64, string) (OrderResponse, error)
	GetOrders(context.Context, string) ([]map[string]any, error)
	CancelOrder(context.Context, string) error
	CancelAllOrders(context.Context) error
	CloseAllPositions(context.Context) ([]map[string]any, error)
}

type RiskLimitsRepository interface {
	GetRiskLimits(context.Context, *string) (*domain.RiskLimits, error)
	SaveRiskLimits(context.Context, *domain.RiskLimits) error
}

type RiskPublisher interface {
	Publish(context.Context, string, []byte) error
}

type TradeUseCase interface {
	GetTrades(int, int, string, string) ([]Trade, error)
	GetTradeByID(string) (Trade, bool, error)
	GetStatsSummary(string, string) (TradeStats, error)
	GetExecutionQuality() (ExecutionQuality, error)
}

type Trade struct {
	ID                    int
	OrderID, Symbol, Side string
	Quantity, Price       float64
	Status, Timestamp     string
}
type TradeStats struct {
	TimeRange, Symbol           string
	TotalTrades                 int64
	TotalNotional, AveragePrice float64
	BuyCount, SellCount         int64
}
type ExecutionQuality struct{ FillRate, AverageLatencyMS, AverageSlippageBPS, RejectionRate float64 }

type AlpacaUseCase interface {
	GetAccount(context.Context) (AlpacaAccount, error)
	GetPositions(context.Context) ([]AlpacaPosition, error)
	PlaceMarketOrder(context.Context, string, float64, string, string) (OrderResponse, error)
	PlaceLimitOrder(context.Context, string, float64, string, float64, string) (OrderResponse, error)
	GetOrders(context.Context, string) ([]map[string]any, error)
	CancelOrder(context.Context, string) error
	CancelAllOrders(context.Context) error
	CloseAllPositions(context.Context) ([]map[string]any, error)
	GetBars(context.Context, string, string, string, string) (map[string]any, error)
}

type RiskLimitsUseCase interface {
	GetRiskLimits(context.Context, *string) (*domain.RiskLimits, error)
	UpdateRiskLimits(context.Context, *domain.RiskLimits, string) error
}
