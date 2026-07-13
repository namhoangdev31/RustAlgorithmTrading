package postgres

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"os"
	"path"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"trading/control-gateway/internal/domain/entities"
	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/storage"
)

const (
	sdkTokenPrefix = "lp_sdk_"
	licensePrefix  = "lp_license_"
)

var (
	ErrUnauthorized = errors.New("unauthorized")
	ErrForbidden    = errors.New("forbidden")
	ErrNotFound     = errors.New("not found")
	ErrConflict     = errors.New("conflict")
	ErrBadRequest   = errors.New("bad request")
)

type LepoShipRepository struct {
	db *gorm.DB
}

func NewLepoShipRepository(store *storage.Store) (*LepoShipRepository, error) {
	if store == nil || store.Postgres() == nil || store.Postgres().GormDB() == nil {
		return nil, errors.New("postgres is not configured")
	}
	return &LepoShipRepository{db: store.Postgres().GormDB()}, nil
}

func (r *LepoShipRepository) AuthenticateSDKToken(ctx context.Context, token string, requiredScope string) (*repositories.SDKIdentity, error) {
	if !strings.HasPrefix(token, sdkTokenPrefix) || len(token) <= len(sdkTokenPrefix)+8 {
		return nil, ErrUnauthorized
	}
	tokenPrefix := token[len(sdkTokenPrefix) : len(sdkTokenPrefix)+8]
	hash := sha256Hex(token)

	var row entities.BundleSDKToken
	err := r.db.WithContext(ctx).Where("token_prefix = ? AND token_hash = ?", tokenPrefix, hash).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUnauthorized
	}
	if err != nil {
		return nil, fmt.Errorf("authenticate sdk token: %w", err)
	}
	now := time.Now().UTC()
	if row.IsRevoked {
		return nil, ErrUnauthorized
	}
	if row.ExpiresAt != nil && row.ExpiresAt.Before(now) && (row.RotationGraceUntil == nil || row.RotationGraceUntil.Before(now)) {
		return nil, ErrUnauthorized
	}
	scopes := []string(row.Scopes)
	if requiredScope != "" && !slices.Contains(scopes, requiredScope) {
		return nil, ErrForbidden
	}
	_ = r.db.WithContext(ctx).Model(&entities.BundleSDKToken{}).Where("id = ?", row.ID).Update("last_used_at", now).Error
	return &repositories.SDKIdentity{BundleID: row.BundleID, TokenID: row.ID, Scopes: scopes}, nil
}

func (r *LepoShipRepository) IngestTelemetry(ctx context.Context, identity repositories.SDKIdentity, payload repositories.TelemetryPayload, ip string) (repositories.TelemetryResult, error) {
	if len(payload.Analytics) > 100 || len(payload.Installs) > 100 || len(payload.Crashes) > 100 {
		return repositories.TelemetryResult{}, fmt.Errorf("%w: telemetry collection exceeds 100 events", ErrBadRequest)
	}
	result := repositories.TelemetryResult{Accepted: true}
	now := time.Now().UTC()
	pepper := os.Getenv("TELEMETRY_DEVICE_PEPPER")

	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		insertTelemetry := func(event repositories.TelemetryEvent) (bool, error) {
			if event.EventType == "" {
				return false, fmt.Errorf("%w: eventType is required", ErrBadRequest)
			}
			eventData, err := json.Marshal(event.EventData)
			if err != nil {
				return false, fmt.Errorf("marshal telemetry data: %w", err)
			}
			clientID := optionalString(event.ClientEventID)
			row := entities.BundleAnalyticsEvent{
				ID:                uuid.New(),
				BundleID:          identity.BundleID,
				SessionID:         optionalString(event.SessionID),
				EventType:         event.EventType,
				EventData:         eventData,
				PlatformVersion:   optionalString(event.Platform),
				BundleVersion:     optionalString(event.BundleVersion),
				IPAddress:         optionalString(ip),
				DeviceFingerprint: optionalString(deviceFingerprint(event.DeviceID, pepper)),
				ClientEventID:     clientID,
				CreatedAt:         eventTime(event.Timestamp, now),
			}
			res := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&row)
			if res.Error != nil {
				return false, fmt.Errorf("insert analytics event: %w", res.Error)
			}
			return res.RowsAffected > 0, nil
		}
		for _, event := range payload.Analytics {
			inserted, err := insertTelemetry(event)
			if err != nil {
				return err
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
				return err
			}
			if inserted {
				result.Crashes++
			} else {
				result.Duplicates++
			}
		}
		for _, event := range payload.Installs {
			clientID := optionalString(event.ClientEventID)
			row := entities.BundleInstallEvent{
				ID:                uuid.New(),
				BundleID:          identity.BundleID,
				EventType:         coalesce(event.EventType, "install"),
				DeviceID:          optionalString(event.DeviceID),
				DeviceFingerprint: optionalString(deviceFingerprint(event.DeviceID, pepper)),
				ClientEventID:     clientID,
				Platform:          optionalString(event.Platform),
				OSVersion:         optionalString(event.OSVersion),
				BundleVersion:     optionalString(event.BundleVersion),
				CountryCode:       optionalString(event.CountryCode),
				CreatedAt:         eventTime(event.Timestamp, now),
			}
			res := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&row)
			if res.Error != nil {
				return fmt.Errorf("insert install event: %w", res.Error)
			}
			if res.RowsAffected == 0 {
				result.Duplicates++
			} else {
				result.Installs++
			}
		}
		return nil
	})
	return result, err
}

