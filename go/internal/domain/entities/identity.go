package entities

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents a user record in the system.
type User struct {
	ID           uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Username     string         `json:"username" gorm:"type:varchar(100);not null;uniqueIndex"`
	Email        string         `json:"email" gorm:"type:varchar(255);not null;uniqueIndex"`
	PasswordHash string         `json:"-" gorm:"type:varchar(255);not null"`
	Status       UserStatus     `json:"status" gorm:"type:user_status;not null;default:active"`
	CreatedAt    time.Time      `json:"created_at" gorm:"not null;default:now()"`
	UpdatedAt    time.Time      `json:"updated_at" gorm:"not null;default:now()"`
	DeletedAt    gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// TableName overrides the default table name for User.
func (User) TableName() string {
	return "users"
}

// UserProfile represents secondary metadata associated with a user.
type UserProfile struct {
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;primaryKey"`
	FullName  *string   `json:"full_name" gorm:"type:varchar(255)"`
	Timezone  string    `json:"timezone" gorm:"type:varchar(50);not null;default:UTC"`
	UpdatedAt time.Time `json:"updated_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for UserProfile.
func (UserProfile) TableName() string {
	return "user_profiles"
}

// Role represents system authorisation templates.
type Role struct {
	ID          string    `json:"id" gorm:"type:varchar(50);primaryKey"`
	Description *string   `json:"description" gorm:"type:text"`
	CreatedAt   time.Time `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for Role.
func (Role) TableName() string {
	return "roles"
}

// UserRole maps users to authorizations.
type UserRole struct {
	UserID uuid.UUID `json:"user_id" gorm:"type:uuid;primaryKey"`
	RoleID string    `json:"role_id" gorm:"type:varchar(50);primaryKey"`
}

// TableName overrides the default table name for UserRole.
func (UserRole) TableName() string {
	return "user_roles"
}

// RolePermission holds granular permissions assigned to roles.
type RolePermission struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	RoleID     string    `json:"role_id" gorm:"type:varchar(50);not null"`
	Permission string    `json:"permission" gorm:"type:varchar(100);not null"`
}

// TableName overrides the default table name for RolePermission.
func (RolePermission) TableName() string {
	return "role_permissions"
}

// ApiClient represents an external program authorized to interact with the API.
type ApiClient struct {
	ID           uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name         string         `json:"name" gorm:"type:varchar(100);not null"`
	ClientStatus string         `json:"client_status" gorm:"type:varchar(50);not null;default:active"`
	CreatedAt    time.Time      `json:"created_at" gorm:"not null;default:now()"`
	DeletedAt    gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// TableName overrides the default table name for ApiClient.
func (ApiClient) TableName() string {
	return "api_clients"
}

// ApiClientKey holds API keys and secret hashes for external programs.
type ApiClientKey struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ClientID       uuid.UUID `json:"client_id" gorm:"type:uuid;not null"`
	ApiKey         string    `json:"api_key" gorm:"type:varchar(255);not null;uniqueIndex"`
	ApiSecretHash  string    `json:"-" gorm:"type:varchar(255);not null"`
	CreatedAt      time.Time `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for ApiClientKey.
func (ApiClientKey) TableName() string {
	return "api_client_keys"
}

// ApiClientScope holds scopes assigned to API clients.
type ApiClientScope struct {
	ID       uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ClientID uuid.UUID `json:"client_id" gorm:"type:uuid;not null"`
	Scope    string    `json:"scope" gorm:"type:varchar(100);not null"`
}

// TableName overrides the default table name for ApiClientScope.
func (ApiClientScope) TableName() string {
	return "api_client_scopes"
}

// Session represents user sessions.
type Session struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
	TokenHash string    `json:"-" gorm:"type:varchar(255);not null;uniqueIndex"`
	IPAddress *string   `json:"ip_address" gorm:"type:varchar(45)"`
	UserAgent *string   `json:"user_agent" gorm:"type:text"`
	IsValid   bool      `json:"is_valid" gorm:"not null;default:true"`
	CreatedAt time.Time `json:"created_at" gorm:"not null;default:now()"`
	ExpiresAt time.Time `json:"expires_at" gorm:"not null"`
}

// TableName overrides the default table name for Session.
func (Session) TableName() string {
	return "sessions"
}

// Device holds trusted devices.
type Device struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID            uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
	DeviceFingerprint string    `json:"device_fingerprint" gorm:"type:varchar(255);not null"`
	DeviceName        *string   `json:"device_name" gorm:"type:varchar(255)"`
	IsTrusted         bool      `json:"is_trusted" gorm:"not null;default:false"`
	CreatedAt         time.Time `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for Device.
func (Device) TableName() string {
	return "devices"
}

// DeviceSession maps sessions to devices.
type DeviceSession struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	DeviceID  uuid.UUID `json:"device_id" gorm:"type:uuid;not null"`
	SessionID uuid.UUID `json:"session_id" gorm:"type:uuid;not null"`
}

// TableName overrides the default table name for DeviceSession.
func (DeviceSession) TableName() string {
	return "device_sessions"
}

// RefreshToken represents session refresh tokens.
type RefreshToken struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SessionID uuid.UUID `json:"session_id" gorm:"type:uuid;not null"`
	TokenHash string    `json:"-" gorm:"type:varchar(255);not null;uniqueIndex"`
	IsRevoked bool      `json:"is_revoked" gorm:"not null;default:false"`
	CreatedAt time.Time `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for RefreshToken.
func (RefreshToken) TableName() string {
	return "refresh_tokens"
}

// IdempotencyKey prevents duplicate operations.
type IdempotencyKey struct {
	ShardKey       uuid.UUID `json:"shard_key" gorm:"type:uuid;primaryKey"`
	Key            string    `json:"key" gorm:"type:varchar(255);primaryKey"`
	Endpoint       string    `json:"endpoint" gorm:"type:varchar(255);not null"`
	RequestHash    string    `json:"request_hash" gorm:"type:varchar(64);not null"`
	Status         string    `json:"status" gorm:"type:varchar(50);not null;default:locked"`
	ResponseStatus *int      `json:"response_status"`
	ResponseBody   *string   `json:"response_body" gorm:"type:text"`
	CreatedAt      time.Time `json:"created_at" gorm:"not null;default:now()"`
	ExpiresAt      time.Time `json:"expires_at" gorm:"not null"`
	LockedUntil    time.Time `json:"locked_until" gorm:"not null"`
}

// TableName overrides the default table name for IdempotencyKey.
func (IdempotencyKey) TableName() string {
	return "idempotency_keys"
}
