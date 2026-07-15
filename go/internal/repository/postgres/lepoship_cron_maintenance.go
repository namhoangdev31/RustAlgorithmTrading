package postgres

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	entsql "entgo.io/ent/dialect/sql"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"

	entdb "trading/control-gateway/internal/data/ent"
	"trading/control-gateway/internal/data/ent/bundleabtestanalysissnapshots"
	"trading/control-gateway/internal/data/ent/bundleabtests"
	"trading/control-gateway/internal/data/ent/bundleartifacts"
	"trading/control-gateway/internal/data/ent/bundleledgertransactions"
	"trading/control-gateway/internal/data/ent/bundleoutboxevents"
	"trading/control-gateway/internal/data/ent/bundlereleasetracks"
	"trading/control-gateway/internal/data/ent/bundles"
	"trading/control-gateway/internal/data/ent/formwebhookdelivery"
	"trading/control-gateway/internal/data/ent/nativedeployment"
	"trading/control-gateway/internal/data/ent/nativedomainconfig"
	"trading/control-gateway/internal/data/ent/nativewafevent"
	entschema "trading/control-gateway/internal/data/ent/schema"
	"trading/control-gateway/internal/domain/repositories"
)

func (r *LepoShipRepository) runFormWebhookRetry(ctx context.Context) (repositories.CronJobResult, error) {
	now := time.Now().UTC()
	rows, err := r.client.FormWebhookDelivery.Query().Where(
		formwebhookdelivery.StatusEQ("FAILED"),
		formwebhookdelivery.AttemptsLT(5),
		formwebhookdelivery.NextRetryAtLTE(now),
	).WithForm().WithSubmission().All(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("load form webhook retries: %w", err)
	}
	var succeeded int64
	for _, row := range rows {
		form, formErr := row.Edges.FormOrErr()
		submission, submissionErr := row.Edges.SubmissionOrErr()
		if formErr != nil || submissionErr != nil {
			continue
		}
		payload, _ := json.Marshal(map[string]any{
			"event": "form.submission.created", "formId": form.ID, "formName": form.Name,
			"submissionId": submission.ID, "data": submission.Data, "createdAt": submission.CreatedAt.Format(time.RFC3339),
		})
		if r.sendFormWebhook(ctx, row.ID, row.URL, stringValue(form.WebhookSecret), payload, row.Attempts+1) {
			succeeded++
		}
	}
	return repositories.CronJobResult{Job: "webhook-retry", Processed: int64(len(rows)), Skipped: succeeded, Message: "retried failed form webhooks"}, nil
}

func (r *LepoShipRepository) runOutbox(ctx context.Context) (repositories.CronJobResult, error) {
	now := time.Now().UTC()
	tx, err := r.client.Tx(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("begin outbox transaction: %w", err)
	}
	rollback := true
	defer func() {
		if rollback {
			_ = tx.Rollback()
		}
	}()
	rows, err := tx.BundleOutboxEvents.Query().Where(
		bundleoutboxevents.StatusEQ("pending"),
		bundleoutboxevents.Or(bundleoutboxevents.NextAttemptAtIsNil(), bundleoutboxevents.NextAttemptAtLTE(now)),
	).Order(bundleoutboxevents.ByCreatedAt()).Limit(100).ForUpdate(entsql.WithLockAction(entsql.SkipLocked)).All(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("lease pending outbox events: %w", err)
	}
	ids := make([]uuid.UUID, 0, len(rows))
	for _, row := range rows {
		ids = append(ids, row.ID)
	}
	if len(ids) > 0 {
		if _, err := tx.BundleOutboxEvents.Update().Where(bundleoutboxevents.IDIn(ids...)).
			AddAttempts(1).SetProcessedAt(now).SetStatus("processed").ClearLeaseOwner().ClearLeasedUntil().Save(ctx); err != nil {
			return repositories.CronJobResult{}, fmt.Errorf("process outbox events: %w", err)
		}
	}
	if err := tx.Commit(); err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("commit outbox transaction: %w", err)
	}
	rollback = false
	return repositories.CronJobResult{Job: "lepoship-outbox", Processed: int64(len(rows)), Message: "processed pending outbox events"}, nil
}

