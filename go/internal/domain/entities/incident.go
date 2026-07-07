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
	ID            string                 `json:"incident_id" gorm:"type:uuid;primaryKey;column:id;default:gen_random_uuid()"`
	Title         string                 `json:"title" gorm:"column:title;type:varchar(255);not null"`
	Severity      string                 `json:"severity" gorm:"column:severity;type:varchar(50);not null"`
	Status        Status                 `json:"status" gorm:"column:status;type:varchar(50);not null;default:open"`
	Component     string                 `json:"component" gorm:"-"`
	ReasonCode    string                 `json:"reason_code" gorm:"-"`
	CorrelationID string                 `json:"correlation_id" gorm:"-"`
	Owner         string                 `json:"owner,omitempty" gorm:"-"`
	Evidence      string                 `json:"evidence,omitempty" gorm:"-"`
	CreatedAt     time.Time              `json:"created_at" gorm:"-"`
	UpdatedAt     time.Time              `json:"updated_at" gorm:"-"`
	Metadata      map[string]interface{} `json:"metadata,omitempty" gorm:"-"`
}

// TableName overrides the default table name for Incident model mapping.
func (Incident) TableName() string {
	return "incidents"
}