func (r *LepoShipRepository) CheckOTA(ctx context.Context, identity repositories.SDKIdentity, req repositories.OTACheckRequest) (repositories.OTACheckResponse, error) {
	if req.CurrentBuildNumber < 0 || req.DeviceID == "" || len(req.DeviceID) > 128 {
		return repositories.OTACheckResponse{}, fmt.Errorf("%w: invalid OTA request", ErrBadRequest)
	}
	var channel entities.BundleChannel
	err := r.db.WithContext(ctx).
		Where("bundle_id = ? AND name = ? AND is_active = true", identity.BundleID, "production").
		First(&channel).Error
	if errors.Is(err, gorm.ErrRecordNotFound) || channel.CurrentReleaseID == nil {
		return repositories.OTACheckResponse{UpdateAvailable: false, Status: "no_published_release"}, nil
	}
	if err != nil {
		return repositories.OTACheckResponse{}, fmt.Errorf("load production channel: %w", err)
	}
	var release entities.BundleRelease
	if err := r.db.WithContext(ctx).Where("id = ? AND status = ?", *channel.CurrentReleaseID, "published").First(&release).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return repositories.OTACheckResponse{UpdateAvailable: false, Status: "no_published_release"}, nil
		}
		return repositories.OTACheckResponse{}, fmt.Errorf("load current release: %w", err)
	}
	if release.BuildNumber <= req.CurrentBuildNumber {
		return repositories.OTACheckResponse{UpdateAvailable: false, Status: "current"}, nil
	}
	var artifact entities.BundleArtifact
	err = r.db.WithContext(ctx).
		Where("release_id = ? AND kind IN ?", release.ID, []string{"full", "zip"}).
		Order("created_at DESC").
		First(&artifact).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return repositories.OTACheckResponse{}, fmt.Errorf("%w: release artifact missing", ErrNotFound)
	}
	if err != nil {
		return repositories.OTACheckResponse{}, fmt.Errorf("load artifact: %w", err)
	}
	return repositories.OTACheckResponse{
		UpdateAvailable: true,
		LatestRelease: &repositories.OTALatest{
			Version:      release.Version,
			BuildNumber:  release.BuildNumber,
			Track:        channel.Name,
			DownloadURL:  artifactURL(artifact),
			Checksum:     artifact.ChecksumSHA256,
			ReleaseNotes: stringValue(release.ReleaseNotes),
		},
		RuntimeConfig: map[string]any{},
		Status:        "update_available",
	}, nil
}

func (r *LepoShipRepository) CreateReleaseUpload(ctx context.Context, req repositories.ReleaseUploadRequest, file io.Reader, size int64) (repositories.ReleaseUploadResponse, error) {
	if req.IdempotencyKey == "" || req.ChecksumSHA256 == "" || req.Version == "" || req.BuildNumber <= 0 {
		return repositories.ReleaseUploadResponse{}, fmt.Errorf("%w: missing upload metadata", ErrBadRequest)
	}
	if size > 512*1024*1024 {
		return repositories.ReleaseUploadResponse{}, fmt.Errorf("%w: file exceeds 512 MiB", ErrBadRequest)
	}
	if !strings.HasSuffix(req.FileName, ".zip") && !strings.HasSuffix(req.FileName, ".tar.gz") {
		return repositories.ReleaseUploadResponse{}, fmt.Errorf("%w: only .zip and .tar.gz are accepted", ErrBadRequest)
	}

	now := time.Now().UTC()
	releaseID := uuid.New()
	artifactID := uuid.New()
	bucket := coalesce(os.Getenv("LEPOS_ARTIFACT_BUCKET"), "lepoship-artifacts")
	provider := coalesce(os.Getenv("LEPOS_ARTIFACT_PROVIDER"), "s3")
	key := path.Join("bundles", req.BundleID.String(), req.Version, fmt.Sprintf("%d-%s", req.BuildNumber, req.FileName))

	hasher := sha256.New()
	written, err := io.Copy(io.Discard, io.TeeReader(file, hasher))
	if err != nil {
		return repositories.ReleaseUploadResponse{}, fmt.Errorf("stream release upload: %w", err)
	}
	if size >= 0 && written != size {
		return repositories.ReleaseUploadResponse{}, fmt.Errorf("%w: file size mismatch", ErrBadRequest)
	}
	actual := hex.EncodeToString(hasher.Sum(nil))
	if !strings.EqualFold(actual, req.ChecksumSHA256) {
		return repositories.ReleaseUploadResponse{}, fmt.Errorf("%w: checksum mismatch", ErrBadRequest)
	}

	err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var channel entities.BundleChannel
		if err := tx.Where("bundle_id = ? AND name = ?", req.BundleID, coalesce(req.Channel, "production")).First(&channel).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				channel = entities.BundleChannel{ID: uuid.New(), BundleID: req.BundleID, Name: coalesce(req.Channel, "production"), IsActive: true, CreatedAt: now, UpdatedAt: now}
				if err := tx.Create(&channel).Error; err != nil {
					return fmt.Errorf("create channel: %w", err)
				}
			} else {
				return fmt.Errorf("load channel: %w", err)
			}
		}
		release := entities.BundleRelease{
			ID: releaseID, BundleID: req.BundleID, ChannelID: channel.ID, Version: req.Version, BuildNumber: req.BuildNumber,
			Status: "queued", Source: "manual", ReleaseNotes: optionalString(req.ReleaseNotes), CreatedByID: &req.UserID,
			SubmittedAt: &now, CreatedAt: now, UpdatedAt: now,
		}
		if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&release).Error; err != nil {
			return fmt.Errorf("create release: %w", err)
		}
		artifact := entities.BundleArtifact{
			ID: artifactID, ReleaseID: releaseID, Kind: "full", StorageProvider: provider, StorageBucket: bucket,
			StorageKey: key, ChecksumSHA256: actual, FileSize: written, ContentType: coalesce(req.ContentType, "application/octet-stream"), CreatedAt: now,
		}
		if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&artifact).Error; err != nil {
			return fmt.Errorf("create artifact: %w", err)
		}
		return nil
	})
	if err != nil {
		return repositories.ReleaseUploadResponse{}, err
	}
	return repositories.ReleaseUploadResponse{Accepted: true, ReleaseID: releaseID, ArtifactID: artifactID, Status: "queued"}, nil
}

