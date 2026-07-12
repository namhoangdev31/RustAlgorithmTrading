import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { verifyCronAuth } from "@/lib/server/cron-auth";

/**
 * Hourly cron: evaluate abuse signals for bundles with >= 6 distinct reporters in 24h.
 * Upserts BundleAbuseSignals and transitions published bundles to under_review.
 */
export async function GET(request: NextRequest) {
  return handleAbuse(request);
}

export async function POST(request: NextRequest) {
  return handleAbuse(request);
}

async function handleAbuse(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find bundles with >= 6 distinct reporters (by fingerprint) in the last 24 hours
    const reportCounts = await prisma.bundleUserReports.groupBy({
      by: ["bundleId"],
      where: {
        createdAt: { gte: twentyFourHoursAgo },
        reporterFingerprint: { not: null },
      },
      _count: {
        reporterFingerprint: true,
      },
      having: {
        reporterFingerprint: {
          _count: { gte: 6 },
        },
      },
    });

    let flagged = 0;
    let transitioned = 0;

    for (const entry of reportCounts) {
      const bundleId = entry.bundleId;
      const reportCount = entry._count.reporterFingerprint;

      // Compute risk scores (normalized)
      const anomalyScore = Math.min(reportCount / 20.0, 1.0);
      const overallRiskScore = anomalyScore; // Can be enriched with more signals
      const riskLevel = overallRiskScore >= 0.7 ? "high" : overallRiskScore >= 0.4 ? "medium" : "low";

      // Upsert BundleAbuseSignals
      await prisma.bundleAbuseSignals.upsert({
        where: { bundleId },
        create: {
          id: crypto.randomUUID(),
          bundleId,
          anomalyScore,
          overallRiskScore,
          riskLevel,
          flaggedForReview: true,
          lastCalculatedAt: now,
        },
        update: {
          anomalyScore,
          overallRiskScore,
          riskLevel,
          flaggedForReview: true,
          lastCalculatedAt: now,
        },
      });
      flagged++;

      // Only transition published bundles to under_review
      const bundle = await prisma.bundles.findUnique({
        where: { id: bundleId },
        select: { id: true, status: true },
      });

      if (bundle && bundle.status === "published") {
        await prisma.$transaction([
          prisma.bundles.update({
            where: { id: bundleId },
            data: { status: "under_review", updatedAt: now },
          }),
          prisma.bundleStateTransitions.create({
            data: {
              id: crypto.randomUUID(),
              bundleId,
              fromState: "published",
              toState: "under_review",
              trigger: "abuse_threshold_reached",
              metadata: JSON.stringify({ reportCount, anomalyScore }),
              createdAt: now,
            },
          }),
        ]);
        transitioned++;
      }
    }

    return NextResponse.json({
      success: true,
      flagged,
      transitioned,
      evaluatedAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error("[Bundle Abuse Cron] Error:", error.message);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
