//go:build integration

package events

import (
	"context"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"

	"trading/control-gateway/internal/platform/database"
	shared "trading/control-gateway/internal/shared/application"
)

func TestConcurrentOutboxLeasesDoNotOverlap(t *testing.T) {
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("TEST_DATABASE_URL is not configured")
	}
	ctx := context.Background()
	postgres, err := database.OpenPostgres(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	defer postgres.Close()
	store := NewOutboxStore(postgres)
	events := []shared.Event{
		{ID: uuid.New(), EventKey: uuid.NewString(), Type: "integration.one", AggregateType: "test", AggregateID: uuid.NewString()},
		{ID: uuid.New(), EventKey: uuid.NewString(), Type: "integration.two", AggregateType: "test", AggregateID: uuid.NewString()},
	}
	if err := store.Append(ctx, events...); err != nil {
		t.Fatal(err)
	}
	defer func() {
		for _, event := range events {
			_ = postgres.Ent().BundleOutboxEvents.DeleteOneID(event.ID).Exec(ctx)
		}
	}()

	start := make(chan struct{})
	results := make(chan []leasedEvent, 2)
	errors := make(chan error, 2)
	var wg sync.WaitGroup
	for _, owner := range []string{"worker-a", "worker-b"} {
		owner := owner
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			rows, leaseErr := store.Lease(ctx, owner, 1, time.Minute, time.Now().UTC())
			results <- rows
			errors <- leaseErr
		}()
	}
	close(start)
	wg.Wait()
	close(results)
	close(errors)
	for err := range errors {
		if err != nil {
			t.Fatal(err)
		}
	}
	leased := map[uuid.UUID]struct{}{}
	for rows := range results {
		if len(rows) != 1 {
			t.Fatalf("expected one lease per worker, got %d", len(rows))
		}
		if _, duplicate := leased[rows[0].row.ID]; duplicate {
			t.Fatalf("event %s leased twice", rows[0].row.ID)
		}
		leased[rows[0].row.ID] = struct{}{}
	}
}
