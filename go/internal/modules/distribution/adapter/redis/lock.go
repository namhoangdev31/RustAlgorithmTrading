package redis

import (
	"context"
	"time"

	redisclient "github.com/redis/go-redis/v9"
)

type Lock struct{ client *redisclient.Client }

var releaseScript = redisclient.NewScript(`
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`)

func NewLock(client *redisclient.Client) *Lock { return &Lock{client: client} }

func (l *Lock) Acquire(ctx context.Context, key, owner string, ttl time.Duration) (func(), bool, error) {
	ok, err := l.client.SetNX(ctx, key, owner, ttl).Result()
	if err != nil || !ok {
		return func() {}, ok, err
	}
	return func() { _ = releaseScript.Run(context.Background(), l.client, []string{key}, owner).Err() }, true, nil
}
