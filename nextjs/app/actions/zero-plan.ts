"use server";

import { createHash, randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { localizedHref, redirect } from "@/i18n/navigation";

import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { buildIntegrationConfig } from "@/lib/server/platform-guardrails";
import { prisma } from "@/lib/server/prisma";

const CAPABILITY_TYPES = new Set([
  "pat_cli_contract",
  "git_preview_engine",
  "speed_insights",
  "edge_routing_cdn",
  "waf_rate_limits",
  "compute_runner",
  "kv_blob_hub",
  "forms_experiments",
  "enterprise_sso_mfa",
  "lepoship_store_delivery",
]);

const RELEASE_CAPABILITIES = new Set([
  "git_preview_engine",
  "compute_runner",
  "lepoship_store_delivery",
]);

const SECURITY_CAPABILITIES = new Set([
  "waf_rate_limits",
  "enterprise_sso_mfa",
  "lepoship_store_delivery",
]);

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function readReturnTo(formData: FormData) {
  return localizedHref(readFormValue(formData, "returnTo") || "/dashboard/zero-plan");
}

function withQueryParam(href: string, key: string, value: string) {
  return `${href}${href.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

function readInt(value: string, fallback: number, min = 0, max = 100000) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.round(numberValue)));
}

async function getEditableBundle(userId: string, projectId: string) {
  await requireProjectRole(userId, projectId, "editor");

  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: {
      id: true,
      name: true,
      bundle: {
        select: {
          id: true,
          name: true,
          version: true,
          buildNumber: true,
        },
      },
    },
  });

  if (!project?.bundle) {
    throw new Error("Project bundle is required.");
  }

  return { project, bundle: project.bundle };
}

async function writeAudit(bundleId: string, userId: string, action: string, value: string) {
  await prisma.bundleAuditLog.create({
    data: {
      id: crypto.randomUUID(),
      bundleId,
      userId,
      action,
      fieldName: "zero_plan",
      oldValue: value,
      createdAt: new Date(),
    },
  });
}

export async function upsertZeroPlanCapabilityAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const capability = readFormValue(formData, "capability");
  const returnTo = await readReturnTo(formData);

  if (!CAPABILITY_TYPES.has(capability)) {
    redirect(withQueryParam(returnTo, "zero", "unsupported_capability"));
  }

  try {
    const { bundle } = await getEditableBundle(user.id, projectId);
    const now = new Date();
    const integration = buildIntegrationConfig(capability, {
      notes: readFormValue(formData, "notes"),
      endpoint: "",
    });
    const patToken =
      capability === "pat_cli_contract"
        ? `lp_pat_${randomBytes(24).toString("hex")}`
        : "";

    await prisma.bundleExternalIntegrations.upsert({
      where: {
        bundleId_integrationType: {
          bundleId: bundle.id,
          integrationType: integration.integrationType,
        },
      },
      create: {
        id: crypto.randomUUID(),
        bundleId: bundle.id,
        integrationType: integration.integrationType,
        displayName: readFormValue(formData, "displayName") || capability,
        config: JSON.stringify({
          ...integration.config,
          phase: readFormValue(formData, "phase"),
          owner: readFormValue(formData, "owner"),
          policy: readFormValue(formData, "policy"),
          command: readFormValue(formData, "command"),
          status: readFormValue(formData, "status") || "configured",
          tokenPreview: patToken ? `${patToken.slice(0, 14)}...` : undefined,
          tokenHash: patToken
            ? createHash("sha256").update(patToken).digest("hex")
            : undefined,
        }),
        isActive: true,
        lastSyncAt: now,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        displayName: readFormValue(formData, "displayName") || capability,
        config: JSON.stringify({
          ...integration.config,
          phase: readFormValue(formData, "phase"),
          owner: readFormValue(formData, "owner"),
          policy: readFormValue(formData, "policy"),
          command: readFormValue(formData, "command"),
          status: readFormValue(formData, "status") || "configured",
          tokenPreview: patToken ? `${patToken.slice(0, 14)}...` : undefined,
          tokenHash: patToken
            ? createHash("sha256").update(patToken).digest("hex")
            : undefined,
        }),
        isActive: true,
        lastSyncAt: now,
        updatedAt: now,
      },
    });

    if (RELEASE_CAPABILITIES.has(capability)) {
      const nextBuildNumber = bundle.buildNumber + 1;
      await prisma.$transaction([
        prisma.bundles.update({
          where: { id: bundle.id },
          data: { buildNumber: nextBuildNumber, updatedAt: now },
        }),
        prisma.bundleReleaseTracks.create({
          data: {
            id: crypto.randomUUID(),
            bundleId: bundle.id,
            track: capability === "git_preview_engine" ? "preview" : "internal",
            version: `${bundle.version}-${capability}.${nextBuildNumber}`,
            buildNumber: nextBuildNumber,
            storagePath: `internal://${capability}/${projectId}/${nextBuildNumber}`,
            releaseNotes:
              readFormValue(formData, "notes") ||
              `${capability} control-plane run queued.`,
            status: "queued",
            createdAt: now,
          },
        }),
      ]);
    }

    await writeAudit(bundle.id, user.id, "zero_capability", capability);
    revalidatePath("/dashboard/zero-plan");
    redirect(withQueryParam(returnTo, "zero", "capability_saved"));
  } catch (error: any) {
    redirect(withQueryParam(returnTo, "zero", error?.message || "capability_failed"));
  }
}

