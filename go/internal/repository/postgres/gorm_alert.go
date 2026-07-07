package postgres

import (
	"trading/observability-api/internal/alerts"
	"trading/observability-api/internal/domain/entities"
	"trading/observability-api/internal/domain/repositories"
)

// GormAlertRepository implements repositories.AlertRepository.
type GormAlertRepository struct {
	manager *alerts.Manager
}

// NewGormAlertRepository creates a new instance of GormAlertRepository.
func NewGormAlertRepository(manager *alerts.Manager) repositories.AlertRepository {
	return &GormAlertRepository{manager: manager}
}

func (r *GormAlertRepository) Create(alert map[string]interface{}) entities.Incident {
	return r.manager.Create(alert)
}

func (r *GormAlertRepository) Acknowledge(id, owner string) (entities.Incident, error) {
	return r.manager.Acknowledge(id, owner)
}

func (r *GormAlertRepository) Resolve(id, evidence string) (entities.Incident, error) {
	return r.manager.Resolve(id, evidence)
}

func (r *GormAlertRepository) List() map[string]entities.Incident {
	return r.manager.List()
}
