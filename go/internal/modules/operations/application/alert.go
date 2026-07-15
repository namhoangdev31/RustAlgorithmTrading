package application

import (
	domain "trading/control-gateway/internal/modules/operations/domain"
)

type alertUseCase struct {
	repo AlertRepository
}

// NewAlertUseCase creates a new instance of AlertUseCase, returning the interface.
func NewAlertUseCase(repo AlertRepository) AlertUseCase {
	return &alertUseCase{repo: repo}
}

func (u *alertUseCase) CreateIncident(alert map[string]interface{}) domain.Incident {
	return u.repo.Create(alert)
}

func (u *alertUseCase) AcknowledgeIncident(id, owner string) (domain.Incident, error) {
	return u.repo.Acknowledge(id, owner)
}

func (u *alertUseCase) ResolveIncident(id, evidence string) (domain.Incident, error) {
	return u.repo.Resolve(id, evidence)
}

func (u *alertUseCase) ListIncidents() map[string]domain.Incident {
	return u.repo.List()
}

func (u *alertUseCase) AcknowledgeAlert(alertID string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"status":   "acknowledged",
		"alert_id": alertID,
	}, nil
}
