"use server";

import { revalidatePath } from "next/cache";
import { localizedHref, redirect } from "@/i18n/navigation";

import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { buildIntegrationConfig } from "@/lib/server/platform-guardrails";
import { prisma } from "@/lib/server/prisma";

const PLATFORM_CONFIG_TYPES = new Set([
  "deployment_pipeline",
  "preview_deployments",
  "dx_contracts",
  "edge_functions",
  "image_optimization",
  "form_handling",
  "enterprise_controls",
  "marketplace_registry",
  "monitoring_dashboard",
  "status_page",
]);

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function readReturnTo(formData: FormData) {
  return localizedHref(readFormValue(formData, "returnTo") || "/dashboard/platform");
}

function withQueryParam(href: string, key: string, value: string) {
  return `${href}${href.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

function readPercent(value: string, fallback = 50) {
  const percent = Number(value);
  if (!Number.isFinite(percent)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(percent)));
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
      fieldName: "platform_control_plane",
      oldValue: value,
      createdAt: new Date(),
    },
  });
}

export async function createInternalDeploymentAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = await readReturnTo(formData);

  try {
    const { bundle } = await getEditableBundle(user.id, projectId);
    const target = readFormValue(formData, "target") === "production" ? "production" : "preview";
    const nextBuildNumber = bundle.buildNumber + 1;
    const version = `${bundle.version}-${target}.${nextBuildNumber}`;
    const now = new Date();

    await prisma.$transaction([
      prisma.bundles.update({
        where: { id: bundle.id },
        data: { buildNumber: nextBuildNumber, updatedAt: now },
      }),
      prisma.bundleReleaseTracks.create({
        data: {
          id: crypto.randomUUID(),
          bundleId: bundle.id,
          track: target,
          version,
          buildNumber: nextBuildNumber,
          storagePath: `internal://${target}/${projectId}/${nextBuildNumber}`,
          releaseNotes:
            readFormValue(formData, "releaseNotes") ||
            `${target} deployment queued by LepoS control plane.`,
          status: "queued",
          createdAt: now,
        },
      }),
      prisma.bundleApiUsageStats.create({
        data: {
          id: crypto.randomUUID(),
          bundleId: bundle.id,
          statsDate: now.toISOString().slice(0, 10),
          endpoint: `/deployments/${target}`,
          method: "POST",
          callCount: BigInt(1),
          errorCount: BigInt(0),
          avgLatencyMs: 0,
          p99LatencyMs: 0,
          createdAt: now,
        },
      }),
    ]);

    await writeAudit(bundle.id, user.id, "deployment_queued", version);
    revalidatePath("/dashboard/platform");
    redirect(withQueryParam(returnTo, "platform", "deployment_queued"));
  } catch (error: any) {
    redirect(withQueryParam(returnTo, "platform", error?.message || "deployment_failed"));
  }
}

export async function upsertPlatformConfigAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const configType = readFormValue(formData, "configType");
  const returnTo = await readReturnTo(formData);

  if (!PLATFORM_CONFIG_TYPES.has(configType)) {
    redirect(withQueryParam(returnTo, "platform", "unsupported_config"));
  }

  try {
    const { bundle } = await getEditableBundle(user.id, projectId);
    const integration = buildIntegrationConfig(configType, {
      notes: readFormValue(formData, "notes"),
      endpoint: "",
    });
    const now = new Date();

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
        displayName: readFormValue(formData, "displayName") || configType,
        config: JSON.stringify({
          ...integration.config,
          branch: readFormValue(formData, "branch"),
          command: readFormValue(formData, "command"),
          policy: readFormValue(formData, "policy"),
        }),
        isActive: readFormValue(formData, "isActive") !== "false",
        lastSyncAt: now,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        displayName: readFormValue(formData, "displayName") || configType,
        config: JSON.stringify({
          ...integration.config,
          branch: readFormValue(formData, "branch"),
          command: readFormValue(formData, "command"),
          policy: readFormValue(formData, "policy"),
        }),
        isActive: readFormValue(formData, "isActive") !== "false",
        lastSyncAt: now,
        updatedAt: now,
      },
    });

    await writeAudit(bundle.id, user.id, "platform_config_saved", configType);
    revalidatePath("/dashboard/platform");
    redirect(withQueryParam(returnTo, "platform", "config_saved"));
  } catch (error: any) {
    redirect(withQueryParam(returnTo, "platform", error?.message || "config_failed"));
  }
}

