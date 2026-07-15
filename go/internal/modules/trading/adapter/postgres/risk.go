package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	entdb "trading/control-gateway/internal/data/ent"
	"trading/control-gateway/internal/data/ent/risklimits"
	"trading/control-gateway/internal/modules/trading/application"
	domain "trading/control-gateway/internal/modules/trading/domain"
)

type EntRiskLimitsRepository struct {
	client *entdb.Client
}

func NewRiskLimitsRepository(client *entdb.Client) application.RiskLimitsRepository {
	return &EntRiskLimitsRepository{client: client}
}

func (r *EntRiskLimitsRepository) GetRiskLimits(ctx context.Context, accountID *string) (*domain.RiskLimits, error) {
	if r.client == nil {
		return nil, errors.New("database store not configured")
	}
	if accountID != nil && *accountID != "" {
		row, err := r.client.RiskLimits.Query().Where(risklimits.AccountIdEQ(*accountID)).Only(ctx)
		if err == nil {
			return riskEntity(row), nil
		}
		if !entdb.IsNotFound(err) {
			return nil, fmt.Errorf("get risk limits for account: %w", err)
		}
	}
	row, err := r.client.RiskLimits.Query().Where(risklimits.AccountIdIsNil()).Only(ctx)
	if err == nil {
		return riskEntity(row), nil
	}
	if !entdb.IsNotFound(err) {
		return nil, fmt.Errorf("query global risk limits: %w", err)
	}
	row, err = r.client.RiskLimits.Create().SetMaxPrice(10000).SetUpdatedAt(time.Now().UTC()).Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("create default global risk limits: %w", err)
	}
	return riskEntity(row), nil
}

func (r *EntRiskLimitsRepository) SaveRiskLimits(ctx context.Context, limits *domain.RiskLimits) error {
	if r.client == nil {
		return errors.New("database store not configured")
	}
	limits.UpdatedAt = time.Now().UTC()
	id := limits.ID
	if id == 0 {
		query := r.client.RiskLimits.Query()
		if limits.AccountID != nil && *limits.AccountID != "" {
			query.Where(risklimits.AccountIdEQ(*limits.AccountID))
		} else {
			query.Where(risklimits.AccountIdIsNil())
		}
		row, err := query.Only(ctx)
		if err == nil {
			id = row.ID
		} else if !entdb.IsNotFound(err) {
			return fmt.Errorf("find risk limits for save: %w", err)
		}
	}
	if id > 0 {
		update := r.client.RiskLimits.UpdateOneID(id)
		if err := setRiskMutation(update.Mutation(), limits); err != nil {
			return err
		}
		if _, err := update.Save(ctx); err != nil {
			return fmt.Errorf("update risk limits: %w", err)
		}
		limits.ID = id
		return nil
	}
	create := r.client.RiskLimits.Create()
	if err := setRiskMutation(create.Mutation(), limits); err != nil {
		return err
	}
	row, err := create.Save(ctx)
	if err != nil {
		return fmt.Errorf("create risk limits: %w", err)
	}
	limits.ID = row.ID
	return nil
}

func setRiskMutation(m *entdb.RiskLimitsMutation, value *domain.RiskLimits) error {
	fields := map[string]any{
		risklimits.FieldMaxShares: value.MaxShares, risklimits.FieldMaxNotionalPerPosition: value.MaxNotionalPerPosition,
		risklimits.FieldMaxTotalExposure: value.MaxTotalExposure, risklimits.FieldMaxOpenPositions: value.MaxOpenPositions,
		risklimits.FieldMaxConcentrationPercent: value.MaxConcentrationPercent, risklimits.FieldMaxLossPerTrade: value.MaxLossPerTrade,
		risklimits.FieldMaxDailyLoss: value.MaxDailyLoss, risklimits.FieldMaxWeeklyLoss: value.MaxWeeklyLoss,
		risklimits.FieldMaxMonthlyLoss: value.MaxMonthlyLoss, risklimits.FieldDrawdownThresholdPercent: value.DrawdownThresholdPercent,
		risklimits.FieldDefaultStopLossPercent: value.DefaultStopLossPercent, risklimits.FieldMinStopLossPercent: value.MinStopLossPercent,
		risklimits.FieldMaxStopLossPercent: value.MaxStopLossPercent, risklimits.FieldEnableTrailingStop: value.EnableTrailingStop,
		risklimits.FieldTrailingStopPercent: value.TrailingStopPercent, risklimits.FieldTrailingActivationPercent: value.TrailingActivationPercent,
		risklimits.FieldDefaultTakeProfitPercent: value.DefaultTakeProfitPercent, risklimits.FieldMinRiskRewardRatio: value.MinRiskRewardRatio,
		risklimits.FieldEnablePartialProfit: value.EnablePartialProfit, risklimits.FieldPartialProfitPercent: value.PartialProfitPercent,
		risklimits.FieldFirstTargetPercent: value.FirstTargetPercent, risklimits.FieldSecondTargetPercent: value.SecondTargetPercent,
		risklimits.FieldCircuitBreakerEnabled: value.CircuitBreakerEnabled, risklimits.FieldDailyLossThreshold: value.DailyLossThreshold,
		risklimits.FieldMaxConsecutiveLosses: value.MaxConsecutiveLosses, risklimits.FieldMaxTradesPerDay: value.MaxTradesPerDay,
		risklimits.FieldCooldownMinutes: value.CooldownMinutes, risklimits.FieldAutoResume: value.AutoResume,
		risklimits.FieldMinOrderSize: value.MinOrderSize, risklimits.FieldMaxOrderSize: value.MaxOrderSize,
		risklimits.FieldMaxOrderValue: value.MaxOrderValue, risklimits.FieldMinPrice: value.MinPrice,
		risklimits.FieldMaxPrice: value.MaxPrice, risklimits.FieldMaxSlippagePercent: value.MaxSlippagePercent,
		risklimits.FieldAllowLeverage: value.AllowLeverage, risklimits.FieldMaxLeverage: value.MaxLeverage,
		risklimits.FieldMinMarginPercent: value.MinMarginPercent, risklimits.FieldMaxAtrPercent: value.MaxAtrPercent,
		risklimits.FieldReduceOnHighVolatility: value.ReduceOnHighVolatility, risklimits.FieldEnableVolatilityScaling: value.EnableVolatilityScaling,
		risklimits.FieldBaseVolatilityPercent: value.BaseVolatilityPercent, risklimits.FieldEnforceMarketHours: value.EnforceMarketHours,
		risklimits.FieldAllowPremarket: value.AllowPremarket, risklimits.FieldAllowAfterhours: value.AllowAfterhours,
		risklimits.FieldMaxPositionCorrelation: value.MaxPositionCorrelation, risklimits.FieldEnforceCorrelationCheck: value.EnforceCorrelationCheck,
		risklimits.FieldCorrelationLookbackDays: value.CorrelationLookbackDays, risklimits.FieldUpdatedAt: value.UpdatedAt,
	}
	for fieldName, fieldValue := range fields {
		if err := m.SetField(fieldName, fieldValue); err != nil {
			return fmt.Errorf("set risk field %s: %w", fieldName, err)
		}
	}
	if value.AccountID != nil && *value.AccountID != "" {
		m.SetAccountId(*value.AccountID)
	} else {
		m.ClearAccountId()
	}
	if len(value.BlackoutPeriods) > 0 {
		m.SetBlackoutPeriods(value.BlackoutPeriods)
	} else {
		m.ClearBlackoutPeriods()
	}
	if value.UpdatedBy != nil {
		m.SetUpdatedBy(*value.UpdatedBy)
	} else {
		m.ClearUpdatedBy()
	}
	return nil
}

