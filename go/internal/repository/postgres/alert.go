package postgres

import (
	"trading/observability-api/internal/alerts"
	"trading/observability-api/internal/domain/entities"
	"trading/observability-api/internal/domain/repositories"
)

// RawSQLAlertRepository implements repositories.AlertRepository.
type RawSQLAlertRepository struct {
	manager *alerts.Manager
}

// NewRawSQLAlertRepository creates a new instance of RawSQLAlertRepository.
func NewRawSQLAlertRepository(manager *alerts.Manager) repositories.AlertRepository {
	return &RawSQLAlertRepository{manager: manager}
}

func (r *RawSQLAlertRepository) Create(alert map[string]interface{}) entities.Incident {
	return r.manager.Create(alert)
}

func (r *RawSQLAlertRepository) Acknowledge(id, owner string) (entities.Incident, error) {
	return r.manager.Acknowledge(id, owner)
}

func (r *RawSQLAlertRepository) Resolve(id, evidence string) (entities.Incident, error) {
	return r.manager.Resolve(id, evidence)
}

func (r *RawSQLAlertRepository) List() map[string]entities.Incident {
	return r.manager.List()
}
