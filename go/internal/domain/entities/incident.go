package entities

import "time"

// Status represents incident status values.
type Status string

const (
	StatusNew          Status = "NEW"
	StatusAcknowledged Status = "ACKNOWLEDGED"
	StatusResolved     Status = "RESOLVED"
)

// Incident represents system alert notifications and maps to the database incidents table.
type Incident struct {
	ID            string                 `json:"incident_id"`
	Title         string                 `json:"title"`
	Severity      string                 `json:"severity"`
	Status        Status                 `json:"status"`
	Component     string                 `json:"component"`
	ReasonCode    string                 `json:"reason_code"`
	CorrelationID string                 `json:"correlation_id"`
	Owner         string                 `json:"owner,omitempty"`
	Evidence      string                 `json:"evidence,omitempty"`
	CreatedAt     time.Time              `json:"created_at"`
	UpdatedAt     time.Time              `json:"updated_at"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}