func (r *LepoShipRepository) runReconcile(ctx context.Context) (repositories.CronJobResult, error) {
	rows, err := r.client.BundleLedgerTransactions.Query().Where(bundleledgertransactions.StatusNEQ("balanced")).WithEntries().All(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("load ledger transactions: %w", err)
	}
	var ids []uuid.UUID
	for _, row := range rows {
		total := decimal.Zero
		for _, entry := range row.Edges.Entries {
			if entry.Direction == entschema.LedgerEntryDirectionCredit {
				total = total.Add(entry.Amount)
			} else {
				total = total.Sub(entry.Amount)
			}
		}
		if total.Round(2).IsZero() {
			ids = append(ids, row.ID)
		}
	}
	if len(ids) > 0 {
		if _, err := r.client.BundleLedgerTransactions.Update().Where(bundleledgertransactions.IDIn(ids...)).SetStatus("balanced").Save(ctx); err != nil {
			return repositories.CronJobResult{}, fmt.Errorf("mark balanced ledger transactions: %w", err)
		}
	}
	return repositories.CronJobResult{Job: "lepoship-reconcile", Processed: int64(len(ids)), Message: "marked balanced ledger transactions"}, nil
}

func (r *LepoShipRepository) runCleanupWAFLogs(ctx context.Context) (repositories.CronJobResult, error) {
	now := time.Now().UTC()
	bundleRows, err := r.client.Bundles.Query().Where(bundles.ProjectIdNotNil()).WithPrivacyDeclarations().All(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("load WAF retention declarations: %w", err)
	}
	retention := make(map[uuid.UUID]int, len(bundleRows))
	minimumDays := 30
	for _, bundle := range bundleRows {
		days := 30
		if declaration := bundle.Edges.PrivacyDeclarations; declaration != nil && declaration.DataRetentionDays != nil {
			days = *declaration.DataRetentionDays
		}
		if days <= 0 {
			days = 30
		}
		minimumDays = min(minimumDays, days)
		retention[*bundle.ProjectId] = days
	}
	events, err := r.client.NativeWAFEvent.Query().Where(
		nativewafevent.CreatedAtLT(now.Add(-time.Duration(minimumDays) * 24 * time.Hour)),
	).All(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("load WAF events: %w", err)
	}
	ids := make([]string, 0)
	for _, event := range events {
		days := retention[event.ProjectId]
		if days == 0 {
			days = 30
		}
		if event.CreatedAt.Before(now.Add(-time.Duration(days) * 24 * time.Hour)) {
			ids = append(ids, event.ID)
		}
	}
	if len(ids) > 0 {
		if _, err := r.client.NativeWAFEvent.Delete().Where(nativewafevent.IDIn(ids...)).Exec(ctx); err != nil {
			return repositories.CronJobResult{}, fmt.Errorf("delete expired WAF events: %w", err)
		}
	}
	return repositories.CronJobResult{Job: "cleanup-waf-logs", Processed: int64(len(ids)), Message: "deleted expired WAF events by privacy retention"}, nil
}

func (r *LepoShipRepository) runCleanupPreviews(ctx context.Context) (repositories.CronJobResult, error) {
	previews, err := r.client.NativeDeployment.Query().Where(
		nativedeployment.TargetEQ("preview"),
		nativedeployment.CreatedAtLT(time.Now().UTC().Add(-7*24*time.Hour)),
	).Order(nativedeployment.ByCreatedAt()).Limit(500).All(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("list expired preview deployments: %w", err)
	}
	if len(previews) == 0 {
		return repositories.CronJobResult{Job: "cleanup-previews", Message: "no expired preview deployments"}, nil
	}
	adapterURL := strings.TrimSpace(os.Getenv("LEPOS_PREVIEW_CLEANUP_ADAPTER_URL"))
	token := strings.TrimSpace(os.Getenv("LEPOS_PREVIEW_CLEANUP_ADAPTER_TOKEN"))
	allowDBOnly := envBool("LEPOS_CLEANUP_PREVIEWS_WITHOUT_ADAPTER")
	if adapterURL == "" && !allowDBOnly {
		return repositories.CronJobResult{Job: "cleanup-previews", Skipped: int64(len(previews)), Message: "skipped expired previews because cleanup adapter is not configured"}, nil
	}
	var processed, skipped int64
	for _, preview := range previews {
		if adapterURL != "" {
			status, _, ok := postJSON(ctx, adapterURL, preview, map[string]string{"Authorization": bearerToken(token), "User-Agent": "LepoShip-Preview-Cleanup/2026.1"})
			if !ok && status != http.StatusNotFound {
				skipped++
				continue
			}
		}
		tx, err := r.client.Tx(ctx)
		if err != nil {
			return repositories.CronJobResult{}, err
		}
		tracks, err := tx.BundleReleaseTracks.Query().Where(
			bundlereleasetracks.VersionContains(preview.ID),
			bundlereleasetracks.HasBundleWith(bundles.ProjectIdEQ(preview.ProjectId)),
		).IDs(ctx)
		if err == nil && len(tracks) > 0 {
			_, err = tx.BundleReleaseTracks.Delete().Where(bundlereleasetracks.IDIn(tracks...)).Exec(ctx)
		}
		if err == nil {
			_, err = tx.NativeDeployment.Delete().Where(nativedeployment.IDEQ(preview.ID)).Exec(ctx)
		}
		if err != nil {
			_ = tx.Rollback()
			return repositories.CronJobResult{}, fmt.Errorf("delete expired preview %s: %w", preview.ID, err)
		}
		if err := tx.Commit(); err != nil {
			return repositories.CronJobResult{}, fmt.Errorf("commit preview cleanup %s: %w", preview.ID, err)
		}
		processed++
	}
	message := "deleted expired preview deployment records after provider cleanup"
	if adapterURL == "" {
		message = "deleted expired preview deployment records in DB-only cleanup mode"
	}
	return repositories.CronJobResult{Job: "cleanup-previews", Processed: processed, Skipped: skipped, Message: message}, nil
}

