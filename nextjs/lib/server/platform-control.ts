import { prisma } from "@/lib/server/prisma";
import { getWorkspaceContext } from "@/lib/server/workspace";

export async function getPlatformControlPlane(userId: string) {
  const workspace = await getWorkspaceContext(userId);
  const organizationId = workspace.activeOrganization?.id;

  if (!organizationId) {
    return {
      workspace,
      projects: [],
      metrics: {
        releases: 0,
        previewReleases: 0,
        featureFlags: 0,
        webhooks: 0,
        integrations: 0,
        unresolvedCrashes: 0,
        securityFindings: 0,
        apiErrors: 0,
      },
      recentReleases: [],
      featureFlags: [],
      webhooks: [],
      integrations: [],
      apiUsage: [],
      crashReports: [],
      securityScans: [],
    };
  }

  const projects = await prisma.project.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      vercelProjectId: true,
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
    recentReleases,
    featureFlags,
    webhooks,
    integrations,
    apiUsage,
    crashReports,
    securityScans,
    previewReleases,
  ] = await Promise.all([
    prisma.bundleReleaseTracks.findMany({
      where: { bundleId: { in: bundleIds } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        bundleId: true,
        track: true,
        version: true,
        buildNumber: true,
        status: true,
        createdAt: true,
        bundle: { select: { name: true } },
      },
    }),
    prisma.bundleAbTests.findMany({
      where: { bundleId: { in: bundleIds } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        testName: true,
        metric: true,
        trafficSplit: true,
        status: true,
        bundle: { select: { name: true } },
      },
    }),
    prisma.bundleWebhooks.findMany({
      where: { bundleId: { in: bundleIds } },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        failureCount: true,
        bundle: { select: { name: true } },
      },
    }),
    prisma.bundleExternalIntegrations.findMany({
      where: { bundleId: { in: bundleIds } },
      orderBy: { updatedAt: "desc" },
      take: 16,
      select: {
        id: true,
        integrationType: true,
        displayName: true,
        isActive: true,
        updatedAt: true,
        bundle: { select: { name: true } },
      },
    }),
    prisma.bundleApiUsageStats.findMany({
      where: { bundleId: { in: bundleIds } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        endpoint: true,
        method: true,
        callCount: true,
        errorCount: true,
        avgLatencyMs: true,
        p99LatencyMs: true,
        statsDate: true,
        bundle: { select: { name: true } },
      },
    }),
    prisma.bundleCrashReports.findMany({
      where: { bundleId: { in: bundleIds }, isResolved: false },
      orderBy: { lastSeen: "desc" },
      take: 8,
      select: {
        id: true,
        platform: true,
        occurrenceCount: true,
        affectedUsers: true,
        stackTraceHash: true,
        bundle: { select: { name: true } },
      },
    }),
    prisma.bundleSecurityScanResults.findMany({
      where: { bundleId: { in: bundleIds } },
      orderBy: { scannedAt: "desc" },
      take: 8,
      select: {
        id: true,
        scanType: true,
        result: true,
        severity: true,
        scannedAt: true,
        bundle: { select: { name: true } },
      },
    }),
    prisma.bundleReleaseTracks.count({
      where: { bundleId: { in: bundleIds }, track: "preview" },
    }),
  ]);

  const apiErrors = apiUsage.reduce(
    (sum, item) => sum + Number(item.errorCount),
    0
  );

  return {
    workspace,
    projects,
    metrics: {
      releases: recentReleases.length,
      previewReleases,
      featureFlags: featureFlags.length,
      webhooks: webhooks.length,
      integrations: integrations.length,
      unresolvedCrashes: crashReports.length,
      securityFindings: securityScans.filter((scan) => scan.result !== "pass").length,
      apiErrors,
    },
    recentReleases,
    featureFlags,
    webhooks,
    integrations,
    apiUsage,
    crashReports,
    securityScans,
  };
}
