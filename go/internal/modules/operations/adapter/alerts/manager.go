package alerts

import (
	"errors"
	"fmt"
	"sync"
	"time"

	domain "trading/control-gateway/internal/modules/operations/domain"
)

type Manager struct {
	mu        sync.RWMutex
	incidents map[string]domain.Incident
	counter   int64
}

func NewManager() *Manager {
	return &Manager{incidents: make(map[string]domain.Incident)}
}

func (m *Manager) Create(alert map[string]interface{}) domain.Incident {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.counter++
	id := fmt.Sprintf("INC-%06d", m.counter)
	now := time.Now().UTC()
	inc := domain.Incident{
		ID:            id,
		Severity:      asString(alert, "severity", "P2"),
		Component:     asString(alert, "component", "unknown"),
		ReasonCode:    asString(alert, "reason_code", "UNKNOWN"),
		CorrelationID: asString(alert, "correlation_id", ""),
		Status:        domain.StatusNew,
		CreatedAt:     now,
		UpdatedAt:     now,
		Metadata:      alert,
	}
	m.incidents[id] = inc
	return inc
}

func (m *Manager) Acknowledge(id, owner string) (domain.Incident, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	inc, ok := m.incidents[id]
	if !ok {
		return domain.Incident{}, errors.New("incident not found")
	}
	inc.Status = domain.StatusAcknowledged
	inc.Owner = owner
	inc.UpdatedAt = time.Now().UTC()
	m.incidents[id] = inc
	return inc, nil
}

func (m *Manager) Resolve(id, evidence string) (domain.Incident, error) {
	if evidence == "" {
		return domain.Incident{}, errors.New("evidence is required")
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	inc, ok := m.incidents[id]
	if !ok {
		return domain.Incident{}, errors.New("incident not found")
	}
	inc.Status = domain.StatusResolved
	inc.Evidence = evidence
	inc.UpdatedAt = time.Now().UTC()
	m.incidents[id] = inc
	return inc, nil
}

func (m *Manager) List() map[string]domain.Incident {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make(map[string]domain.Incident, len(m.incidents))
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
