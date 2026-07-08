package questdb

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
		return r.store.Postgres().QueryLogs(level, limit)
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