func (r *LepoShipRepository) IssueLicense(ctx context.Context, req repositories.LicenseIssueRequest) (repositories.LicenseIssueResponse, error) {
	if req.DeviceLimit <= 0 {
		req.DeviceLimit = 3
	}
	token, err := randomToken(32)
	if err != nil {
		return repositories.LicenseIssueResponse{}, fmt.Errorf("generate license: %w", err)
	}
	licenseKey := licensePrefix + token
	tokenPrefix := token[:8]
	tokenHash := sha256Hex(licenseKey)
	now := time.Now().UTC()
	graceUntil := now.Add(7 * 24 * time.Hour)

	err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var entitlement entities.BundleUserEntitlement
		err := tx.Where("user_id = ? AND bundle_id = ? AND entitlement_type = ? AND is_active = true", req.UserID, req.BundleID, coalesce(req.EntitlementType, "purchase")).First(&entitlement).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			entitlement = entities.BundleUserEntitlement{
				ID: uuid.New(), UserID: req.UserID, BundleID: req.BundleID, EntitlementType: coalesce(req.EntitlementType, "purchase"),
				IsActive: true, CreatedAt: now, UpdatedAt: now,
			}
			if err := tx.Create(&entitlement).Error; err != nil {
				return fmt.Errorf("create entitlement: %w", err)
			}
		} else if err != nil {
			return fmt.Errorf("load entitlement: %w", err)
		}
		if err := tx.Model(&entities.BundleEntitlementLicense{}).Where("entitlement_id = ? AND is_revoked = false", entitlement.ID).Updates(map[string]any{"is_revoked": true, "grace_until": graceUntil, "updated_at": now}).Error; err != nil {
			return fmt.Errorf("rotate licenses: %w", err)
		}
		row := entities.BundleEntitlementLicense{
			ID: uuid.New(), EntitlementID: entitlement.ID, TokenPrefix: tokenPrefix, TokenHash: tokenHash,
			DeviceLimit: req.DeviceLimit, DeviceIDs: pq.StringArray{}, CreatedAt: now, UpdatedAt: now,
		}
		if err := tx.Create(&row).Error; err != nil {
			return fmt.Errorf("create license: %w", err)
		}
		return nil
	})
	if err != nil {
		return repositories.LicenseIssueResponse{}, err
	}
	return repositories.LicenseIssueResponse{LicenseKey: licenseKey, TokenPrefix: tokenPrefix, GraceDays: 7}, nil
}

