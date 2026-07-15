//go:build integration

package redis

import (
	"context"
	"os"
	"testing"
	"time"

	redisclient "github.com/redis/go-redis/v9"
)

func TestDistributedLockMutualExclusion(t *testing.T) {
	url := os.Getenv("TEST_REDIS_URL")
	if url == "" {
		t.Skip("TEST_REDIS_URL is not configured")
	}
	options, err := redisclient.ParseURL(url)
	if err != nil {
		t.Fatal(err)
	}
	client := redisclient.NewClient(options)
	defer client.Close()
	ctx := context.Background()
	key := "integration:lock:" + time.Now().UTC().Format("20060102150405.000000000")
	defer client.Del(ctx, key)
	lock := NewLock(client)
	release, acquired, err := lock.Acquire(ctx, key, "owner-a", time.Minute)
	if err != nil || !acquired {
		t.Fatalf("first acquire: acquired=%v err=%v", acquired, err)
	}
	_, acquired, err = lock.Acquire(ctx, key, "owner-b", time.Minute)
	if err != nil || acquired {
		t.Fatalf("second acquire: acquired=%v err=%v", acquired, err)
	}
	release()
	_, acquired, err = lock.Acquire(ctx, key, "owner-b", time.Minute)
	if err != nil || !acquired {
		t.Fatalf("acquire after release: acquired=%v err=%v", acquired, err)
	}
}
