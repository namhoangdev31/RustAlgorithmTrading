package postgres

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"path"
	"slices"
	"strings"
	"time"

	"entgo.io/ent/dialect/sql"
	"github.com/google/uuid"
	"github.com/lib/pq"

	entdb "trading/control-gateway/internal/data/ent"
	"trading/control-gateway/internal/data/ent/bundleanalyticsevents"
	"trading/control-gateway/internal/data/ent/bundleartifacts"
	"trading/control-gateway/internal/data/ent/bundlechannels"
	"trading/control-gateway/internal/data/ent/bundleentitlementlicenses"
	"trading/control-gateway/internal/data/ent/bundleinstallevents"
	"trading/control-gateway/internal/data/ent/bundlereleases"
	"trading/control-gateway/internal/data/ent/bundlesdktokens"
	"trading/control-gateway/internal/data/ent/bundleuserentitlements"
	entschema "trading/control-gateway/internal/data/ent/schema"
	"trading/control-gateway/internal/modules/distribution/application"
	"trading/control-gateway/internal/shared/apperror"
)

const (
	sdkTokenPrefix = "lp_sdk_"
	licensePrefix  = "lp_license_"
)

type Repository struct {
	client *entdb.Client
	config Config
}

type Config struct {
	DevicePepper        string
	EncryptionKey       string
	ArtifactBucket      string
	ArtifactProvider    string
	ArtifactPublicURL   string
	PreviewCleanupURL   string
	PreviewCleanupToken string
	CleanupDBOnly       bool
	StorageSyncURL      string
	StorageSyncToken    string
	SSLRenewalURL       string
	SSLRenewalToken     string
	SchedulerEnabled    bool
	Schedules           map[string]string
}

func New(client *entdb.Client, config Config) (*Repository, error) {
	if client == nil {
		return nil, apperror.WithMessage(apperror.ErrUnavailable, "distribution database is not configured")
	}
	if config.ArtifactBucket == "" {
		config.ArtifactBucket = "lepoship-artifacts"
	}
	if config.ArtifactProvider == "" {
		config.ArtifactProvider = "s3"
	}
	return &Repository{client: client, config: config}, nil
}

func (r *Repository) AuthenticateSDKToken(ctx context.Context, token string, requiredScope string) (*application.SDKIdentity, error) {
	if !strings.HasPrefix(token, sdkTokenPrefix) || len(token) <= len(sdkTokenPrefix)+8 {
		return nil, apperror.ErrUnauthorized
	}
	tokenPrefix := token[len(sdkTokenPrefix) : len(sdkTokenPrefix)+8]
	hash := sha256Hex(token)

	row, err := r.client.BundleSDKTokens.Query().Where(bundlesdktokens.TokenPrefixEQ(tokenPrefix), bundlesdktokens.TokenHashEQ(hash)).Only(ctx)
	if entdb.IsNotFound(err) {
		return nil, apperror.ErrUnauthorized
	}
	if err != nil {
		return nil, fmt.Errorf("authenticate sdk token: %w", err)
	}
	now := time.Now().UTC()
	if row.IsRevoked {
		return nil, apperror.ErrUnauthorized
	}
	if row.ExpiresAt != nil && row.ExpiresAt.Before(now) && (row.RotationGraceUntil == nil || row.RotationGraceUntil.Before(now)) {
		return nil, apperror.ErrUnauthorized
	}
	scopes := []string(row.Scopes)
	if requiredScope != "" && !slices.Contains(scopes, requiredScope) {
		return nil, apperror.ErrForbidden
	}
	_, _ = row.Update().SetLastUsedAt(now).Save(ctx)
	return &application.SDKIdentity{BundleID: row.BundleId, TokenID: row.ID, Scopes: scopes}, nil
}