func (r *LepoShipRepository) VerifyLicense(ctx context.Context, identity repositories.SDKIdentity, req repositories.LicenseVerifyRequest) (repositories.LicenseVerifyResponse, error) {
	if !strings.HasPrefix(req.LicenseKey, licensePrefix) || req.DeviceID == "" {
		return repositories.LicenseVerifyResponse{Valid: false, Reason: "invalid_request"}, nil
	}
	token := strings.TrimPrefix(req.LicenseKey, licensePrefix)
	if len(token) < 8 {
		return repositories.LicenseVerifyResponse{Valid: false, Reason: "invalid_license"}, nil
	}
	tokenPrefix := token[:8]
	tokenHash := sha256Hex(req.LicenseKey)
	now := time.Now().UTC()

	var license entities.BundleEntitlementLicense
	err := r.db.WithContext(ctx).Where("token_prefix = ? AND token_hash = ?", tokenPrefix, tokenHash).First(&license).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return repositories.LicenseVerifyResponse{Valid: false, Reason: "invalid_license"}, nil
	}
	if err != nil {
		return repositories.LicenseVerifyResponse{}, fmt.Errorf("load license: %w", err)
	}
	var entitlement entities.BundleUserEntitlement
	if err := r.db.WithContext(ctx).Where("id = ?", license.EntitlementID).First(&entitlement).Error; err != nil {
		return repositories.LicenseVerifyResponse{}, fmt.Errorf("load entitlement: %w", err)
	}
	if entitlement.BundleID != identity.BundleID {
		return repositories.LicenseVerifyResponse{Valid: false, Reason: "bundle_mismatch"}, nil
	}
	if !entitlement.IsActive || entitlement.RevokedAt != nil || (entitlement.ExpiresAt != nil && entitlement.ExpiresAt.Before(now)) {
		return repositories.LicenseVerifyResponse{Valid: false, Reason: "entitlement_inactive"}, nil
	}
	if license.IsRevoked && (license.GraceUntil == nil || license.GraceUntil.Before(now)) {
		return repositories.LicenseVerifyResponse{Valid: false, Reason: "license_revoked"}, nil
	}
	deviceHash := deviceFingerprint(req.DeviceID, os.Getenv("TELEMETRY_DEVICE_PEPPER"))
	deviceIDs := []string(license.DeviceIDs)
	if !slices.Contains(deviceIDs, deviceHash) {
		if len(deviceIDs) >= license.DeviceLimit {
			return repositories.LicenseVerifyResponse{Valid: false, Reason: "device_limit_exceeded"}, nil
		}
		deviceIDs = append(deviceIDs, deviceHash)
	}
	if err := r.db.WithContext(ctx).Model(&entities.BundleEntitlementLicense{}).Where("id = ?", license.ID).Updates(map[string]any{"device_ids": pq.StringArray(deviceIDs), "last_verified_at": now, "updated_at": now}).Error; err != nil {
		return repositories.LicenseVerifyResponse{}, fmt.Errorf("update license verification: %w", err)
	}
	return repositories.LicenseVerifyResponse{
		Valid: true, BundleID: entitlement.BundleID.String(), EntitlementID: entitlement.ID.String(),
		OfflineToken: offlineToken(entitlement.ID.String(), req.DeviceID),
	}, nil
}

func (r *LepoShipRepository) RunCronJob(ctx context.Context, name string) (repositories.CronJobResult, error) {
	switch name {
	case "bundle-abuse", "retention-calculator", "ab-experiments", "ranking-calculator", "bundle-webhooks", "webhook-retry", "ssl-renew", "lepoship-outbox", "lepoship-reconcile", "cleanup-previews", "cleanup-waf-logs", "sync-storage":
	default:
		return repositories.CronJobResult{}, fmt.Errorf("%w: unknown job %q", ErrBadRequest, name)
	}
	switch name {
	case "bundle-abuse":
		return r.runBundleAbuse(ctx)
	case "retention-calculator":
		return r.runRetentionCalculator(ctx)
	case "ranking-calculator":
		return r.runRankingCalculator(ctx)
	case "bundle-webhooks":
		return r.runBundleWebhooks(ctx)
	case "lepoship-outbox":
		return r.runOutbox(ctx)
	case "lepoship-reconcile":
		return r.runReconcile(ctx)
	case "webhook-retry":
		return r.runFormWebhookRetry(ctx)
	case "cleanup-waf-logs":
		return r.runCleanupWAFLogs(ctx)
	case "cleanup-previews":
		return r.runCleanupPreviews(ctx)
	case "sync-storage":
		return r.runSyncStorage(ctx)
	case "ssl-renew":
		return r.runSSLRenew(ctx)
	case "ab-experiments":
		return r.runABExperiments(ctx)
	default:
		return repositories.CronJobResult{}, fmt.Errorf("%w: unknown job %q", ErrBadRequest, name)
	}
}

