import { prisma } from "@/lib/server/prisma";

type RegionReplicaInput = {
  projectId: string;
  region: string;
  provider: string;
  deploymentId?: string | null;
  endpoint?: string | null;
  bundleUrl?: string | null;
  storagePath?: string | null;
  healthStatus?: string;
  drainState?: string;
  latencyMs?: number | null;
  trafficPercent?: number;
  isPrimary?: boolean;
  replicationVersion?: string | null;
  vectorClock?: Record<string, number> | null;
  metadata?: unknown;
};

const DEFAULT_POLICY = {
  strategy: "latency",
  consistency: "eventual",
  stickySessions: true,
  manualFailback: false,
  snapshotTtlSeconds: 30,
  failoverThresholdMs: 250,
  latencyProbeIntervalSeconds: 30,
  preferredRegions: [] as string[],
};

function deriveReplicaHealthStatus(
  currentStatus: string | null | undefined,
  lastHeartbeatAt: Date | null | undefined
) {
  const normalized = normalizeHealthStatus(currentStatus);
  if (!lastHeartbeatAt) {
    return normalized;
  }

  const ageMs = Date.now() - lastHeartbeatAt.getTime();
  if (ageMs > 5 * 60_000) {
    return "unhealthy";
  }
  if (ageMs > 90_000 && normalized === "healthy") {
    return "overloaded";
  }
  return normalized;
}

function normalizeHealthStatus(status?: string | null) {
  return status === "unhealthy" ? "unhealthy" : status === "overloaded" ? "overloaded" : "healthy";
}

function normalizeDrainState(state?: string | null) {
  return state === "draining" || state === "drained" ? state : "accepting";
}

function regionScore(replica: {
  isPrimary: boolean;
  drainState: string;
  healthStatus: string;
  latencyMs: number | null;
}) {
  const drainPenalty = replica.drainState === "accepting" ? 0 : replica.drainState === "draining" ? 500 : 1000;
  const healthPenalty = replica.healthStatus === "healthy" ? 0 : replica.healthStatus === "overloaded" ? 150 : 1000;
  const latency = replica.latencyMs ?? 999;
  const primaryBonus = replica.isPrimary ? -25 : 0;
  return drainPenalty + healthPenalty + latency + primaryBonus;
}

export async function getRoutingPolicy(projectId: string) {
  return prisma.nativeRoutingPolicy.upsert({
    where: { projectId },
    create: {
      projectId,
      ...DEFAULT_POLICY,
    },
    update: {},
  });
}

export async function listRegionReplicas(projectId: string) {
  const replicas = await prisma.nativeRegionReplica.findMany({
    where: { projectId },
    orderBy: [{ isPrimary: "desc" }, { region: "asc" }],
  });

  if (replicas.length > 0) {
    return replicas;
  }

  return seedRegionReplicas(projectId);
}

