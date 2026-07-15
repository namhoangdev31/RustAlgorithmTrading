package httpadapter

import (
	"encoding/json"
	"time"
)

type riskLimitsPayload struct {
	ID                        int             `json:"id"`
	AccountID                 *string         `json:"account_id"`
	MaxShares                 int             `json:"max_shares"`
	MaxNotionalPerPosition    float64         `json:"max_notional_per_position"`
	MaxTotalExposure          float64         `json:"max_total_exposure"`
	MaxOpenPositions          int             `json:"max_open_positions"`
	MaxConcentrationPercent   float64         `json:"max_concentration_percent"`
	MaxLossPerTrade           float64         `json:"max_loss_per_trade"`
	MaxDailyLoss              float64         `json:"max_daily_loss"`
	MaxWeeklyLoss             float64         `json:"max_weekly_loss"`
	MaxMonthlyLoss            float64         `json:"max_monthly_loss"`
	DrawdownThresholdPercent  float64         `json:"drawdown_threshold_percent"`
	DefaultStopLossPercent    float64         `json:"default_stop_loss_percent"`
	MinStopLossPercent        float64         `json:"min_stop_loss_percent"`
	MaxStopLossPercent        float64         `json:"max_stop_loss_percent"`
	EnableTrailingStop        bool            `json:"enable_trailing_stop"`
	TrailingStopPercent       float64         `json:"trailing_stop_percent"`
	TrailingActivationPercent float64         `json:"trailing_activation_percent"`
	DefaultTakeProfitPercent  float64         `json:"default_take_profit_percent"`
	MinRiskRewardRatio        float64         `json:"min_risk_reward_ratio"`
	EnablePartialProfit       bool            `json:"enable_partial_profit"`
	PartialProfitPercent      float64         `json:"partial_profit_percent"`
	FirstTargetPercent        float64         `json:"first_target_percent"`
	SecondTargetPercent       float64         `json:"second_target_percent"`
	CircuitBreakerEnabled     bool            `json:"circuit_breaker_enabled"`
	DailyLossThreshold        float64         `json:"daily_loss_threshold"`
	MaxConsecutiveLosses      int             `json:"max_consecutive_losses"`
	MaxTradesPerDay           int             `json:"max_trades_per_day"`
	CooldownMinutes           int             `json:"cooldown_minutes"`
	AutoResume                bool            `json:"auto_resume"`
	MinOrderSize              int             `json:"min_order_size"`
	MaxOrderSize              int             `json:"max_order_size"`
	MaxOrderValue             float64         `json:"max_order_value"`
	MinPrice                  float64         `json:"min_price"`
	MaxPrice                  float64         `json:"max_price"`
	MaxSlippagePercent        float64         `json:"max_slippage_percent"`
	AllowLeverage             bool            `json:"allow_leverage"`
	MaxLeverage               float64         `json:"max_leverage"`
	MinMarginPercent          float64         `json:"min_margin_percent"`
	MaxAtrPercent             float64         `json:"max_atr_percent"`
	ReduceOnHighVolatility    bool            `json:"reduce_on_high_volatility"`
	EnableVolatilityScaling   bool            `json:"enable_volatility_scaling"`
	BaseVolatilityPercent     float64         `json:"base_volatility_percent"`
	EnforceMarketHours        bool            `json:"enforce_market_hours"`
	AllowPremarket            bool            `json:"allow_premarket"`
	AllowAfterhours           bool            `json:"allow_afterhours"`
	BlackoutPeriods           json.RawMessage `json:"blackout_periods"`
	MaxPositionCorrelation    float64         `json:"max_position_correlation"`
	EnforceCorrelationCheck   bool            `json:"enforce_correlation_check"`
	CorrelationLookbackDays   int             `json:"correlation_lookback_days"`
	UpdatedAt                 time.Time       `json:"updated_at"`
	UpdatedBy                 *string         `json:"updated_by"`
}