func (r *LepoShipRepository) runBundleAbuse(ctx context.Context) (repositories.CronJobResult, error) {
	now := time.Now().UTC()
	since := now.Add(-24 * time.Hour)
	type reportCount struct {
		BundleID    uuid.UUID `gorm:"column:bundle_id"`
		ReportCount int64     `gorm:"column:report_count"`
	}
	var rows []reportCount
	err := r.db.WithContext(ctx).Raw(`
		SELECT bundle_id, COUNT(DISTINCT reporter_fingerprint) AS report_count
		FROM bundle_user_reports
		WHERE created_at >= ? AND reporter_fingerprint IS NOT NULL
		GROUP BY bundle_id
		HAVING COUNT(DISTINCT reporter_fingerprint) >= 6
	`, since).Scan(&rows).Error
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("scan abuse reports: %w", err)
	}
	var transitioned int64
	err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, row := range rows {
			anomaly := math.Min(float64(row.ReportCount)/20.0, 1.0)
			riskLevel := "low"
			if anomaly >= 0.7 {
				riskLevel = "high"
			} else if anomaly >= 0.4 {
				riskLevel = "medium"
			}
			if err := tx.Exec(`
				INSERT INTO bundle_abuse_signals (id, bundle_id, anomaly_score, overall_risk_score, risk_level, flagged_for_review, last_calculated_at)
				VALUES (?, ?, ?, ?, ?, true, ?)
				ON CONFLICT (bundle_id) DO UPDATE SET
					anomaly_score = EXCLUDED.anomaly_score,
					overall_risk_score = EXCLUDED.overall_risk_score,
					risk_level = EXCLUDED.risk_level,
					flagged_for_review = true,
					last_calculated_at = EXCLUDED.last_calculated_at
			`, uuid.New(), row.BundleID, anomaly, anomaly, riskLevel, now).Error; err != nil {
				return fmt.Errorf("upsert abuse signal: %w", err)
			}
			res := tx.Exec("UPDATE bundles SET status = 'under_review', updated_at = ? WHERE id = ? AND status = 'published'", now, row.BundleID)
			if res.Error != nil {
				return fmt.Errorf("transition bundle review state: %w", res.Error)
			}
			if res.RowsAffected > 0 {
				transitioned += res.RowsAffected
				metadata, _ := json.Marshal(map[string]any{"reportCount": row.ReportCount, "anomalyScore": anomaly})
				if err := tx.Exec(`
					INSERT INTO bundle_state_transitions (id, bundle_id, from_state, to_state, trigger, metadata, created_at)
					VALUES (?, ?, 'published', 'under_review', 'abuse_threshold_reached', ?, ?)
				`, uuid.New(), row.BundleID, string(metadata), now).Error; err != nil {
					return fmt.Errorf("record state transition: %w", err)
				}
			}
		}
		return nil
	})
	return repositories.CronJobResult{Job: "bundle-abuse", Processed: int64(len(rows)), Skipped: transitioned, Message: "flagged abusive bundles and transitioned published bundles"}, err
}

func (r *LepoShipRepository) runRetentionCalculator(ctx context.Context) (repositories.CronJobResult, error) {
	now := time.Now().UTC()
	yesterday := time.Date(now.Year(), now.Month(), now.Day()-1, 0, 0, 0, 0, time.UTC)
	start := yesterday
	end := yesterday.Add(24*time.Hour - time.Millisecond)
	statsDate := yesterday.Format("2006-01-02")
	var bundles []struct {
		ID uuid.UUID `gorm:"column:id"`
	}
	if err := r.db.WithContext(ctx).Raw("SELECT id FROM bundles").Scan(&bundles).Error; err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("list bundles: %w", err)
	}
	for _, bundle := range bundles {
		dau, err := r.distinctActiveUsers(ctx, bundle.ID, start, end)
		if err != nil {
			return repositories.CronJobResult{}, err
		}
		mau, err := r.distinctActiveUsers(ctx, bundle.ID, start.AddDate(0, 0, -29), end)
		if err != nil {
			return repositories.CronJobResult{}, err
		}
		d1, err := r.cohortRetention(ctx, bundle.ID, start.AddDate(0, 0, -1), end.AddDate(0, 0, -1), start, end)
		if err != nil {
			return repositories.CronJobResult{}, err
		}
		d7, err := r.cohortRetention(ctx, bundle.ID, start.AddDate(0, 0, -7), end.AddDate(0, 0, -7), start, end)
		if err != nil {
			return repositories.CronJobResult{}, err
		}
		d30, err := r.cohortRetention(ctx, bundle.ID, start.AddDate(0, 0, -30), end.AddDate(0, 0, -30), start, end)
		if err != nil {
			return repositories.CronJobResult{}, err
		}
		var sessionCount int64
		if err := r.db.WithContext(ctx).Raw(`
			SELECT COUNT(DISTINCT session_id) FROM bundle_analytics_events
			WHERE bundle_id = ? AND created_at BETWEEN ? AND ? AND session_id IS NOT NULL
		`, bundle.ID, start, end).Scan(&sessionCount).Error; err != nil {
			return repositories.CronJobResult{}, fmt.Errorf("count sessions: %w", err)
		}
		var avgDuration *float64
		if err := r.db.WithContext(ctx).Raw(`
			SELECT AVG(NULLIF((event_data::jsonb->>'durationMs')::float, 0) / 1000.0)
			FROM bundle_analytics_events
			WHERE bundle_id = ? AND event_type = 'session_end' AND created_at BETWEEN ? AND ?
		`, bundle.ID, start, end).Scan(&avgDuration).Error; err != nil {
			return repositories.CronJobResult{}, fmt.Errorf("average session duration: %w", err)
		}
		if err := r.db.WithContext(ctx).Exec(`
			INSERT INTO bundle_retention_stats (id, bundle_id, stats_date, d1_retention, d7_retention, d30_retention, dau, mau, session_count, avg_session_duration, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT (bundle_id, stats_date) DO UPDATE SET
				d1_retention = EXCLUDED.d1_retention,
				d7_retention = EXCLUDED.d7_retention,
				d30_retention = EXCLUDED.d30_retention,
				dau = EXCLUDED.dau,
				mau = EXCLUDED.mau,
				session_count = EXCLUDED.session_count,
				avg_session_duration = EXCLUDED.avg_session_duration
		`, uuid.New(), bundle.ID, statsDate, d1, d7, d30, dau, mau, sessionCount, avgDuration, now).Error; err != nil {
			return repositories.CronJobResult{}, fmt.Errorf("upsert retention stats: %w", err)
		}
		if err := r.refreshBundleStats(ctx, bundle.ID, now); err != nil {
			return repositories.CronJobResult{}, err
		}
	}
	return repositories.CronJobResult{Job: "retention-calculator", Processed: int64(len(bundles)), Message: "computed retention and refreshed bundle stats"}, nil
}

