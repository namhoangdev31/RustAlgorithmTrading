import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { verifyCronAuth } from "@/lib/server/cron-auth";

/**
 * Daily Cron job (01:15 UTC): compute cohort-based D1/D7/D30 retention,
 * DAU/MAU, session count, session duration, and update cumulative BundleStats.
 */
export async function GET(request: NextRequest) {
  return handleRetention(request);
}

export async function POST(request: NextRequest) {
  return handleRetention(request);
}

async function handleRetention(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const now = new Date();
    // Compute stats for yesterday (UTC)
    const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    const statsDate = yesterday.toISOString().split("T")[0]; // YYYY-MM-DD

    const startOfYesterday = new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate(), 0, 0, 0));
    const endOfYesterday = new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate(), 23, 59, 59, 999));

    // Get all bundles
    const bundles = await prisma.bundles.findMany({ select: { id: true } });

    let computedCount = 0;

    for (const bundle of bundles) {
      const bundleId = bundle.id;

      // 1. DAU: distinct devices or users who had analytics events yesterday
      const dauDevices = await prisma.bundleAnalyticsEvents.findMany({
        where: {
          bundleId,
          createdAt: { gte: startOfYesterday, lte: endOfYesterday },
        },
        select: { deviceFingerprint: true, userId: true },
      });
      const dauSet = new Set<string>();
      for (const item of dauDevices) {
        if (item.deviceFingerprint) dauSet.add(item.deviceFingerprint);
        if (item.userId) dauSet.add(item.userId);
      }
      const dau = dauSet.size;

      // 2. MAU: distinct devices or users in the last 30 days
      const thirtyDaysAgo = new Date(startOfYesterday.getTime() - 29 * 24 * 60 * 60 * 1000);
      const mauDevices = await prisma.bundleAnalyticsEvents.findMany({
        where: {
          bundleId,
          createdAt: { gte: thirtyDaysAgo, lte: endOfYesterday },
        },
        select: { deviceFingerprint: true, userId: true },
      });
      const mauSet = new Set<string>();
      for (const item of mauDevices) {
        if (item.deviceFingerprint) mauSet.add(item.deviceFingerprint);
        if (item.userId) mauSet.add(item.userId);
      }
      const mau = mauSet.size;

      // 3. Cohorts check (for yesterday)
      // D1: cohort installed on statsDate - 1 day
      const d1CohortStart = new Date(startOfYesterday.getTime() - 24 * 60 * 60 * 1000);
      const d1CohortEnd = new Date(endOfYesterday.getTime() - 24 * 60 * 60 * 1000);
      const d1Retention = await getCohortRetention(bundleId, d1CohortStart, d1CohortEnd, startOfYesterday, endOfYesterday);

      // D7: cohort installed on statsDate - 7 days
      const d7CohortStart = new Date(startOfYesterday.getTime() - 7 * 24 * 60 * 60 * 1000);
      const d7CohortEnd = new Date(endOfYesterday.getTime() - 7 * 24 * 60 * 60 * 1000);
      const d7Retention = await getCohortRetention(bundleId, d7CohortStart, d7CohortEnd, startOfYesterday, endOfYesterday);

      // D30: cohort installed on statsDate - 30 days
      const d30CohortStart = new Date(startOfYesterday.getTime() - 30 * 24 * 60 * 60 * 1000);
      const d30CohortEnd = new Date(endOfYesterday.getTime() - 30 * 24 * 60 * 60 * 1000);
      const d30Retention = await getCohortRetention(bundleId, d30CohortStart, d30CohortEnd, startOfYesterday, endOfYesterday);

      // 4. Session Count & Average Duration
      // Session count = count of distinct sessionIds
      const sessionAggregation = await prisma.bundleAnalyticsEvents.findMany({
        where: {
          bundleId,
          createdAt: { gte: startOfYesterday, lte: endOfYesterday },
          sessionId: { not: null },
        },
        select: { sessionId: true },
      });
      const uniqueSessions = new Set(sessionAggregation.map((s) => s.sessionId));
      const sessionCount = uniqueSessions.size;

      // Average duration: look at session_end events durationMs in eventData
      const sessionEndEvents = await prisma.bundleAnalyticsEvents.findMany({
        where: {
          bundleId,
          createdAt: { gte: startOfYesterday, lte: endOfYesterday },
          eventType: "session_end",
        },
        select: { eventData: true },
      });

      let totalDurationMs = 0;
      let durationCount = 0;
      for (const e of sessionEndEvents) {
        try {
          const parsed = JSON.parse(e.eventData || "{}");
          if (parsed && typeof parsed.durationMs === "number") {
            totalDurationMs += parsed.durationMs;
            durationCount++;
          }
        } catch {}
      }
      const avgSessionDuration = durationCount > 0 ? (totalDurationMs / durationCount) / 1000.0 : null; // in seconds

      // Upsert BundleRetentionStats
      await prisma.bundleRetentionStats.upsert({
        where: {
          bundleId_statsDate: { bundleId, statsDate },
        },
        create: {
          id: crypto.randomUUID(),
          bundleId,
          statsDate,
          d1Retention,
          d7Retention,
          d30Retention,
          dau,
          mau,
          sessionCount,
          avgSessionDuration,
          createdAt: now,
        },
        update: {
          d1Retention,
          d7Retention,
          d30Retention,
          dau,
          mau,
          sessionCount,
          avgSessionDuration,
        },
      });

      // 5. Refresh BundleStats metadata
      // downloadCount = count of all 'install' events
      const downloadCount = await prisma.bundleInstallEvents.count({
        where: { bundleId, eventType: "install" },
      });

      // activeInstalls = installs - uninstalls
      const uninstallCount = await prisma.bundleInstallEvents.count({
        where: { bundleId, eventType: "uninstall" },
      });
      const activeInstalls = Math.max(0, downloadCount - uninstallCount);

      // reviews & rating count
      const reviewAggregate = await prisma.bundleReviews.aggregate({
        where: { bundleId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const rating1 = await prisma.bundleReviews.count({ where: { bundleId, rating: 1 } });
      const rating2 = await prisma.bundleReviews.count({ where: { bundleId, rating: 2 } });
      const rating3 = await prisma.bundleReviews.count({ where: { bundleId, rating: 3 } });
      const rating4 = await prisma.bundleReviews.count({ where: { bundleId, rating: 4 } });
      const rating5 = await prisma.bundleReviews.count({ where: { bundleId, rating: 5 } });

      await prisma.bundleStats.upsert({
        where: { bundleId },
        create: {
          id: crypto.randomUUID(),
          bundleId,
          rating: reviewAggregate._avg.rating || 0.0,
          ratingCount: reviewAggregate._count.rating || 0,
          rating1,
          rating2,
          rating3,
          rating4,
          rating5,
          downloadCount,
          activeInstalls,
          updatedAt: now,
        },
        update: {
          rating: reviewAggregate._avg.rating || 0.0,
          ratingCount: reviewAggregate._count.rating || 0,
          rating1,
          rating2,
          rating3,
          rating4,
          rating5,
          downloadCount,
          activeInstalls,
          updatedAt: now,
        },
      });

      computedCount++;
    }

    return NextResponse.json({
      success: true,
      computedBundles: computedCount,
      statsDate,
      calculatedAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error("[Retention Calculator Cron] Error:", error.message);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Calculates cohort retention percentage.
 * Finds devices that installed during cohort range, and check if they had activity in active range.
 */
async function getCohortRetention(
  bundleId: string,
  cohortStart: Date,
  cohortEnd: Date,
  activeStart: Date,
  activeEnd: Date
): Promise<number | null> {
  // Find distinct devices that installed in cohort range
  const installs = await prisma.bundleInstallEvents.findMany({
    where: {
      bundleId,
      eventType: "install",
      createdAt: { gte: cohortStart, lte: cohortEnd },
    },
    select: { deviceFingerprint: true, userId: true },
  });

  const cohortDevices = new Set<string>();
  for (const item of installs) {
    if (item.deviceFingerprint) cohortDevices.add(item.deviceFingerprint);
    if (item.userId) cohortDevices.add(item.userId);
  }

  if (cohortDevices.size === 0) return null;

  // Find distinct devices active in verification range
  const activity = await prisma.bundleAnalyticsEvents.findMany({
    where: {
      bundleId,
      createdAt: { gte: activeStart, lte: activeEnd },
    },
    select: { deviceFingerprint: true, userId: true },
  });

  const activeDevices = new Set<string>();
  for (const item of activity) {
    if (item.deviceFingerprint) activeDevices.add(item.deviceFingerprint);
    if (item.userId) activeDevices.add(item.userId);
  }

  // Count intersection
  let retained = 0;
  for (const dev of cohortDevices) {
    if (activeDevices.has(dev)) {
      retained++;
    }
  }

  return retained / cohortDevices.size;
}