export async function createFeatureFlagAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = await readReturnTo(formData);

  try {
    const { bundle } = await getEditableBundle(user.id, projectId);
    const now = new Date();

    await prisma.bundleAbTests.create({
      data: {
        id: crypto.randomUUID(),
        bundleId: bundle.id,
        testName: readFormValue(formData, "testName") || "Feature flag",
        hypothesis: readFormValue(formData, "hypothesis") || null,
        variantAConfig: readFormValue(formData, "variantAConfig") || "{}",
        variantBConfig: readFormValue(formData, "variantBConfig") || "{}",
        metric: readFormValue(formData, "metric") || "activation",
        trafficSplit: readPercent(readFormValue(formData, "trafficSplit")),
        status: readFormValue(formData, "status") || "draft",
        startedAt: readFormValue(formData, "status") === "running" ? now : null,
        createdAt: now,
      },
    });

    await writeAudit(bundle.id, user.id, "feature_flag_created", readFormValue(formData, "testName"));
    revalidatePath("/dashboard/platform");
    redirect(withQueryParam(returnTo, "platform", "feature_created"));
  } catch (error: any) {
    redirect(withQueryParam(returnTo, "platform", error?.message || "feature_failed"));
  }
}

export async function upsertWebhookAction(formData: FormData) {
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
        url: readFormValue(formData, "url") || "internal://deployment-status",
        secret: readFormValue(formData, "secret") || null,
        events: readFormValue(formData, "events") || "deployment.created,deployment.ready",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    });

    await writeAudit(bundle.id, user.id, "webhook_registered", readFormValue(formData, "events"));
    revalidatePath("/dashboard/platform");
    redirect(withQueryParam(returnTo, "platform", "webhook_saved"));
  } catch (error: any) {
    redirect(withQueryParam(returnTo, "platform", error?.message || "webhook_failed"));
  }
}

export async function upsertMarketplaceAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = await readReturnTo(formData);

  try {
    const { bundle } = await getEditableBundle(user.id, projectId);
    const now = new Date();
    const region = readFormValue(formData, "region") || "global";

    await prisma.$transaction([
      prisma.bundleStoreListings.upsert({
        where: {
          bundleId_region: {
            bundleId: bundle.id,
            region,
          },
        },
        create: {
          id: crypto.randomUUID(),
          bundleId: bundle.id,
          region,
          name: readFormValue(formData, "listingName") || bundle.name,
          shortDescription: readFormValue(formData, "shortDescription") || null,
          description: readFormValue(formData, "description") || null,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        update: {
          name: readFormValue(formData, "listingName") || bundle.name,
          shortDescription: readFormValue(formData, "shortDescription") || null,
          description: readFormValue(formData, "description") || null,
          isActive: true,
          updatedAt: now,
        },
      }),
      prisma.bundleStoreFlags.upsert({
        where: { bundleId: bundle.id },
        create: {
          id: crypto.randomUUID(),
          bundleId: bundle.id,
          isFeatured: readFormValue(formData, "isFeatured") === "on",
          isVerified: readFormValue(formData, "isVerified") === "on",
          isEditorChoice: readFormValue(formData, "isEditorChoice") === "on",
          updatedAt: now,
        },
        update: {
          isFeatured: readFormValue(formData, "isFeatured") === "on",
          isVerified: readFormValue(formData, "isVerified") === "on",
          isEditorChoice: readFormValue(formData, "isEditorChoice") === "on",
          updatedAt: now,
        },
      }),
    ]);

    await writeAudit(bundle.id, user.id, "marketplace_listing_saved", region);
    revalidatePath("/dashboard/platform");
    redirect(withQueryParam(returnTo, "platform", "marketplace_saved"));
  } catch (error: any) {
    redirect(withQueryParam(returnTo, "platform", error?.message || "marketplace_failed"));
  }
}

export async function recordMonitoringSnapshotAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = await readReturnTo(formData);

  try {
    const { bundle } = await getEditableBundle(user.id, projectId);
    const now = new Date();
    const errorCount = BigInt(Number(readFormValue(formData, "errorCount")) || 0);

    await prisma.$transaction([
      prisma.bundleApiUsageStats.create({
        data: {
          id: crypto.randomUUID(),
          bundleId: bundle.id,
          statsDate: now.toISOString().slice(0, 10),
          endpoint: readFormValue(formData, "endpoint") || "/",
          method: readFormValue(formData, "method") || "GET",
          callCount: BigInt(Number(readFormValue(formData, "callCount")) || 1),
          errorCount,
          avgLatencyMs: Number(readFormValue(formData, "avgLatencyMs")) || 0,
          p99LatencyMs: Number(readFormValue(formData, "p99LatencyMs")) || 0,
          createdAt: now,
        },
      }),
      prisma.bundleSecurityScanResults.create({
        data: {
          id: crypto.randomUUID(),
          bundleId: bundle.id,
          scanType: "release_guard",
          result: errorCount > BigInt(0) ? "warn" : "pass",
          severity: errorCount > BigInt(0) ? "medium" : "info",
          findings: readFormValue(formData, "findings") || null,
          scannedAt: now,
          scannerVersion: "lepos-control-plane-v1",
        },
      }),
    ]);

    await writeAudit(bundle.id, user.id, "monitoring_snapshot_recorded", readFormValue(formData, "endpoint"));
    revalidatePath("/dashboard/platform");
    redirect(withQueryParam(returnTo, "platform", "monitoring_recorded"));
  } catch (error: any) {
    redirect(withQueryParam(returnTo, "platform", error?.message || "monitoring_failed"));
  }
}
