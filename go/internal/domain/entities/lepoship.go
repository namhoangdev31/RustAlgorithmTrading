package entities

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type Bundle struct {
	ID                 uuid.UUID  `gorm:"column:id;type:uuid;primaryKey"`
	ProjectID          *uuid.UUID `gorm:"column:project_id;type:uuid"`
	Name               string     `gorm:"column:name"`
	Version            string     `gorm:"column:version"`
	BuildNumber        int        `gorm:"column:build_number"`
	StoragePath        string     `gorm:"column:storage_path"`
	Bucket             string     `gorm:"column:bucket"`
	Status             string     `gorm:"column:status"`
	ActiveDeliveryMode string     `gorm:"column:active_delivery_mode"`
	CreatedAt          time.Time  `gorm:"column:created_at"`
	UpdatedAt          time.Time  `gorm:"column:updated_at"`
}

func (Bundle) TableName() string { return "bundles" }

type BundleSDKToken struct {
	ID                 uuid.UUID      `gorm:"column:id;type:uuid;primaryKey"`
	BundleID           uuid.UUID      `gorm:"column:bundle_id;type:uuid"`
	TokenPrefix        string         `gorm:"column:token_prefix"`
	TokenHash          string         `gorm:"column:token_hash"`
	Scopes             pq.StringArray `gorm:"column:scopes;type:text[]"`
	ExpiresAt          *time.Time     `gorm:"column:expires_at"`
	RotationGraceUntil *time.Time     `gorm:"column:rotation_grace_until"`
	LastUsedAt         *time.Time     `gorm:"column:last_used_at"`
	IsRevoked          bool           `gorm:"column:is_revoked"`
	CreatedAt          time.Time      `gorm:"column:created_at"`
}

func (BundleSDKToken) TableName() string { return "bundle_sdk_tokens" }

type BundleAnalyticsEvent struct {
	ID                uuid.UUID       `gorm:"column:id;type:uuid;primaryKey"`
	BundleID          uuid.UUID       `gorm:"column:bundle_id;type:uuid"`
	UserID            *uuid.UUID      `gorm:"column:user_id;type:uuid"`
	SessionID         *string         `gorm:"column:session_id"`
	EventType         string          `gorm:"column:event_type"`
	EventData         json.RawMessage `gorm:"column:event_data;serializer:json"`
	PlatformVersion   *string         `gorm:"column:platform_version"`
	BundleVersion     *string         `gorm:"column:bundle_version"`
	IPAddress         *string         `gorm:"column:ip_address"`
	DeviceFingerprint *string         `gorm:"column:device_fingerprint"`
	ClientEventID     *string         `gorm:"column:client_event_id"`
	ABTestID          *uuid.UUID      `gorm:"column:ab_test_id;type:uuid"`
	ABExposureID      *uuid.UUID      `gorm:"column:ab_exposure_id;type:uuid"`
	ABVariant         *string         `gorm:"column:ab_variant"`
	CreatedAt         time.Time       `gorm:"column:created_at"`
}

func (BundleAnalyticsEvent) TableName() string { return "bundle_analytics_events" }

type BundleInstallEvent struct {
	ID                uuid.UUID  `gorm:"column:id;type:uuid;primaryKey"`
	BundleID          uuid.UUID  `gorm:"column:bundle_id;type:uuid"`
	UserID            *uuid.UUID `gorm:"column:user_id;type:uuid"`
	EventType         string     `gorm:"column:event_type"`
	DeviceID          *string    `gorm:"column:device_id"`
	DeviceFingerprint *string    `gorm:"column:device_fingerprint"`
	ClientEventID     *string    `gorm:"column:client_event_id"`
	Platform          *string    `gorm:"column:platform"`
	OSVersion         *string    `gorm:"column:os_version"`
	BundleVersion     *string    `gorm:"column:bundle_version"`
	CountryCode       *string    `gorm:"column:country_code"`
	CreatedAt         time.Time  `gorm:"column:created_at"`
}

func (BundleInstallEvent) TableName() string { return "bundle_install_events" }

type BundleChannel struct {
	ID               uuid.UUID  `gorm:"column:id;type:uuid;primaryKey"`
	BundleID         uuid.UUID  `gorm:"column:bundle_id;type:uuid"`
	Name             string     `gorm:"column:name"`
	CurrentReleaseID *uuid.UUID `gorm:"column:current_release_id;type:uuid"`
	IsActive         bool       `gorm:"column:is_active"`
	CreatedAt        time.Time  `gorm:"column:created_at"`
	UpdatedAt        time.Time  `gorm:"column:updated_at"`
}

func (BundleChannel) TableName() string { return "bundle_channels" }

type BundleRelease struct {
	ID           uuid.UUID  `gorm:"column:id;type:uuid;primaryKey"`
	BundleID     uuid.UUID  `gorm:"column:bundle_id;type:uuid"`
	ChannelID    uuid.UUID  `gorm:"column:channel_id;type:uuid"`
	Version      string     `gorm:"column:version"`
	BuildNumber  int        `gorm:"column:build_number"`
	Status       string     `gorm:"column:status"`
	Source       string     `gorm:"column:source"`
	ReleaseNotes *string    `gorm:"column:release_notes"`
	CreatedByID  *uuid.UUID `gorm:"column:created_by_id;type:uuid"`
	SubmittedAt  *time.Time `gorm:"column:submitted_at"`
	CreatedAt    time.Time  `gorm:"column:created_at"`
	UpdatedAt    time.Time  `gorm:"column:updated_at"`
}

