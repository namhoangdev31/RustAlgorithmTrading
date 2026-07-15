package scheduler

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/robfig/cron/v3"

	application "trading/control-gateway/internal/modules/distribution/application"
)

type Scheduler struct {
	cron    *cron.Cron
	runner  application.CronRunner
	lock    application.DistributedLock
	mu      sync.Mutex
	running map[string]struct{}
	config  Config
}

type Config struct {
	Enabled   bool
	HostID    string
	Schedules map[string]string
}

func New(runner application.CronRunner, lock application.DistributedLock, config Config) *Scheduler {
	return &Scheduler{
		cron:    cron.New(cron.WithLocation(time.UTC), cron.WithSeconds()),
		runner:  runner,
		lock:    lock,
		running: map[string]struct{}{},
		config:  config,
	}
}

func (s *Scheduler) RegisterDefaults() error {
	jobs := s.config.Schedules
	for name, spec := range jobs {
		jobName := name
		if _, err := s.cron.AddFunc(spec, func() { s.Run(context.Background(), jobName) }); err != nil {
			return err
		}
	}
	return nil
}

func (s *Scheduler) Start() {
	if !s.config.Enabled {
		slog.Info("lepoship_scheduler_disabled")
		return
	}
	s.cron.Start()
	slog.Info("lepoship_scheduler_started")
}

func (s *Scheduler) Stop() {
	ctx := s.cron.Stop()
	<-ctx.Done()
	slog.Info("lepoship_scheduler_stopped")
}

func (s *Scheduler) Run(ctx context.Context, name string) {
	start := time.Now()
	if !s.enterLocal(name) {
		slog.Info("lepoship_cron_skipped_local_lock", "job", name)
		return
	}
	defer s.leaveLocal(name)

	lockKey := "lepos:cron-lock:" + name
	if s.lock != nil {
		release, ok, err := s.lock.Acquire(ctx, lockKey, s.config.HostID, 15*time.Minute)
		if err != nil || !ok {
			slog.Info("lepoship_cron_skipped_distributed_lock", "job", name, "error", err)
			return
		}
		defer release()
	}
	result, err := s.runner.RunCronJob(ctx, name)
	if err != nil {
		slog.Error("lepoship_cron_failed", "job", name, "duration_ms", time.Since(start).Milliseconds(), "error", err)
		return
	}
	slog.Info("lepoship_cron_finished", "job", name, "duration_ms", time.Since(start).Milliseconds(), "processed", result.Processed, "skipped", result.Skipped, "message", result.Message)
}

func (s *Scheduler) enterLocal(name string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.running[name]; ok {
		return false
	}
	s.running[name] = struct{}{}
	return true
}

func (s *Scheduler) leaveLocal(name string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.running, name)
}
