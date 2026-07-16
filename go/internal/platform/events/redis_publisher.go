package events

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	redisclient "github.com/redis/go-redis/v9"

	shared "trading/control-gateway/internal/shared/application"
)

type RedisPublisher struct {
	client *redisclient.Client
	stream string
}

const LepoShipStreamName = "LEPOSHIP_EVENTS_V1"

func NewRedisPublisher(client *redisclient.Client, stream string) (*RedisPublisher, error) {
	if client == nil {
		return nil, nil
	}
	if strings.TrimSpace(stream) == "" {
		stream = LepoShipStreamName
	}
	return &RedisPublisher{client: client, stream: stream}, nil
}

func (p *RedisPublisher) Check(ctx context.Context) error {
	if p == nil || p.client == nil {
		return fmt.Errorf("redis publisher is not configured")
	}
	return p.client.Ping(ctx).Err()
}

func (p *RedisPublisher) Publish(ctx context.Context, event shared.Event) error {
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal event %s: %w", event.Type, err)
	}

	err = p.client.XAdd(ctx, &redisclient.XAddArgs{
		Stream: p.stream,
		Values: map[string]interface{}{
			"event_key":      event.EventKey,
			"type":           event.Type,
			"aggregate_type": event.AggregateType,
			"payload":        string(payload),
		},
	}).Err()

	if err != nil {
		return fmt.Errorf("publish redis stream event %s: %w", event.Type, err)
	}
	return nil
}