func riskEntity(row *entdb.RiskLimits) *domain.RiskLimits {
	return &domain.RiskLimits{
		ID: row.ID, AccountID: row.AccountId, MaxShares: row.MaxShares, MaxNotionalPerPosition: row.MaxNotionalPerPosition,
		MaxTotalExposure: row.MaxTotalExposure, MaxOpenPositions: row.MaxOpenPositions, MaxConcentrationPercent: row.MaxConcentrationPercent,
		MaxLossPerTrade: row.MaxLossPerTrade, MaxDailyLoss: row.MaxDailyLoss, MaxWeeklyLoss: row.MaxWeeklyLoss,
		MaxMonthlyLoss: row.MaxMonthlyLoss, DrawdownThresholdPercent: row.DrawdownThresholdPercent,
		DefaultStopLossPercent: row.DefaultStopLossPercent, MinStopLossPercent: row.MinStopLossPercent, MaxStopLossPercent: row.MaxStopLossPercent,
		EnableTrailingStop: row.EnableTrailingStop, TrailingStopPercent: row.TrailingStopPercent, TrailingActivationPercent: row.TrailingActivationPercent,
		DefaultTakeProfitPercent: row.DefaultTakeProfitPercent, MinRiskRewardRatio: row.MinRiskRewardRatio,
		EnablePartialProfit: row.EnablePartialProfit, PartialProfitPercent: row.PartialProfitPercent,
		FirstTargetPercent: row.FirstTargetPercent, SecondTargetPercent: row.SecondTargetPercent,
		CircuitBreakerEnabled: row.CircuitBreakerEnabled, DailyLossThreshold: row.DailyLossThreshold,
		MaxConsecutiveLosses: row.MaxConsecutiveLosses, MaxTradesPerDay: row.MaxTradesPerDay, CooldownMinutes: row.CooldownMinutes,
		AutoResume: row.AutoResume, MinOrderSize: row.MinOrderSize, MaxOrderSize: row.MaxOrderSize, MaxOrderValue: row.MaxOrderValue,
		MinPrice: row.MinPrice, MaxPrice: row.MaxPrice, MaxSlippagePercent: row.MaxSlippagePercent,
		AllowLeverage: row.AllowLeverage, MaxLeverage: row.MaxLeverage, MinMarginPercent: row.MinMarginPercent,
		MaxAtrPercent: row.MaxAtrPercent, ReduceOnHighVolatility: row.ReduceOnHighVolatility,
		EnableVolatilityScaling: row.EnableVolatilityScaling, BaseVolatilityPercent: row.BaseVolatilityPercent,
		EnforceMarketHours: row.EnforceMarketHours, AllowPremarket: row.AllowPremarket, AllowAfterhours: row.AllowAfterhours,
		BlackoutPeriods: row.BlackoutPeriods, MaxPositionCorrelation: row.MaxPositionCorrelation,
		EnforceCorrelationCheck: row.EnforceCorrelationCheck, CorrelationLookbackDays: row.CorrelationLookbackDays,
		UpdatedAt: row.UpdatedAt, UpdatedBy: row.UpdatedBy,
	}
}
