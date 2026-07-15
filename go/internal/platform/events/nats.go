package events

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/nats-io/nats.go"

	shared "trading/control-gateway/internal/shared/application"
)

type JetStreamPublisher struct {
	js     nats.JetStreamContext
	prefix string
	stream string
}

func NewJetStreamPublisher(connection *nats.Conn, prefix, stream string) (*JetStreamPublisher, error) {
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
	prefix = strings.TrimSuffix(prefix, ".")
	if strings.TrimSpace(stream) == "" {
		stream = "CONTROL_GATEWAY_EVENTS"
	}
	subject := prefix + ".>"
	info, err := js.StreamInfo(stream)
	if err != nil {
		if err != nats.ErrStreamNotFound {
			return nil, fmt.Errorf("inspect jetstream stream %s: %w", stream, err)
		}
		if _, err = js.AddStream(&nats.StreamConfig{Name: stream, Subjects: []string{subject}, Storage: nats.FileStorage, Duplicates: 10 * time.Minute}); err != nil {
			return nil, fmt.Errorf("create jetstream stream %s: %w", stream, err)
		}
	} else if !contains(info.Config.Subjects, subject) {
		return nil, fmt.Errorf("jetstream stream %s does not include subject %s", stream, subject)
	}
	return &JetStreamPublisher{js: js, prefix: prefix, stream: stream}, nil
}

func (p *JetStreamPublisher) Check(ctx context.Context) error {
	if p == nil || p.js == nil {
		return fmt.Errorf("jetstream publisher is not configured")
	}
	if _, err := p.js.StreamInfo(p.stream, nats.Context(ctx)); err != nil {
		return fmt.Errorf("inspect jetstream stream %s: %w", p.stream, err)
	}
	return nil
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

func contains(values []string, expected string) bool {
	for _, value := range values {
		if value == expected {
			return true
		}
	}
	return false
}
