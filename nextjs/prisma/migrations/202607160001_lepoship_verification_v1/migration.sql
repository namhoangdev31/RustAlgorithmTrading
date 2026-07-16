-- CreateEnum
CREATE TYPE "VerificationRunStatus" AS ENUM ('queued', 'running', 'scoring', 'evaluating', 'completed', 'incomplete', 'cancelled');

-- CreateEnum
CREATE TYPE "VerificationDecision" AS ENUM ('allow', 'warn', 'review', 'reject');

-- CreateEnum
CREATE TYPE "VerificationTaskStatus" AS ENUM ('queued', 'ready', 'dispatched', 'running', 'succeeded', 'bundle_failed', 'infrastructure_failed', 'timed_out', 'cancelled', 'dead_lettered');

-- CreateEnum
CREATE TYPE "VerificationAttemptStatus" AS ENUM ('dispatched', 'running', 'succeeded', 'failed', 'timed_out', 'cancelled');

-- CreateEnum
CREATE TYPE "VerificationEnforcementMode" AS ENUM ('legacy', 'shadow', 'enforce');

-- AlterTable
ALTER TABLE "bundle_releases" ADD COLUMN     "eligible_verification_run_id" UUID;

-- CreateTable
CREATE TABLE "verification_pipeline_versions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "version" INTEGER NOT NULL,
    "definition" JSONB NOT NULL,
    "definition_hash" VARCHAR(64) NOT NULL,
    "enforcement_mode" "VerificationEnforcementMode" NOT NULL DEFAULT 'shadow',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "verification_pipeline_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_engine_versions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "image_digest" VARCHAR(128) NOT NULL,
    "manifest" JSONB NOT NULL,
    "configuration_schema" JSONB,
    "result_schema_version" VARCHAR(50) NOT NULL DEFAULT 'verification-result.v1',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "approved_at" TIMESTAMP(6),
    "revoked_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "verification_engine_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_policy_versions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "version" INTEGER NOT NULL,
    "definition" JSONB NOT NULL,
    "definition_hash" VARCHAR(64) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "effective_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "verification_policy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_runs" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "bundle_id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "artifact_id" UUID NOT NULL,
    "artifact_checksum" VARCHAR(64) NOT NULL,
    "trigger_event_key" VARCHAR(255) NOT NULL,
    "pipeline_version_id" UUID NOT NULL,
    "policy_version_id" UUID NOT NULL,
    "scoring_version" VARCHAR(30) NOT NULL DEFAULT 'v1',
    "status" "VerificationRunStatus" NOT NULL DEFAULT 'queued',
    "decision" "VerificationDecision",
    "overall_score" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "completeness" DOUBLE PRECISION,
    "error_code" VARCHAR(100),
    "error_message" TEXT,
    "started_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "verification_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tasks" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "engine_version_id" UUID NOT NULL,
    "node_id" VARCHAR(100) NOT NULL,
    "resource_class" VARCHAR(30) NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "status" "VerificationTaskStatus" NOT NULL DEFAULT 'queued',
    "configuration" JSONB,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 2,
    "timeout_seconds" INTEGER NOT NULL DEFAULT 900,
    "next_attempt_at" TIMESTAMP(6),
    "accepted_attempt_id" UUID,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "verification_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_task_dependencies" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "prerequisite_id" UUID NOT NULL,

    CONSTRAINT "verification_task_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_attempts" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "attempt_no" INTEGER NOT NULL,
    "status" "VerificationAttemptStatus" NOT NULL DEFAULT 'dispatched',
    "worker_id" VARCHAR(128),
    "lease_owner" VARCHAR(128),
    "leased_until" TIMESTAMP(6),
    "heartbeat_at" TIMESTAMP(6),
    "deadline_at" TIMESTAMP(6) NOT NULL,
    "started_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),
    "error_code" VARCHAR(100),
    "error_message" TEXT,
    "result_digest" VARCHAR(64),
    "metrics" JSONB,
    "coverage" DOUBLE PRECISION,
    "completeness" DOUBLE PRECISION,
    "reproducibility" DOUBLE PRECISION,
    "engine_health" DOUBLE PRECISION,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "verification_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_findings" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "attempt_id" UUID,
    "fingerprint" VARCHAR(128) NOT NULL,
    "dimension" VARCHAR(40) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "rule_id" VARCHAR(150) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "location" JSONB,
    "remediation" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "verification_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_evidence" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "attempt_id" UUID,
    "kind" VARCHAR(50) NOT NULL,
    "storage_provider" VARCHAR(30) NOT NULL,
    "storage_bucket" VARCHAR(100) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "checksum_sha256" VARCHAR(64) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "content_type" VARCHAR(100) NOT NULL,
    "sensitivity" VARCHAR(30) NOT NULL DEFAULT 'restricted',
    "created_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "verification_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_scores" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "version" VARCHAR(30) NOT NULL,
    "dimensions" JSONB NOT NULL,
    "overall" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "verification_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_policy_evaluations" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "policy_version_id" UUID NOT NULL,
    "input_digest" VARCHAR(64) NOT NULL,
    "decision" "VerificationDecision" NOT NULL,
    "results" JSONB NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "verification_policy_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_reports" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "schema_version" VARCHAR(30) NOT NULL,
    "storage_provider" VARCHAR(30) NOT NULL,
    "storage_bucket" VARCHAR(100) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "checksum_sha256" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "verification_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_inbox" (
    "id" UUID NOT NULL,
    "consumer" VARCHAR(100) NOT NULL,
    "message_id" VARCHAR(255) NOT NULL,
    "outcome" VARCHAR(50),
    "processed_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "verification_inbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_telemetry_events" (
    "id" UUID NOT NULL,
    "event_id" VARCHAR(255) NOT NULL,
    "project_id" UUID NOT NULL,
    "run_id" UUID,
    "kind" VARCHAR(100) NOT NULL,
    "correlation_id" VARCHAR(128),
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "verification_telemetry_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_metric_rollups" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "metric" VARCHAR(100) NOT NULL,
    "scope" VARCHAR(100) NOT NULL,
    "window_start" TIMESTAMP(6) NOT NULL,
    "window_end" TIMESTAMP(6) NOT NULL,
    "count" INTEGER NOT NULL,
    "sum" DOUBLE PRECISION NOT NULL,
    "min" DOUBLE PRECISION NOT NULL,
    "max" DOUBLE PRECISION NOT NULL,
    "p95" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "verification_metric_rollups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_alerts" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "rule_id" VARCHAR(100) NOT NULL,
    "scope" VARCHAR(100) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'open',
    "severity" VARCHAR(20) NOT NULL,
    "first_seen_at" TIMESTAMP(6) NOT NULL,
    "last_seen_at" TIMESTAMP(6) NOT NULL,
    "acknowledged_at" TIMESTAMP(6),
    "acknowledged_by" UUID,
    "resolved_at" TIMESTAMP(6),
    "details" JSONB,

    CONSTRAINT "verification_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verification_pipeline_versions_definition_hash_key" ON "verification_pipeline_versions"("definition_hash");

-- CreateIndex
CREATE INDEX "verification_pipeline_versions_active" ON "verification_pipeline_versions"("is_active", "enforcement_mode");

-- CreateIndex
CREATE UNIQUE INDEX "verification_pipeline_versions_name_version_key" ON "verification_pipeline_versions"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "verification_engine_versions_image_digest_key" ON "verification_engine_versions"("image_digest");

-- CreateIndex
CREATE INDEX "verification_engine_versions_active" ON "verification_engine_versions"("name", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "verification_engine_versions_name_version_key" ON "verification_engine_versions"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "verification_policy_versions_definition_hash_key" ON "verification_policy_versions"("definition_hash");

-- CreateIndex
CREATE INDEX "verification_policy_versions_active" ON "verification_policy_versions"("is_active", "effective_at");

-- CreateIndex
CREATE UNIQUE INDEX "verification_policy_versions_name_version_key" ON "verification_policy_versions"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "verification_runs_trigger_event_key_key" ON "verification_runs"("trigger_event_key");

-- CreateIndex
CREATE INDEX "verification_runs_release_time" ON "verification_runs"("release_id", "created_at");

-- CreateIndex
CREATE INDEX "verification_runs_status_time" ON "verification_runs"("status", "created_at");

-- CreateIndex
CREATE INDEX "verification_runs_project_time" ON "verification_runs"("project_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tasks_accepted_attempt_id_key" ON "verification_tasks"("accepted_attempt_id");

-- CreateIndex
CREATE INDEX "verification_tasks_ready" ON "verification_tasks"("status", "next_attempt_at", "resource_class");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tasks_run_id_node_id_key" ON "verification_tasks"("run_id", "node_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_task_dependencies_task_id_prerequisite_id_key" ON "verification_task_dependencies"("task_id", "prerequisite_id");

-- CreateIndex
CREATE INDEX "verification_attempts_recovery" ON "verification_attempts"("status", "leased_until");

-- CreateIndex
CREATE UNIQUE INDEX "verification_attempts_task_id_attempt_no_key" ON "verification_attempts"("task_id", "attempt_no");

-- CreateIndex
CREATE INDEX "verification_findings_run_severity" ON "verification_findings"("run_id", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "verification_findings_run_id_task_id_fingerprint_key" ON "verification_findings"("run_id", "task_id", "fingerprint");

-- CreateIndex
CREATE INDEX "verification_evidence_run_kind" ON "verification_evidence"("run_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "verification_evidence_storage_provider_storage_bucket_stora_key" ON "verification_evidence"("storage_provider", "storage_bucket", "storage_key");

-- CreateIndex
CREATE UNIQUE INDEX "verification_scores_run_id_key" ON "verification_scores"("run_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_policy_evaluations_run_id_key" ON "verification_policy_evaluations"("run_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_reports_run_id_key" ON "verification_reports"("run_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_reports_storage_provider_storage_bucket_storag_key" ON "verification_reports"("storage_provider", "storage_bucket", "storage_key");

-- CreateIndex
CREATE INDEX "verification_inbox_processed" ON "verification_inbox"("processed_at");

-- CreateIndex
CREATE UNIQUE INDEX "verification_inbox_consumer_message_id_key" ON "verification_inbox"("consumer", "message_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_telemetry_events_event_id_key" ON "verification_telemetry_events"("event_id");

-- CreateIndex
CREATE INDEX "verification_telemetry_project_time" ON "verification_telemetry_events"("project_id", "occurred_at");

-- CreateIndex
CREATE INDEX "verification_telemetry_run_time" ON "verification_telemetry_events"("run_id", "occurred_at");

-- CreateIndex
CREATE INDEX "verification_rollups_project_time" ON "verification_metric_rollups"("project_id", "window_start");

-- CreateIndex
CREATE UNIQUE INDEX "verification_metric_rollups_project_id_metric_scope_window__key" ON "verification_metric_rollups"("project_id", "metric", "scope", "window_start");

-- CreateIndex
CREATE INDEX "verification_alerts_project_status" ON "verification_alerts"("project_id", "status", "last_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "verification_alerts_project_id_rule_id_scope_status_key" ON "verification_alerts"("project_id", "rule_id", "scope", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_releases_eligible_verification_run_id_key" ON "bundle_releases"("eligible_verification_run_id");

-- AddForeignKey
ALTER TABLE "bundle_releases" ADD CONSTRAINT "bundle_releases_eligible_verification_run_id_fkey" FOREIGN KEY ("eligible_verification_run_id") REFERENCES "verification_runs"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_runs" ADD CONSTRAINT "verification_runs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_runs" ADD CONSTRAINT "verification_runs_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bundles"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_runs" ADD CONSTRAINT "verification_runs_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "bundle_releases"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_runs" ADD CONSTRAINT "verification_runs_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "bundle_artifacts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_runs" ADD CONSTRAINT "verification_runs_pipeline_version_id_fkey" FOREIGN KEY ("pipeline_version_id") REFERENCES "verification_pipeline_versions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_runs" ADD CONSTRAINT "verification_runs_policy_version_id_fkey" FOREIGN KEY ("policy_version_id") REFERENCES "verification_policy_versions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_tasks" ADD CONSTRAINT "verification_tasks_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "verification_runs"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_tasks" ADD CONSTRAINT "verification_tasks_engine_version_id_fkey" FOREIGN KEY ("engine_version_id") REFERENCES "verification_engine_versions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_tasks" ADD CONSTRAINT "verification_tasks_accepted_attempt_id_fkey" FOREIGN KEY ("accepted_attempt_id") REFERENCES "verification_attempts"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_task_dependencies" ADD CONSTRAINT "verification_task_dependencies_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "verification_tasks"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_task_dependencies" ADD CONSTRAINT "verification_task_dependencies_prerequisite_id_fkey" FOREIGN KEY ("prerequisite_id") REFERENCES "verification_tasks"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_attempts" ADD CONSTRAINT "verification_attempts_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "verification_tasks"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_findings" ADD CONSTRAINT "verification_findings_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "verification_runs"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_findings" ADD CONSTRAINT "verification_findings_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "verification_tasks"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_findings" ADD CONSTRAINT "verification_findings_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "verification_attempts"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_evidence" ADD CONSTRAINT "verification_evidence_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "verification_runs"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_evidence" ADD CONSTRAINT "verification_evidence_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "verification_tasks"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_evidence" ADD CONSTRAINT "verification_evidence_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "verification_attempts"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_scores" ADD CONSTRAINT "verification_scores_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "verification_runs"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_policy_evaluations" ADD CONSTRAINT "verification_policy_evaluations_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "verification_runs"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_policy_evaluations" ADD CONSTRAINT "verification_policy_evaluations_policy_version_id_fkey" FOREIGN KEY ("policy_version_id") REFERENCES "verification_policy_versions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_reports" ADD CONSTRAINT "verification_reports_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "verification_runs"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_telemetry_events" ADD CONSTRAINT "verification_telemetry_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_telemetry_events" ADD CONSTRAINT "verification_telemetry_events_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "verification_runs"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_metric_rollups" ADD CONSTRAINT "verification_metric_rollups_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "verification_alerts" ADD CONSTRAINT "verification_alerts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE RESTRICT;
