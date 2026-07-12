import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { verifyCronAuth } from "@/lib/server/cron-auth";

/**
 * Cron route run twice daily (00:30 & 12:30 UTC) to update BundleRankingScores
 * and insert daily entries into BundleTrendingSnapshots.
 */
export async function GET(request: NextRequest) {
  return handleRanking(request);
}

export async function POST(request: NextRequest) {
  return handleRanking(request);
}

async function handleRanking(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const now = new Date();
    const statsDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all published bundles
    const publishedBundles = await prisma.bundles.findMany({
      where: { status: "published" },
      select: {
        id: true,
        category: true,
        stats: true,
        retentionStats: {
          orderBy: { statsDate: "desc" },
          take: 1,
        },
      },
    });

    if (publishedBundles.length === 0) {
      return NextResponse.json({ success: true, message: "No published bundles to rank." });
    }

    // Prepare lists to calculate maximums for log-normalization
    const bundleDataList: any[] = [];
    let maxInstalls = 0;
    let maxOrders = 0;

    for (const b of publishedBundles) {
      const activeInstalls = Number(b.stats?.activeInstalls || 0);

      // Paid orders in last 30 days
      const paidOrdersCount = await prisma.bundleOrders.count({
        where: {
          bundleId: b.id,
          status: "completed",
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      if (activeInstalls > maxInstalls) maxInstalls = activeInstalls;
      if (paidOrdersCount > maxOrders) maxOrders = paidOrdersCount;

      bundleDataList.push({
        id: b.id,
        category: b.category,
        activeInstalls,
        paidOrdersCount,
        retention: b.retentionStats[0] || null,
        stats: b.stats || null,
      });
    }

    // Process scores for each bundle
    const results: any[] = [];
    for (const data of bundleDataList) {
      const { id: bundleId, activeInstalls, paidOrdersCount, retention, stats } = data;

      // 1. Popularity (35%): 60% log-normalized active installs + 40% log-normalized paid orders
      const normInstalls = maxInstalls > 0 ? Math.log(activeInstalls + 1) / Math.log(maxInstalls + 1) : 0;
      const normOrders = maxOrders > 0 ? Math.log(paidOrdersCount + 1) / Math.log(maxOrders + 1) : 0;
      const popularityScore = 0.6 * normInstalls + 0.4 * normOrders;

      // 2. Retention (25%): D30, fallback to D7, fallback to D1 (normalized 0 to 1.0)
      let retentionVal = 0.0;
      if (retention) {
        if (retention.d30Retention !== null) {
          retentionVal = retention.d30Retention;
        } else if (retention.d7Retention !== null) {
          retentionVal = retention.d7Retention;
        } else if (retention.d1Retention !== null) {
          retentionVal = retention.d1Retention;
        }
      }
      const retentionScore = retentionVal;

      // 3. Quality (30%): Bayesian rating: (v * R + m * C) / (v + m)
      // v = ratingCount, R = average rating, m = 10 (prior weight), C = 3.5 (default prior)
      const v = stats?.ratingCount || 0;
      const R = stats?.rating || 0.0;
      const m = 10;
      const C = 3.5;
      const bayesianRating = (v * R + m * C) / (v + m);
      // Normalize from 1-5 stars to 0-1 scale: (rating - 1) / 4
      const qualityScore = Math.max(0, (bayesianRating - 1.0) / 4.0);

      // 4. Crash Health (10%): unresolved crashes / active installs.
      // Score decreases as crash ratio increases. Cap ratio at 1.0.
      const unresolvedCrashes = await prisma.bundleCrashReports.count({
        where: { bundleId, isResolved: false },
      });
      const crashRatio = activeInstalls > 0 ? unresolvedCrashes / activeInstalls : 0.0;
      const crashScore = Math.max(0.0, 1.0 - Math.min(crashRatio, 1.0));

      // Weighted sum overall score (0.0 to 1.0)
      const overallScore =
        0.35 * popularityScore +
        0.25 * retentionScore +
        0.3 * qualityScore +
        0.1 * crashScore;

      // Upsert BundleRankingScores
      await prisma.bundleRankingScores.upsert({
        where: { bundleId },
        create: {
          id: crypto.randomUUID(),
          bundleId,
          popularityScore,
          retentionScore,
          qualityScore,
          crashScore,
          overallScore,
          updatedAt: now,
        },
        update: {
          popularityScore,
          retentionScore,
          qualityScore,
          crashScore,
          overallScore,
          updatedAt: now,
        },
      });

      results.push({ bundleId, overallScore, category: data.category });
    }

    // Calculate rank positions and insert Trending Snapshots
    // Group by category to compute regional/category ranks
    const categories = [...new Set(results.map((r) => r.category))];
    for (const cat of categories) {
      const catResults = results
        .filter((r) => r.category === cat)
        .sort((a, b) => b.overallScore - a.overallScore);

      for (let index = 0; index < catResults.length; index++) {
        const item = catResults[index];
        const rankPosition = index + 1;

        const downloadCount = await prisma.bundleInstallEvents.count({
          where: { bundleId: item.bundleId, eventType: "install" },
        });
        const uninstallCount = await prisma.bundleInstallEvents.count({
          where: { bundleId: item.bundleId, eventType: "uninstall" },
        });
        const activeInstalls = Math.max(0, downloadCount - uninstallCount);

        // Upsert Trending Snapshot
        await prisma.bundleTrendingSnapshots.upsert({
          where: {
            bundleId_snapshotDate: { bundleId: item.bundleId, snapshotDate: statsDate },
          },
          create: {
            id: crypto.randomUUID(),
            bundleId: item.bundleId,
            snapshotDate: statsDate,
            downloadCount: BigInt(downloadCount),
            activeInstalls: BigInt(activeInstalls),
            rankPosition,
            category: cat || "General",
            createdAt: now,
          },
          update: {
            downloadCount: BigInt(downloadCount),
            activeInstalls: BigInt(activeInstalls),
            rankPosition,
            category: cat || "General",
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      rankedBundles: results.length,
      statsDate,
      calculatedAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error("[Ranking Calculator Cron] Error:", error.message);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
