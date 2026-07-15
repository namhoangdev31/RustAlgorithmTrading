package domain

import (
	"encoding/json"
	"time"
)

type RiskLimits struct {
	ID                        int
	AccountID                 *string
	MaxShares                 int
	MaxNotionalPerPosition    float64
	MaxTotalExposure          float64
	MaxOpenPositions          int
	MaxConcentrationPercent   float64
	MaxLossPerTrade           float64
	MaxDailyLoss              float64
	MaxWeeklyLoss             float64
	MaxMonthlyLoss            float64
	DrawdownThresholdPercent  float64
	DefaultStopLossPercent    float64
	MinStopLossPercent        float64
	MaxStopLossPercent        float64
	EnableTrailingStop        bool
	TrailingStopPercent       float64
	TrailingActivationPercent float64
	DefaultTakeProfitPercent  float64
	MinRiskRewardRatio        float64
	EnablePartialProfit       bool
	PartialProfitPercent      float64
	FirstTargetPercent        float64
	SecondTargetPercent       float64
	CircuitBreakerEnabled     bool
	DailyLossThreshold        float64
	MaxConsecutiveLosses      int
	MaxTradesPerDay           int
	CooldownMinutes           int
	AutoResume                bool
	MinOrderSize              int
	MaxOrderSize              int
	MaxOrderValue             float64
	MinPrice                  float64
	MaxPrice                  float64
	MaxSlippagePercent        float64
	AllowLeverage             bool
	MaxLeverage               float64
	MinMarginPercent          float64
	MaxAtrPercent             float64
	ReduceOnHighVolatility    bool
	EnableVolatilityScaling   bool
	BaseVolatilityPercent     float64
	EnforceMarketHours        bool
	AllowPremarket            bool
	AllowAfterhours           bool
	BlackoutPeriods           json.RawMessage
	MaxPositionCorrelation    float64
	EnforceCorrelationCheck   bool
	CorrelationLookbackDays   int
	UpdatedAt                 time.Time
	UpdatedBy                 *string
}
