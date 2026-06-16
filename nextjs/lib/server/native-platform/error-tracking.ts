import { prisma } from "@/lib/server/prisma";

export async function getCrashGroups(
  projectId: string,
  options?: {
    status?: string;
    timeRange?: { from: Date; to: Date };
    limit?: number;
    offset?: number;
  }
) {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  const status = options?.status;
  const timeRange = options?.timeRange;

  const where: any = { projectId };
  if (status === "resolved") {
    where.isResolved = true;
  } else if (status === "unresolved") {
    where.isResolved = false;
  }
  if (timeRange) {
    where.createdAt = {
      gte: timeRange.from,
      lte: timeRange.to,
    };
  }

  // Use groupBy to aggregate
  const aggregations = await prisma.nativeCrashReport.groupBy({
    by: ["fingerprint"],
    where,
    _count: {
      id: true,
    },
    _min: {
      createdAt: true,
    },
    _max: {
      createdAt: true,
    },
    orderBy: {
      _max: {
        createdAt: "desc",
      },
    },
    take: limit,
    skip: offset,
  });

  const groups = [];
  for (const agg of aggregations) {
    const fingerprint = agg.fingerprint;
    const latestCrash = await prisma.nativeCrashReport.findFirst({
      where: { projectId, fingerprint },
      orderBy: { createdAt: "desc" },
    });

    groups.push({
      fingerprint,
      errorMessage: latestCrash?.errorMessage || "Unknown Error",
      count: agg._count.id,
      firstSeen: agg._min.createdAt,
      lastSeen: agg._max.createdAt,
      status: latestCrash?.isResolved ? "resolved" : "unresolved",
      latestCrashId: latestCrash?.id,
    });
  }

  return groups;
}

export async function getCrashGroupDetail(projectId: string, fingerprint: string) {
  const crashes = await prisma.nativeCrashReport.findMany({
    where: { projectId, fingerprint },
    orderBy: { createdAt: "desc" },
  });

  if (crashes.length === 0) return null;

  return {
    fingerprint,
    errorMessage: crashes[0].errorMessage,
    status: crashes[0].isResolved ? "resolved" : "unresolved",
    count: crashes.length,
    firstSeen: crashes[crashes.length - 1].createdAt,
    lastSeen: crashes[0].createdAt,
    reports: crashes.map((c) => ({
      id: c.id,
      environment: c.environment,
      errorMessage: c.errorMessage,
      errorStack: c.errorStack,
      parsedStack: c.parsedStack,
      platform: c.platform,
      releaseVersion: c.releaseVersion,
      userAgent: c.userAgent,
      ipAddress: c.ipAddress,
      createdAt: c.createdAt,
    })),
  };
}

export async function updateCrashGroupStatus(
  projectId: string,
  fingerprint: string,
  status: "unresolved" | "resolved" | "ignored" | "regression"
) {
  const isResolved = status === "resolved" || status === "ignored";

  const result = await prisma.nativeCrashReport.updateMany({
    where: { projectId, fingerprint },
    data: { isResolved },
  });

  return result.count;
}

export async function getCrashStats(projectId: string, timeRange: { from: Date; to: Date }) {
  const crashes = await prisma.nativeCrashReport.findMany({
    where: {
      projectId,
      createdAt: {
        gte: timeRange.from,
        lte: timeRange.to,
      },
    },
  });

  const total = crashes.length;
  let resolved = 0;
  let unresolved = 0;
  const byEnvironment: Record<string, number> = {};
  const byPlatform: Record<string, number> = {};
  const bySeverity: { error: number; warning: number; fatal: number } = { error: 0, warning: 0, fatal: 0 };
  const trendMap: Record<string, number> = {};

  for (const c of crashes) {
    if (c.isResolved) {
      resolved++;
    } else {
      unresolved++;
    }

    byEnvironment[c.environment] = (byEnvironment[c.environment] || 0) + 1;
    byPlatform[c.platform] = (byPlatform[c.platform] || 0) + 1;

    const lowerMessage = c.errorMessage.toLowerCase();
    if (lowerMessage.includes("warning")) {
      bySeverity.warning++;
    } else if (lowerMessage.includes("fatal") || lowerMessage.includes("panic") || lowerMessage.includes("unhandled")) {
      bySeverity.fatal++;
    } else {
      bySeverity.error++;
    }

    const dateStr = c.createdAt.toISOString().split("T")[0];
    trendMap[dateStr] = (trendMap[dateStr] || 0) + 1;
  }

  const trend = Object.entries(trendMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    total,
    unresolved,
    resolved,
    byEnvironment,
    byPlatform,
    bySeverity,
    trend,
  };
}

export async function getTopCrashes(projectId: string, limit = 10) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const aggregations = await prisma.nativeCrashReport.groupBy({
    by: ["fingerprint"],
    where: {
      projectId,
      createdAt: {
        gte: oneDayAgo,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: limit,
  });

  const topCrashes = [];
  for (const agg of aggregations) {
    const latestCrash = await prisma.nativeCrashReport.findFirst({
      where: { projectId, fingerprint: agg.fingerprint },
      orderBy: { createdAt: "desc" },
    });

    topCrashes.push({
      fingerprint: agg.fingerprint,
      errorMessage: latestCrash?.errorMessage || "Unknown Error",
      count: agg._count.id,
      latestCrashId: latestCrash?.id,
      platform: latestCrash?.platform,
    });
  }

  return topCrashes;
}

export async function deleteCrashGroup(projectId: string, fingerprint: string) {
  const result = await prisma.nativeCrashReport.deleteMany({
    where: { projectId, fingerprint },
  });
  return result.count;
}

export async function mergeCrashGroups(projectId: string, sourceFingerprint: string, targetFingerprint: string) {
  const result = await prisma.nativeCrashReport.updateMany({
    where: { projectId, fingerprint: sourceFingerprint },
    data: { fingerprint: targetFingerprint },
  });
  return result.count;
}
