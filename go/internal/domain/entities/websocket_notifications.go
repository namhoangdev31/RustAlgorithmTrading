package entities

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// WebsocketSession represents a websocket client connection.
type WebsocketSession struct {
	ID           uuid.UUID  `json:"id"`
	UserID       *uuid.UUID `json:"user_id"`
	ConnectionID string     `json:"connection_id"`
	ConnectedAt  time.Time  `json:"connected_at"`
}

// WebsocketSubscription tracks active subscriptions for a session.
type WebsocketSubscription struct {
	ID        uuid.UUID `json:"id"`
	SessionID uuid.UUID `json:"session_id"`
	Topic     string    `json:"topic"`
}

// WebsocketResumeToken is used to resume disconnected websocket sessions.
type WebsocketResumeToken struct {
	ID        uuid.UUID `json:"id"`
	SessionID uuid.UUID `json:"session_id"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
}

// WebsocketAckOffset tracks processed messages sequence offsets per topic.
type WebsocketAckOffset struct {
	ID              uuid.UUID `json:"id"`
	SessionID       uuid.UUID `json:"session_id"`
	Topic           string    `json:"topic"`
	LastAckSequence int64     `json:"last_ack_sequence"`
}

// WebsocketReplayWindow defines boundaries for messages replaying.
type WebsocketReplayWindow struct {
	ID             uuid.UUID `json:"id"`
	SessionID      uuid.UUID `json:"session_id"`
	RequestedTopic string    `json:"requested_topic"`
	StartSequence  int64     `json:"start_sequence"`
	EndSequence    int64     `json:"end_sequence"`
	CreatedAt      time.Time `json:"created_at"`
}

// NotificationChannel represents a medium for notification dispatch.
type NotificationChannel struct {
	ID        string `json:"id"`
	IsEnabled bool   `json:"is_enabled"`
}

// NotificationPreference tracks opt-in/opt-out selections of users.
type NotificationPreference struct {
	ID            uuid.UUID `json:"id"`
	UserID        uuid.UUID `json:"user_id"`
	ChannelID     string    `json:"channel_id"`
	EventCategory string    `json:"event_category"`
	IsSubscribed  bool      `json:"is_subscribed"`
}

// NotificationTemplate contains layouts for notification events.
type NotificationTemplate struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	BodyTemplate string    `json:"body_template"`
}

// NotificationEvent represents dispatched notifications history.
type NotificationEvent struct {
	ID         uuid.UUID  `json:"id"`
	UserID     uuid.UUID  `json:"user_id"`
	TemplateID *uuid.UUID `json:"template_id"`
	Status     string     `json:"status"`
	CreatedAt  time.Time  `json:"created_at"`
}

// FeatureFlag is used to enable/disable specific features.
type FeatureFlag struct {
	ID        string `json:"id"`
	IsEnabled bool   `json:"is_enabled"`
}

// FeatureFlagRule stores rules for feature flag evaluation.
type FeatureFlagRule struct {
	ID        uuid.UUID `json:"id"`
	FlagID    string    `json:"flag_id"`
	RuleType  string    `json:"rule_type"`
	RuleValue string    `json:"rule_value"`
}

// FeatureFlagEvaluation logs feature flag evaluation history.
type FeatureFlagEvaluation struct {
	ID             uuid.UUID  `json:"id"`
	FlagID         string     `json:"flag_id"`
	UserID         *uuid.UUID `json:"user_id"`
	EvaluatedValue bool       `json:"evaluated_value"`
	EvaluatedAt    time.Time  `json:"evaluated_at"`
}

// ConfigSet groups configurations under a namespace.
type ConfigSet struct {
	ID        uuid.UUID `json:"id"`
	Namespace string    `json:"namespace"`
}

// ConfigVersion tracks configuration history payloads.
type ConfigVersion struct {
	ID          uuid.UUID       `json:"id"`
	ConfigSetID uuid.UUID       `json:"config_set_id"`
	Version     int             `json:"version"`
	Payload     json.RawMessage `json:"payload"`
}

// ConfigChangeEvent tracks historical updates to configs.
type ConfigChangeEvent struct {
	ID        uuid.UUID  `json:"id"`
	VersionID uuid.UUID  `json:"version_id"`
	ChangedBy *uuid.UUID `json:"changed_by"`
	CreatedAt time.Time  `json:"created_at"`
}

// IncidentUpdate maps updates to incidents.
type IncidentUpdate struct {
	ID         uuid.UUID  `json:"id"`
	IncidentID uuid.UUID  `json:"incident_id"`
	Message    string     `json:"message"`
	UpdatedBy  *uuid.UUID `json:"updated_by"`
	CreatedAt  time.Time  `json:"created_at"`
}

// SystemComponent represents a system component.
type SystemComponent struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"`
}

// ServiceHealthCheck records components status checks history.
type ServiceHealthCheck struct {
	ID          uuid.UUID `json:"id"`
	ComponentID string    `json:"component_id"`
	IsAlive     bool      `json:"is_alive"`
	CheckedAt   time.Time `json:"checked_at"`
}

// AlertRule holds configuration boundaries for system alerts.
type AlertRule struct {
	ID         uuid.UUID `json:"id"`
	Name       string    `json:"name"`
	MetricName string    `json:"metric_name"`
	Threshold  float64   `json:"threshold"`
}

// AlertEvent logs triggered events violating alert rules.
type AlertEvent struct {
	ID        uuid.UUID  `json:"id"`
	RuleID    *uuid.UUID `json:"rule_id"`
	Severity  string     `json:"severity"`
	Message   string     `json:"message"`
	CreatedAt time.Time  `json:"created_at"`
}

// AlertDelivery logs delivery channels and dispatch outcomes.
type AlertDelivery struct {
	ID           uuid.UUID `json:"id"`
	AlertEventID uuid.UUID `json:"alert_event_id"`
	Channel      string    `json:"channel"`
	Status       string    `json:"status"`
}

// ProviderEvent logs webhook notification payloads from third-party vendors.
type ProviderEvent struct {
	ID           uuid.UUID       `json:"id"`
	ProviderName string          `json:"provider_name"`
	EventType    string          `json:"event_type"`
	RawPayload   json.RawMessage `json:"raw_payload"`
	CreatedAt    time.Time       `json:"created_at"`
}

// ProviderEventError logs processing failures of provider events.
type ProviderEventError struct {
	EventID      uuid.UUID `json:"event_id"`
	ErrorMessage string    `json:"error_message"`
}

// MetricRollup represents rollup summaries of metric samples.
type MetricRollup struct {
	ID          int64     `json:"id"`
	MetricName  string    `json:"metric_name"`
	Timestamp   time.Time `json:"timestamp"`
	Resolution  string    `json:"resolution"`
	MinValue    float64   `json:"min_value"`
	MaxValue    float64   `json:"max_value"`
	AvgValue    float64   `json:"avg_value"`
	SampleCount int64     `json:"sample_count"`
}

// AuditEvent logs partition events of user and system audit trails.
type AuditEvent struct {
	ID           uuid.UUID  `json:"id"`
	UserID       *uuid.UUID `json:"user_id"`
	Action       string     `json:"action"`
	ResourceType string     `json:"resource_type"`
	ResourceID   *string    `json:"resource_id"`
	CreatedAt    time.Time  `json:"created_at"`
}

// MetricSample stores raw time-series metrics.
type MetricSample struct {
	ID         int64     `json:"id"`
	MetricName string    `json:"metric_name"`
	Timestamp  time.Time `json:"timestamp"`
	Value      float64   `json:"value"`
}
