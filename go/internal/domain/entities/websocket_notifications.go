package entities

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// WebsocketSession represents a websocket client connection.
type WebsocketSession struct {
	ID           uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID       *uuid.UUID `json:"user_id" gorm:"type:uuid"`
	ConnectionID string     `json:"connection_id" gorm:"type:varchar(255);not null;uniqueIndex"`
	ConnectedAt  time.Time  `json:"connected_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for WebsocketSession.
func (WebsocketSession) TableName() string {
	return "websocket_sessions"
}

// WebsocketSubscription tracks active subscriptions for a session.
type WebsocketSubscription struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SessionID uuid.UUID `json:"session_id" gorm:"type:uuid;not null"`
	Topic     string    `json:"topic" gorm:"type:varchar(255);not null"`
}

// TableName overrides the default table name for WebsocketSubscription.
func (WebsocketSubscription) TableName() string {
	return "websocket_subscriptions"
}

// WebsocketResumeToken is used to resume disconnected websocket sessions.
type WebsocketResumeToken struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SessionID uuid.UUID `json:"session_id" gorm:"type:uuid;not null"`
	Token     string    `json:"token" gorm:"type:varchar(255);not null;uniqueIndex"`
	ExpiresAt time.Time `json:"expires_at" gorm:"not null"`
}

// TableName overrides the default table name for WebsocketResumeToken.
func (WebsocketResumeToken) TableName() string {
	return "websocket_resume_tokens"
}

// WebsocketAckOffset tracks processed messages sequence offsets per topic.
type WebsocketAckOffset struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SessionID       uuid.UUID `json:"session_id" gorm:"type:uuid;not null"`
	Topic           string    `json:"topic" gorm:"type:varchar(255);not null"`
	LastAckSequence int64     `json:"last_ack_sequence" gorm:"type:bigint;not null"`
}

// TableName overrides the default table name for WebsocketAckOffset.
func (WebsocketAckOffset) TableName() string {
	return "websocket_ack_offsets"
}

// WebsocketReplayWindow defines boundaries for messages replaying.
type WebsocketReplayWindow struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	SessionID      uuid.UUID `json:"session_id" gorm:"type:uuid;not null"`
	RequestedTopic string    `json:"requested_topic" gorm:"type:varchar(255);not null"`
	StartSequence  int64     `json:"start_sequence" gorm:"type:bigint;not null"`
	EndSequence    int64     `json:"end_sequence" gorm:"type:bigint;not null"`
	CreatedAt      time.Time `json:"created_at" gorm:"primaryKey;not null"`
}

// TableName overrides the default table name for WebsocketReplayWindow.
func (WebsocketReplayWindow) TableName() string {
	return "websocket_replay_windows"
}

// NotificationChannel represents a medium for notification dispatch.
type NotificationChannel struct {
	ID        string `json:"id" gorm:"type:varchar(50);primaryKey"`
	IsEnabled bool   `json:"is_enabled" gorm:"not null;default:true"`
}

// TableName overrides the default table name for NotificationChannel.
func (NotificationChannel) TableName() string {
	return "notification_channels"
}

// NotificationPreference tracks opt-in/opt-out selections of users.
type NotificationPreference struct {
	ID            uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID        uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
	ChannelID     string    `json:"channel_id" gorm:"type:varchar(50);not null"`
	EventCategory string    `json:"event_category" gorm:"type:varchar(100);not null"`
	IsSubscribed  bool      `json:"is_subscribed" gorm:"not null;default:true"`
}

// TableName overrides the default table name for NotificationPreference.
func (NotificationPreference) TableName() string {
	return "notification_preferences"
}

// NotificationTemplate contains layouts for notification events.
type NotificationTemplate struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name         string    `json:"name" gorm:"type:varchar(150);not null;uniqueIndex"`
	BodyTemplate string    `json:"body_template" gorm:"type:text;not null"`
}

// TableName overrides the default table name for NotificationTemplate.
func (NotificationTemplate) TableName() string {
	return "notification_templates"
}

// NotificationEvent represents dispatched notifications history.
type NotificationEvent struct {
	ID         uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID     uuid.UUID  `json:"user_id" gorm:"type:uuid;not null"`
	TemplateID *uuid.UUID `json:"template_id" gorm:"type:uuid"`
	Status     string     `json:"status" gorm:"type:varchar(50);not null"`
	CreatedAt  time.Time  `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for NotificationEvent.
func (NotificationEvent) TableName() string {
	return "notification_events"
}

// FeatureFlag is used to enable/disable specific features.
type FeatureFlag struct {
	ID        string `json:"id" gorm:"type:varchar(100);primaryKey"`
	IsEnabled bool   `json:"is_enabled" gorm:"not null;default:false"`
}

// TableName overrides the default table name for FeatureFlag.
func (FeatureFlag) TableName() string {
	return "feature_flags"
}

// FeatureFlagRule stores rules for feature flag evaluation.
type FeatureFlagRule struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	FlagID    string    `json:"flag_id" gorm:"type:varchar(100);not null"`
	RuleType  string    `json:"rule_type" gorm:"type:varchar(50);not null"`
	RuleValue string    `json:"rule_value" gorm:"type:text;not null"`
}

