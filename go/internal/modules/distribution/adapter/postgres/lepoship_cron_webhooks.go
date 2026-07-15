package postgres

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	entsql "entgo.io/ent/dialect/sql"
	"github.com/google/uuid"

	entdb "trading/control-gateway/internal/data/ent"
	"trading/control-gateway/internal/data/ent/bundlereleasetracks"
	"trading/control-gateway/internal/data/ent/bundles"
	"trading/control-gateway/internal/data/ent/bundlewebhookdeliveries"
	"trading/control-gateway/internal/data/ent/bundlewebhooks"
	"trading/control-gateway/internal/data/ent/leposhipbuild"
	"trading/control-gateway/internal/modules/distribution/application"
)

type bundleWebhookDelivery struct {
	ID                  uuid.UUID
	WebhookID           uuid.UUID
	EventKey            string
	EventType           string
	Payload             string
	Attempt             int
	URL                 string
	Secret              *string
	FailureCount        int
	ConsecutiveFailures int
}

func (r *Repository) runBundleWebhooks(ctx context.Context) (application.CronJobResult, error) {
	if _, err := r.queueRecentBuildWebhookEvents(ctx); err != nil {
		return application.CronJobResult{}, err
	}
	if _, err := r.queueRecentReleaseWebhookEvents(ctx); err != nil {
		return application.CronJobResult{}, err
	}
	return r.dispatchBundleWebhookDeliveries(ctx, "bundle-webhooks")
}

func (r *Repository) queueRecentBuildWebhookEvents(ctx context.Context) (int64, error) {
	now := time.Now().UTC()
	builds, err := r.client.LepoShipBuild.Query().Where(leposhipbuild.UpdatedAtGTE(now.Add(-15 * time.Minute))).All(ctx)
	if err != nil {
		return 0, fmt.Errorf("collect recent builds: %w", err)
	}
	var queued int64
	for _, build := range builds {
		bundle, err := r.client.Bundles.Query().Where(bundles.ProjectIdEQ(build.ProjectId)).
			WithWebhooks(func(q *entdb.BundleWebhooksQuery) { q.Where(bundlewebhooks.IsActiveEQ(true)) }).Only(ctx)
		if entdb.IsNotFound(err) {
			continue
		}
		if err != nil {
			return queued, fmt.Errorf("load build bundle webhooks: %w", err)
		}
		eventType := buildWebhookEventType(build.Status)
		payload, _ := json.Marshal(map[string]any{
			"eventId":   "wh_evt_build_" + build.Status + "_" + build.ID,
			"eventType": build.Status, "timestamp": now, "bundleId": bundle.ID, "data": build,
		})
		for _, webhook := range bundle.Edges.Webhooks {
			if !subscribesTo(webhook.Events, eventType) {
				continue
			}
			inserted, err := r.queueBundleWebhook(ctx, webhook.ID, "wh_evt_build_"+build.Status+"_"+build.ID, eventType, string(payload), now)
			if err != nil {
				return queued, err
			}
			if inserted {
				queued++
			}
		}
	}
	return queued, nil
}

func (r *Repository) queueRecentReleaseWebhookEvents(ctx context.Context) (int64, error) {
	now := time.Now().UTC()
	tracks, err := r.client.BundleReleaseTracks.Query().Where(
		bundlereleasetracks.StatusEQ("active"), bundlereleasetracks.CreatedAtGTE(now.Add(-15*time.Minute)),
	).WithBundle(func(q *entdb.BundlesQuery) {
		q.WithWebhooks(func(webhooks *entdb.BundleWebhooksQuery) { webhooks.Where(bundlewebhooks.IsActiveEQ(true)) })
	}).All(ctx)
	if err != nil {
		return 0, fmt.Errorf("collect recent release tracks: %w", err)
	}
	var queued int64
	for _, track := range tracks {
		bundle, err := track.Edges.BundleOrErr()
		if err != nil {
			continue
		}
		eventKey := "wh_evt_release_published_" + track.ID.String()
		payload, _ := json.Marshal(map[string]any{
			"eventId": eventKey, "eventType": "release:published", "timestamp": now,
			"bundleId": track.BundleId, "data": track,
		})
		for _, webhook := range bundle.Edges.Webhooks {
			if !subscribesTo(webhook.Events, "release:published") {
				continue
			}
			inserted, err := r.queueBundleWebhook(ctx, webhook.ID, eventKey, "release:published", string(payload), now)
			if err != nil {
				return queued, err
			}
			if inserted {
				queued++
			}
		}
	}
	return queued, nil
}

