package postgres

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"entgo.io/ent/dialect/sql"
	"github.com/google/uuid"
	"github.com/robfig/cron/v3"

	"trading/control-gateway/internal/data/ent/leposhipcronrun"
	"trading/control-gateway/internal/domain/repositories"
)

var lepoCronDefinitions = []lepoCronDefinition{
	{Job: "bundle-abuse", ScheduleEnv: "LEPOS_CRON_BUNDLE_ABUSE", DefaultSchedule: "0 0 * * * *"},
	{Job: "retention-calculator", ScheduleEnv: "LEPOS_CRON_RETENTION", DefaultSchedule: "0 15 1 * * *"},
	{Job: "ab-experiments", ScheduleEnv: "LEPOS_CRON_AB_EXPERIMENTS", DefaultSchedule: "0 */15 * * * *"},
	{Job: "ranking-calculator", ScheduleEnv: "LEPOS_CRON_RANKING", DefaultSchedule: "0 30 0,12 * * *"},
	{Job: "bundle-webhooks", ScheduleEnv: "LEPOS_CRON_BUNDLE_WEBHOOKS", DefaultSchedule: "0 */5 * * * *"},
	{Job: "webhook-retry", ScheduleEnv: "LEPOS_CRON_WEBHOOK_RETRY", DefaultSchedule: "0 */10 * * * *"},
	{Job: "ssl-renew", ScheduleEnv: "LEPOS_CRON_SSL_RENEW", DefaultSchedule: "0 0 3 * * *"},
	{Job: "lepoship-outbox", ScheduleEnv: "LEPOS_CRON_OUTBOX", DefaultSchedule: "0 */2 * * * *"},
	{Job: "lepoship-reconcile", ScheduleEnv: "LEPOS_CRON_RECONCILE", DefaultSchedule: "0 */15 * * * *"},
	{Job: "cleanup-previews", ScheduleEnv: "LEPOS_CRON_CLEANUP_PREVIEWS", DefaultSchedule: "0 0 2 * * *"},
	{Job: "cleanup-waf-logs", ScheduleEnv: "LEPOS_CRON_CLEANUP_WAF", DefaultSchedule: "0 30 2 * * *"},
	{Job: "sync-storage", ScheduleEnv: "LEPOS_CRON_SYNC_STORAGE", DefaultSchedule: "0 0 * * * *"},
}

type lepoCronDefinition struct {
	Job             string
	ScheduleEnv     string
	DefaultSchedule string
}

func (r *LepoShipRepository) RunCronJob(ctx context.Context, name string) (repositories.CronJobResult, error) {
	return r.RunCronJobWithTrigger(ctx, name, "scheduler")
}

func (r *LepoShipRepository) RunCronJobWithTrigger(ctx context.Context, name, trigger string) (repositories.CronJobResult, error) {
	switch name {
	case "bundle-abuse", "retention-calculator", "ab-experiments", "ranking-calculator", "bundle-webhooks", "webhook-retry", "ssl-renew", "lepoship-outbox", "lepoship-reconcile", "cleanup-previews", "cleanup-waf-logs", "sync-storage":
	default:
		return repositories.CronJobResult{}, fmt.Errorf("%w: unknown job %q", ErrBadRequest, name)
	}
	runID := uuid.New()
	startedAt := time.Now().UTC()
	if strings.TrimSpace(trigger) == "" {
		trigger = "scheduler"
	}
	if _, err := r.client.LepoShipCronRun.Create().SetID(runID).SetJob(name).SetStatus("running").SetStartedAt(startedAt).SetTrigger(trigger).Save(ctx); err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("record cron run start: %w", err)
	}
	result, err := r.runCronJobBody(ctx, name)
	finishedAt := time.Now().UTC()
	status, errorMessage := "success", ""
	if err != nil {
		status, errorMessage, result.Job = "failed", err.Error(), name
	}
	update := r.client.LepoShipCronRun.UpdateOneID(runID).SetStatus(status).SetProcessed(result.Processed).SetSkipped(result.Skipped).
		SetMessage(result.Message).SetFinishedAt(finishedAt).SetDurationMs(finishedAt.Sub(startedAt).Milliseconds())
	if errorMessage == "" {
		update.ClearError()
	} else {
		update.SetError(errorMessage)
	}
	if _, updateErr := update.Save(context.Background()); updateErr != nil && err == nil {
		return result, fmt.Errorf("record cron run finish: %w", updateErr)
	}
	return result, err
}

