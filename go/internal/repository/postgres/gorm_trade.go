package postgres

import (
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"trading/observability-api/internal/domain/entities"
	"trading/observability-api/internal/domain/repositories"
	"trading/observability-api/internal/storage"
)

// GormTradeRepository implements repositories.TradeRepository using GORM DB.
type GormTradeRepository struct {
	store *storage.Store
}

// NewGormTradeRepository creates a new instance of GormTradeRepository.
func NewGormTradeRepository(store *storage.Store) repositories.TradeRepository {
	return &GormTradeRepository{store: store}
}

func (r *GormTradeRepository) QueryTrades(limit, offset int, symbol, side string) ([]map[string]interface{}, error) {
	if r.store == nil || r.store.Postgres() == nil || r.store.Postgres().GormDB() == nil {
		return []map[string]interface{}{}, nil
	}
	db := r.store.Postgres().GormDB()

	var orders []entities.Order
	query := db.Model(&entities.Order{})

	if symbol != "" {
		query = query.Where("symbol = ?", symbol)
	}
	if side != "" {
		query = query.Where("LOWER(side) = LOWER(?)", side)
	}

	if limit <= 0 {
		limit = 100
	}
	err := query.Order("submitted_at desc").Limit(limit).Offset(offset).Find(&orders).Error
	if err != nil {
		return nil, fmt.Errorf("gorm failed to query trades: %w", err)
	}

	results := make([]map[string]interface{}, len(orders))
	for i, o := range orders {
		priceVal := 0.0
		if o.Price != nil {
			priceVal = *o.Price
		}
		results[i] = map[string]interface{}{
			"id":        o.ID,
			"order_id":  o.ClientOrderID,
			"symbol":    o.Symbol,
			"side":      string(o.Side),
			"quantity":  o.Quantity,
			"price":     priceVal,
			"status":    string(o.Status),
			"timestamp": o.SubmittedAt,
		}
	}
	return results, nil
}

func (r *GormTradeRepository) QueryTradeByID(tradeID string) (map[string]interface{}, bool, error) {
	if r.store == nil || r.store.Postgres() == nil || r.store.Postgres().GormDB() == nil {
		return nil, false, nil
	}
	db := r.store.Postgres().GormDB()

	var o entities.Order
	query := db
	if _, err := uuid.Parse(tradeID); err == nil {
		query = query.Where("id = ? OR client_order_id = ?", tradeID, tradeID)
	} else {
		query = query.Where("client_order_id = ?", tradeID)
	}

	err := query.First(&o).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, false, nil
		}
		return nil, false, fmt.Errorf("gorm failed to find trade by id: %w", err)
	}

	priceVal := 0.0
	if o.Price != nil {
		priceVal = *o.Price
	}

	return map[string]interface{}{
		"id":        o.ID,
		"order_id":  o.ClientOrderID,
		"symbol":    o.Symbol,
		"side":      string(o.Side),
		"quantity":  o.Quantity,
		"price":     priceVal,
		"status":    string(o.Status),
		"timestamp": o.SubmittedAt,
	}, true, nil
}

func (r *GormTradeRepository) QueryTradeStatsSummary(symbol, timeRange string) (map[string]interface{}, error) {
	if r.store == nil || r.store.Postgres() == nil {
		return map[string]interface{}{}, nil
	}
	return r.store.Postgres().QueryTradeStatsSummary(symbol, timeRange)
}

func (r *GormTradeRepository) QueryExecutionQuality() (map[string]interface{}, error) {
	if r.store == nil || r.store.Postgres() == nil {
		return map[string]interface{}{}, nil
	}
	return r.store.Postgres().QueryExecutionQuality()
}
