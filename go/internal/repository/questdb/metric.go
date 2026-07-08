package questdb

import (
	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/storage"
)

// QuestDBMetricRepository implements repositories.MetricRepository.
type QuestDBMetricRepository struct {
	store *storage.Store
}

// NewQuestDBMetricRepository creates a new instance of QuestDBMetricRepository.
func NewQuestDBMetricRepository(store *storage.Store) repositories.MetricRepository {
	return &QuestDBMetricRepository{store: store}
}

func (r *QuestDBMetricRepository) QueryPerformanceSummary(userID string) (map[string]interface{}, error) {
	if r.store == nil || r.store.QuestDB() == nil {
		return map[string]interface{}{}, nil
	}
	return r.store.QuestDB().QueryPerformanceSummary(userID)
}

func (r *QuestDBMetricRepository) QueryCurrentMetricsSnapshot(userID string) (map[string]interface{}, error) {
	if r.store == nil || r.store.QuestDB() == nil {
		return map[string]interface{}{}, nil
	}
	return r.store.QuestDB().QueryCurrentMetricsSnapshot(userID)
}

func (r *QuestDBMetricRepository) QueryMetricsHistory(userID string, start, end string, metricTypes []string) ([]map[string]interface{}, error) {
	if r.store == nil || r.store.QuestDB() == nil {
		return []map[string]interface{}{}, nil
	}
	return r.store.QuestDB().QueryMetricsHistory(userID, start, end, metricTypes)
}
