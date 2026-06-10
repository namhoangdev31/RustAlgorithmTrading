import { prisma } from "@/lib/server/prisma";
import { getWorkspaceContext } from "@/lib/server/workspace";

export const ZERO_PLAN_PHASES = [
  {
    phase: "Phase 9",
    capability: "pat_cli_contract",
    title: "Internal CLI & PAT Contracts",
    summary: "PAT hashing, CLI command contracts, and no public API v1 exposure.",
  },
  {
    phase: "Phase 10",
    capability: "git_preview_engine",
    title: "Git Preview Automation",
    summary: "GitHub-backed preview records and internal deployment queue.",
  },
  {
    phase: "Phase 11",
    capability: "speed_insights",
    title: "Speed Insights Telemetry",
    summary: "Core Web Vitals snapshots stored as Prisma usage records.",
  },
  {
    phase: "Phase 12",
    capability: "edge_routing_cdn",
    title: "Edge Routing & CDN Controls",
    summary: "Domain, SSL, and cache-purge policy tracked as internal config.",
  },
  {
    phase: "Phase 13",
    capability: "waf_rate_limits",
    title: "WAF & Rate Limits",
    summary: "Firewall policy and DDoS validation snapshots without Redis dependency.",
  },
  {
    phase: "Phase 14",
    capability: "compute_runner",
    title: "Compute Runner",
    summary: "Function packaging, runtime logs, and runner state as control-plane data.",
  },
  {
    phase: "Phase 15",
    capability: "kv_blob_hub",
    title: "KV & Blob Hub",
    summary: "Storage namespace and file explorer contracts without external buckets.",
  },
  {
    phase: "Phase 16",
    capability: "forms_experiments",
    title: "Forms & A/B Experiments",
    summary: "Static form registry, webhook hooks, and SSR-side experiments.",
  },
  {
    phase: "Phase 17",
    capability: "enterprise_sso_mfa",
    title: "Enterprise SSO, MFA & Comments",
    summary: "SSO/MFA/preview comment configuration as internal enterprise controls.",
  },
  {
    phase: "Phase 18",
    capability: "lepoship_store_delivery",
    title: "LepoShip Signing & Store Delivery",
    summary: "Signing/distribution contracts without Apple or Google API calls.",
  },
] as const;

const ZERO_CAPABILITIES = ZERO_PLAN_PHASES.map((phase) => phase.capability);

export async function getZeroPlanControlPlane(userId: string) {
  const workspace = await getWorkspaceContext(userId);
  const organizationId = workspace.activeOrganization?.id;

  if (!organizationId) {
    return {
      workspace,
      projects: [],
      phases: ZERO_PLAN_PHASES.map((phase) => ({ ...phase, configured: false })),
      metrics: {
        configured: 0,
        releaseRuns: 0,
        telemetrySignals: 0,
        securitySignals: 0,
        webhooks: 0,
        experiments: 0,
      },
      capabilities: [],
      releases: [],
      telemetry: [],
      security: [],
      webhooks: [],
      experiments: [],
    };
  }

  const projects = await prisma.project.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      bundle: {
        select: {
          id: true,
          name: true,
          version: true,
          buildNumber: true,
          status: true,
        },
      },
    },
  });
  const bundleIds = projects.flatMap((project) =>
    project.bundle ? [project.bundle.id] : []
  );

  const [
    capabilities,
    releases,
    telemetry,
    security,
    webhooks,
    experiments,
  ] = await Promise.all([
    prisma.bundleExternalIntegrations.findMany({
      where: {
        bundleId: { in: bundleIds },
        integrationType: { in: ZERO_CAPABILITIES },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        integrationType: true,
        displayName: true,
        isActive: true,
        updatedAt: true,
        bundle: { select: { name: true } },
      },
    }),
    prisma.bundleReleaseTracks.findMany({
      where: {
        bundleId: { in: bundleIds },
        storagePath: { startsWith: "internal://" },
      },
      orderBy: { createdAt: "desc" },
      take: 16,
      select: {
        id: true,
        track: true,
        version: true,
        status: true,
        createdAt: true,
        bundle: { select: { name: true } },
      },
    }),
    prisma.bundleApiUsageStats.findMany({
      where: { bundleId: { in: bundleIds } },
      orderBy: { createdAt: "desc" },
      take: 16,
      select: {
        id: true,
        endpoint: true,
        method: true,
        callCount: true,
        errorCount: true,
        avgLatencyMs: true,
        statsDate: true,
        bundle: { select: { name: true } },
      },
    }),
    prisma.bundleSecurityScanResults.findMany({
      where: { bundleId: { in: bundleIds } },
      orderBy: { scannedAt: "desc" },
      take: 16,
      select: {
        id: true,
        scanType: true,
        result: true,
        severity: true,
        scannedAt: true,
        bundle: { select: { name: true } },
      },
    }),
    prisma.bundleWebhooks.findMany({
      where: { bundleId: { in: bundleIds } },
      orderBy: { updatedAt: "desc" },
      take: 16,
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        failureCount: true,
        bundle: { select: { name: true } },
      },
    }),
    prisma.bundleAbTests.findMany({
      where: { bundleId: { in: bundleIds } },
      orderBy: { createdAt: "desc" },
      take: 16,
      select: {
        id: true,
        testName: true,
        metric: true,
        trafficSplit: true,
        status: true,
        bundle: { select: { name: true } },
      },
    }),
  ]);

  const configuredSet = new Set(
    capabilities.map((capability) => capability.integrationType)
  );

  return {
    workspace,
    projects,
    phases: ZERO_PLAN_PHASES.map((phase) => ({
      ...phase,
      configured: configuredSet.has(phase.capability),
    })),
    metrics: {
      configured: configuredSet.size,
      releaseRuns: releases.length,
      telemetrySignals: telemetry.length,
      securitySignals: security.length,
      webhooks: webhooks.length,
      experiments: experiments.length,
    },
    capabilities,
    releases,
    telemetry,
    security,
    webhooks,
    experiments,
  };
}
