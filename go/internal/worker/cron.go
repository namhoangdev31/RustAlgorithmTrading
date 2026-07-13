package worker

import (
	"context"
	"log/slog"
	"os"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/robfig/cron/v3"

	"trading/control-gateway/internal/usecase/lepoship"
)

type LepoShipScheduler struct {
	cron    *cron.Cron
	service *lepoship.Service
	redis   *redis.Client
	mu      sync.Mutex
	running map[string]struct{}
}

func NewLepoShipScheduler(service *lepoship.Service, redisClient *redis.Client) *LepoShipScheduler {
	return &LepoShipScheduler{
		cron:    cron.New(cron.WithLocation(time.UTC), cron.WithSeconds()),
		service: service,
		redis:   redisClient,
		running: map[string]struct{}{},
	}
}

func (s *LepoShipScheduler) RegisterDefaults() error {
	jobs := map[string]string{
		"bundle-abuse":         envSchedule("LEPOS_CRON_BUNDLE_ABUSE", "0 0 * * * *"),
		"retention-calculator": envSchedule("LEPOS_CRON_RETENTION", "0 15 1 * * *"),
		"ab-experiments":       envSchedule("LEPOS_CRON_AB_EXPERIMENTS", "0 */15 * * * *"),
		"ranking-calculator":   envSchedule("LEPOS_CRON_RANKING", "0 30 0,12 * * *"),
		"bundle-webhooks":      envSchedule("LEPOS_CRON_BUNDLE_WEBHOOKS", "0 */5 * * * *"),
		"webhook-retry":        envSchedule("LEPOS_CRON_WEBHOOK_RETRY", "0 */10 * * * *"),
		"ssl-renew":            envSchedule("LEPOS_CRON_SSL_RENEW", "0 0 3 * * *"),
		"lepoship-outbox":      envSchedule("LEPOS_CRON_OUTBOX", "0 */2 * * * *"),
		"lepoship-reconcile":   envSchedule("LEPOS_CRON_RECONCILE", "0 */15 * * * *"),
		"cleanup-previews":     envSchedule("LEPOS_CRON_CLEANUP_PREVIEWS", "0 0 2 * * *"),
		"cleanup-waf-logs":     envSchedule("LEPOS_CRON_CLEANUP_WAF", "0 30 2 * * *"),
		"sync-storage":         envSchedule("LEPOS_CRON_SYNC_STORAGE", "0 0 * * * *"),
	}
	for name, spec := range jobs {
		jobName := name
		if _, err := s.cron.AddFunc(spec, func() { s.Run(context.Background(), jobName) }); err != nil {
			return err
		}
	}
	return nil
}

func (s *LepoShipScheduler) Start() {
	if os.Getenv("LEPOS_SCHEDULER_ENABLED") != "true" {
		slog.Info("lepoship_scheduler_disabled")
		return
	}
	s.cron.Start()
	slog.Info("lepoship_scheduler_started")
}

func (s *LepoShipScheduler) Stop() {
	ctx := s.cron.Stop()
	<-ctx.Done()
	slog.Info("lepoship_scheduler_stopped")
}

func (s *LepoShipScheduler) Run(ctx context.Context, name string) {
	start := time.Now()
	if !s.enterLocal(name) {
		slog.Info("lepoship_cron_skipped_local_lock", "job", name)
		return
	}
	defer s.leaveLocal(name)

	lockKey := "lepos:cron-lock:" + name
	if s.redis != nil {
		ok, err := s.redis.SetNX(ctx, lockKey, os.Getenv("HOSTNAME"), 15*time.Minute).Result()
		if err != nil || !ok {
			slog.Info("lepoship_cron_skipped_distributed_lock", "job", name, "error", err)
			return
		}
		defer s.redis.Del(context.Background(), lockKey)
	}
	result, err := s.service.RunCronJob(ctx, name)
	if err != nil {
		slog.Error("lepoship_cron_failed", "job", name, "duration_ms", time.Since(start).Milliseconds(), "error", err)
		return
	}
	slog.Info("lepoship_cron_finished", "job", name, "duration_ms", time.Since(start).Milliseconds(), "processed", result.Processed, "skipped", result.Skipped, "message", result.Message)
}

func (s *LepoShipScheduler) enterLocal(name string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.running[name]; ok {
		return false
	}
	s.running[name] = struct{}{}
	return true
}

func (s *LepoShipScheduler) leaveLocal(name string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.running, name)
}

func envSchedule(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