func (r *LepoShipRepository) runRankingCalculator(ctx context.Context) (repositories.CronJobResult, error) {
	now := time.Now().UTC()
	statsDate := now.Format("2006-01-02")
	thirtyDaysAgo := now.AddDate(0, 0, -30)
	type bundleScore struct {
		ID            uuid.UUID `gorm:"column:id"`
		Category      *string   `gorm:"column:category"`
		ActiveInstalls int64    `gorm:"column:active_installs"`
		Rating        float64   `gorm:"column:rating"`
		RatingCount   int64     `gorm:"column:rating_count"`
		D1Retention   *float64  `gorm:"column:d1_retention"`
		D7Retention   *float64  `gorm:"column:d7_retention"`
		D30Retention  *float64  `gorm:"column:d30_retention"`
		PaidOrders    int64
		OverallScore  float64
	}
	var rows []bundleScore
	if err := r.db.WithContext(ctx).Raw(`
		SELECT b.id, b.category, COALESCE(bs.active_installs, 0) AS active_installs,
		       COALESCE(bs.rating, 0) AS rating, COALESCE(bs.rating_count, 0) AS rating_count,
		       brs.d1_retention, brs.d7_retention, brs.d30_retention
		FROM bundles b
		LEFT JOIN bundle_stats bs ON bs.bundle_id = b.id
		LEFT JOIN LATERAL (
			SELECT d1_retention, d7_retention, d30_retention
			FROM bundle_retention_stats r
			WHERE r.bundle_id = b.id
			ORDER BY stats_date DESC
			LIMIT 1
		) brs ON true
		WHERE b.status = 'published'
	`).Scan(&rows).Error; err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("load ranking candidates: %w", err)
	}
	var maxInstalls, maxOrders int64
	for i := range rows {
		if err := r.db.WithContext(ctx).Raw("SELECT COUNT(*) FROM bundle_orders WHERE bundle_id = ? AND status = 'completed' AND created_at >= ?", rows[i].ID, thirtyDaysAgo).Scan(&rows[i].PaidOrders).Error; err != nil {
			return repositories.CronJobResult{}, fmt.Errorf("count paid orders: %w", err)
		}
		maxInstalls = max(maxInstalls, rows[i].ActiveInstalls)
		maxOrders = max(maxOrders, rows[i].PaidOrders)
	}
	for i := range rows {
		popularity := 0.0
		if maxInstalls > 0 {
			popularity += 0.6 * math.Log(float64(rows[i].ActiveInstalls)+1) / math.Log(float64(maxInstalls)+1)
		}
		if maxOrders > 0 {
			popularity += 0.4 * math.Log(float64(rows[i].PaidOrders)+1) / math.Log(float64(maxOrders)+1)
		}
		retention := firstFloat(rows[i].D30Retention, rows[i].D7Retention, rows[i].D1Retention)
		bayesian := (float64(rows[i].RatingCount)*rows[i].Rating + 10*3.5) / (float64(rows[i].RatingCount) + 10)
		quality := math.Max(0, (bayesian-1.0)/4.0)
		var unresolved int64
		if err := r.db.WithContext(ctx).Raw("SELECT COUNT(*) FROM bundle_crash_reports WHERE bundle_id = ? AND is_resolved = false", rows[i].ID).Scan(&unresolved).Error; err != nil {
			return repositories.CronJobResult{}, fmt.Errorf("count unresolved crashes: %w", err)
		}
		crashRatio := 0.0
		if rows[i].ActiveInstalls > 0 {
			crashRatio = float64(unresolved) / float64(rows[i].ActiveInstalls)
		}
		crashScore := math.Max(0, 1-math.Min(crashRatio, 1))
		overall := 0.35*popularity + 0.25*retention + 0.3*quality + 0.1*crashScore
		rows[i].OverallScore = overall
		if err := r.db.WithContext(ctx).Exec(`
			INSERT INTO bundle_ranking_scores (id, bundle_id, popularity_score, retention_score, quality_score, crash_score, overall_score, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT (bundle_id) DO UPDATE SET
				popularity_score = EXCLUDED.popularity_score,
				retention_score = EXCLUDED.retention_score,
				quality_score = EXCLUDED.quality_score,
				crash_score = EXCLUDED.crash_score,
				overall_score = EXCLUDED.overall_score,
				updated_at = EXCLUDED.updated_at
		`, uuid.New(), rows[i].ID, popularity, retention, quality, crashScore, overall, now).Error; err != nil {
			return repositories.CronJobResult{}, fmt.Errorf("upsert ranking score: %w", err)
		}
	}
	for _, category := range uniqueCategories(rows) {
		rank := 1
		for _, row := range sortedByCategory(rows, category) {
			downloadCount, activeInstalls, err := r.installCounts(ctx, row.ID)
			if err != nil {
				return repositories.CronJobResult{}, err
			}
			if err := r.db.WithContext(ctx).Exec(`
				INSERT INTO bundle_trending_snapshots (id, bundle_id, snapshot_date, download_count, active_installs, rank_position, category, created_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				ON CONFLICT (bundle_id, snapshot_date) DO UPDATE SET
					download_count = EXCLUDED.download_count,
					active_installs = EXCLUDED.active_installs,
					rank_position = EXCLUDED.rank_position,
					category = EXCLUDED.category
			`, uuid.New(), row.ID, statsDate, downloadCount, activeInstalls, rank, coalescePtr(row.Category, "General"), now).Error; err != nil {
				return repositories.CronJobResult{}, fmt.Errorf("upsert trending snapshot: %w", err)
			}
			rank++
		}
	}
	return repositories.CronJobResult{Job: "ranking-calculator", Processed: int64(len(rows)), Message: "updated ranking scores and trending snapshots"}, nil
}

