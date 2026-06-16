import { prisma } from "@/lib/server/prisma";

/**
 * Record a new Marketplace install, uninstall, or error event.
 */
export async function recordInstallEvent(params: {
  bundleId: string;
  userId: string;
  eventType: "install" | "uninstall" | "error";
  errorMessage?: string;
  metadata?: any;
}) {
  const { bundleId, userId, eventType, errorMessage, metadata } = params;
  try {
    const event = await prisma.marketplaceInstallEvent.create({
      data: {
        bundleId,
        userId,
        eventType,
        errorMessage,
        metadata: metadata ? (metadata as any) : undefined,
      },
    });
    return event;
  } catch (error) {
    console.error("Error recording install event:", error);
    throw error;
  }
}

/**
 * Fetch installation, uninstallation, churn rate, and error analytics.
 */
export async function getInstallAnalytics(bundleId: string, daysLimit = 30) {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - daysLimit);

  // Fetch all events for the bundle within the date range
  const events = await prisma.marketplaceInstallEvent.findMany({
    where: {
      bundleId,
      createdAt: { gte: sinceDate },
    },
    orderBy: { createdAt: "asc" },
  });

  let installsCount = 0;
  let uninstallsCount = 0;
  let errorsCount = 0;

  // Track error messages and their counts
  const errorMap = new Map<string, { count: number; lastSeen: Date }>();
  
  // Track daily time-series
  const dailyMap = new Map<string, { date: string; installs: number; uninstalls: number; errors: number }>();

  // Initialize daily map for the last N days to ensure contiguous dates
  for (let i = daysLimit - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dailyMap.set(dateStr, { date: dateStr, installs: 0, uninstalls: 0, errors: 0 });
  }

  events.forEach((ev) => {
    const dateStr = ev.createdAt.toISOString().split("T")[0];
    
    // Grouping by event type
    if (ev.eventType === "install") {
      installsCount++;
      const day = dailyMap.get(dateStr);
      if (day) day.installs++;
    } else if (ev.eventType === "uninstall") {
      uninstallsCount++;
      const day = dailyMap.get(dateStr);
      if (day) day.uninstalls++;
    } else if (ev.eventType === "error") {
      errorsCount++;
      const day = dailyMap.get(dateStr);
      if (day) day.errors++;

      const errMsg = ev.errorMessage || "Unknown error";
      const existing = errorMap.get(errMsg);
      if (existing) {
        existing.count++;
        existing.lastSeen = ev.createdAt;
      } else {
        errorMap.set(errMsg, { count: 1, lastSeen: ev.createdAt });
      }
    }
  });

  // Calculate active installs and churn rate
  const activeInstalls = Math.max(0, installsCount - uninstallsCount);
  const churnRate = installsCount > 0 ? Number(((uninstallsCount / installsCount) * 100).toFixed(1)) : 0;

  const dailyStats = Array.from(dailyMap.values());
  const errorBreakdown = Array.from(errorMap.entries()).map(([message, val]) => ({
    message,
    count: val.count,
    lastSeen: val.lastSeen,
  })).sort((a, b) => b.count - a.count);

  return {
    totalInstalls: installsCount,
    totalUninstalls: uninstallsCount,
    activeInstalls,
    churnRate,
    errorCount: errorsCount,
    dailyStats,
    errorBreakdown,
  };
}

/**
 * Get top plugins/bundles ranked by install counts.
 */
export async function getTopPluginsByInstalls(limit = 5) {
  // Fetch install events
  const installs = await prisma.marketplaceInstallEvent.findMany({
    where: { eventType: "install" },
    select: { bundleId: true },
  });

  const countMap = new Map<string, number>();
  installs.forEach((inst) => {
    countMap.set(inst.bundleId, (countMap.get(inst.bundleId) || 0) + 1);
  });

  const sortedBundleIds = Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  // Fetch bundle names
  const bundles = await prisma.bundles.findMany({
    where: { id: { in: sortedBundleIds.map(([id]) => id) } },
    select: { id: true, name: true },
  });

  return sortedBundleIds.map(([id, count]) => {
    const bundle = bundles.find((b) => b.id === id);
    return {
      bundleId: id,
      name: bundle?.name || `Plugin ${id.substring(0, 8)}`,
      installs: count,
    };
  });
}
