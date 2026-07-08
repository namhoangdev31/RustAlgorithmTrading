package duckdb

import (
	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/storage"
)

// HybridSystemRepository implements repositories.SystemRepository.
type HybridSystemRepository struct {
	store *storage.Store
}

// NewHybridSystemRepository creates a new instance of HybridSystemRepository.
func NewHybridSystemRepository(store *storage.Store) repositories.SystemRepository {
	return &HybridSystemRepository{store: store}
}

func (r *HybridSystemRepository) QueryPerformanceHistory(limit int) ([]map[string]interface{}, error) {
	if r.store == nil || r.store.DuckDB() == nil {
		return []map[string]interface{}{}, nil
	}
	return r.store.DuckDB().QueryPerformanceHistory(limit)
}

func (r *HybridSystemRepository) QueryLogs(level string, limit int) ([]map[string]interface{}, error) {
	if r.store == nil {
		return []map[string]interface{}{}, nil
	}
	if r.store.Postgres() != nil {
		return r.store.Postgres().QueryLogs(level, limit)
	}
	if r.store.DuckDB() != nil {
		return r.store.DuckDB().QueryLogs(level, limit)
	}
	return []map[string]interface{}{}, nil
}

func (r *HybridSystemRepository) QueryLatestIntegrityReport() (map[string]interface{}, error) {
	if r.store == nil || r.store.DuckDB() == nil {
		return map[string]interface{}{
			"is_valid": true,
			"reasons":  []interface{}{},
			"metrics":  map[string]interface{}{},
		}, nil
	}
	return r.store.DuckDB().QueryLatestIntegrityReport()
}