// TableName overrides the default table name for FeatureFlagRule.
func (FeatureFlagRule) TableName() string {
	return "feature_flag_rules"
}

// FeatureFlagEvaluation logs feature flag evaluation history.
type FeatureFlagEvaluation struct {
	ID             uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	FlagID         string     `json:"flag_id" gorm:"type:varchar(100);not null"`
	UserID         *uuid.UUID `json:"user_id" gorm:"type:uuid"`
	EvaluatedValue bool       `json:"evaluated_value" gorm:"not null"`
	EvaluatedAt    time.Time  `json:"evaluated_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for FeatureFlagEvaluation.
func (FeatureFlagEvaluation) TableName() string {
	return "feature_flag_evaluations"
}

// ConfigSet groups configurations under a namespace.
type ConfigSet struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Namespace string    `json:"namespace" gorm:"type:varchar(100);not null;uniqueIndex"`
}

// TableName overrides the default table name for ConfigSet.
func (ConfigSet) TableName() string {
	return "config_sets"
}

// ConfigVersion tracks configuration history payloads.
type ConfigVersion struct {
	ID          uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ConfigSetID uuid.UUID       `json:"config_set_id" gorm:"type:uuid;not null"`
	Version     int             `json:"version" gorm:"type:integer;not null"`
	Payload     json.RawMessage `json:"payload" gorm:"type:jsonb;not null"`
}

// TableName overrides the default table name for ConfigVersion.
func (ConfigVersion) TableName() string {
	return "config_versions"
}

// ConfigChangeEvent tracks historical updates to configs.
type ConfigChangeEvent struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	VersionID uuid.UUID  `json:"version_id" gorm:"type:uuid;not null"`
	ChangedBy *uuid.UUID `json:"changed_by" gorm:"type:uuid"`
	CreatedAt time.Time  `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for ConfigChangeEvent.
func (ConfigChangeEvent) TableName() string {
	return "config_change_events"
}

// IncidentUpdate maps updates to incidents.
type IncidentUpdate struct {
	ID         uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	IncidentID uuid.UUID  `json:"incident_id" gorm:"type:uuid;not null"`
	Message    string     `json:"message" gorm:"type:text;not null"`
	UpdatedBy  *uuid.UUID `json:"updated_by" gorm:"type:uuid"`
	CreatedAt  time.Time  `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for IncidentUpdate.
func (IncidentUpdate) TableName() string {
	return "incident_updates"
}

// SystemComponent represents a system component.
type SystemComponent struct {
	ID     string `json:"id" gorm:"type:varchar(100);primaryKey"`
	Name   string `json:"name" gorm:"type:varchar(150);not null"`
	Status string `json:"status" gorm:"type:varchar(50);not null;default:healthy"`
}

// TableName overrides the default table name for SystemComponent.
func (SystemComponent) TableName() string {
	return "system_components"
}

// ServiceHealthCheck records components status checks history.
type ServiceHealthCheck struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ComponentID string    `json:"component_id" gorm:"type:varchar(100);not null"`
	IsAlive     bool      `json:"is_alive" gorm:"not null"`
	CheckedAt   time.Time `json:"checked_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for ServiceHealthCheck.
func (ServiceHealthCheck) TableName() string {
	return "service_health_checks"
}

// AlertRule holds configuration boundaries for system alerts.
type AlertRule struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name      string    `json:"name" gorm:"type:varchar(150);not null"`
	MetricName string   `json:"metric_name" gorm:"type:varchar(100);not null"`
	Threshold  float64   `json:"threshold" gorm:"type:numeric(20,8);not null"`
}

// TableName overrides the default table name for AlertRule.
func (AlertRule) TableName() string {
	return "alert_rules"
}

// AlertEvent logs triggered events violating alert rules.
type AlertEvent struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	RuleID    *uuid.UUID `json:"rule_id" gorm:"type:uuid"`
	Severity  string     `json:"severity" gorm:"type:varchar(50);not null"`
	Message   string     `json:"message" gorm:"type:text;not null"`
	CreatedAt time.Time  `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for AlertEvent.
func (AlertEvent) TableName() string {
	return "alert_events"
}

// AlertDelivery logs delivery channels and dispatch outcomes.
type AlertDelivery struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AlertEventID uuid.UUID `json:"alert_event_id" gorm:"type:uuid;not null"`
	Channel      string    `json:"channel" gorm:"type:varchar(50);not null"`
	Status       string    `json:"status" gorm:"type:varchar(50);not null"`
}

// TableName overrides the default table name for AlertDelivery.
func (AlertDelivery) TableName() string {
	return "alert_deliveries"
}

// ProviderEvent logs webhook notification payloads from third-party vendors.
type ProviderEvent struct {
	ID           uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ProviderName string          `json:"provider_name" gorm:"type:varchar(100);not null"`
	EventType    string          `json:"event_type" gorm:"type:varchar(100);not null"`
	RawPayload   json.RawMessage `json:"raw_payload" gorm:"type:jsonb;not null"`
	CreatedAt    time.Time       `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for ProviderEvent.
func (ProviderEvent) TableName() string {
	return "provider_events"
}

// ProviderEventError logs processing failures of provider events.
type ProviderEventError struct {
	EventID      uuid.UUID `json:"event_id" gorm:"type:uuid;primaryKey"`
	ErrorMessage string    `json:"error_message" gorm:"type:text;not null"`
}

// TableName overrides the default table name for ProviderEventError.
func (ProviderEventError) TableName() string {
	return "provider_event_errors"
}

// MetricRollup represents rollup summaries of metric samples.
type MetricRollup struct {
	ID          int64     `json:"id" gorm:"type:bigserial;primaryKey"`
	MetricName  string    `json:"metric_name" gorm:"type:varchar(255);not null"`
	Timestamp   time.Time `json:"timestamp" gorm:"not null"`
	Resolution  string    `json:"resolution" gorm:"type:varchar(50);not null"`
	MinValue    float64   `json:"min_value" gorm:"type:double precision;not null"`
	MaxValue    float64   `json:"max_value" gorm:"type:double precision;not null"`
	AvgValue    float64   `json:"avg_value" gorm:"type:double precision;not null"`
	SampleCount int64     `json:"sample_count" gorm:"type:bigint;not null"`
}

// TableName overrides the default table name for MetricRollup.
func (MetricRollup) TableName() string {
	return "metric_rollups"
}

// AuditEvent logs partition events of user and system audit trails.
type AuditEvent struct {
	ID           uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey"`
	UserID       *uuid.UUID `json:"user_id" gorm:"type:uuid"`
	Action       string     `json:"action" gorm:"type:varchar(255);not null"`
	ResourceType string     `json:"resource_type" gorm:"type:varchar(100);not null"`
	ResourceID   *string    `json:"resource_id" gorm:"type:varchar(100)"`
	CreatedAt    time.Time  `json:"created_at" gorm:"primaryKey;not null"`
}

// TableName overrides the default table name for AuditEvent.
func (AuditEvent) TableName() string {
	return "audit_events"
}

// MetricSample stores raw time-series metrics.
type MetricSample struct {
	ID         int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	MetricName string    `json:"metric_name" gorm:"type:varchar(255);not null"`
	Timestamp  time.Time `json:"timestamp" gorm:"primaryKey;not null"`
	Value      float64   `json:"value" gorm:"type:double precision;not null"`
}

// TableName overrides the default table name for MetricSample.
func (MetricSample) TableName() string {
	return "metric_samples"
}
