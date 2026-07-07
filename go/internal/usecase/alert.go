package usecase

import (
	"trading/observability-api/internal/domain/entities"
	"trading/observability-api/internal/domain/repositories"
	"trading/observability-api/internal/domain/usecases"
)

type alertUseCase struct {
	repo repositories.AlertRepository
}

// NewAlertUseCase creates a new instance of AlertUseCase, returning the interface.
func NewAlertUseCase(repo repositories.AlertRepository) usecases.AlertUseCase {
	return &alertUseCase{repo: repo}
}

func (u *alertUseCase) CreateIncident(alert map[string]interface{}) entities.Incident {
	return u.repo.Create(alert)
}

func (u *alertUseCase) AcknowledgeIncident(id, owner string) (entities.Incident, error) {
	return u.repo.Acknowledge(id, owner)
}

func (u *alertUseCase) ResolveIncident(id, evidence string) (entities.Incident, error) {
	return u.repo.Resolve(id, evidence)
}

func (u *alertUseCase) ListIncidents() map[string]entities.Incident {
	return u.repo.List()
}

func (u *alertUseCase) AcknowledgeAlert(alertID string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"status":   "acknowledged",
		"alert_id": alertID,
	}, nil
}
