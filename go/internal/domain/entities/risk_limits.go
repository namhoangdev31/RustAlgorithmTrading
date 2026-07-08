package entities

import (
	"encoding/json"
	"time"
)

type RiskLimits struct {
	ID                        int             `gorm:"primaryKey;autoIncrement;column:id" json:"id"`
	AccountID                 *string         `gorm:"uniqueIndex;column:account_id" json:"account_id"`
	MaxShares                 int             `gorm:"default:1000;column:max_shares" json:"max_shares"`
	MaxNotionalPerPosition    float64         `gorm:"default:250.0;column:max_notional_per_position" json:"max_notional_per_position"`
	MaxTotalExposure          float64         `gorm:"default:10000.0;column:max_total_exposure" json:"max_total_exposure"`
	MaxOpenPositions          int             `gorm:"default:2;column:max_open_positions" json:"max_open_positions"`
	MaxConcentrationPercent   float64         `gorm:"default:25.0;column:max_concentration_percent" json:"max_concentration_percent"`
	MaxLossPerTrade           float64         `gorm:"default:500.0;column:max_loss_per_trade" json:"max_loss_per_trade"`
	MaxDailyLoss              float64         `gorm:"default:1000.0;column:max_daily_loss" json:"max_daily_loss"`
	MaxWeeklyLoss             float64         `gorm:"default:15000.0;column:max_weekly_loss" json:"max_weekly_loss"`
	MaxMonthlyLoss            float64         `gorm:"default:50000.0;column:max_monthly_loss" json:"max_monthly_loss"`
	DrawdownThresholdPercent  float64         `gorm:"default:10.0;column:drawdown_threshold_percent" json:"drawdown_threshold_percent"`
	DefaultStopLossPercent    float64         `gorm:"default:1.0;column:default_stop_loss_percent" json:"default_stop_loss_percent"`
	MinStopLossPercent        float64         `gorm:"default:0.5;column:min_stop_loss_percent" json:"min_stop_loss_percent"`
	MaxStopLossPercent        float64         `gorm:"default:10.0;column:max_stop_loss_percent" json:"max_stop_loss_percent"`
	EnableTrailingStop        bool            `gorm:"default:true;column:enable_trailing_stop" json:"enable_trailing_stop"`
	TrailingStopPercent       float64         `gorm:"default:0.75;column:trailing_stop_percent" json:"trailing_stop_percent"`
	TrailingActivationPercent float64         `gorm:"default:2.0;column:trailing_activation_percent" json:"trailing_activation_percent"`
	DefaultTakeProfitPercent  float64         `gorm:"default:5.0;column:default_take_profit_percent" json:"default_take_profit_percent"`
	MinRiskRewardRatio        float64         `gorm:"default:2.0;column:min_risk_reward_ratio" json:"min_risk_reward_ratio"`
	EnablePartialProfit       bool            `gorm:"default:true;column:enable_partial_profit" json:"enable_partial_profit"`
	PartialProfitPercent      float64         `gorm:"default:50.0;column:partial_profit_percent" json:"partial_profit_percent"`
	FirstTargetPercent        float64         `gorm:"default:3.0;column:first_target_percent" json:"first_target_percent"`
	SecondTargetPercent       float64         `gorm:"default:5.0;column:second_target_percent" json:"second_target_percent"`
	CircuitBreakerEnabled     bool            `gorm:"default:true;column:circuit_breaker_enabled" json:"circuit_breaker_enabled"`
	DailyLossThreshold        float64         `gorm:"default:1000.0;column:daily_loss_threshold" json:"daily_loss_threshold"`
	MaxConsecutiveLosses      int             `gorm:"default:5;column:max_consecutive_losses" json:"max_consecutive_losses"`
	MaxTradesPerDay           int             `gorm:"default:50;column:max_trades_per_day" json:"max_trades_per_day"`
	CooldownMinutes           int             `gorm:"default:60;column:cooldown_minutes" json:"cooldown_minutes"`
	AutoResume                bool            `gorm:"default:false;column:auto_resume" json:"auto_resume"`
	MinOrderSize              int             `gorm:"default:1;column:min_order_size" json:"min_order_size"`
	MaxOrderSize              int             `gorm:"default:1000;column:max_order_size" json:"max_order_size"`
	MaxOrderValue             float64         `gorm:"default:10000.0;column:max_order_value" json:"max_order_value"`
	MinPrice                  float64         `gorm:"default:0.01;column:min_price" json:"min_price"`
	MaxPrice                  float64         `gorm:"column:max_price" json:"max_price"`
	MaxSlippagePercent        float64         `gorm:"default:0.5;column:max_slippage_percent" json:"max_slippage_percent"`
	AllowLeverage             bool            `gorm:"default:false;column:allow_leverage" json:"allow_leverage"`
	MaxLeverage               float64         `gorm:"default:1.0;column:max_leverage" json:"max_leverage"`
	MinMarginPercent          float64         `gorm:"default:100.0;column:min_margin_percent" json:"min_margin_percent"`
	MaxAtrPercent             float64         `gorm:"default:5.0;column:max_atr_percent" json:"max_atr_percent"`
	ReduceOnHighVolatility    bool            `gorm:"default:true;column:reduce_on_high_volatility" json:"reduce_on_high_volatility"`
	EnableVolatilityScaling   bool            `gorm:"default:true;column:enable_volatility_scaling" json:"enable_volatility_scaling"`
	BaseVolatilityPercent     float64         `gorm:"default:2.0;column:base_volatility_percent" json:"base_volatility_percent"`
	EnforceMarketHours        bool            `gorm:"default:true;column:enforce_market_hours" json:"enforce_market_hours"`
	AllowPremarket            bool            `gorm:"default:false;column:allow_premarket" json:"allow_premarket"`
	AllowAfterhours         bool            `gorm:"default:false;column:allow_afterhours" json:"allow_afterhours"`
	BlackoutPeriods           json.RawMessage `gorm:"type:jsonb;column:blackout_periods" json:"blackout_periods"`
	MaxPositionCorrelation    float64         `gorm:"default:0.7;column:max_position_correlation" json:"max_position_correlation"`
	EnforceCorrelationCheck   bool            `gorm:"default:true;column:enforce_correlation_check" json:"enforce_correlation_check"`
	CorrelationLookbackDays   int             `gorm:"default:30;column:correlation_lookback_days" json:"correlation_lookback_days"`
	UpdatedAt                 time.Time       `gorm:"default:now();column:updated_at" json:"updated_at"`
	UpdatedBy                 *string         `gorm:"column:updated_by" json:"updated_by"`
}

func (RiskLimits) TableName() string {
	return "risk_limits"
}