func (r *Repository) IngestTelemetry(ctx context.Context, identity application.SDKIdentity, payload application.TelemetryPayload, ip string) (application.TelemetryResult, error) {
	if len(payload.Analytics) > 100 || len(payload.Installs) > 100 || len(payload.Crashes) > 100 {
		return application.TelemetryResult{}, fmt.Errorf("%w: telemetry collection exceeds 100 events", apperror.ErrInvalidArgument)
	}
	result := application.TelemetryResult{Accepted: true}
	now := time.Now().UTC()
	pepper := r.config.DevicePepper

	tx, err := r.client.Tx(ctx)
	if err != nil {
		return application.TelemetryResult{}, fmt.Errorf("begin telemetry transaction: %w", err)
	}
	rollback := true
	defer func() {
		if rollback {
			_ = tx.Rollback()
		}
	}()
	insertTelemetry := func(event application.TelemetryEvent) (bool, error) {
		if event.EventType == "" {
			return false, fmt.Errorf("%w: eventType is required", apperror.ErrInvalidArgument)
		}
		eventData, err := json.Marshal(event.EventData)
		if err != nil {
			return false, fmt.Errorf("marshal telemetry data: %w", err)
		}
		proposedID := uuid.New()
		clientID := optionalString(event.ClientEventID)
		builder := tx.BundleAnalyticsEvents.Create().
			SetID(proposedID).
			SetBundleId(identity.BundleID).
			SetNillableSessionId(optionalString(event.SessionID)).
			SetEventType(event.EventType).
			SetEventData(string(eventData)).
			SetNillablePlatformVersion(optionalString(event.Platform)).
			SetNillableBundleVersion(optionalString(event.BundleVersion)).
			SetNillableIpAddress(optionalString(ip)).
			SetNillableDeviceFingerprint(optionalString(deviceFingerprint(event.DeviceID, pepper))).
			SetNillableClientEventId(clientID).
			SetCreatedAt(eventTime(event.Timestamp, now))
		if clientID == nil {
			if _, err := builder.Save(ctx); err != nil {
				return false, fmt.Errorf("insert analytics event: %w", err)
			}
			return true, nil
		}
		id, err := builder.OnConflictColumns(bundleanalyticsevents.FieldClientEventId).
			Update(func(upsert *entdb.BundleAnalyticsEventsUpsert) { upsert.SetClientEventId(*clientID) }).ID(ctx)
		if err != nil {
			return false, fmt.Errorf("insert analytics event: %w", err)
		}
		return id == proposedID, nil
	}
	for _, event := range payload.Analytics {
		inserted, err := insertTelemetry(event)
		if err != nil {
			return application.TelemetryResult{}, err
		}
		if inserted {
			result.Analytics++
		} else {
			result.Duplicates++
		}
	}
	for _, event := range payload.Crashes {
		inserted, err := insertTelemetry(event)
		if err != nil {
			return application.TelemetryResult{}, err
		}
		if inserted {
			result.Crashes++
		} else {
			result.Duplicates++
		}
	}
	for _, event := range payload.Installs {
		proposedID := uuid.New()
		clientID := optionalString(event.ClientEventID)
		builder := tx.BundleInstallEvents.Create().
			SetID(proposedID).
			SetBundleId(identity.BundleID).
			SetEventType(coalesce(event.EventType, "install")).
			SetNillableDeviceId(optionalString(event.DeviceID)).
			SetNillableDeviceFingerprint(optionalString(deviceFingerprint(event.DeviceID, pepper))).
			SetNillableClientEventId(clientID).
			SetNillablePlatform(optionalString(event.Platform)).
			SetNillableOsVersion(optionalString(event.OSVersion)).
			SetNillableBundleVersion(optionalString(event.BundleVersion)).
			SetNillableCountryCode(optionalString(event.CountryCode)).
			SetCreatedAt(eventTime(event.Timestamp, now))
		inserted := true
		if clientID == nil {
			if _, err := builder.Save(ctx); err != nil {
				return application.TelemetryResult{}, fmt.Errorf("insert install event: %w", err)
			}
		} else {
			id, err := builder.OnConflictColumns(bundleinstallevents.FieldClientEventId).
				Update(func(upsert *entdb.BundleInstallEventsUpsert) { upsert.SetClientEventId(*clientID) }).ID(ctx)
			if err != nil {
				return application.TelemetryResult{}, fmt.Errorf("insert install event: %w", err)
			}
			inserted = id == proposedID
		}
		if inserted {
			result.Installs++
		} else {
			result.Duplicates++
		}
	}
	if err := tx.Commit(); err != nil {
		return application.TelemetryResult{}, fmt.Errorf("commit telemetry transaction: %w", err)
	}
	rollback = false
	return result, nil
}

