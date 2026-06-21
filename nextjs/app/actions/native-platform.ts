"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "@/i18n/navigation";

import { deleteArtifactMirror, publishArtifactMirror } from "@/lib/server/native-platform/artifact-mirrors";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";
import { purgeNativeCache } from "@/lib/server/native-platform/cache";
import { createAiDiagnostic } from "@/lib/server/native-platform/diagnostics";
import { activateNativeDeployment, syncProjectRouting } from "@/lib/server/native-platform/deployments";
import { recordSchedulingSignal, upsertSchedulingPolicy } from "@/lib/server/native-platform/finops";
import { uploadSourceMap } from "@/lib/server/native-platform/telemetry";
import {
  approveRemediationRun,
  createRemediationRun,
  executeRemediationRun,
} from "@/lib/server/native-platform/remediation";
import { upsertRegionReplica, upsertRoutingPolicy } from "@/lib/server/native-platform/routing";
import { renewDomainSsl } from "@/lib/server/native-platform/ssl";
import { createWafRule } from "@/lib/server/native-platform/waf-engine";
import {
  ingestTelemetryEnvelope,
  upsertServiceIdentity,
  upsertTrustPolicy,
} from "@/lib/server/native-platform/zero-trust";
import {
  installNativePlugin,
  toggleNativePlugin,
  uninstallNativePlugin,
  upsertNativePlugin,
} from "@/lib/server/native-platform/plugins";

function readFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(formData: FormData, key: string, fallback = false): boolean {
  const value = readFormValue(formData, key).toLowerCase();
  if (!value) {
    return fallback;
  }
  return value === "true" || value === "1" || value === "on" || value === "yes";
}

