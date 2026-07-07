package entities

import (
	"time"
)

// PartitionRetentionPolicy configures automated partition deletion policies.
type PartitionRetentionPolicy struct {
	Table           string    `json:"table_name" gorm:"column:table_name;type:varchar(255);primaryKey"`
	RetentionPeriod string    `json:"retention_period" gorm:"type:interval;not null"`
	ArchiveToS3     bool      `json:"archive_to_s3" gorm:"not null;default:false"`
	UpdatedAt       time.Time `json:"updated_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for PartitionRetentionPolicy.
func (PartitionRetentionPolicy) TableName() string {
	return "partition_retention_policies"
}
