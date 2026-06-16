import { prisma } from "@/lib/server/prisma";

export async function getNativePlatformData(projectId: string) {
  const [
    deployments,
    domains,
    edgeFunctions,
    cacheEntries,
    replays,
    crashes,
    plugins,
    debugSessions,
    initialCloudTargets,
    wafEvents,
    diagnostics,
    allPlugins,
  ] = await Promise.all([
    prisma.nativeDeployment.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.nativeDomainConfig.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.nativeEdgeFunction.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.nativeCacheEntry.findMany({ where: { projectId }, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.nativeAnalyticsReplay.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.nativeCrashReport.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.nativePluginInstallation.findMany({
      where: { projectId },
      include: { plugin: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.nativeDebugSession.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.nativeCloudTarget.findMany({ where: { projectId }, orderBy: { priority: "asc" }, take: 8 }),
    prisma.nativeWafEvent.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.nativeAiDiagnostic.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.nativePlugin.findMany({ orderBy: { name: "asc" } }),
  ]);

  let cloudTargets = initialCloudTargets;
  if (cloudTargets.length === 0) {
    const { seedCloudTargets } = await import("./failover");
    cloudTargets = await seedCloudTargets(projectId);
  }

  return {
    deployments,
    domains,
    edgeFunctions,
    cacheEntries,
    replays,
    crashes,
    plugins,
    debugSessions,
    cloudTargets,
    wafEvents,
    diagnostics,
    allPlugins,
    metrics: {
      deployments: deployments.length,
      domains: domains.length,
      edgeFunctions: edgeFunctions.length,
      cacheEntries: cacheEntries.length,
      replays: replays.length,
      crashes: crashes.length,
      plugins: plugins.length,
      debugSessions: debugSessions.length,
      cloudTargets: cloudTargets.length,
      wafEvents: wafEvents.length,
      diagnostics: diagnostics.length,
    },
  };
}
