package questdb

import (
	"trading/control-gateway/internal/modules/operations/application"
	"trading/control-gateway/internal/platform/database"
)

// QuestDBMetricRepository implements application.MetricRepository.
type QuestDBMetricRepository struct {
	reader *database.QuestDB
}

// NewQuestDBMetricRepository creates a new instance of QuestDBMetricRepository.
func NewMetricRepository(reader *database.QuestDB) application.MetricRepository {
	return &QuestDBMetricRepository{reader: reader}
}

func (r *QuestDBMetricRepository) QueryPerformanceSummary(userID string) (map[string]interface{}, error) {
	if r.reader == nil {
		return map[string]interface{}{}, nil
	}
	return r.reader.QueryPerformanceSummary(userID)
}

func (r *QuestDBMetricRepository) QueryCurrentMetricsSnapshot(userID string) (map[string]interface{}, error) {
	if r.reader == nil {
		return map[string]interface{}{}, nil
	}
	return r.reader.QueryCurrentMetricsSnapshot(userID)
}

func (r *QuestDBMetricRepository) QueryMetricsHistory(userID string, start, end string, metricTypes []string) ([]map[string]interface{}, error) {
	if r.reader == nil {
		return []map[string]interface{}{}, nil
	}
	return r.reader.QueryMetricsHistory(userID, start, end, metricTypes)
}