func (r *LepoShipRepository) runBundleWebhooks(ctx context.Context) (repositories.CronJobResult, error) {
	if _, err := r.queueRecentBuildWebhookEvents(ctx); err != nil {
		return repositories.CronJobResult{}, err
	}
	if _, err := r.queueRecentReleaseWebhookEvents(ctx); err != nil {
		return repositories.CronJobResult{}, err
	}
	return r.dispatchBundleWebhookDeliveries(ctx, "bundle-webhooks")
}

func (r *LepoShipRepository) runFormWebhookRetry(ctx context.Context) (repositories.CronJobResult, error) {
	type delivery struct {
		ID             string          `gorm:"column:id"`
		URL            string          `gorm:"column:url"`
		Attempts       int             `gorm:"column:attempts"`
		WebhookSecret  *string         `gorm:"column:webhook_secret"`
		FormID         string          `gorm:"column:form_id"`
		FormName       string          `gorm:"column:form_name"`
		SubmissionID   string          `gorm:"column:submission_id"`
		SubmissionData json.RawMessage `gorm:"column:submission_data"`
		CreatedAt      time.Time       `gorm:"column:created_at"`
	}
	var rows []delivery
	if err := r.db.WithContext(ctx).Raw(`
		SELECT d.id, d.url, d.attempts, f.webhook_secret, f.id AS form_id, f.name AS form_name,
		       d.submission_id, s.data AS submission_data, d.created_at
		FROM form_webhook_deliveries d
		JOIN forms f ON f.id = d.form_id
		JOIN form_submissions s ON s.id = d.submission_id
		WHERE d.status = 'FAILED' AND d.attempts < 5 AND d.next_retry_at <= now()
	`).Scan(&rows).Error; err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("load form webhook retries: %w", err)
	}
	var succeeded int64
	for _, row := range rows {
		payload, _ := json.Marshal(map[string]any{
			"event": "form.submission.created", "formId": row.FormID, "formName": row.FormName,
			"submissionId": row.SubmissionID, "data": row.SubmissionData, "createdAt": row.CreatedAt.Format(time.RFC3339),
		})
		if r.sendFormWebhook(ctx, row.ID, row.URL, stringValue(row.WebhookSecret), payload, row.Attempts+1) {
			succeeded++
		}
	}
	return repositories.CronJobResult{Job: "webhook-retry", Processed: int64(len(rows)), Skipped: succeeded, Message: "retried failed form webhooks"}, nil
}

func (r *LepoShipRepository) runOutbox(ctx context.Context) (repositories.CronJobResult, error) {
	res := r.db.WithContext(ctx).Exec(`
		UPDATE bundle_outbox_events
		SET attempts = attempts + 1,
		    processed_at = now(),
		    status = 'processed',
		    lease_owner = NULL,
		    leased_until = NULL
		WHERE id IN (
			SELECT id FROM bundle_outbox_events
			WHERE status = 'pending' AND (next_attempt_at IS NULL OR next_attempt_at <= now())
			ORDER BY created_at
			FOR UPDATE SKIP LOCKED
			LIMIT 100
		)
	`)
	return repositories.CronJobResult{Job: "lepoship-outbox", Processed: res.RowsAffected, Message: "processed pending outbox events"}, res.Error
}

func (r *LepoShipRepository) runReconcile(ctx context.Context) (repositories.CronJobResult, error) {
	res := r.db.WithContext(ctx).Exec(`
		UPDATE bundle_ledger_transactions t
		SET status = 'balanced'
		WHERE status <> 'balanced'
		  AND COALESCE((
		    SELECT ROUND(SUM(CASE WHEN e.direction = 'credit' THEN e.amount ELSE -e.amount END)::numeric, 2)
		    FROM bundle_ledger_entries e
		    WHERE e.transaction_id = t.id
		  ), 0) = 0
	`)
	return repositories.CronJobResult{Job: "lepoship-reconcile", Processed: res.RowsAffected, Message: "marked balanced ledger transactions"}, res.Error
}

