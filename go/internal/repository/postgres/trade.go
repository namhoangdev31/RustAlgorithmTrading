package postgres

import (
	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/storage"
)

// RawSQLTradeRepository implements the repositories.TradeRepository contract using pgx raw SQL.
type RawSQLTradeRepository struct {
	store *storage.Store
}

// NewRawSQLTradeRepository creates a new instance of RawSQLTradeRepository.
func NewRawSQLTradeRepository(store *storage.Store) repositories.TradeRepository {
	return &RawSQLTradeRepository{store: store}
}

func (r *RawSQLTradeRepository) QueryTrades(limit, offset int, symbol, side string) ([]map[string]interface{}, error) {
	if r.store == nil || r.store.Postgres() == nil {
		return []map[string]interface{}{}, nil
	}
	return r.store.Postgres().QueryTrades(limit, offset, symbol, side)
}

func (r *RawSQLTradeRepository) QueryTradeByID(tradeID string) (map[string]interface{}, bool, error) {
	if r.store == nil || r.store.Postgres() == nil {
		return nil, false, nil
	}
	return r.store.Postgres().QueryTradeByID(tradeID)
}

func (r *RawSQLTradeRepository) QueryTradeStatsSummary(symbol, timeRange string) (map[string]interface{}, error) {
	if r.store == nil || r.store.Postgres() == nil {
		return map[string]interface{}{}, nil
	}
	return r.store.Postgres().QueryTradeStatsSummary(symbol, timeRange)
}

func (r *RawSQLTradeRepository) QueryExecutionQuality() (map[string]interface{}, error) {
	if r.store == nil || r.store.Postgres() == nil {
		return map[string]interface{}{}, nil
	}
	return r.store.Postgres().QueryExecutionQuality()
}