func (r *Repository) CheckOTA(ctx context.Context, identity application.SDKIdentity, req application.OTACheckRequest) (application.OTACheckResponse, error) {
	if req.CurrentBuildNumber < 0 || req.DeviceID == "" || len(req.DeviceID) > 128 {
		return application.OTACheckResponse{}, fmt.Errorf("%w: invalid OTA request", apperror.ErrInvalidArgument)
	}
	channel, err := r.client.BundleChannels.Query().Where(
		bundlechannels.BundleIdEQ(identity.BundleID),
		bundlechannels.NameEQ("production"),
		bundlechannels.IsActiveEQ(true),
	).Only(ctx)
	if entdb.IsNotFound(err) {
		return application.OTACheckResponse{UpdateAvailable: false, Status: "no_published_release"}, nil
	}
	if err != nil {
		return application.OTACheckResponse{}, fmt.Errorf("load production channel: %w", err)
	}
	if channel.CurrentReleaseId == nil {
		return application.OTACheckResponse{UpdateAvailable: false, Status: "no_published_release"}, nil
	}
	release, err := r.client.BundleReleases.Query().Where(
		bundlereleases.IDEQ(*channel.CurrentReleaseId),
		bundlereleases.StatusEQ(entschema.BundleReleaseStatusActive),
	).Only(ctx)
	if err != nil {
		if entdb.IsNotFound(err) {
			return application.OTACheckResponse{UpdateAvailable: false, Status: "no_published_release"}, nil
		}
		return application.OTACheckResponse{}, fmt.Errorf("load current release: %w", err)
	}
	if release.BuildNumber <= req.CurrentBuildNumber {
		return application.OTACheckResponse{UpdateAvailable: false, Status: "current"}, nil
	}
	artifact, err := r.client.BundleArtifacts.Query().Where(
		bundleartifacts.ReleaseIdEQ(release.ID),
		bundleartifacts.KindEQ(entschema.BundleArtifactKindFull),
	).Order(bundleartifacts.ByCreatedAt(sql.OrderDesc())).First(ctx)
	if entdb.IsNotFound(err) {
		return application.OTACheckResponse{}, fmt.Errorf("%w: release artifact missing", apperror.ErrNotFound)
	}
	if err != nil {
		return application.OTACheckResponse{}, fmt.Errorf("load artifact: %w", err)
	}
	return application.OTACheckResponse{
		UpdateAvailable: true,
		LatestRelease: &application.OTALatest{
			Version:      release.Version,
			BuildNumber:  release.BuildNumber,
			Track:        channel.Name,
			DownloadURL:  r.artifactURL(artifact.StorageKey),
			Checksum:     artifact.ChecksumSha256,
			ReleaseNotes: stringValue(release.ReleaseNotes),
		},
		RuntimeConfig: map[string]any{},
		Status:        "update_available",
	}, nil
}