func (r *LepoShipRepository) runSyncStorage(ctx context.Context) (repositories.CronJobResult, error) {
	artifacts, err := r.client.BundleArtifacts.Query().Order(bundleartifacts.ByCreatedAt(entsql.OrderDesc())).Limit(1000).All(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("list canonical artifacts: %w", err)
	}
	legacy, err := r.client.BundleReleaseTracks.Query().Where(
		bundlereleasetracks.StatusEQ("active"),
		bundlereleasetracks.StoragePathNEQ(""),
		bundlereleasetracks.Not(bundlereleasetracks.HasArtifactManifest()),
	).Count(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("count legacy tracks: %w", err)
	}
	adapterURL := strings.TrimSpace(os.Getenv("LEPOS_STORAGE_SYNC_ADAPTER_URL"))
	token := strings.TrimSpace(os.Getenv("LEPOS_STORAGE_SYNC_ADAPTER_TOKEN"))
	var processed int64
	skipped := int64(legacy)
	for _, artifact := range artifacts {
		if artifact.StorageProvider == "" || artifact.StorageBucket == "" || artifact.StorageKey == "" || artifact.ChecksumSha256 == "" || artifact.FileSize <= 0 {
			skipped++
			continue
		}
		if adapterURL != "" {
			status, _, ok := postJSON(ctx, adapterURL, artifact, map[string]string{"Authorization": bearerToken(token), "User-Agent": "LepoShip-Storage-Sync/2026.1"})
			if !ok || status == http.StatusNotFound {
				skipped++
				continue
			}
		}
		processed++
	}
	message := "probed canonical artifact objects through storage sync adapter"
	if adapterURL == "" {
		message = "validated canonical artifact metadata; storage adapter not configured for object probe"
	}
	return repositories.CronJobResult{Job: "sync-storage", Processed: processed, Skipped: skipped, Message: message}, nil
}

func (r *LepoShipRepository) runSSLRenew(ctx context.Context) (repositories.CronJobResult, error) {
	now := time.Now().UTC()
	cutoff := now.Add(15 * 24 * time.Hour)
	domains, err := r.client.NativeDomainConfig.Query().Where(
		nativedomainconfig.DnsVerifiedEQ(true),
		nativedomainconfig.Or(nativedomainconfig.CertExpiresAtIsNil(), nativedomainconfig.CertExpiresAtLTE(cutoff)),
	).Order(nativedomainconfig.ByCertExpiresAt()).Limit(200).All(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("list domains requiring ssl renewal: %w", err)
	}
	if len(domains) == 0 {
		return repositories.CronJobResult{Job: "ssl-renew", Message: "no verified domains require certificate renewal"}, nil
	}
	adapterURL := strings.TrimSpace(os.Getenv("LEPOS_SSL_RENEWAL_ADAPTER_URL"))
	token := strings.TrimSpace(os.Getenv("LEPOS_SSL_RENEWAL_ADAPTER_TOKEN"))
	if adapterURL == "" {
		ids := make([]string, 0, len(domains))
		for _, domain := range domains {
			ids = append(ids, domain.ID)
		}
		if _, err := r.client.NativeDomainConfig.Update().Where(nativedomainconfig.IDIn(ids...)).SetSslStatus("RENEWAL_REQUIRED").SetUpdatedAt(now).Save(ctx); err != nil {
			return repositories.CronJobResult{}, err
		}
		return repositories.CronJobResult{Job: "ssl-renew", Processed: int64(len(domains)), Skipped: int64(len(domains)), Message: "marked verified domains requiring renewal; SSL renewal adapter not configured"}, nil
	}
	var processed, skipped int64
	for _, domain := range domains {
		input := lepoSSLDomainConfig{ID: domain.ID, Domain: domain.Domain, ProjectID: domain.ProjectId, DNSProvider: domain.DnsProvider, ExpiresAt: domain.CertExpiresAt}
		response, ok := r.renewDomainCertificate(ctx, adapterURL, token, input)
		if !ok {
			skipped++
			_, _ = domain.Update().SetSslStatus("RENEWAL_REQUIRED").SetUpdatedAt(now).Save(ctx)
			continue
		}
		status := coalesce(response.SSLStatus, "ACTIVE")
		update := domain.Update().SetSslStatus(status).SetUpdatedAt(now).
			SetNillableCertIssuedAt(response.CertIssuedAt).SetNillableCertExpiresAt(response.CertExpiresAt)
		if response.CertPEMRef != "" {
			update.SetCertPemRef(response.CertPEMRef)
		}
		if response.KeyPEMRef != "" {
			update.SetKeyPemRef(response.KeyPEMRef)
		}
		if _, err := update.Save(ctx); err != nil {
			return repositories.CronJobResult{}, fmt.Errorf("persist ssl renewal for %s: %w", domain.Domain, err)
		}
		processed++
	}
	return repositories.CronJobResult{Job: "ssl-renew", Processed: processed, Skipped: skipped, Message: "renewed expiring certificates through SSL renewal adapter"}, nil
}

