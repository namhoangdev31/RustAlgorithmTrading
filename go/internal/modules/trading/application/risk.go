package application

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"

	domain "trading/control-gateway/internal/modules/trading/domain"
)

type riskLimitsUseCase struct {
	repo      RiskLimitsRepository
	publisher RiskPublisher
}

func NewRiskLimitsUseCase(repo RiskLimitsRepository, publisher RiskPublisher) RiskLimitsUseCase {
	return &riskLimitsUseCase{
		repo:      repo,
		publisher: publisher,
	}
}

func (u *riskLimitsUseCase) GetRiskLimits(ctx context.Context, accountID *string) (*domain.RiskLimits, error) {
	return u.repo.GetRiskLimits(ctx, accountID)
}

func (u *riskLimitsUseCase) UpdateRiskLimits(ctx context.Context, limits *domain.RiskLimits, username string) error {
	if limits == nil {
		return errors.New("risk limits payload cannot be nil")
	}

	// 1. Validation Logic
	if limits.MaxShares <= 0 {
		return errors.New("max_shares must be greater than 0")
	}
	if limits.MaxNotionalPerPosition <= 0 {
		return errors.New("max_notional_per_position must be greater than 0")
	}
	if limits.MaxTotalExposure <= 0 {
		return errors.New("max_total_exposure must be greater than 0")
	}
	if limits.MaxOpenPositions <= 0 {
		return errors.New("max_open_positions must be greater than 0")
	}
	if limits.MaxDailyLoss <= 0 {
		return errors.New("max_daily_loss must be greater than 0")
	}
	if limits.DefaultStopLossPercent <= 0 || limits.DefaultStopLossPercent > 100 {
		return errors.New("default_stop_loss_percent must be between 0 and 100")
	}
	if limits.DefaultTakeProfitPercent <= 0 {
		return errors.New("default_take_profit_percent must be greater than 0")
	}

	limits.UpdatedBy = &username

	// 2. Save to database
	if err := u.repo.SaveRiskLimits(ctx, limits); err != nil {
		return fmt.Errorf("failed to save risk limits: %w", err)
	}

	// 3. Publish to Redis Pub/Sub if client is configured
	if u.publisher != nil {
		// Map to structure matching Rust's RiskConfig deserialization
		payload := map[string]interface{}{
			"max_position_size":      limits.MaxNotionalPerPosition,
			"max_notional_exposure":  limits.MaxTotalExposure,
			"max_open_positions":     limits.MaxOpenPositions,
			"stop_loss_percent":      limits.DefaultStopLossPercent,
			"trailing_stop_percent":  limits.TrailingStopPercent,
			"enable_circuit_breaker": limits.CircuitBreakerEnabled,
			"max_loss_threshold":     limits.MaxDailyLoss,
			"sizing_amount":          0.0,
			// Extended fields
			"max_shares":                limits.MaxShares,
			"max_weekly_loss":           limits.MaxWeeklyLoss,
			"max_monthly_loss":          limits.MaxMonthlyLoss,
			"enforce_market_hours":      limits.EnforceMarketHours,
			"max_position_correlation":  limits.MaxPositionCorrelation,
			"enforce_correlation_check": limits.EnforceCorrelationCheck,
		}

		jsonBytes, err := json.Marshal(payload)
		if err != nil {
			slog.Error("failed_to_marshal_redis_risk_payload", "error", err)
		} else {
			channel := "channel:risk-limits"
			err = u.publisher.Publish(ctx, channel, jsonBytes)
			if err != nil {
				slog.Error("failed_to_publish_risk_limits_to_redis", "channel", channel, "error", err)
			} else {
				slog.Info("published_risk_limits_hot_reload_event", "channel", channel, "updated_by", username)
			}
		}
	} else {
		slog.Warn("redis_client_not_configured_skipping_pubsub_broadcast")
	}

	return nil
}
