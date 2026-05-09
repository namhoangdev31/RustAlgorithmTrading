package alerts

import (
	"errors"
	"fmt"
	"sync"
	"time"
)

type Status string

const (
	StatusNew          Status = "NEW"
	StatusAcknowledged Status = "ACKNOWLEDGED"
	StatusResolved     Status = "RESOLVED"
)

type Incident struct {
	ID            string                 `json:"incident_id"`
	Severity      string                 `json:"severity"`
	Component     string                 `json:"component"`
	ReasonCode    string                 `json:"reason_code"`
	CorrelationID string                 `json:"correlation_id"`
	Status        Status                 `json:"status"`
	Owner         string                 `json:"owner,omitempty"`
	Evidence      string                 `json:"evidence,omitempty"`
	CreatedAt     time.Time              `json:"created_at"`
	UpdatedAt     time.Time              `json:"updated_at"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}

type Manager struct {
	mu        sync.RWMutex
	incidents map[string]Incident
	counter   int64
}

func NewManager() *Manager {
	return &Manager{incidents: make(map[string]Incident)}
}

func (m *Manager) Create(alert map[string]interface{}) Incident {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.counter++
	id := fmt.Sprintf("INC-%06d", m.counter)
	now := time.Now().UTC()
	inc := Incident{
		ID:            id,
		Severity:      asString(alert, "severity", "P2"),
		Component:     asString(alert, "component", "unknown"),
		ReasonCode:    asString(alert, "reason_code", "UNKNOWN"),
		CorrelationID: asString(alert, "correlation_id", ""),
		Status:        StatusNew,
		CreatedAt:     now,
		UpdatedAt:     now,
		Metadata:      alert,
	}
	m.incidents[id] = inc
	return inc
}

func (m *Manager) Acknowledge(id, owner string) (Incident, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	inc, ok := m.incidents[id]
	if !ok {
		return Incident{}, errors.New("incident not found")
	}
	inc.Status = StatusAcknowledged
	inc.Owner = owner
	inc.UpdatedAt = time.Now().UTC()
	m.incidents[id] = inc
	return inc, nil
}

func (m *Manager) Resolve(id, evidence string) (Incident, error) {
	if evidence == "" {
		return Incident{}, errors.New("evidence is required")
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	inc, ok := m.incidents[id]
	if !ok {
		return Incident{}, errors.New("incident not found")
	}
	inc.Status = StatusResolved
	inc.Evidence = evidence
	inc.UpdatedAt = time.Now().UTC()
	m.incidents[id] = inc
	return inc, nil
}

func (m *Manager) List() map[string]Incident {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make(map[string]Incident, len(m.incidents))
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
