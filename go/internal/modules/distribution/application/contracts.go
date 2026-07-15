package application

import (
	"context"
	"io"
	"time"

	"github.com/google/uuid"
)

type Repository interface {
	AuthenticateSDKToken(ctx context.Context, token string, requiredScope string) (*SDKIdentity, error)
	IngestTelemetry(ctx context.Context, identity SDKIdentity, payload TelemetryPayload, ip string) (TelemetryResult, error)
	CheckOTA(ctx context.Context, identity SDKIdentity, req OTACheckRequest) (OTACheckResponse, error)
	CreateReleaseUpload(ctx context.Context, req ReleaseUploadRequest, file io.Reader, size int64) (ReleaseUploadResponse, error)
	IssueLicense(ctx context.Context, req LicenseIssueRequest) (LicenseIssueResponse, error)
	VerifyLicense(ctx context.Context, identity SDKIdentity, req LicenseVerifyRequest) (LicenseVerifyResponse, error)
	RunCronJob(ctx context.Context, name string) (CronJobResult, error)
	RunCronJobWithTrigger(ctx context.Context, name string, trigger string) (CronJobResult, error)
	ListCronJobStatus(ctx context.Context) (CronJobStatusResponse, error)
}

type CronRunner interface {
	RunCronJob(context.Context, string) (CronJobResult, error)
}

type DistributedLock interface {
	Acquire(context.Context, string, string, time.Duration) (func(), bool, error)
}

type SDKIdentity struct {
	BundleID uuid.UUID `json:"bundleId"`
	TokenID  uuid.UUID `json:"tokenId"`
	Scopes   []string  `json:"scopes"`
}

type TelemetryPayload struct {
	Analytics []TelemetryEvent `json:"analytics"`
	Installs  []InstallEvent   `json:"installs"`
	Crashes   []TelemetryEvent `json:"crashes"`
}

type TelemetryEvent struct {
	ClientEventID string         `json:"clientEventId"`
	EventType     string         `json:"eventType"`
	SessionID     string         `json:"sessionId"`
	DeviceID      string         `json:"deviceId"`
	BundleVersion string         `json:"bundleVersion"`
	Platform      string         `json:"platform"`
	Timestamp     string         `json:"timestamp"`
	EventData     map[string]any `json:"eventData"`
}

type InstallEvent struct {
	ClientEventID string `json:"clientEventId"`
	EventType     string `json:"eventType"`
	DeviceID      string `json:"deviceId"`
	Platform      string `json:"platform"`
	OSVersion     string `json:"osVersion"`
	BundleVersion string `json:"bundleVersion"`
	CountryCode   string `json:"countryCode"`
	Timestamp     string `json:"timestamp"`
}

type TelemetryResult struct {
	Accepted   bool `json:"accepted"`
	Analytics  int  `json:"analytics"`
	Installs   int  `json:"installs"`
	Crashes    int  `json:"crashes"`
	Duplicates int  `json:"duplicates"`
}

type OTACheckRequest struct {
	ProjectID          string `form:"projectId"`
	BundleID           string `form:"bundleId"`
	CurrentBuildNumber int    `form:"currentBuildNumber"`
	DeviceID           string `form:"deviceId"`
	Platform           string `form:"platform"`
	Locale             string `form:"locale"`
}

type OTACheckResponse struct {
	UpdateAvailable bool           `json:"updateAvailable"`
	LatestRelease   *OTALatest     `json:"latestRelease,omitempty"`
	RuntimeConfig   map[string]any `json:"runtimeConfig,omitempty"`
	Status          string         `json:"status,omitempty"`
}

type OTALatest struct {
	Version      string `json:"version"`
	BuildNumber  int    `json:"buildNumber"`
	Track        string `json:"track"`
	DownloadURL  string `json:"downloadUrl"`
	Checksum     string `json:"checksumSha256"`
	ReleaseNotes string `json:"releaseNotes,omitempty"`
}

type ReleaseUploadRequest struct {
	UserID         uuid.UUID
	BundleID       uuid.UUID
	Version        string
	BuildNumber    int
	Channel        string
	ReleaseNotes   string
	IdempotencyKey string
	ChecksumSHA256 string
	FileName       string
	ContentType    string
}

type ReleaseUploadResponse struct {
	Accepted   bool      `json:"accepted"`
	ReleaseID  uuid.UUID `json:"releaseId"`
	ArtifactID uuid.UUID `json:"artifactId"`
	Status     string    `json:"status"`
}

type LicenseIssueRequest struct {
	UserID          uuid.UUID
	BundleID        uuid.UUID
	EntitlementType string
	DeviceLimit     int
}

type LicenseIssueResponse struct {
	LicenseKey  string `json:"licenseKey"`
	TokenPrefix string `json:"tokenPrefix"`
	GraceDays   int    `json:"graceDays"`
}

type LicenseVerifyRequest struct {
	LicenseKey string `json:"licenseKey"`
	DeviceID   string `json:"deviceId"`
	Platform   string `json:"platform"`
}

type LicenseVerifyResponse struct {
	Valid         bool   `json:"valid"`
	BundleID      string `json:"bundleId,omitempty"`
	EntitlementID string `json:"entitlementId,omitempty"`
	OfflineToken  string `json:"offlineToken,omitempty"`
	Reason        string `json:"reason,omitempty"`
}

type CronJobResult struct {
	Job       string `json:"job"`
	Processed int64  `json:"processed"`
	Skipped   int64  `json:"skipped"`
	Message   string `json:"message"`
}

type CronJobStatusResponse struct {
	Jobs       []CronJobStatus `json:"jobs"`
	RecentRuns []CronJobRun    `json:"recentRuns"`
}

type CronJobStatus struct {
	Job       string      `json:"job"`
	Schedule  string      `json:"schedule"`
	Enabled   bool        `json:"enabled"`
	NextRunAt *time.Time  `json:"nextRunAt,omitempty"`
	LatestRun *CronJobRun `json:"latestRun,omitempty"`
}

type CronJobRun struct {
	ID         uuid.UUID  `json:"id"`
	Job        string     `json:"job"`
	Status     string     `json:"status"`
	Processed  int64      `json:"processed"`
	Skipped    int64      `json:"skipped"`
	Message    string     `json:"message"`
	Error      string     `json:"error,omitempty"`
	StartedAt  time.Time  `json:"startedAt"`
	FinishedAt *time.Time `json:"finishedAt,omitempty"`
	DurationMS int64      `json:"durationMs"`
	Trigger    string     `json:"trigger"`
}