func (r *Repository) queueBundleWebhook(ctx context.Context, webhookID uuid.UUID, eventKey, eventType, payload string, now time.Time) (bool, error) {
	proposedID := uuid.New()
	id, err := r.client.BundleWebhookDeliveries.Create().SetID(proposedID).SetWebhookId(webhookID).
		SetEventKey(eventKey).SetEventType(eventType).SetPayload(payload).SetStatus("pending").
		SetNextRetryAt(now).SetCreatedAt(now).SetUpdatedAt(now).
		OnConflictColumns(bundlewebhookdeliveries.FieldWebhookId, bundlewebhookdeliveries.FieldEventKey).
		Update(func(upsert *entdb.BundleWebhookDeliveriesUpsert) { upsert.SetEventKey(eventKey) }).ID(ctx)
	if err != nil {
		return false, fmt.Errorf("queue webhook event %s: %w", eventKey, err)
	}
	return id == proposedID, nil
}

func (r *Repository) dispatchBundleWebhookDeliveries(ctx context.Context, job string) (application.CronJobResult, error) {
	now := time.Now().UTC()
	rows, err := r.client.BundleWebhookDeliveries.Query().Where(
		bundlewebhookdeliveries.StatusEQ("pending"),
		bundlewebhookdeliveries.Or(bundlewebhookdeliveries.NextRetryAtIsNil(), bundlewebhookdeliveries.NextRetryAtLTE(now)),
		bundlewebhookdeliveries.HasWebhookWith(bundlewebhooks.IsActiveEQ(true)),
	).WithWebhook().Order(bundlewebhookdeliveries.ByCreatedAt(entsql.OrderAsc())).Limit(100).All(ctx)
	if err != nil {
		return application.CronJobResult{}, fmt.Errorf("load webhook deliveries: %w", err)
	}
	var successes int64
	for _, row := range rows {
		webhook, err := row.Edges.WebhookOrErr()
		if err != nil {
			continue
		}
		if r.sendBundleWebhook(ctx, bundleWebhookDelivery{
			ID: row.ID, WebhookID: row.WebhookId, EventKey: row.EventKey, EventType: row.EventType,
			Payload: row.Payload, Attempt: row.Attempt, URL: webhook.URL, Secret: webhook.Secret,
			FailureCount: webhook.FailureCount, ConsecutiveFailures: webhook.ConsecutiveFailures,
		}) {
			successes++
		}
	}
	return application.CronJobResult{Job: job, Processed: int64(len(rows)), Skipped: int64(len(rows)) - successes, Message: "dispatched pending bundle webhooks"}, nil
}

func (r *Repository) sendBundleWebhook(ctx context.Context, row bundleWebhookDelivery) bool {
	status, body, ok := postWebhook(ctx, row.URL, row.Payload, map[string]string{
		"User-Agent": "LepoShip-Webhook-Dispatcher/2026.1", "X-LepoShip-Event": row.EventType,
		"X-LepoShip-Signature": hmacHex(stringValue(row.Secret), row.Payload),
	})
	now := time.Now().UTC()
	nextAttempt := row.Attempt + 1
	tx, err := r.client.Tx(ctx)
	if err != nil {
		return false
	}
	rollback := true
	defer func() {
		if rollback {
			_ = tx.Rollback()
		}
	}()
	update := tx.BundleWebhookDeliveries.Update().Where(bundlewebhookdeliveries.IDEQ(row.ID)).
		SetHttpStatus(status).SetResponseBody(truncate(body, 1000)).SetAttempt(nextAttempt).SetUpdatedAt(now)
	webhookUpdate := tx.BundleWebhooks.Update().Where(bundlewebhooks.IDEQ(row.WebhookID)).SetLastTriggeredAt(now).SetUpdatedAt(now)
	if ok {
		update.SetStatus("delivered").ClearNextRetryAt()
		webhookUpdate.SetConsecutiveFailures(0)
	} else {
		delay := []time.Duration{time.Minute, 5 * time.Minute, 30 * time.Minute, 2 * time.Hour, 12 * time.Hour}
		update.SetStatus("failed").ClearNextRetryAt()
		if row.Attempt < len(delay) {
			update.SetStatus("pending").SetNextRetryAt(now.Add(delay[row.Attempt]))
		}
		nextFailures := row.ConsecutiveFailures + 1
		webhookUpdate.SetFailureCount(row.FailureCount + 1).SetConsecutiveFailures(nextFailures)
		if nextFailures >= 5 {
			webhookUpdate.SetIsActive(false)
		}
	}
	if _, err := update.Save(ctx); err != nil {
		return false
	}
	if _, err := webhookUpdate.Save(ctx); err != nil {
		return false
	}
	if err := tx.Commit(); err != nil {
		return false
	}
	rollback = false
	return ok
}

func buildWebhookEventType(status string) string {
	switch status {
	case "queued", "building":
		return "build:started"
	case "success":
		return "build:success"
	case "failed":
		return "build:failed"
	default:
		return "build:updated"
	}
}

func subscribesTo(raw, event string) bool {
	var events []string
	if json.Unmarshal([]byte(raw), &events) == nil {
		for _, candidate := range events {
			if candidate == "*" || candidate == event {
				return true
			}
		}
	}
	return raw == "*" || raw == event
}
