package events

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/nats-io/nats.go"

	shared "trading/control-gateway/internal/shared/application"
)

type JetStreamPublisher struct {
	js     nats.JetStreamContext
	prefix string
}

func NewJetStreamPublisher(connection *nats.Conn, prefix string) (*JetStreamPublisher, error) {
	if connection == nil {
		return nil, nil
	}
	js, err := connection.JetStream()
	if err != nil {
		return nil, fmt.Errorf("initialize jetstream: %w", err)
	}
	if strings.TrimSpace(prefix) == "" {
		prefix = "control-gateway"
	}
	return &JetStreamPublisher{js: js, prefix: strings.TrimSuffix(prefix, ".")}, nil
}

func (p *JetStreamPublisher) Publish(ctx context.Context, event shared.Event) error {
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal event %s: %w", event.Type, err)
	}
	subject := p.prefix + "." + subjectToken(event.AggregateType) + "." + subjectToken(event.Type)
	_, err = p.js.Publish(subject, payload, nats.Context(ctx), nats.MsgId(event.EventKey))
	if err != nil {
		return fmt.Errorf("publish jetstream event %s: %w", event.Type, err)
	}
	return nil
}

func subjectToken(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	value = strings.NewReplacer(" ", "-", "/", "-", ".", "-").Replace(value)
	if value == "" {
		return "unknown"
	}
	return value
}
