-- Developer Portal Phase 2 additive schema.
-- Existing installations historically used db push, so every operation is idempotent.

ALTER TABLE IF EXISTS "forms"
  ADD COLUMN IF NOT EXISTS "definition" JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS "lepoship_local_configs"
  ADD COLUMN IF NOT EXISTS "repository" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "branch" TEXT NOT NULL DEFAULT 'main',
  ADD COLUMN IF NOT EXISTS "framework" TEXT NOT NULL DEFAULT 'nextjs',
  ADD COLUMN IF NOT EXISTS "buildProfile" TEXT NOT NULL DEFAULT 'production';

CREATE TABLE IF NOT EXISTS "organization_memberships" (
  "id" TEXT PRIMARY KEY,
  "organization_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role" VARCHAR(30) NOT NULL DEFAULT 'viewer',
  "invite_status" TEXT NOT NULL DEFAULT 'accepted',
  "invited_by_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_memberships_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "organization_memberships_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "organization_memberships_organization_id_user_id_key"
  ON "organization_memberships"("organization_id", "user_id");

CREATE TABLE IF NOT EXISTS "project_memberships" (
  "id" TEXT PRIMARY KEY,
  "project_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role" VARCHAR(30) NOT NULL DEFAULT 'viewer',
  "invite_status" TEXT NOT NULL DEFAULT 'accepted',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_memberships_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "project_memberships_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "project_memberships_project_id_user_id_key"
  ON "project_memberships"("project_id", "user_id");

CREATE TABLE IF NOT EXISTS "workspace_provider_connections" (
  "id" TEXT PRIMARY KEY,
  "organization_id" UUID NOT NULL,
  "provider" VARCHAR(64) NOT NULL,
  "encrypted_credential" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'connected',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspace_provider_connections_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "workspace_provider_connections_organization_id_provider_key"
  ON "workspace_provider_connections"("organization_id", "provider");

CREATE TABLE IF NOT EXISTS "project_provider_bindings" (
  "id" TEXT PRIMARY KEY,
  "project_id" UUID NOT NULL,
  "connection_id" TEXT NOT NULL,
  "external_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_provider_bindings_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "project_provider_bindings_connection_id_fkey"
    FOREIGN KEY ("connection_id") REFERENCES "workspace_provider_connections"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "project_provider_bindings_project_id_connection_id_key"
  ON "project_provider_bindings"("project_id", "connection_id");

CREATE TABLE IF NOT EXISTS "workspace_audit_events" (
  "id" TEXT PRIMARY KEY,
  "workspace_id" UUID NOT NULL,
  "actor_id" UUID NOT NULL,
  "actor_email" TEXT NOT NULL,
  "action" VARCHAR(128) NOT NULL,
  "resource_type" VARCHAR(64) NOT NULL,
  "resource_id" VARCHAR(128),
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "workspace_audit_events_workspace_id_timestamp_idx"
  ON "workspace_audit_events"("workspace_id", "timestamp" DESC);

CREATE TABLE IF NOT EXISTS "lepoship_builds" (
  "id" TEXT PRIMARY KEY,
  "project_id" UUID NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "source_commit" VARCHAR(64) NOT NULL,
  "platform" VARCHAR(32) NOT NULL,
  "logs" TEXT,
  "artifact_url" TEXT,
  "error" TEXT,
  "triggered_by_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lepoship_builds_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "lepoship_builds_triggered_by_id_fkey"
    FOREIGN KEY ("triggered_by_id") REFERENCES "users"("id") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "lepoship_builds_project_id_created_at_idx"
  ON "lepoship_builds"("project_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "marketplace_compatibility_runs" (
  "id" TEXT PRIMARY KEY,
  "integration_id" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "check_results" JSONB NOT NULL,
  "logs" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "marketplace_compatibility_runs_integration_id_created_at_idx"
  ON "marketplace_compatibility_runs"("integration_id", "created_at" DESC);

-- Backfill owners and legacy bundle collaborators without changing legacy tables.
INSERT INTO "organization_memberships" (
  "id", "organization_id", "user_id", "role", "invite_status", "created_at", "updated_at"
)
SELECT 'orgmem_' || md5(o."id"::text || ':' || o."user_id"::text),
       o."id", o."user_id", 'owner', 'accepted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "organizations" o
ON CONFLICT ("organization_id", "user_id") DO UPDATE SET "role" = 'owner', "invite_status" = 'accepted';

INSERT INTO "project_memberships" (
  "id", "project_id", "user_id", "role", "invite_status", "created_at", "updated_at"
)
SELECT 'prjmem_' || md5(p."id"::text || ':' || bc."user_id"::text),
       p."id", bc."user_id", bc."role",
       CASE WHEN bc."accepted_at" IS NULL THEN 'pending' ELSE 'accepted' END,
       bc."created_at", CURRENT_TIMESTAMP
FROM "bundle_collaborators" bc
JOIN "bundles" b ON b."id" = bc."bundle_id"
JOIN "projects" p ON p."id" = b."project_id"
ON CONFLICT ("project_id", "user_id") DO NOTHING;

INSERT INTO "organization_memberships" (
  "id", "organization_id", "user_id", "role", "invite_status", "created_at", "updated_at"
)
SELECT 'orgmem_' || md5(p."organization_id"::text || ':' || bc."user_id"::text),
       p."organization_id", bc."user_id",
       CASE
         WHEN bool_or(bc."role" = 'admin') THEN 'admin'
         WHEN bool_or(bc."role" = 'editor') THEN 'editor'
         ELSE 'viewer'
       END,
       CASE WHEN bool_or(bc."accepted_at" IS NOT NULL) THEN 'accepted' ELSE 'pending' END,
       min(bc."created_at"), CURRENT_TIMESTAMP
FROM "bundle_collaborators" bc
JOIN "bundles" b ON b."id" = bc."bundle_id"
JOIN "projects" p ON p."id" = b."project_id"
GROUP BY p."organization_id", bc."user_id"
ON CONFLICT ("organization_id", "user_id") DO NOTHING;