export async function recordZeroPlanSignalAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const capability = readFormValue(formData, "capability");
  const returnTo = await readReturnTo(formData);

  if (!CAPABILITY_TYPES.has(capability)) {
    redirect(withQueryParam(returnTo, "zero", "unsupported_signal"));
  }

  try {
    const { bundle } = await getEditableBundle(user.id, projectId);
    const now = new Date();
    const calls = readInt(readFormValue(formData, "calls"), 1, 0, 1000000);
    const errors = readInt(readFormValue(formData, "errors"), 0, 0, calls);

    await prisma.$transaction([
      prisma.bundleApiUsageStats.create({
        data: {
          id: crypto.randomUUID(),
          bundleId: bundle.id,
          statsDate: now.toISOString().slice(0, 10),
          endpoint: `/${capability}/${readFormValue(formData, "signal") || "snapshot"}`,
          method: readFormValue(formData, "method") || "POST",
          callCount: BigInt(calls),
          errorCount: BigInt(errors),
          avgLatencyMs: readInt(readFormValue(formData, "avgLatencyMs"), 0),
          p99LatencyMs: readInt(readFormValue(formData, "p99LatencyMs"), 0),
          createdAt: now,
        },
      }),
      ...(SECURITY_CAPABILITIES.has(capability)
        ? [
            prisma.bundleSecurityScanResults.create({
              data: {
                id: crypto.randomUUID(),
                bundleId: bundle.id,
                scanType: capability,
                result: errors > 0 ? "warn" : "pass",
                severity: errors > 0 ? "medium" : "low",
                findings:
                  readFormValue(formData, "notes") ||
                  "Internal control-plane validation snapshot.",
                scannedAt: now,
                scannerVersion: "zero-plan-internal",
              },
            }),
          ]
        : []),
    ]);

    await writeAudit(bundle.id, user.id, "zero_signal", capability);
    revalidatePath("/dashboard/zero-plan");
    redirect(withQueryParam(returnTo, "zero", "signal_recorded"));
  } catch (error: any) {
    redirect(withQueryParam(returnTo, "zero", error?.message || "signal_failed"));
  }
}

export async function createZeroPlanWebhookAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = await readReturnTo(formData);

  try {
    const { bundle } = await getEditableBundle(user.id, projectId);
    const now = new Date();

    await prisma.bundleWebhooks.create({
      data: {
        id: crypto.randomUUID(),
        bundleId: bundle.id,
        url: readFormValue(formData, "url") || "internal://zero-plan/forms",
        secret: readFormValue(formData, "secret") || null,
        events:
          readFormValue(formData, "events") ||
          "forms.submission,preview.comment,deploy.hook",
        isActive: true,
        failureCount: 0,
        createdAt: now,
        updatedAt: now,
      },
    });

    await writeAudit(bundle.id, user.id, "zero_webhook", "created");
    revalidatePath("/dashboard/zero-plan");
    redirect(withQueryParam(returnTo, "zero", "webhook_created"));
  } catch (error: any) {
    redirect(withQueryParam(returnTo, "zero", error?.message || "webhook_failed"));
  }
}

export async function createZeroPlanExperimentAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = await readReturnTo(formData);

  try {
    const { bundle } = await getEditableBundle(user.id, projectId);

    await prisma.bundleAbTests.create({
      data: {
        id: crypto.randomUUID(),
        bundleId: bundle.id,
        testName: readFormValue(formData, "testName") || "Zero Plan experiment",
        hypothesis:
          readFormValue(formData, "hypothesis") ||
          "SSR-assigned variants are tracked through internal records.",
        variantAConfig: readFormValue(formData, "variantAConfig") || "{\"path\":\"/\"}",
        variantBConfig:
          readFormValue(formData, "variantBConfig") || "{\"path\":\"/variant\"}",
        metric: readFormValue(formData, "metric") || "conversion",
        trafficSplit: readInt(readFormValue(formData, "trafficSplit"), 50, 1, 99),
        status: "running",
        startedAt: new Date(),
        createdAt: new Date(),
      },
    });

    await writeAudit(bundle.id, user.id, "zero_experiment", "created");
    revalidatePath("/dashboard/zero-plan");
    redirect(withQueryParam(returnTo, "zero", "experiment_created"));
  } catch (error: any) {
    redirect(withQueryParam(returnTo, "zero", error?.message || "experiment_failed"));
  }
}
