package application

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"trading/control-gateway/internal/modules/verification/domain"
	shared "trading/control-gateway/internal/shared/application"
)

type ReportStore interface {
	Put(context.Context, domain.TerminalSnapshot) (domain.ReportRef, error)
}

type Repository interface {
	StartRun(context.Context, string, string, domain.VerificationRequest) (string, bool, error)
	ClaimReady(context.Context, string, int) ([]domain.Dispatch, error)
	RecoverExpired(context.Context) ([]string, error)
	AcceptResult(context.Context, domain.ResultEnvelope, string) (string, bool, error)
	RetryRequest(context.Context, string) (domain.VerificationRequest, error)
	Cancel(context.Context, string) error
	Heartbeat(context.Context, string, string) error
	RunJSON(context.Context, string) (json.RawMessage, error)
	ReleaseJSON(context.Context, string) (json.RawMessage, error)
	TasksJSON(context.Context, string) (json.RawMessage, error)
	FindingsJSON(context.Context, string) (json.RawMessage, error)
	ReportJSON(context.Context, string) (json.RawMessage, error)
	Advance(context.Context, string) (*domain.TerminalSnapshot, error)
	Finalize(context.Context, domain.TerminalSnapshot, domain.ReportRef) error
}

type Service struct {
	repository Repository
	redis      *redis.Client
	reports    ReportStore
	consumer   string
}

func New(repository Repository, redisClient *redis.Client, reports ReportStore) *Service {
	host, _ := os.Hostname()
	if host == "" {
		host = "verification-orchestrator"
	}
	return &Service{repository: repository, redis: redisClient, reports: reports, consumer: host + ":" + uuid.NewString()}
}

func (s *Service) Run(ctx context.Context) error {
	if s.redis == nil {
		return errors.New("verification orchestration requires the existing Redis service")
	}
	if err := s.ensureGroup(ctx); err != nil {
		return err
	}
	consumerErrors := make(chan error, 1)
	go func() { consumerErrors <- s.consume(ctx) }()

	batchSize := 10
	if val := os.Getenv("LEPOSHIP_SCHEDULER_BATCH_SIZE"); val != "" {
		if limit, err := strconv.Atoi(val); err == nil && limit > 0 {
			batchSize = limit
		}
	}

	scheduleTicker := time.NewTicker(time.Second)
	recoveryTicker := time.NewTicker(30 * time.Second)
	defer scheduleTicker.Stop()
	defer recoveryTicker.Stop()
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case err := <-consumerErrors:
			return err
		case <-scheduleTicker.C:
			if _, err := s.repository.ClaimReady(ctx, s.consumer, batchSize); err != nil {
				slog.Error("verification_dispatch_failed", "error", err)
			}
		case <-recoveryTicker.C:
			runs, err := s.repository.RecoverExpired(ctx)
			if err != nil {
				slog.Error("verification_recovery_failed", "error", err)
				continue
			}
			for _, runID := range runs {
				if err := s.advance(ctx, runID); err != nil {
					slog.Error("verification_advance_failed", "run_id", runID, "error", err)
				}
			}
		}
	}
}

func (s *Service) AcceptResult(ctx context.Context, result domain.ResultEnvelope) (string, bool, error) {
	if err := result.Validate(); err != nil {
		return "", false, err
	}
	encoded, err := json.Marshal(result)
	if err != nil {
		return "", false, err
	}
	digest := sha256.Sum256(encoded)
	runID, accepted, err := s.repository.AcceptResult(ctx, result, hex.EncodeToString(digest[:]))
	if err != nil {
		return "", false, err
	}
	if err := s.advance(ctx, runID); err != nil {
		return runID, accepted, err
	}
	return runID, accepted, nil
}

func (s *Service) RetryRelease(ctx context.Context, releaseID, idempotencyKey string) (string, bool, error) {
	if idempotencyKey == "" {
		return "", false, errors.New("Idempotency-Key is required")
	}
	req, err := s.repository.RetryRequest(ctx, releaseID)
	if err != nil {
		return "", false, err
	}
	eventKey := "release.verification_retry.v1:" + releaseID + ":" + idempotencyKey
	return s.repository.StartRun(ctx, eventKey, eventKey, req)
}

