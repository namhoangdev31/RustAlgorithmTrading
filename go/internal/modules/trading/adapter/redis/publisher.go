package redis

import (
	"context"

	redisclient "github.com/redis/go-redis/v9"
)

type Publisher struct{ client *redisclient.Client }

func NewPublisher(client *redisclient.Client) *Publisher { return &Publisher{client: client} }

func (p *Publisher) Publish(ctx context.Context, channel string, payload []byte) error {
	if p == nil || p.client == nil {
		return nil
	}
	return p.client.Publish(ctx, channel, payload).Err()
}
