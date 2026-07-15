package events

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math"
	"time"

	"entgo.io/ent/dialect/sql"
	"github.com/google/uuid"

	entdb "trading/control-gateway/internal/data/ent"
	"trading/control-gateway/internal/data/ent/bundleoutboxevents"
	"trading/control-gateway/internal/platform/database"
	shared "trading/control-gateway/internal/shared/application"
)

const (
	statusPending   = "pending"
	statusLeased    = "leased"
	statusProcessed = "processed"
	statusFailed    = "failed"
)

type OutboxStore struct{ database *database.Postgres }

func NewOutboxStore(database *database.Postgres) *OutboxStore {
	return &OutboxStore{database: database}
}

func (s *OutboxStore) Append(ctx context.Context, input ...shared.Event) error {
	client := s.database.Client(ctx)
	if client == nil {
		return fmt.Errorf("append outbox: database is not configured")
	}
	for _, event := range input {
		if event.ID == uuid.Nil {
			event.ID = uuid.New()
		}
		if event.EventKey == "" {
			event.EventKey = event.ID.String()
		}
		if event.Version == 0 {
			event.Version = 1
		}
		if event.OccurredAt.IsZero() {
			event.OccurredAt = time.Now().UTC()
		}
		payload, err := json.Marshal(event)
		if err != nil {
			return fmt.Errorf("marshal outbox event: %w", err)
		}
		if _, err := client.BundleOutboxEvents.Create().
			SetID(event.ID).
			SetEventKey(event.EventKey).
			SetAggregateType(event.AggregateType).
			SetAggregateId(event.AggregateID).
			SetEventType(event.Type).
			SetPayload(payload).
			SetStatus(statusPending).
			SetCreatedAt(event.OccurredAt).
			Save(ctx); err != nil {
			return fmt.Errorf("append outbox event %s: %w", event.EventKey, err)
		}
	}
	return nil
}

type leasedEvent struct {
	row   *entdb.BundleOutboxEvents
	event shared.Event
}

func (s *OutboxStore) Lease(ctx context.Context, owner string, limit int, ttl time.Duration, now time.Time) ([]leasedEvent, error) {
	if limit <= 0 {
		limit = 100
	}
	if ttl <= 0 {
		ttl = 30 * time.Second
	}
	var leased []leasedEvent
	err := s.database.Within(ctx, func(txCtx context.Context) error {
		client := s.database.Client(txCtx)
		rows, err := client.BundleOutboxEvents.Query().Where(
			bundleoutboxevents.Or(
				bundleoutboxevents.And(
					bundleoutboxevents.StatusEQ(statusPending),
					bundleoutboxevents.Or(bundleoutboxevents.NextAttemptAtIsNil(), bundleoutboxevents.NextAttemptAtLTE(now)),
				),
				bundleoutboxevents.And(bundleoutboxevents.StatusEQ(statusLeased), bundleoutboxevents.LeasedUntilLTE(now)),
			),
		).Order(bundleoutboxevents.ByCreatedAt()).
			Limit(limit).
			ForUpdate(sql.WithLockAction(sql.SkipLocked)).
			All(txCtx)
		if err != nil {
			return fmt.Errorf("lease outbox events: %w", err)
		}
		ids := make([]uuid.UUID, 0, len(rows))
		for _, row := range rows {
			ids = append(ids, row.ID)
		}
		if len(ids) > 0 {
			if _, err := client.BundleOutboxEvents.Update().
				Where(bundleoutboxevents.IDIn(ids...)).
				SetStatus(statusLeased).
				SetLeaseOwner(owner).
				SetLeasedUntil(now.Add(ttl)).
				Save(txCtx); err != nil {
				return fmt.Errorf("mark outbox leases: %w", err)
			}
		}
		leased = make([]leasedEvent, 0, len(rows))
		for _, row := range rows {
			var event shared.Event
			if err := json.Unmarshal(row.Payload, &event); err != nil || event.Type == "" {
				event = shared.Event{
					ID: row.ID, EventKey: row.EventKey, Type: row.EventType, Version: 1,
					AggregateType: row.AggregateType, AggregateID: row.AggregateId,
					OccurredAt: row.CreatedAt, Payload: row.Payload,
				}
			}
			leased = append(leased, leasedEvent{row: row, event: event})
		}
		return nil
	})
	return leased, err
}