func (r *Repository) CreateReleaseUpload(ctx context.Context, req application.ReleaseUploadRequest, file io.Reader, size int64) (application.ReleaseUploadResponse, error) {
	if req.IdempotencyKey == "" || req.ChecksumSHA256 == "" || req.Version == "" || req.BuildNumber <= 0 {
		return application.ReleaseUploadResponse{}, fmt.Errorf("%w: missing upload metadata", apperror.ErrInvalidArgument)
	}
	if size > 512*1024*1024 {
		return application.ReleaseUploadResponse{}, fmt.Errorf("%w: file exceeds 512 MiB", apperror.ErrInvalidArgument)
	}
	if !strings.HasSuffix(req.FileName, ".zip") && !strings.HasSuffix(req.FileName, ".tar.gz") {
		return application.ReleaseUploadResponse{}, fmt.Errorf("%w: only .zip and .tar.gz are accepted", apperror.ErrInvalidArgument)
	}

	now := time.Now().UTC()
	releaseID := uuid.New()
	artifactID := uuid.New()
	bucket := r.config.ArtifactBucket
	provider := r.config.ArtifactProvider
	key := path.Join("bundles", req.BundleID.String(), req.Version, fmt.Sprintf("%d-%s", req.BuildNumber, req.FileName))

	hasher := sha256.New()
	written, err := io.Copy(io.Discard, io.TeeReader(file, hasher))
	if err != nil {
		return application.ReleaseUploadResponse{}, fmt.Errorf("stream release upload: %w", err)
	}
	if size >= 0 && written != size {
		return application.ReleaseUploadResponse{}, fmt.Errorf("%w: file size mismatch", apperror.ErrInvalidArgument)
	}
	actual := hex.EncodeToString(hasher.Sum(nil))
	if !strings.EqualFold(actual, req.ChecksumSHA256) {
		return application.ReleaseUploadResponse{}, fmt.Errorf("%w: checksum mismatch", apperror.ErrInvalidArgument)
	}

	tx, err := r.client.Tx(ctx)
	if err != nil {
		return application.ReleaseUploadResponse{}, fmt.Errorf("begin release upload transaction: %w", err)
	}
	rollback := true
	defer func() {
		if rollback {
			_ = tx.Rollback()
		}
	}()
	channelID, err := tx.BundleChannels.Create().
		SetID(uuid.New()).
		SetBundleId(req.BundleID).
		SetName(coalesce(req.Channel, "production")).
		SetIsActive(true).
		SetCreatedAt(now).
		SetUpdatedAt(now).
		OnConflictColumns(bundlechannels.FieldBundleId, bundlechannels.FieldName).
		Update(func(upsert *entdb.BundleChannelsUpsert) { upsert.SetUpdatedAt(now) }).ID(ctx)
	if err != nil {
		return application.ReleaseUploadResponse{}, fmt.Errorf("upsert channel: %w", err)
	}
	releaseID, err = tx.BundleReleases.Create().
		SetID(releaseID).
		SetBundleId(req.BundleID).
		SetChannelId(channelID).
		SetVersion(req.Version).
		SetBuildNumber(req.BuildNumber).
		SetStatus(entschema.BundleReleaseStatusQueued).
		SetSource("manual").
		SetNillableReleaseNotes(optionalString(req.ReleaseNotes)).
		SetCreatedById(req.UserID).
		SetSubmittedAt(now).
		SetCreatedAt(now).
		SetUpdatedAt(now).
		OnConflictColumns(bundlereleases.FieldBundleId, bundlereleases.FieldBuildNumber).
		Update(func(upsert *entdb.BundleReleasesUpsert) { upsert.SetUpdatedAt(now) }).ID(ctx)
	if err != nil {
		return application.ReleaseUploadResponse{}, fmt.Errorf("upsert release: %w", err)
	}
	artifactID, err = tx.BundleArtifacts.Create().
		SetID(artifactID).
		SetReleaseId(releaseID).
		SetKind(entschema.BundleArtifactKindFull).
		SetStorageProvider(provider).
		SetStorageBucket(bucket).
		SetStorageKey(key).
		SetChecksumSha256(actual).
		SetFileSize(written).
		SetContentType(coalesce(req.ContentType, "application/octet-stream")).
		SetCreatedAt(now).
		OnConflictColumns(bundleartifacts.FieldStorageProvider, bundleartifacts.FieldStorageBucket, bundleartifacts.FieldStorageKey).
		Update(func(upsert *entdb.BundleArtifactsUpsert) { upsert.SetChecksumSha256(actual) }).ID(ctx)
	if err != nil {
		return application.ReleaseUploadResponse{}, fmt.Errorf("upsert artifact: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return application.ReleaseUploadResponse{}, fmt.Errorf("commit release upload: %w", err)
	}
	rollback = false
	return application.ReleaseUploadResponse{Accepted: true, ReleaseID: releaseID, ArtifactID: artifactID, Status: "queued"}, nil
}

func (r *Repository) IssueLicense(ctx context.Context, req application.LicenseIssueRequest) (application.LicenseIssueResponse, error) {
	if req.DeviceLimit <= 0 {
		req.DeviceLimit = 3
	}
	token, err := randomToken(32)
	if err != nil {
		return application.LicenseIssueResponse{}, fmt.Errorf("generate license: %w", err)
	}
	licenseKey := licensePrefix + token
	tokenPrefix := token[:8]
	tokenHash := sha256Hex(licenseKey)
	now := time.Now().UTC()
	graceUntil := now.Add(7 * 24 * time.Hour)

	tx, err := r.client.Tx(ctx)
	if err != nil {
		return application.LicenseIssueResponse{}, fmt.Errorf("begin license issue transaction: %w", err)
	}
	rollback := true
	defer func() {
		if rollback {
			_ = tx.Rollback()
		}
	}()
	entitlementID, err := tx.BundleUserEntitlements.Create().
		SetID(uuid.New()).
		SetUserId(req.UserID).
		SetBundleId(req.BundleID).
		SetEntitlementType(coalesce(req.EntitlementType, "purchase")).
		SetIsActive(true).
		SetCreatedAt(now).
		SetUpdatedAt(now).
		OnConflictColumns(bundleuserentitlements.FieldUserId, bundleuserentitlements.FieldBundleId, bundleuserentitlements.FieldEntitlementType).
		Update(func(upsert *entdb.BundleUserEntitlementsUpsert) {
			upsert.SetIsActive(true).ClearRevokedAt().SetUpdatedAt(now)
		}).ID(ctx)
	if err != nil {
		return application.LicenseIssueResponse{}, fmt.Errorf("upsert entitlement: %w", err)
	}
	if _, err := tx.BundleEntitlementLicenses.Update().Where(
		bundleentitlementlicenses.EntitlementIdEQ(entitlementID),
		bundleentitlementlicenses.IsRevokedEQ(false),
	).SetIsRevoked(true).SetGraceUntil(graceUntil).SetUpdatedAt(now).Save(ctx); err != nil {
		return application.LicenseIssueResponse{}, fmt.Errorf("rotate licenses: %w", err)
	}
	if _, err := tx.BundleEntitlementLicenses.Create().
		SetID(uuid.New()).
		SetEntitlementId(entitlementID).
		SetTokenPrefix(tokenPrefix).
		SetTokenHash(tokenHash).
		SetDeviceLimit(req.DeviceLimit).
		SetDeviceIds(pq.StringArray{}).
		SetCreatedAt(now).
		SetUpdatedAt(now).
		Save(ctx); err != nil {
		return application.LicenseIssueResponse{}, fmt.Errorf("create license: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return application.LicenseIssueResponse{}, fmt.Errorf("commit license issue: %w", err)
	}
	rollback = false
	return application.LicenseIssueResponse{LicenseKey: licenseKey, TokenPrefix: tokenPrefix, GraceDays: 7}, nil
}

func (r *Repository) VerifyLicense(ctx context.Context, identity application.SDKIdentity, req application.LicenseVerifyRequest) (application.LicenseVerifyResponse, error) {
	if !strings.HasPrefix(req.LicenseKey, licensePrefix) || req.DeviceID == "" {
		return application.LicenseVerifyResponse{Valid: false, Reason: "invalid_request"}, nil
	}
	token := strings.TrimPrefix(req.LicenseKey, licensePrefix)
	if len(token) < 8 {
		return application.LicenseVerifyResponse{Valid: false, Reason: "invalid_license"}, nil
	}
	tokenPrefix := token[:8]
	tokenHash := sha256Hex(req.LicenseKey)
	now := time.Now().UTC()

	tx, err := r.client.Tx(ctx)
	if err != nil {
		return application.LicenseVerifyResponse{}, fmt.Errorf("begin license verification: %w", err)
	}
	rollback := true
	defer func() {
		if rollback {
			_ = tx.Rollback()
		}
	}()
	license, err := tx.BundleEntitlementLicenses.Query().Where(
		bundleentitlementlicenses.TokenPrefixEQ(tokenPrefix),
		bundleentitlementlicenses.TokenHashEQ(tokenHash),
	).ForUpdate().Only(ctx)
	if entdb.IsNotFound(err) {
		return application.LicenseVerifyResponse{Valid: false, Reason: "invalid_license"}, nil
	}
	if err != nil {
		return application.LicenseVerifyResponse{}, fmt.Errorf("load license: %w", err)
	}
	entitlement, err := tx.BundleUserEntitlements.Get(ctx, license.EntitlementId)
	if err != nil {
		return application.LicenseVerifyResponse{}, fmt.Errorf("load entitlement: %w", err)
	}
	if entitlement.BundleId != identity.BundleID {
		return application.LicenseVerifyResponse{Valid: false, Reason: "bundle_mismatch"}, nil
	}
	if !entitlement.IsActive || entitlement.RevokedAt != nil || (entitlement.ExpiresAt != nil && entitlement.ExpiresAt.Before(now)) {
		return application.LicenseVerifyResponse{Valid: false, Reason: "entitlement_inactive"}, nil
	}
	if license.IsRevoked && (license.GraceUntil == nil || license.GraceUntil.Before(now)) {
		return application.LicenseVerifyResponse{Valid: false, Reason: "license_revoked"}, nil
	}
	deviceHash := deviceFingerprint(req.DeviceID, r.config.DevicePepper)
	deviceIDs := []string(license.DeviceIds)
	if !slices.Contains(deviceIDs, deviceHash) {
		if len(deviceIDs) >= license.DeviceLimit {
			return application.LicenseVerifyResponse{Valid: false, Reason: "device_limit_exceeded"}, nil
		}
		deviceIDs = append(deviceIDs, deviceHash)
	}
	if _, err := license.Update().SetDeviceIds(pq.StringArray(deviceIDs)).SetLastVerifiedAt(now).SetUpdatedAt(now).Save(ctx); err != nil {
		return application.LicenseVerifyResponse{}, fmt.Errorf("update license verification: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return application.LicenseVerifyResponse{}, fmt.Errorf("commit license verification: %w", err)
	}
	rollback = false
	return application.LicenseVerifyResponse{
		Valid: true, BundleID: entitlement.BundleId.String(), EntitlementID: entitlement.ID.String(),
		OfflineToken: r.offlineToken(entitlement.ID.String(), req.DeviceID),
	}, nil
}