func (r *LepoShipRepository) runCronJobBody(ctx context.Context, name string) (repositories.CronJobResult, error) {
	switch name {
	case "bundle-abuse":
		return r.runBundleAbuse(ctx)
	case "retention-calculator":
		return r.runRetentionCalculator(ctx)
	case "ranking-calculator":
		return r.runRankingCalculator(ctx)
	case "bundle-webhooks":
		return r.runBundleWebhooks(ctx)
	case "lepoship-outbox":
		return r.runOutbox(ctx)
	case "lepoship-reconcile":
		return r.runReconcile(ctx)
	case "webhook-retry":
		return r.runFormWebhookRetry(ctx)
	case "cleanup-waf-logs":
		return r.runCleanupWAFLogs(ctx)
	case "cleanup-previews":
		return r.runCleanupPreviews(ctx)
	case "sync-storage":
		return r.runSyncStorage(ctx)
	case "ssl-renew":
		return r.runSSLRenew(ctx)
	case "ab-experiments":
		return r.runABExperiments(ctx)
	default:
		return repositories.CronJobResult{}, fmt.Errorf("%w: unknown job %q", ErrBadRequest, name)
	}
}

func (r *LepoShipRepository) ListCronJobStatus(ctx context.Context) (repositories.CronJobStatusResponse, error) {
	recent, err := r.listRecentCronRuns(ctx, 100)
	if err != nil {
		return repositories.CronJobStatusResponse{}, err
	}
	latest := map[string]repositories.CronJobRun{}
	for _, run := range recent {
		if _, ok := latest[run.Job]; !ok {
			latest[run.Job] = run
		}
	}
	now := time.Now().UTC()
	jobs := make([]repositories.CronJobStatus, 0, len(lepoCronDefinitions))
	for _, definition := range lepoCronDefinitions {
		schedule := envSchedule(definition.ScheduleEnv, definition.DefaultSchedule)
		status := repositories.CronJobStatus{Job: definition.Job, Schedule: schedule, Enabled: os.Getenv("LEPOS_SCHEDULER_ENABLED") == "true"}
		if next := nextCronRun(schedule, now); next != nil {
			status.NextRunAt = next
		}
		if run, ok := latest[definition.Job]; ok {
			copy := run
			status.LatestRun = &copy
		}
		jobs = append(jobs, status)
	}
	return repositories.CronJobStatusResponse{Jobs: jobs, RecentRuns: recent}, nil
}

func (r *LepoShipRepository) listRecentCronRuns(ctx context.Context, limit int) ([]repositories.CronJobRun, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	rows, err := r.client.LepoShipCronRun.Query().Order(leposhipcronrun.ByStartedAt(sql.OrderDesc())).Limit(limit).All(ctx)
	if err != nil {
		return nil, fmt.Errorf("list cron runs: %w", err)
	}
	result := make([]repositories.CronJobRun, 0, len(rows))
	for _, row := range rows {
		result = append(result, repositories.CronJobRun{ID: row.ID, Job: row.Job, Status: row.Status, Processed: row.Processed, Skipped: row.Skipped, Message: row.Message, Error: stringValue(row.Error), StartedAt: row.StartedAt, FinishedAt: row.FinishedAt, DurationMS: row.DurationMs, Trigger: row.Trigger})
	}
	return result, nil
}

func envSchedule(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func nextCronRun(schedule string, now time.Time) *time.Time {
	parser := cron.NewParser(cron.Second | cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow | cron.Descriptor)
	parsed, err := parser.Parse(schedule)
	if err != nil {
		return nil
	}
	next := parsed.Next(now)
	return &next
}
