import { prisma } from "@/lib/server/prisma";
import { listArtifactMirrors } from "@/lib/server/native-platform/artifact-mirrors";
import { listConnectedDevices } from "@/lib/server/native-platform/devices";
import { getSchedulingPolicy, listSchedulingSignals } from "@/lib/server/native-platform/finops";
import { listRemediationRuns } from "@/lib/server/native-platform/remediation";
import { getRoutingPolicy, listRegionReplicas } from "@/lib/server/native-platform/routing";
import { getSourcePreview, listProjectSourceMaps } from "@/lib/server/native-platform/source-maps";
import {
  listServiceIdentities,
  listServiceTrustPolicies,
  listTelemetryEnvelopes,
  summarizeTelemetryEnvelopes,
} from "@/lib/server/native-platform/zero-trust";

type ParsedStackFrame = {
  original?: {
    source?: string | null;
    line?: number | null;
    column?: number | null;
    name?: string | null;
  } | null;
};

type ParsedStackPayload = {
  frames?: ParsedStackFrame[];
  sourceMapId?: string;
};

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
    connectedDevices,
    initialCloudTargets,
    routingPolicy,
    regionReplicas,
    artifactMirrors,
    wafEvents,
    wafRules,
    diagnostics,
    remediationRuns,
    schedulingPolicy,
    schedulingSignals,
    serviceIdentities,
    serviceTrustPolicies,
    telemetryEnvelopes,
    telemetrySummary,
    allPlugins,
    sourceMaps,
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
    listConnectedDevices(projectId),
    prisma.nativeCloudTarget.findMany({ where: { projectId }, orderBy: { priority: "asc" }, take: 8 }),
    getRoutingPolicy(projectId),
    listRegionReplicas(projectId),
    listArtifactMirrors(projectId),
    prisma.nativeWafEvent.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.nativeWafRule.findMany({ where: { projectId }, orderBy: { updatedAt: "desc" }, take: 12 }),
    prisma.nativeAiDiagnostic.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 8 }),
    listRemediationRuns(projectId),
    getSchedulingPolicy(projectId),
    listSchedulingSignals(projectId),
    listServiceIdentities(projectId),
    listServiceTrustPolicies(projectId),
    listTelemetryEnvelopes(projectId),
    summarizeTelemetryEnvelopes(projectId),
    prisma.nativePlugin.findMany({ orderBy: { name: "asc" } }),
    listProjectSourceMaps(projectId),
  ]);

  let cloudTargets = initialCloudTargets;
  if (cloudTargets.length === 0) {
    const { seedCloudTargets } = await import("./failover");
    cloudTargets = await seedCloudTargets(projectId);
  }

  const enrichedCrashes = await Promise.all(
    crashes.map(async (crash) => {
      const parsedStack = (crash.parsedStack || null) as ParsedStackPayload | null;
      const frames = Array.isArray(parsedStack?.frames) ? parsedStack.frames : [];
      const topMappedFrame = frames.find(
        (frame) => frame?.original?.source && typeof frame?.original?.line === "number"
      );

      if (!topMappedFrame?.original?.source || !topMappedFrame.original?.line) {
        return crash;
      }

      const sourcePreview = await getSourcePreview({
        projectId,
        sourceMapId: parsedStack?.sourceMapId,
        releaseVersion: crash.releaseVersion,
        source: topMappedFrame.original.source,
        line: topMappedFrame.original.line,
      });

      return {
        ...crash,
        sourcePreview: {
          ...sourcePreview,
          functionName: topMappedFrame.original?.name || "",
          column: topMappedFrame.original?.column ?? null,
        },
      };
    })
  );

  return {
    deployments,
    domains,
    edgeFunctions,
    cacheEntries,
    replays,
    crashes: enrichedCrashes,
    sourceMaps,
    plugins,
    debugSessions,
    connectedDevices,
    cloudTargets,
    routingPolicy,
    regionReplicas,
    artifactMirrors,
    wafEvents,
    wafRules,
    diagnostics,
    remediationRuns,
    schedulingPolicy,
    schedulingSignals,
    serviceIdentities,
    serviceTrustPolicies,
    telemetryEnvelopes,
    telemetrySummary,
    allPlugins,
    metrics: {
      deployments: deployments.length,
      domains: domains.length,
      edgeFunctions: edgeFunctions.length,
      cacheEntries: cacheEntries.length,
      replays: replays.length,
      crashes: crashes.length,
      sourceMaps: sourceMaps.length,
      plugins: plugins.length,
      debugSessions: debugSessions.length,
      connectedDevices: connectedDevices.length,
      cloudTargets: cloudTargets.length,
      regionReplicas: regionReplicas.length,
      artifactMirrors: artifactMirrors.length,
      wafEvents: wafEvents.length,
      wafRules: wafRules.length,
      diagnostics: diagnostics.length,
      remediationRuns: remediationRuns.length,
      schedulingSignals: schedulingSignals.length,
      serviceIdentities: serviceIdentities.length,
      telemetryEnvelopes: telemetryEnvelopes.length,
    },
  };
}
