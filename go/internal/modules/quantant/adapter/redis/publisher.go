package redisadapter

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	redisclient "github.com/redis/go-redis/v9"

	domain "trading/control-gateway/internal/modules/quantant/contract"
)

type Publisher struct {
	client *redisclient.Client
	stream string
}

func New(client *redisclient.Client, stream string) (*Publisher, error) {
	if client == nil {
		return nil, nil
	}
	if strings.TrimSpace(stream) == "" {
		stream = "QUANTANT_COMMANDS"
	}
	return &Publisher{client: client, stream: stream}, nil
}

func (p *Publisher) Publish(ctx context.Context, command domain.ExecutionCommand) error {
	payload, err := json.Marshal(command)
	if err != nil {
		return err
	}

	err = p.client.XAdd(ctx, &redisclient.XAddArgs{
		Stream: p.stream,
		Values: map[string]interface{}{
			"command_id": command.CommandID,
			"payload":    string(payload),
		},
	}).Err()
	if err != nil {
		return err
	}

	// Publish via PubSub for WS Hub real-time distribution
	_ = p.client.Publish(ctx, "quantant:events", string(payload))

	return nil
}

func (p *Publisher) Check(ctx context.Context) error {
	if p == nil || p.client == nil {
		return fmt.Errorf("QuantAnt Redis Stream is disconnected")
	}
	return p.client.Ping(ctx).Err()
}