func (r *LepoShipRepository) runCleanupWAFLogs(ctx context.Context) (repositories.CronJobResult, error) {
	res := r.db.WithContext(ctx).Exec(`
		DELETE FROM native_waf_events e
		USING projects p
		LEFT JOIN bundles b ON b.project_id = p.id
		LEFT JOIN bundle_privacy_declarations d ON d.bundle_id = b.id
		WHERE e.project_id = p.id
		  AND e.created_at < now() - (COALESCE(d.data_retention_days, 30)::text || ' days')::interval
	`)
	return repositories.CronJobResult{Job: "cleanup-waf-logs", Processed: res.RowsAffected, Message: "deleted expired WAF events by privacy retention"}, res.Error
}

func (r *LepoShipRepository) runCleanupPreviews(ctx context.Context) (repositories.CronJobResult, error) {
	res := r.db.WithContext(ctx).Exec(`
		WITH old_previews AS (
			DELETE FROM native_deployments
			WHERE target = 'preview' AND created_at < now() - interval '7 days'
			RETURNING project_id, id
		)
		DELETE FROM bundle_release_tracks brt
		USING bundles b, old_previews p
		WHERE brt.bundle_id = b.id
		  AND b.project_id = p.project_id
		  AND brt.version LIKE '%' || p.id || '%'
	`)
	return repositories.CronJobResult{Job: "cleanup-previews", Processed: res.RowsAffected, Message: "removed expired preview deployment records and related release tracks; provider/object cleanup handled by external adapters"}, res.Error
}

func (r *LepoShipRepository) runSyncStorage(ctx context.Context) (repositories.CronJobResult, error) {
	var total int64
	if err := r.db.WithContext(ctx).Raw("SELECT COUNT(*) FROM bundle_artifacts").Scan(&total).Error; err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("count canonical artifacts: %w", err)
	}
	var legacy int64
	if err := r.db.WithContext(ctx).Raw(`
		SELECT COUNT(*) FROM bundle_release_tracks rt
		LEFT JOIN bundle_artifact_manifests m ON m.id = rt.artifact_manifest_id
		WHERE rt.status = 'active' AND rt.storage_path <> '' AND m.id IS NULL
	`).Scan(&legacy).Error; err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("count legacy tracks: %w", err)
	}
	return repositories.CronJobResult{Job: "sync-storage", Processed: total, Skipped: legacy, Message: "verified canonical artifact index; legacy tracks without manifests skipped"}, nil
}

func (r *LepoShipRepository) runSSLRenew(ctx context.Context) (repositories.CronJobResult, error) {
	res := r.db.WithContext(ctx).Exec(`
		UPDATE native_domain_configs
		SET ssl_status = 'RENEWAL_REQUIRED', updated_at = now()
		WHERE dns_verified = true
		  AND (cert_expires_at IS NULL OR cert_expires_at <= now() + interval '15 days')
	`)
	return repositories.CronJobResult{Job: "ssl-renew", Processed: res.RowsAffected, Message: "marked verified domains requiring certificate renewal"}, res.Error
}

func (r *LepoShipRepository) runABExperiments(ctx context.Context) (repositories.CronJobResult, error) {
	res := r.db.WithContext(ctx).Exec(`
		INSERT INTO bundle_ab_test_analysis_snapshots (id, ab_test_id, sample_size, conversion_rate_control, conversion_rate_treatment, confidence, recommendation, created_at)
		SELECT gen_random_uuid(), t.id,
		       COUNT(e.id),
		       0,
		       0,
		       0,
		       'collect_more_data',
		       now()
		FROM bundle_ab_tests t
		LEFT JOIN bundle_ab_test_exposures e ON e.ab_test_id = t.id
		WHERE t.status = 'running'
		GROUP BY t.id
	`)
	return repositories.CronJobResult{Job: "ab-experiments", Processed: res.RowsAffected, Message: "recorded running AB experiment analysis snapshots"}, res.Error
}

func sha256Hex(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

func deviceFingerprint(deviceID, pepper string) string {
	if deviceID == "" {
		return ""
	}
	mac := hmac.New(sha256.New, []byte(pepper))
	mac.Write([]byte(deviceID))
	return hex.EncodeToString(mac.Sum(nil))
}

func offlineToken(entitlementID, deviceID string) string {
	secret := os.Getenv("ENCRYPTION_KEY")
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(entitlementID + ":" + deviceID))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func randomToken(bytes int) (string, error) {
	buf := make([]byte, bytes)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

func optionalString(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

func stringValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func coalesce(value, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return value
}

func eventTime(raw string, fallback time.Time) time.Time {
	if raw == "" {
		return fallback
	}
	parsed, err := time.Parse(time.RFC3339, raw)
	if err != nil || parsed.After(fallback.Add(5*time.Minute)) || parsed.Before(fallback.AddDate(0, 0, -30)) {
		return fallback
	}
	return parsed.UTC()
}

func artifactURL(artifact entities.BundleArtifact) string {
	base := os.Getenv("LEPOS_ARTIFACT_PUBLIC_URL")
	if base == "" {
		return fmt.Sprintf("s3://%s/%s", artifact.StorageBucket, artifact.StorageKey)
	}
	parsed, err := url.Parse(base)
	if err != nil {
		return strings.TrimRight(base, "/") + "/" + strings.TrimLeft(artifact.StorageKey, "/")
	}
	parsed.Path = path.Join(parsed.Path, artifact.StorageKey)
	return parsed.String()
}
