package gorm

import (
	"encoding/json"

	"github.com/google/uuid"
)

// NotificationTemplate represents a template for user notifications.
type NotificationTemplate struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name         string    `gorm:"type:varchar(150);not null;unique"`
	BodyTemplate string    `gorm:"type:text;not null"`
}

// TableName overrides the default table name for NotificationTemplate.
func (NotificationTemplate) TableName() string {
	return "notification_templates"
}

// FeatureFlag represents a toggleable system feature.
type FeatureFlag struct {
	ID        string            `gorm:"type:varchar(100);primaryKey"`
	IsEnabled bool              `gorm:"type:boolean;not null;default:false"`
	Rules     []FeatureFlagRule `gorm:"foreignKey:FlagID;constraint:OnDelete:CASCADE;"`
}

// TableName overrides the default table name for FeatureFlag.
func (FeatureFlag) TableName() string {
	return "feature_flags"
}

// FeatureFlagRule represents targeting rules for a feature flag.
type FeatureFlagRule struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	FlagID    string    `gorm:"type:varchar(100);not null;index"`
	RuleType  string    `gorm:"type:varchar(50);not null"`
	RuleValue string    `gorm:"type:text;not null"`
}

// TableName overrides the default table name for FeatureFlagRule.
func (FeatureFlagRule) TableName() string {
	return "feature_flag_rules"
}

// ConfigSet represents a configuration namespace.
type ConfigSet struct {
	ID        uuid.UUID       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Namespace string          `gorm:"type:varchar(100);not null;unique"`
	Versions  []ConfigVersion `gorm:"foreignKey:ConfigSetID;constraint:OnDelete:CASCADE;"`
}

// TableName overrides the default table name for ConfigSet.
func (ConfigSet) TableName() string {
	return "config_sets"
}

// ConfigVersion represents a versioned configuration payload.
type ConfigVersion struct {
	ID          uuid.UUID       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ConfigSetID uuid.UUID       `gorm:"type:uuid;not null;index"`
	Version     int             `gorm:"type:integer;not null"`
	Payload     json.RawMessage `gorm:"type:jsonb;not null"`
}

// TableName overrides the default table name for ConfigVersion.
func (ConfigVersion) TableName() string {
	return "config_versions"
}

// StrategyTemplate represents a template for algotrading strategies.
type StrategyTemplate struct {
	ID   uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name string    `gorm:"type:varchar(255);not null;unique"`
}

// TableName overrides the default table name for StrategyTemplate.
func (StrategyTemplate) TableName() string {
	return "strategy_templates"
}

// StrategyDraft represents a working draft of an algotrading strategy.
type StrategyDraft struct {
	ID          uuid.UUID       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	StrategyID  uuid.UUID       `gorm:"type:uuid;not null;index"`
	ConfigDraft json.RawMessage `gorm:"type:jsonb;not null"`
}

// TableName overrides the default table name for StrategyDraft.
func (StrategyDraft) TableName() string {
	return "strategy_drafts"
}
