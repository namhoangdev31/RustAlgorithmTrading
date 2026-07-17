package executor

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	verificationapp "trading/control-gateway/internal/modules/verification/application"
	"trading/control-gateway/internal/modules/verification/domain"
	shared "trading/control-gateway/internal/shared/application"
)

const buildExecutorGroup = "lepoship-build-executor-v1"

type permanentEventError struct{ error }

type Worker struct {
	redis    *redis.Client
	service  *verificationapp.Service
	runner   *EngineRunner
	builds   *BuildRunner
	consumer string
	heavy    chan struct{}
	wg       sync.WaitGroup
}

func NewWorker(redisClient *redis.Client, service *verificationapp.Service, runner *EngineRunner, builds *BuildRunner) *Worker {
	host, _ := os.Hostname()
	if host == "" {
		host = "lepoship-worker"
	}
	limit := 1
	if limitStr := os.Getenv("LEPOSHIP_CONCURRENCY_LIMIT"); limitStr != "" {
		if val, err := strconv.Atoi(limitStr); err == nil && val > 0 {
			limit = val
		}
	}
	return &Worker{
		redis:    redisClient,
		service:  service,
		runner:   runner,
		builds:   builds,
		consumer: host + ":" + uuid.NewString(),
		heavy:    make(chan struct{}, limit),
	}
}

func (w *Worker) Run(ctx context.Context) error {
	if w.redis == nil || w.service == nil || w.runner == nil {
		return errors.New("LepoShip Go worker requires Redis, verification service and engine runner")
	}
	for _, group := range []string{domain.ExecutorGroup, buildExecutorGroup} {
		if err := w.redis.XGroupCreateMkStream(ctx, domain.StreamName, group, "0").Err(); err != nil && !strings.Contains(err.Error(), "BUSYGROUP") {
			return fmt.Errorf("create Redis Stream group %s: %w", group, err)
		}
	}
	errorsCh := make(chan error, 2)
	w.wg.Add(2)
	go func() {
		defer w.wg.Done()
		errorsCh <- w.consume(ctx, domain.ExecutorGroup, "verification.task.dispatched.v1", w.runVerification)
	}()
	go func() {
		defer w.wg.Done()
		errorsCh <- w.consume(ctx, buildExecutorGroup, "bundle.build_requested.v1", w.runBuild)
	}()
	select {
	case <-ctx.Done():
		w.wg.Wait()
		return nil
	case err := <-errorsCh:
		return err
	}
}

func (w *Worker) consume(ctx context.Context, group, eventType string, handle func(context.Context, shared.Event) error) error {
	for ctx.Err() == nil {
		reclaimed, _, err := w.redis.XAutoClaim(ctx, &redis.XAutoClaimArgs{Stream: domain.StreamName, Group: group, Consumer: w.consumer, MinIdle: 60 * time.Second, Start: "0-0", Count: 1}).Result()
		if err != nil && !errors.Is(err, redis.Nil) {
			return fmt.Errorf("reclaim %s: %w", group, err)
		}
		if len(reclaimed) > 0 {
			w.process(ctx, group, eventType, reclaimed[0], handle)
			continue
		}
		streams, err := w.redis.XReadGroup(ctx, &redis.XReadGroupArgs{Group: group, Consumer: w.consumer, Streams: []string{domain.StreamName, ">"}, Count: 1, Block: 5 * time.Second}).Result()
		if errors.Is(err, redis.Nil) {
			continue
		}
		if err != nil {
			if ctx.Err() != nil {
				return nil
			}
			return fmt.Errorf("read %s: %w", group, err)
		}
		for _, stream := range streams {
			for _, message := range stream.Messages {
				w.process(ctx, group, eventType, message, handle)
			}
		}
	}
	return nil
}

func (w *Worker) process(ctx context.Context, group, eventType string, message redis.XMessage, handle func(context.Context, shared.Event) error) {
	raw := fmt.Sprint(message.Values["payload"])
	var event shared.Event
	if err := json.Unmarshal([]byte(raw), &event); err != nil {
		slog.Error("lepoship_worker_event_invalid", "group", group, "message_id", message.ID, "error", err)
		_ = w.redis.XAck(ctx, domain.StreamName, group, message.ID).Err()
		return
	}
	if event.Type != eventType {
		_ = w.redis.XAck(ctx, domain.StreamName, group, message.ID).Err()
		return
	}
	w.heavy <- struct{}{}
	err := handle(ctx, event)
	<-w.heavy
	if err != nil {
		slog.Error("lepoship_worker_event_failed", "group", group, "event_type", event.Type, "event_key", event.EventKey, "error", err)
		var permanent permanentEventError
		if !errors.As(err, &permanent) {
			return
		}
	}
	if err := w.redis.XAck(ctx, domain.StreamName, group, message.ID).Err(); err != nil {
		slog.Error("lepoship_worker_ack_failed", "group", group, "message_id", message.ID, "error", err)
	}
}

func (w *Worker) runVerification(ctx context.Context, event shared.Event) error {
	var dispatch domain.Dispatch
	if err := json.Unmarshal(event.Payload, &dispatch); err != nil || dispatch.AttemptID == "" || dispatch.LeaseOwner == "" {
		return permanentEventError{errors.New("invalid verification dispatch")}
	}
	deadline := dispatch.DeadlineAt
	if deadline.IsZero() {
		deadline = time.Now().Add(15 * time.Minute)
	}
	taskCtx, cancel := context.WithDeadline(ctx, deadline)
	defer cancel()
	workspace, err := os.MkdirTemp("", "lepoship-verification-"+dispatch.AttemptID+"-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(workspace)
	archive := workspace + "/full.zip"
	started := time.Now().UTC()
	result := domain.ResultEnvelope{}
	if err := w.runner.store.Download(taskCtx, dispatch.Artifact, archive); err != nil {
		result = domain.ResultEnvelope{SchemaVersion: "verification-result.v1", AttemptID: dispatch.AttemptID, LeaseOwner: dispatch.LeaseOwner, EngineDigest: dispatch.EngineDigest, ArtifactChecksum: dispatch.Artifact.ChecksumSHA256, Status: "infrastructure_failed", Findings: []domain.Finding{}, Evidence: []domain.Evidence{}, Metrics: map[string]float64{}, StartedAt: started, CompletedAt: time.Now().UTC(), ErrorCode: "ARTIFACT_DOWNLOAD_FAILED", ErrorMessage: err.Error()}
	} else {
		heartbeatDone := make(chan struct{})
		go func() {
			ticker := time.NewTicker(20 * time.Second)
			defer ticker.Stop()
			for {
				select {
				case <-heartbeatDone:
					return
				case <-taskCtx.Done():
					return
				case <-ticker.C:
					_ = w.service.Heartbeat(context.Background(), dispatch.AttemptID, dispatch.LeaseOwner)
				}
			}
		}()
		result = w.runner.Execute(taskCtx, dispatch, archive, workspace)
		close(heartbeatDone)
	}
	_, _, err = w.service.AcceptResult(ctx, result)
	if err != nil && (strings.Contains(err.Error(), "lease is invalid or expired") || strings.Contains(err.Error(), "attempt already has a different terminal result")) {
		return permanentEventError{err}
	}
	return err
}

func (w *Worker) runBuild(ctx context.Context, event shared.Event) error {
	if w.builds == nil {
		return errors.New("Go build runner is not configured")
	}
	return w.builds.Execute(ctx, event.EventKey, event.Payload)
}
