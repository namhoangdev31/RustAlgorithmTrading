package entities

import (
	"time"
)

// PartitionRetentionPolicy configures automated partition deletion policies.
type PartitionRetentionPolicy struct {
	Table           string    `json:"table_name"`
	RetentionPeriod string    `json:"retention_period"`
	ArchiveToS3     bool      `json:"archive_to_s3"`
	UpdatedAt       time.Time `json:"updated_at"`
}
