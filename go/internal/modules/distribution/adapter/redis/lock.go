package redis

import (
	"context"
	"time"

	redisclient "github.com/redis/go-redis/v9"
)

type Lock struct{ client *redisclient.Client }

func NewLock(client *redisclient.Client) *Lock { return &Lock{client: client} }

func (l *Lock) Acquire(ctx context.Context, key, owner string, ttl time.Duration) (func(), bool, error) {
	ok, err := l.client.SetNX(ctx, key, owner, ttl).Result()
	if err != nil || !ok {
		return func() {}, ok, err
	}
	return func() { _ = l.client.Del(context.Background(), key).Err() }, true, nil
}
