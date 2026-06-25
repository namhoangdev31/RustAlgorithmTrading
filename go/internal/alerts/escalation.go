package alerts

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"trading/observability-api/internal/models"
)

type Manager struct {
	mu        sync.RWMutex
	incidents map[string]models.Incident
	counter   int64
}

func NewManager() *Manager {
	return &Manager{incidents: make(map[string]models.Incident)}
}

func (m *Manager) Create(alert map[string]interface{}) models.Incident {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.counter++
	id := fmt.Sprintf("INC-%06d", m.counter)
	now := time.Now().UTC()
	inc := models.Incident{
		ID:            id,
		Severity:      asString(alert, "severity", "P2"),
		Component:     asString(alert, "component", "unknown"),
		ReasonCode:    asString(alert, "reason_code", "UNKNOWN"),
		CorrelationID: asString(alert, "correlation_id", ""),
		Status:        models.StatusNew,
		CreatedAt:     now,
		UpdatedAt:     now,
		Metadata:      alert,
	}
	m.incidents[id] = inc
	return inc
}

func (m *Manager) Acknowledge(id, owner string) (models.Incident, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	inc, ok := m.incidents[id]
	if !ok {
		return models.Incident{}, errors.New("incident not found")
	}
	inc.Status = models.StatusAcknowledged
	inc.Owner = owner
	inc.UpdatedAt = time.Now().UTC()
	m.incidents[id] = inc
	return inc, nil
}

func (m *Manager) Resolve(id, evidence string) (models.Incident, error) {
	if evidence == "" {
		return models.Incident{}, errors.New("evidence is required")
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	inc, ok := m.incidents[id]
	if !ok {
		return models.Incident{}, errors.New("incident not found")
	}
	inc.Status = models.StatusResolved
	inc.Evidence = evidence
	inc.UpdatedAt = time.Now().UTC()
	m.incidents[id] = inc
	return inc, nil
}

func (m *Manager) List() map[string]models.Incident {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make(map[string]models.Incident, len(m.incidents))
	for k, v := range m.incidents {
		out[k] = v
	}
	return out
}

func asString(m map[string]interface{}, key, fallback string) string {
	if m == nil {
		return fallback
	}
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return fallback
}
