package questdb

import (
	"context"
	"fmt"
	"time"

	"entgo.io/ent/dialect/sql"

	"trading/control-gateway/internal/data/ent/riskevent"
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

func (r *HybridSystemRepository) QueryPerformanceHistory(userID string, limit int) ([]map[string]interface{}, error) {
	if r.store == nil || r.store.QuestDB() == nil {
		return []map[string]interface{}{}, nil
	}
	return r.store.QuestDB().QueryPerformanceHistory(userID, limit)
}

func (r *HybridSystemRepository) QueryLogs(userID string, level string, limit int) ([]map[string]interface{}, error) {
	if r.store == nil {
		return []map[string]interface{}{}, nil
	}
	if r.store.Postgres() != nil {
		client := r.store.Postgres().Ent()
		if client == nil {
			return []map[string]interface{}{}, nil
		}
		if limit <= 0 {
			limit = 100
		}
		rows, err := client.RiskEvent.Query().Where(riskevent.SeverityHasPrefix(level)).Order(riskevent.ByOccurredAt(sql.OrderDesc())).Limit(limit).All(context.Background())
		if err != nil {
			return nil, fmt.Errorf("query risk event logs: %w", err)
		}
		result := make([]map[string]interface{}, 0, len(rows))
		for _, row := range rows {
			result = append(result, map[string]interface{}{
				"id": row.ID, "event_type": row.EventType, "severity": row.Severity,
				"message": row.Message, "timestamp": row.OccurredAt.Format(time.RFC3339),
			})
		}
		return result, nil
	}
	if r.store.QuestDB() != nil {
		return r.store.QuestDB().QueryLogs(userID, level, limit)
	}
	return []map[string]interface{}{}, nil
}

func (r *HybridSystemRepository) QueryLatestIntegrityReport(userID string) (map[string]interface{}, error) {
	if r.store == nil || r.store.QuestDB() == nil {
		return map[string]interface{}{
			"is_valid": true,
			"reasons":  []interface{}{},
			"metrics":  map[string]interface{}{},
		}, nil
	}
	return r.store.QuestDB().QueryLatestIntegrityReport(userID)
}
