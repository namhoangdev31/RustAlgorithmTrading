package domain

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
	ID            string
	Title         string
	Severity      string
	Status        Status
	Component     string
	ReasonCode    string
	CorrelationID string
	Owner         string
	Evidence      string
	CreatedAt     time.Time
	UpdatedAt     time.Time
	Metadata      map[string]interface{}
}