func (s *OutboxStore) MarkProcessed(ctx context.Context, id uuid.UUID, now time.Time) error {
	_, err := s.database.Client(ctx).BundleOutboxEvents.Update().
		Where(bundleoutboxevents.IDEQ(id)).
		SetStatus(statusProcessed).
		SetProcessedAt(now).
		ClearLeaseOwner().
		ClearLeasedUntil().
		ClearNextAttemptAt().
		ClearLastError().
		Save(ctx)
	if err != nil {
		return fmt.Errorf("mark outbox event processed: %w", err)
	}
	return nil
}

func (s *OutboxStore) MarkFailed(ctx context.Context, row *entdb.BundleOutboxEvents, cause error, maxAttempts int, now time.Time) error {
	attempts := row.Attempts + 1
	status := statusPending
	if maxAttempts > 0 && attempts >= maxAttempts {
		status = statusFailed
	}
	backoff := time.Duration(math.Min(math.Pow(2, float64(attempts)), 300)) * time.Second
	update := s.database.Client(ctx).BundleOutboxEvents.Update().
		Where(bundleoutboxevents.IDEQ(row.ID)).
		SetStatus(status).
		SetAttempts(attempts).
		SetLastError(cause.Error()).
		ClearLeaseOwner().
		ClearLeasedUntil()
	if status == statusPending {
		update.SetNextAttemptAt(now.Add(backoff))
	} else {
		update.ClearNextAttemptAt()
	}
	if _, err := update.Save(ctx); err != nil {
		return fmt.Errorf("reschedule outbox event: %w", err)
	}
	return nil
}

type Dispatcher struct {
	store       *OutboxStore
	publisher   Publisher
	owner       string
	interval    time.Duration
	leaseTTL    time.Duration
	batchSize   int
	maxAttempts int
}

type DispatcherConfig struct {
	Owner       string
	Interval    time.Duration
	LeaseTTL    time.Duration
	BatchSize   int
	MaxAttempts int
}

func NewDispatcher(store *OutboxStore, publisher Publisher, cfg DispatcherConfig) *Dispatcher {
	if cfg.Owner == "" {
		cfg.Owner = uuid.NewString()
	}
	if cfg.Interval <= 0 {
		cfg.Interval = 2 * time.Second
	}
	if cfg.LeaseTTL <= 0 {
		cfg.LeaseTTL = 30 * time.Second
	}
	if cfg.BatchSize <= 0 {
		cfg.BatchSize = 100
	}
	if cfg.MaxAttempts <= 0 {
		cfg.MaxAttempts = 10
	}
	return &Dispatcher{
		store: store, publisher: publisher, owner: cfg.Owner, interval: cfg.Interval,
		leaseTTL: cfg.LeaseTTL, batchSize: cfg.BatchSize, maxAttempts: cfg.MaxAttempts,
	}
}

func (d *Dispatcher) Run(ctx context.Context) error {
	ticker := time.NewTicker(d.interval)
	defer ticker.Stop()
	for {
		if err := d.dispatch(ctx); err != nil && ctx.Err() == nil {
			slog.Error("outbox_dispatch_failed", "error", err)
		}
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
		}
	}
}

func (d *Dispatcher) dispatch(ctx context.Context) error {
	now := time.Now().UTC()
	rows, err := d.store.Lease(ctx, d.owner, d.batchSize, d.leaseTTL, now)
	if err != nil {
		return err
	}
	for _, leased := range rows {
		if err := d.publisher.Publish(ctx, leased.event); err != nil {
			if markErr := d.store.MarkFailed(ctx, leased.row, err, d.maxAttempts, time.Now().UTC()); markErr != nil {
				return markErr
			}
			continue
		}
		if err := d.store.MarkProcessed(ctx, leased.row.ID, time.Now().UTC()); err != nil {
			return err
		}
	}
	return nil
}