export async function seedRegionReplicas(projectId: string) {
  const [deployment, targets] = await Promise.all([
    prisma.nativeDeployment.findFirst({
      where: { projectId, status: { in: ["active", "ready", "completed", "published"] } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.nativeCloudTarget.findMany({
      where: { projectId },
      orderBy: { priority: "asc" },
    }),
  ]);

  if (!deployment || targets.length === 0) {
    return [];
  }

  await prisma.nativeRegionReplica.createMany({
    data: targets.map((target, index) => ({
      projectId,
      deploymentId: deployment.id,
      provider: target.provider,
      region: target.region,
      endpoint: target.endpoint,
      bundleUrl: deployment.bundleUrl,
      storagePath: deployment.storagePath,
      healthStatus: normalizeHealthStatus(target.healthStatus),
      drainState: "accepting",
      latencyMs:
        typeof (target.metadata as Record<string, unknown> | null)?.latency === "number"
          ? Math.round((target.metadata as Record<string, number>).latency)
          : null,
      trafficPercent: index === 0 ? 100 : 0,
      isPrimary: index === 0,
      replicationVersion: deployment.version,
      vectorClock: {
        [target.region]: deployment.buildNumber || 1,
      },
      metadata: {
        seededFromCloudTarget: true,
      },
    })),
    skipDuplicates: true,
  });

  return prisma.nativeRegionReplica.findMany({
    where: { projectId },
    orderBy: [{ isPrimary: "desc" }, { region: "asc" }],
  });
}

export async function upsertRegionReplica(input: RegionReplicaInput) {
  return prisma.nativeRegionReplica.upsert({
    where: {
      projectId_region: {
        projectId: input.projectId,
        region: input.region,
      },
    },
    create: {
      projectId: input.projectId,
      deploymentId: input.deploymentId || null,
      provider: input.provider,
      region: input.region,
      endpoint: input.endpoint || null,
      bundleUrl: input.bundleUrl || null,
      storagePath: input.storagePath || null,
      healthStatus: normalizeHealthStatus(input.healthStatus),
      drainState: normalizeDrainState(input.drainState),
      latencyMs: input.latencyMs ?? null,
      trafficPercent: input.trafficPercent ?? 0,
      isPrimary: input.isPrimary ?? false,
      replicationVersion: input.replicationVersion || null,
      vectorClock: (input.vectorClock || null) as any,
      metadata: (input.metadata || null) as any,
      lastHeartbeatAt: new Date(),
    },
    update: {
      deploymentId: input.deploymentId || null,
      provider: input.provider,
      endpoint: input.endpoint || null,
      bundleUrl: input.bundleUrl || null,
      storagePath: input.storagePath || null,
      healthStatus: normalizeHealthStatus(input.healthStatus),
      drainState: normalizeDrainState(input.drainState),
      latencyMs: input.latencyMs ?? null,
      trafficPercent: input.trafficPercent ?? 0,
      isPrimary: input.isPrimary ?? false,
      replicationVersion: input.replicationVersion || null,
      vectorClock: (input.vectorClock || null) as any,
      metadata: (input.metadata || null) as any,
      lastHeartbeatAt: new Date(),
    },
  });
}

export async function setRegionReplicaDrainState(projectId: string, region: string, drainState: "accepting" | "draining" | "drained") {
  return prisma.nativeRegionReplica.update({
    where: {
      projectId_region: {
        projectId,
        region,
      },
    },
    data: {
      drainState,
      updatedAt: new Date(),
    },
  });
}

export async function recordRegionReplicaHeartbeat(input: RegionReplicaInput) {
  return upsertRegionReplica(input);
}

export async function upsertRoutingPolicy(projectId: string, payload: Partial<typeof DEFAULT_POLICY>) {
  const current = await getRoutingPolicy(projectId);
  return prisma.nativeRoutingPolicy.update({
    where: { projectId },
    data: {
      strategy: payload.strategy || current.strategy,
      consistency: payload.consistency || current.consistency,
      stickySessions: payload.stickySessions ?? current.stickySessions,
      manualFailback: payload.manualFailback ?? current.manualFailback,
      snapshotTtlSeconds: payload.snapshotTtlSeconds ?? current.snapshotTtlSeconds,
      failoverThresholdMs: payload.failoverThresholdMs ?? current.failoverThresholdMs,
      latencyProbeIntervalSeconds:
        payload.latencyProbeIntervalSeconds ?? current.latencyProbeIntervalSeconds,
      preferredRegions: payload.preferredRegions ?? current.preferredRegions,
      metadata: current.metadata as any,
    },
  });
}

export async function buildRoutingSnapshot(projectId: string) {
  const [project, policy, replicas, mirrors] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      include: {
        activeNativeDeployment: true,
        nativeDomainConfigs: true,
      },
    }),
    getRoutingPolicy(projectId),
    listRegionReplicas(projectId),
    prisma.nativeArtifactMirror.findMany({
      where: { projectId, status: { in: ["published", "active"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  if (!project?.activeNativeDeployment) {
    return null;
  }

  const rankedReplicas = [...replicas].sort((left, right) => regionScore(left) - regionScore(right));
  const replicasWithRuntimeHealth = rankedReplicas.map((replica) => {
    const effectiveHealthStatus = deriveReplicaHealthStatus(replica.healthStatus, replica.lastHeartbeatAt);
    return {
      ...replica,
      healthStatus: effectiveHealthStatus,
    };
  });
  const primaryReplica =
    replicasWithRuntimeHealth.find((replica) => replica.isPrimary) ||
    replicasWithRuntimeHealth[0] ||
    null;

  return {
    projectId: project.id,
    deploymentId: project.activeNativeDeployment.id,
    target: project.activeNativeDeployment.target,
    bundleUrl: primaryReplica?.bundleUrl || project.activeNativeDeployment.bundleUrl,
    storagePath: primaryReplica?.storagePath || project.activeNativeDeployment.storagePath,
    primaryRegion: primaryReplica?.region || null,
    consistency: policy.consistency,
    drainState: primaryReplica?.drainState || "accepting",
    routingPolicy: {
      strategy: policy.strategy,
      stickySessions: policy.stickySessions,
      manualFailback: policy.manualFailback,
      failoverThresholdMs: policy.failoverThresholdMs,
      snapshotTtlSeconds: policy.snapshotTtlSeconds,
      latencyProbeIntervalSeconds: policy.latencyProbeIntervalSeconds,
      preferredRegions: policy.preferredRegions,
    },
    regions: replicasWithRuntimeHealth.map((replica) => ({
      id: replica.id,
      provider: replica.provider,
      region: replica.region,
      endpoint: replica.endpoint,
      bundleUrl: replica.bundleUrl,
      storagePath: replica.storagePath,
      healthStatus: replica.healthStatus,
      drainState: replica.drainState,
      latencyMs: replica.latencyMs,
      trafficPercent: replica.trafficPercent,
      isPrimary: replica.isPrimary,
      replicationVersion: replica.replicationVersion,
      vectorClock: replica.vectorClock,
      lastHeartbeatAt: replica.lastHeartbeatAt?.toISOString() || null,
    })),
    artifactMirrors: mirrors.map((mirror) => ({
      id: mirror.id,
      provider: mirror.provider,
      policy: mirror.policy,
      status: mirror.status,
      locator: mirror.locator,
      cid: mirror.cid,
      txId: mirror.txId,
    })),
    healthyTargets: replicasWithRuntimeHealth
      .filter((replica) => replica.healthStatus !== "unhealthy" && replica.drainState !== "drained")
      .map((replica) => ({
        id: replica.id,
        provider: replica.provider,
        region: replica.region,
        endpoint: replica.endpoint,
        priority: replica.isPrimary ? 0 : 10,
        healthStatus: replica.healthStatus,
      })),
    domains: project.nativeDomainConfigs.map((domain) => ({
      domain: domain.domain,
      sslStatus: domain.sslStatus,
    })),
    updatedAt: new Date().toISOString(),
  };
}