function readNullableNumber(formData: FormData, key: string): number | null {
  const value = readFormValue(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readStringList(formData: FormData, key: string) {
  return readFormValue(formData, key)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function rollbackNativeDeploymentAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const deploymentId = readFormValue(formData, "deploymentId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=deployments`;

  if (!projectId || !deploymentId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "admin");
  await activateNativeDeployment(projectId, deploymentId);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function createNativeDomainAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const domain = readFormValue(formData, "domain");
  const dnsProvider = readFormValue(formData, "dnsProvider") || null;
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=domains`;

  if (!projectId || !domain) {
    redirect(returnTo);
  }

  // Parse credentials
  let dnsCredentials: Record<string, any> | null = null;
  if (dnsProvider) {
    dnsCredentials = {};
    if (dnsProvider === "CLOUDFLARE") {
      dnsCredentials.cloudflareToken = readFormValue(formData, "cloudflareToken");
    } else if (dnsProvider === "ROUTE53") {
      dnsCredentials.awsAccessKeyId = readFormValue(formData, "awsAccessKeyId");
      dnsCredentials.awsSecretAccessKey = readFormValue(formData, "awsSecretAccessKey");
    } else if (dnsProvider === "GODADDY") {
      dnsCredentials.godaddyApiKey = readFormValue(formData, "godaddyApiKey");
      dnsCredentials.godaddyApiSecret = readFormValue(formData, "godaddyApiSecret");
    }
  }

  await requireProjectRole(user.id, projectId, "editor");
  await prisma.nativeDomainConfig.upsert({
    where: { domain },
    create: {
      projectId,
      domain,
      txtRecordToken: `lepos-domain-${crypto.randomUUID()}`,
      dnsProvider,
      dnsCredentials: dnsCredentials ? (dnsCredentials as any) : undefined,
    },
    update: {
      dnsProvider,
      dnsCredentials: dnsCredentials ? (dnsCredentials as any) : undefined,
      lastDnsCheckAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await syncProjectRouting(projectId);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function purgeNativeCacheAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const path = readFormValue(formData, "path") || "/";
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  await purgeNativeCache(projectId, path);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function runNativeDiagnosticAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const crashReportId = readFormValue(formData, "crashReportId") || undefined;
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  await createAiDiagnostic({ projectId, crashReportId });
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function upsertNativeSourceMapAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const releaseVersion = readFormValue(formData, "releaseVersion");
  const fileName = readFormValue(formData, "fileName");
  const storagePath = readFormValue(formData, "storagePath") || undefined;
  const mapJsonRaw = readFormValue(formData, "mapJson");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId || !releaseVersion || !fileName || !mapJsonRaw) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");

  let mapJson: unknown;
  try {
    mapJson = JSON.parse(mapJsonRaw);
  } catch {
    throw new Error("Source map JSON is invalid.");
  }

  await uploadSourceMap({
    projectId,
    releaseVersion,
    fileName,
    storagePath,
    mapJson,
  });

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function deleteNativeSourceMapAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const sourceMapId = readFormValue(formData, "sourceMapId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId || !sourceMapId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  await prisma.nativeSourceMap.deleteMany({
    where: {
      id: sourceMapId,
      projectId,
    },
  });

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function setNativeWafSensitivityAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const level = readFormValue(formData, "level").toLowerCase();
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId || !["low", "medium", "high", "paranoid"].includes(level)) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");

  const existingRule = await prisma.nativeWafRule.findFirst({
    where: {
      projectId,
      type: "rate-limit",
      name: "security-sensitivity",
    },
  });

  const payload = {
    action: level === "paranoid" ? "block" : "challenge",
    pattern: `sensitivity:${level}`,
    description: `Preset sensitivity profile managed from native platform UI (${level}).`,
    enabled: true,
    updatedAt: new Date(),
  };

  if (existingRule) {
    await prisma.nativeWafRule.update({
      where: { id: existingRule.id },
      data: payload,
    });
  } else {
    await createWafRule({
      projectId,
      name: "security-sensitivity",
      action: payload.action,
      type: "rate-limit",
      pattern: payload.pattern,
      description: payload.description,
    });
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function upsertNativeRoutingPolicyAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  await upsertRoutingPolicy(projectId, {
    strategy: readFormValue(formData, "strategy") || undefined,
    consistency: readFormValue(formData, "consistency") || undefined,
    stickySessions: readBoolean(formData, "stickySessions", false),
    manualFailback: readBoolean(formData, "manualFailback", false),
    snapshotTtlSeconds: readNullableNumber(formData, "snapshotTtlSeconds") ?? undefined,
    failoverThresholdMs: readNullableNumber(formData, "failoverThresholdMs") ?? undefined,
    latencyProbeIntervalSeconds: readNullableNumber(formData, "latencyProbeIntervalSeconds") ?? undefined,
    preferredRegions: readStringList(formData, "preferredRegions"),
  });
  await syncProjectRouting(projectId);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function upsertNativeRegionReplicaAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  await upsertRegionReplica({
    projectId,
    region: readFormValue(formData, "region"),
    provider: readFormValue(formData, "provider") || "edge",
    deploymentId: readFormValue(formData, "deploymentId") || null,
    endpoint: readFormValue(formData, "endpoint") || null,
    bundleUrl: readFormValue(formData, "bundleUrl") || null,
    storagePath: readFormValue(formData, "storagePath") || null,
    healthStatus: readFormValue(formData, "healthStatus") || "healthy",
    drainState: readFormValue(formData, "drainState") || "accepting",
    latencyMs: readNullableNumber(formData, "latencyMs"),
    trafficPercent: readNullableNumber(formData, "trafficPercent") ?? 0,
    isPrimary: readBoolean(formData, "isPrimary", false),
    replicationVersion: readFormValue(formData, "replicationVersion") || null,
  });
  await syncProjectRouting(projectId);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function publishNativeArtifactMirrorAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const deploymentId = readFormValue(formData, "deploymentId");
  const provider = readFormValue(formData, "provider") as "ipfs" | "arweave";
  const policy = readFormValue(formData, "policy") as "web2-only" | "hybrid" | "decentralized-preferred";
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId || !deploymentId || !provider) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  await publishArtifactMirror({
    projectId,
    deploymentId,
    provider,
    policy,
    requestedBy: user.id,
  });
  await syncProjectRouting(projectId);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function deleteNativeArtifactMirrorAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const mirrorId = readFormValue(formData, "mirrorId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId || !mirrorId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  await deleteArtifactMirror(projectId, mirrorId);
  await syncProjectRouting(projectId);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function createNativeRemediationRunAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;
  const dryRun = readBoolean(formData, "dryRun", false);
  const mode = (readFormValue(formData, "mode") || "suggest") as "observe" | "suggest" | "approve" | "auto-apply";

  if (!projectId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  const run = await createRemediationRun({
    projectId,
      actionType: readFormValue(formData, "actionType") as
      | "cache_purge"
      | "routing_refresh"
      | "deployment_rollback"
      | "replica_drain",
    mode,
    summary: readFormValue(formData, "summary") || "Native remediation run",
    diagnosticId: readFormValue(formData, "diagnosticId") || null,
    dryRun,
    requestedByUserId: user.id,
      payload: {
      path: readFormValue(formData, "path") || undefined,
      deploymentId: readFormValue(formData, "deploymentId") || undefined,
      region: readFormValue(formData, "region") || undefined,
      drainState: readFormValue(formData, "drainState") || undefined,
    },
  });

  if (mode === "auto-apply") {
    await executeRemediationRun(run.id, user.id);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function approveNativeRemediationRunAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const runId = readFormValue(formData, "runId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId || !runId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  await approveRemediationRun(runId, user.id);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function executeNativeRemediationRunAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const runId = readFormValue(formData, "runId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId || !runId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  await executeRemediationRun(runId, user.id);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function upsertNativeSchedulingPolicyAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  await upsertSchedulingPolicy({
    projectId,
    enabled: readBoolean(formData, "enabled", false),
    mode: readFormValue(formData, "mode") || "observe",
    costProvider: readFormValue(formData, "costProvider") || null,
    carbonProvider: readFormValue(formData, "carbonProvider") || null,
    defaultWorkloadClass: readFormValue(formData, "defaultWorkloadClass") || "interactive",
    deferrableWindowStart: readFormValue(formData, "deferrableWindowStart") || null,
    deferrableWindowEnd: readFormValue(formData, "deferrableWindowEnd") || null,
    maxCarbonIntensity: readNullableNumber(formData, "maxCarbonIntensity"),
    maxCostScore: readNullableNumber(formData, "maxCostScore"),
  });
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function recordNativeSchedulingSignalAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  await recordSchedulingSignal({
    projectId,
    signalType: readFormValue(formData, "signalType") || "carbon_intensity",
    source: readFormValue(formData, "source") || "manual",
    region: readFormValue(formData, "region") || null,
    value: readNullableNumber(formData, "value") ?? 0,
    unit: readFormValue(formData, "unit") || null,
    metadata: {
      recordedBy: user.id,
    },
  });
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function upsertNativeServiceIdentityAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "admin");
  await upsertServiceIdentity({
    projectId,
    serviceName: readFormValue(formData, "serviceName"),
    role: readFormValue(formData, "role") || "internal",
    scopes: readStringList(formData, "scopes"),
    mtlsMode: (readFormValue(formData, "mtlsMode") || "optional") as "disabled" | "optional" | "required",
    status: readFormValue(formData, "status") || "active",
    sharedSecret: readFormValue(formData, "sharedSecret") || null,
    certificateFingerprint: readFormValue(formData, "certificateFingerprint") || null,
    metadata: {
      managedBy: user.id,
    },
  });
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function upsertNativeServiceTrustPolicyAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "admin");
  await upsertTrustPolicy({
    projectId,
    sourceService: readFormValue(formData, "sourceService"),
    targetService: readFormValue(formData, "targetService"),
    allowedScopes: readStringList(formData, "allowedScopes"),
        enforceMtls: readBoolean(formData, "enforceMtls", false),
        allowSharedKeyFallback: readBoolean(formData, "allowSharedKeyFallback", false),
    status: readFormValue(formData, "status") || "active",
    metadata: {
      managedBy: user.id,
    },
  });
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function ingestNativeTelemetryEnvelopeAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  await ingestTelemetryEnvelope({
    projectId,
    serviceName: readFormValue(formData, "serviceName") || null,
    kind: readFormValue(formData, "kind") || "aggregate_metric",
    encryptionMode: readFormValue(formData, "encryptionMode") || "aggregate",
    aggregateKey: readFormValue(formData, "aggregateKey") || null,
    redactedSummary: {
      note: readFormValue(formData, "summary") || "manual ingest",
      recordedBy: user.id,
    },
    metadata: {
      source: "manual-control-plane-ingest",
    },
    rawPayload: {
      summary: readFormValue(formData, "summary") || "manual ingest",
    },
  });
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function renewNativeDomainSslAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const domainId = readFormValue(formData, "domainId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=domains`;

  if (!projectId || !domainId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  await renewDomainSsl(domainId);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function submitNativePluginAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  const slug = readFormValue(formData, "slug");
  const name = readFormValue(formData, "name");
  const version = readFormValue(formData, "version") || "0.1.0";
  const bundleUrl = readFormValue(formData, "bundleUrl");
  const description = readFormValue(formData, "description");
  const permissionsRaw = readFormValue(formData, "permissions");
  const permissions = permissionsRaw ? permissionsRaw.split(",").map((p) => p.trim()).filter(Boolean) : [];

  if (!slug || !name || !bundleUrl) {
    redirect(returnTo);
  }

  if (projectId) {
    await requireProjectRole(user.id, projectId, "editor");
  }

  await upsertNativePlugin({
    slug,
    name,
    version,
    bundleUrl,
    description,
    permissions,
  });

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function installNativePluginAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const pluginId = readFormValue(formData, "pluginId");
  const configRaw = readFormValue(formData, "config");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId || !pluginId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");

  let config: any = null;
  if (configRaw) {
    try {
      config = JSON.parse(configRaw);
    } catch {
      config = { value: configRaw };
    }
  }

  await installNativePlugin(projectId, pluginId, config);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function uninstallNativePluginAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const pluginId = readFormValue(formData, "pluginId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId || !pluginId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");

  await uninstallNativePlugin(projectId, pluginId);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function toggleNativePluginAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const pluginId = readFormValue(formData, "pluginId");
  const enabled = readFormValue(formData, "enabled") === "true";
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId || !pluginId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");

  await toggleNativePlugin(projectId, pluginId, enabled);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function checkCloudTargetsHealthAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  const { checkCloudTargetsHealth } = await import("@/lib/server/native-platform/failover");
  await checkCloudTargetsHealth(projectId);

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function toggleCloudTargetHealthAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const targetId = readFormValue(formData, "targetId");
  const enabledVal = readFormValue(formData, "enabled");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!projectId || !targetId) {
    redirect(returnTo);
  }

  await requireProjectRole(user.id, projectId, "editor");
  const { toggleCloudTargetHealth } = await import("@/lib/server/native-platform/failover");

  let status: "healthy" | "unhealthy" | "overloaded" = "healthy";
  if (enabledVal === "healthy" || enabledVal === "unhealthy" || enabledVal === "overloaded") {
    status = enabledVal;
  } else {
    status = enabledVal === "true" ? "healthy" : "unhealthy";
  }

  await toggleCloudTargetHealth(projectId, targetId, status);

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function reviewNativePluginAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const pluginId = readFormValue(formData, "pluginId");
  const status = readFormValue(formData, "status"); // 'approved', 'rejected', 'pending'
  const notes = readFormValue(formData, "notes");
  const returnTo = readFormValue(formData, "returnTo") || `/projects/${projectId}?tab=native`;

  if (!pluginId || !status) {
    redirect(returnTo);
  }

  if (projectId) {
    await requireProjectRole(user.id, projectId, "editor");
  }

  const plugin = await prisma.nativePlugin.findUnique({
    where: { id: pluginId }
  });

  if (plugin) {
    const existingMetadata = typeof plugin.metadata === "object" && plugin.metadata !== null ? (plugin.metadata as Record<string, any>) : {};
    const updatedMetadata = {
      ...existingMetadata,
      status,
      reviewedBy: user.email || user.id,
      reviewedAt: new Date().toISOString(),
      notes: notes || undefined
    };

    await prisma.nativePlugin.update({
      where: { id: pluginId },
      data: {
        metadata: updatedMetadata
      }
    });
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}