func (s *Service) Cancel(ctx context.Context, runID string) error {
	return s.repository.Cancel(ctx, runID)
}
func (s *Service) Heartbeat(ctx context.Context, attemptID, leaseOwner string) error {
	return s.repository.Heartbeat(ctx, attemptID, leaseOwner)
}
func (s *Service) RunJSON(ctx context.Context, runID string) (json.RawMessage, error) {
	return s.repository.RunJSON(ctx, runID)
}
func (s *Service) ReleaseJSON(ctx context.Context, releaseID string) (json.RawMessage, error) {
	return s.repository.ReleaseJSON(ctx, releaseID)
}
func (s *Service) TasksJSON(ctx context.Context, runID string) (json.RawMessage, error) {
	return s.repository.TasksJSON(ctx, runID)
}
func (s *Service) FindingsJSON(ctx context.Context, runID string) (json.RawMessage, error) {
	return s.repository.FindingsJSON(ctx, runID)
}
func (s *Service) ReportJSON(ctx context.Context, runID string) (json.RawMessage, error) {
	return s.repository.ReportJSON(ctx, runID)
}

func (s *Service) advance(ctx context.Context, runID string) error {
	if runID == "" {
		return nil
	}
	snapshot, err := s.repository.Advance(ctx, runID)
	if err != nil || snapshot == nil {
		return err
	}
	if s.reports == nil {
		return errors.New("verification report storage is unavailable")
	}
	if !snapshot.InfrastructureFailure {
		policyResult, policyErr := domain.EvaluatePolicy(ctx, snapshot.PolicyDefinition, snapshot.Findings, boolToInt(snapshot.RequiredFailure), snapshot.Overall, snapshot.Confidence)
		if policyErr != nil {
			return policyErr
		}
		snapshot.Decision = policyResult.Decision
		snapshot.PolicyResults = policyResult
	}
	if snapshot.InfrastructureFailure {
		snapshot.Status = "incomplete"
	} else {
		snapshot.Status = "completed"
	}
	report, err := s.reports.Put(ctx, *snapshot)
	if err != nil {
		return err
	}
	return s.repository.Finalize(ctx, *snapshot, report)
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}

func (s *Service) ensureGroup(ctx context.Context) error {
	err := s.redis.XGroupCreateMkStream(ctx, domain.StreamName, domain.OrchestratorGroup, "0").Err()
	if err != nil && !strings.Contains(err.Error(), "BUSYGROUP") {
		return fmt.Errorf("create verification consumer group: %w", err)
	}
	return nil
}

func (s *Service) consume(ctx context.Context) error {
	for {
		reclaimed, _, claimErr := s.redis.XAutoClaim(ctx, &redis.XAutoClaimArgs{Stream: domain.StreamName, Group: domain.OrchestratorGroup, Consumer: s.consumer, MinIdle: 60 * time.Second, Start: "0-0", Count: 10}).Result()
		if claimErr != nil && !errors.Is(claimErr, redis.Nil) {
			return fmt.Errorf("reclaim verification stream: %w", claimErr)
		}
		if err := s.processMessages(ctx, reclaimed); err != nil {
			return err
		}
		streams, err := s.redis.XReadGroup(ctx, &redis.XReadGroupArgs{Group: domain.OrchestratorGroup, Consumer: s.consumer, Streams: []string{domain.StreamName, ">"}, Count: 10, Block: 5 * time.Second}).Result()
		if err != nil {
			if errors.Is(err, redis.Nil) {
				continue
			}
			if ctx.Err() != nil {
				return ctx.Err()
			}
			return fmt.Errorf("read verification stream: %w", err)
		}
		for _, stream := range streams {
			if err := s.processMessages(ctx, stream.Messages); err != nil {
				return err
			}
		}
	}
}

func (s *Service) processMessages(ctx context.Context, messages []redis.XMessage) error {
	for _, message := range messages {
		if err := s.consumeMessage(ctx, message); err != nil {
			slog.Error("verification_event_failed", "message_id", message.ID, "error", err)
			continue
		}
		if err := s.redis.XAck(ctx, domain.StreamName, domain.OrchestratorGroup, message.ID).Err(); err != nil {
			return err
		}
	}
	return nil
}

func (s *Service) consumeMessage(ctx context.Context, message redis.XMessage) error {
	raw, ok := message.Values["payload"].(string)
	if !ok || raw == "" {
		return errors.New("redis message has no event payload")
	}
	var event shared.Event
	if err := json.Unmarshal([]byte(raw), &event); err != nil {
		return fmt.Errorf("decode event envelope: %w", err)
	}
	if event.Type != "release.verification_requested.v1" {
		return nil
	}
	var req domain.VerificationRequest
	if err := json.Unmarshal(event.Payload, &req); err != nil {
		return fmt.Errorf("decode verification request: %w", err)
	}
	if req.SchemaVersion != 1 {
		return errors.New("unsupported verification request schema")
	}
	_, _, err := s.repository.StartRun(ctx, message.ID, event.EventKey, req)
	return err
}
