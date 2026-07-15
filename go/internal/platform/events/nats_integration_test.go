//go:build integration

package events

import (
	"context"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/nats-io/nats.go"

	shared "trading/control-gateway/internal/shared/application"
)

func TestJetStreamDeduplicatesEventKey(t *testing.T) {
	url := os.Getenv("TEST_NATS_URL")
	if url == "" {
		t.Skip("TEST_NATS_URL is not configured")
	}
	connection, err := nats.Connect(url)
	if err != nil {
		t.Fatal(err)
	}
	defer connection.Close()
	stream := "TEST_" + uuid.NewString()
	publisher, err := NewJetStreamPublisher(connection, "integration", stream)
	if err != nil {
		t.Fatal(err)
	}
	defer publisher.js.DeleteStream(stream)
	event := shared.Event{ID: uuid.New(), EventKey: uuid.NewString(), Type: "checkout.completed", AggregateType: "order", AggregateID: uuid.NewString()}
	if err := publisher.Publish(context.Background(), event); err != nil {
		t.Fatal(err)
	}
	if err := publisher.Publish(context.Background(), event); err != nil {
		t.Fatal(err)
	}
	info, err := publisher.js.StreamInfo(stream)
	if err != nil {
		t.Fatal(err)
	}
	if info.State.Msgs != 1 {
		t.Fatalf("expected one deduplicated message, got %d", info.State.Msgs)
	}
}
