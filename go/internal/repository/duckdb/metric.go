package duckdb

import (
	"trading/observability-api/internal/domain/repositories"
	"trading/observability-api/internal/storage"
)

// DuckDBMetricRepository implements repositories.MetricRepository.
type DuckDBMetricRepository struct {
	store *storage.Store
}

// NewDuckDBMetricRepository creates a new instance of DuckDBMetricRepository.
func NewDuckDBMetricRepository(store *storage.Store) repositories.MetricRepository {
	return &DuckDBMetricRepository{store: store}
}

func (r *DuckDBMetricRepository) QueryPerformanceSummary() (map[string]interface{}, error) {
	if r.store == nil || r.store.DuckDB() == nil {
		return map[string]interface{}{}, nil
	}
	return r.store.DuckDB().QueryPerformanceSummary()
}

func (r *DuckDBMetricRepository) QueryMetricsHistory(start, end string, metricTypes []string) ([]map[string]interface{}, error) {
	if r.store == nil || r.store.DuckDB() == nil {
		return []map[string]interface{}{}, nil
	}
	return r.store.DuckDB().QueryMetricsHistory(start, end, metricTypes)
}