func (BundleRelease) TableName() string { return "bundle_releases" }

type BundleArtifact struct {
	ID                uuid.UUID       `gorm:"column:id;type:uuid;primaryKey"`
	ReleaseID         uuid.UUID       `gorm:"column:release_id;type:uuid"`
	Kind              string          `gorm:"column:kind"`
	StorageProvider   string          `gorm:"column:storage_provider"`
	StorageBucket     string          `gorm:"column:storage_bucket"`
	StorageKey        string          `gorm:"column:storage_key"`
	ChecksumSHA256    string          `gorm:"column:checksum_sha256"`
	FileSize          int64           `gorm:"column:file_size"`
	ContentType       string          `gorm:"column:content_type"`
	BaseBuildNumber   *int            `gorm:"column:base_build_number"`
	TargetBuildNumber *int            `gorm:"column:target_build_number"`
	Metadata          json.RawMessage `gorm:"column:metadata;serializer:json"`
	CreatedAt         time.Time       `gorm:"column:created_at"`
}

func (BundleArtifact) TableName() string { return "bundle_artifacts" }

type BundleUserEntitlement struct {
	ID              uuid.UUID  `gorm:"column:id;type:uuid;primaryKey"`
	UserID          uuid.UUID  `gorm:"column:user_id;type:uuid"`
	BundleID        uuid.UUID  `gorm:"column:bundle_id;type:uuid"`
	EntitlementType string     `gorm:"column:entitlement_type"`
	ExpiresAt       *time.Time `gorm:"column:expires_at"`
	IsActive        bool       `gorm:"column:is_active"`
	CreatedAt       time.Time  `gorm:"column:created_at"`
	UpdatedAt       time.Time  `gorm:"column:updated_at"`
	RevokedAt       *time.Time `gorm:"column:revoked_at"`
	LastVerifiedAt  *time.Time `gorm:"column:last_verified_at"`
}

func (BundleUserEntitlement) TableName() string { return "bundle_user_entitlements" }

type BundleEntitlementLicense struct {
	ID             uuid.UUID      `gorm:"column:id;type:uuid;primaryKey"`
	EntitlementID  uuid.UUID      `gorm:"column:entitlement_id;type:uuid"`
	TokenPrefix    string         `gorm:"column:token_prefix"`
	TokenHash      string         `gorm:"column:token_hash"`
	DeviceLimit    int            `gorm:"column:device_limit"`
	DeviceIDs      pq.StringArray `gorm:"column:device_ids;type:text[]"`
	IsRevoked      bool           `gorm:"column:is_revoked"`
	GraceUntil     *time.Time     `gorm:"column:grace_until"`
	LastVerifiedAt *time.Time     `gorm:"column:last_verified_at"`
	CreatedAt      time.Time      `gorm:"column:created_at"`
	UpdatedAt      time.Time      `gorm:"column:updated_at"`
}

func (BundleEntitlementLicense) TableName() string { return "bundle_entitlement_licenses" }

type LepoShipIdempotencyKey struct {
	ID          uuid.UUID       `gorm:"column:id;type:uuid;primaryKey"`
	Scope       string          `gorm:"column:scope"`
	Key         string          `gorm:"column:key"`
	RequestHash string          `gorm:"column:request_hash"`
	Response    json.RawMessage `gorm:"column:response;serializer:json"`
	Status      string          `gorm:"column:status"`
	ExpiresAt   time.Time       `gorm:"column:expires_at"`
	CreatedAt   time.Time       `gorm:"column:created_at"`
	CompletedAt *time.Time      `gorm:"column:completed_at"`
}

func (LepoShipIdempotencyKey) TableName() string { return "lepoship_idempotency_keys" }

type BundleOutboxEvent struct {
	ID            uuid.UUID       `gorm:"column:id;type:uuid;primaryKey"`
	EventKey      string          `gorm:"column:event_key"`
	AggregateType string          `gorm:"column:aggregate_type"`
	AggregateID   string          `gorm:"column:aggregate_id"`
	EventType     string          `gorm:"column:event_type"`
	Payload       json.RawMessage `gorm:"column:payload;serializer:json"`
	Status        string          `gorm:"column:status"`
	Attempts      int             `gorm:"column:attempts"`
	NextAttemptAt *time.Time      `gorm:"column:next_attempt_at"`
	ProcessedAt   *time.Time      `gorm:"column:processed_at"`
	LastError     *string         `gorm:"column:last_error"`
	LeaseOwner    *string         `gorm:"column:lease_owner"`
	LeasedUntil   *time.Time      `gorm:"column:leased_until"`
	CreatedAt     time.Time       `gorm:"column:created_at"`
}

func (BundleOutboxEvent) TableName() string { return "bundle_outbox_events" }

type DBLike interface {
	WithContext(ctx interface{}) *gorm.DB
}
