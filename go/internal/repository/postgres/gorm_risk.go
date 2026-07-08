package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"

	"trading/control-gateway/internal/domain/entities"
	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/storage"
)

type GormRiskLimitsRepository struct {
	store *storage.Store
}

func NewGormRiskLimitsRepository(store *storage.Store) repositories.RiskLimitsRepository {
	return &GormRiskLimitsRepository{store: store}
}

func (r *GormRiskLimitsRepository) GetRiskLimits(ctx context.Context, accountID *string) (*entities.RiskLimits, error) {
	if r.store == nil || r.store.Postgres() == nil || r.store.Postgres().GormDB() == nil {
		return nil, errors.New("database store not configured")
	}
	db := r.store.Postgres().GormDB().WithContext(ctx)

	var limits entities.RiskLimits

	if accountID != nil && *accountID != "" {
		err := db.Where("account_id = ?", *accountID).First(&limits).Error
		if err == nil {
			return &limits, nil
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("failed to get risk limits for account: %w", err)
		}
	}

	// Fallback to global config (accountID is NULL)
	err := db.Where("account_id IS NULL").First(&limits).Error
	if err == nil {
		return &limits, nil
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Create a default global config row if none exists
		defaultLimits := entities.RiskLimits{
			MaxShares:                 1000,
			MaxNotionalPerPosition:    250.0,
			MaxTotalExposure:          10000.0,
			MaxOpenPositions:          2,
			MaxConcentrationPercent:   25.0,
			MaxLossPerTrade:           500.0,
			MaxDailyLoss:              1000.0,
			MaxWeeklyLoss:             15000.0,
			MaxMonthlyLoss:            50000.0,
			DrawdownThresholdPercent:  10.0,
			DefaultStopLossPercent:    1.0,
			MinStopLossPercent:        0.5,
			MaxStopLossPercent:        10.0,
			EnableTrailingStop:        true,
			TrailingStopPercent:       0.75,
			TrailingActivationPercent: 2.0,
			DefaultTakeProfitPercent:  5.0,
			MinRiskRewardRatio:        2.0,
			EnablePartialProfit:       true,
			PartialProfitPercent:      50.0,
			FirstTargetPercent:        3.0,
			SecondTargetPercent:       5.0,
			CircuitBreakerEnabled:     true,
			DailyLossThreshold:        1000.0,
			MaxConsecutiveLosses:      5,
			MaxTradesPerDay:           50,
			CooldownMinutes:           60,
			AutoResume:                false,
			MinOrderSize:              1,
			MaxOrderSize:              1000,
			MaxOrderValue:             10000.0,
			MinPrice:                  0.01,
			MaxPrice:                  10000.0,
			MaxSlippagePercent:        0.5,
			AllowLeverage:             false,
			MaxLeverage:               1.0,
			MinMarginPercent:          100.0,
			MaxAtrPercent:             5.0,
			ReduceOnHighVolatility:    true,
			EnableVolatilityScaling:   true,
			BaseVolatilityPercent:     2.0,
			EnforceMarketHours:        true,
			AllowPremarket:            false,
			AllowAfterhours:           false,
			MaxPositionCorrelation:    0.7,
			EnforceCorrelationCheck:   true,
			CorrelationLookbackDays:   30,
			UpdatedAt:                 time.Now(),
		}
		if err := db.Create(&defaultLimits).Error; err != nil {
			return nil, fmt.Errorf("failed to create default global risk limits: %w", err)
		}
		return &defaultLimits, nil
	}

	return nil, fmt.Errorf("failed to query global risk limits: %w", err)
}

func (r *GormRiskLimitsRepository) SaveRiskLimits(ctx context.Context, limits *entities.RiskLimits) error {
	if r.store == nil || r.store.Postgres() == nil || r.store.Postgres().GormDB() == nil {
		return errors.New("database store not configured")
	}
	db := r.store.Postgres().GormDB().WithContext(ctx)

	limits.UpdatedAt = time.Now()
	if limits.ID > 0 {
		return db.Save(limits).Error
	}

	// Double-check if we are saving an account-specific setting and one already exists
	if limits.AccountID != nil && *limits.AccountID != "" {
		var existing entities.RiskLimits
		err := db.Where("account_id = ?", *limits.AccountID).First(&existing).Error
		if err == nil {
			limits.ID = existing.ID
			return db.Save(limits).Error
		}
	} else {
		// Global
		var existing entities.RiskLimits
		err := db.Where("account_id IS NULL").First(&existing).Error
		if err == nil {
			limits.ID = existing.ID
			return db.Save(limits).Error
		}
	}

	return db.Create(limits).Error
}
