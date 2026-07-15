package questdb

import (
	"context"
	"fmt"
	"time"

	"entgo.io/ent/dialect/sql"

	"trading/control-gateway/internal/data/ent"
	"trading/control-gateway/internal/data/ent/riskevent"
	"trading/control-gateway/internal/modules/operations/application"
	"trading/control-gateway/internal/platform/database"
)

// HybridSystemRepository implements application.SystemRepository.
type HybridSystemRepository struct {
	questdb *database.QuestDB
	client  *ent.Client
}

// NewHybridSystemRepository creates a new instance of HybridSystemRepository.
func NewSystemRepository(questdb *database.QuestDB, client *ent.Client) application.SystemRepository {
	return &HybridSystemRepository{questdb: questdb, client: client}
}

func (r *HybridSystemRepository) QueryPerformanceHistory(userID string, limit int) ([]map[string]interface{}, error) {
	if r.questdb == nil {
		return []map[string]interface{}{}, nil
	}
	return r.questdb.QueryPerformanceHistory(userID, limit)
}

func (r *HybridSystemRepository) QueryLogs(userID string, level string, limit int) ([]map[string]interface{}, error) {
	if r.client != nil {
		client := r.client
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
	if r.questdb != nil {
		return r.questdb.QueryLogs(userID, level, limit)
	}
	return []map[string]interface{}{}, nil
}

func (r *HybridSystemRepository) QueryLatestIntegrityReport(userID string) (map[string]interface{}, error) {
	if r.questdb == nil {
		return map[string]interface{}{
			"is_valid": true,
			"reasons":  []interface{}{},
			"metrics":  map[string]interface{}{},
		}, nil
	}
	return r.questdb.QueryLatestIntegrityReport(userID)
}