func (r *LepoShipRepository) runABExperiments(ctx context.Context) (repositories.CronJobResult, error) {
	now := time.Now().UTC()
	bucket := now.Truncate(time.Hour)
	tests, err := r.client.BundleAbTests.Query().Where(bundleabtests.StatusEQ("running")).WithExposures().All(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("collect running AB experiment snapshots: %w", err)
	}
	for _, test := range tests {
		exposedA, exposedB := 0, 0
		for _, exposure := range test.Edges.Exposures {
			switch exposure.Variant {
			case "A":
				exposedA++
			case "B":
				exposedB++
			}
		}
		required := 0
		if test.MinimumSamplePerVariant != nil {
			required = *test.MinimumSamplePerVariant
		}
		if err := r.client.BundleAbTestAnalysisSnapshots.Create().SetID(uuid.New()).SetTestId(test.ID).SetBucketStart(bucket).
			SetAnalysisStatus("collecting").SetExposedA(exposedA).SetExposedB(exposedB).SetAnalyzableA(exposedA).SetAnalyzableB(exposedB).
			SetRequiredSamplePerVariant(required).SetCreatedAt(now).
			OnConflictColumns(bundleabtestanalysissnapshots.FieldTestId, bundleabtestanalysissnapshots.FieldBucketStart).
			Update(func(upsert *entdb.BundleAbTestAnalysisSnapshotsUpsert) {
				upsert.SetExposedA(exposedA).SetExposedB(exposedB).SetAnalyzableA(exposedA).SetAnalyzableB(exposedB).SetCreatedAt(now)
			}).Exec(ctx); err != nil {
			return repositories.CronJobResult{}, fmt.Errorf("upsert AB snapshot for %s: %w", test.ID, err)
		}
	}
	return repositories.CronJobResult{Job: "ab-experiments", Processed: int64(len(tests)), Message: "recorded running AB experiment analysis snapshots"}, nil
}

func (r *LepoShipRepository) sendFormWebhook(ctx context.Context, deliveryID, targetURL, secret string, payload []byte, attempt int) bool {
	headers := map[string]string{"User-Agent": "LepoShip-Webhook-Client/1.0"}
	if secret != "" {
		headers["x-lepoship-signature"] = "sha256=" + hmacHex(secret, string(payload))
	}
	_, body, ok := postWebhook(ctx, targetURL, string(payload), headers)
	update := r.client.FormWebhookDelivery.Update().Where(formwebhookdelivery.IDEQ(deliveryID)).SetAttempts(attempt)
	if ok {
		_, _ = update.SetStatus("SUCCESS").ClearLastError().ClearNextRetryAt().Save(ctx)
		return true
	}
	delayMinutes := []int{1, 5, 30, 120, 720}
	update.SetStatus("FAILED").SetLastError(truncate(body, 1000))
	if attempt < 5 {
		update.SetNextRetryAt(time.Now().UTC().Add(time.Duration(delayMinutes[min(attempt-1, len(delayMinutes)-1)]) * time.Minute))
	} else {
		update.ClearNextRetryAt()
	}
	_, _ = update.Save(ctx)
	return false
}
