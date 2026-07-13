import { calculateBinaryExperiment, calculateSequentialBayesian, sampleRatioMismatchPValue, twoProportionPValue } from "@/lib/ab-testing/statistics";
import { syncProjectFeatureFlags } from "@/lib/server/feature-flags";
import { prisma } from "@/lib/server/prisma";

const DAY_MS = 86_400_000;

function matureAfterMs(metricType: string, conversionWindowHours: number) {
  if (metricType === "retention_d1") return 48 * 3_600_000;
  if (metricType === "retention_d7") return 8 * DAY_MS;
  return conversionWindowHours * 3_600_000;
}

function conversionWindow(exposedAt: Date, metricType: string, conversionWindowHours: number) {
  if (metricType === "retention_d1") {
    return { start: new Date(exposedAt.getTime() + DAY_MS), end: new Date(exposedAt.getTime() + 2 * DAY_MS) };
  }
  if (metricType === "retention_d7") {
    return { start: new Date(exposedAt.getTime() + 7 * DAY_MS), end: new Date(exposedAt.getTime() + 8 * DAY_MS) };
  }
  return { start: exposedAt, end: new Date(exposedAt.getTime() + conversionWindowHours * 3_600_000) };
}

function floorToQuarterHour(date: Date) {
  const bucket = new Date(date);
  bucket.setUTCMinutes(Math.floor(bucket.getUTCMinutes() / 15) * 15, 0, 0);
  return bucket;
}

export async function analyzeExperiment(testId: string, now = new Date()) {
  const test = await prisma.bundleAbTests.findUnique({
    where: { id: testId },
    include: {
      bundle: { select: { projectId: true } },
      exposures: { select: { id: true, variant: true, exposedAt: true } },
    },
  });
  if (!test || !["running", "paused_guardrail"].includes(test.status) || !test.startedAt) return null;

  const [analytics, installs, crashes] = await Promise.all([
    prisma.bundleAnalyticsEvents.findMany({
      where: {
        abTestId: test.id,
        abExposureId: { not: null },
        ...(test.metricType === "analytics_event" && test.metricEventName ? { eventType: test.metricEventName } : {}),
      },
      select: { abExposureId: true, createdAt: true },
    }),
    prisma.bundleInstallEvents.findMany({
      where: { abTestId: test.id, abExposureId: { not: null }, eventType: "install" },
      select: { abExposureId: true, createdAt: true },
    }),
    prisma.bundleCrashEvents.findMany({
      where: { abTestId: test.id, abExposureId: { not: null } },
      select: { abExposureId: true },
      distinct: ["abExposureId"],
    }),
  ]);

  const maturityMs = matureAfterMs(test.metricType, test.conversionWindowHours);
  const matureExposures = test.exposures.filter((exposure) => exposure.exposedAt.getTime() + maturityMs <= now.getTime());
  const events = test.metricType === "install_event" ? installs : analytics;
  const converted = new Set<string>();
  for (const exposure of matureExposures) {
    const window = conversionWindow(exposure.exposedAt, test.metricType, test.conversionWindowHours);
    if (events.some((event) => event.abExposureId === exposure.id && event.createdAt >= window.start && event.createdAt < window.end)) {
      converted.add(exposure.id);
    }
  }

  const byVariant = (variant: "A" | "B", source = matureExposures) => source.filter((exposure) => exposure.variant === variant);
  const exposedA = byVariant("A", test.exposures).length;
  const exposedB = byVariant("B", test.exposures).length;
  const analyzableA = byVariant("A").length;
  const analyzableB = byVariant("B").length;
  const conversionsA = byVariant("A").filter((exposure) => converted.has(exposure.id)).length;
  const conversionsB = byVariant("B").filter((exposure) => converted.has(exposure.id)).length;
  const statistics = calculateBinaryExperiment(
    conversionsA,
    analyzableA,
    conversionsB,
    analyzableB,
    test.confidenceLevel,
  );
  const scientific = calculateSequentialBayesian(conversionsA, analyzableA, conversionsB, analyzableB, 0.95);
  const srmPValue = sampleRatioMismatchPValue(exposedA, exposedB, test.trafficSplit);
  const srmDetected = srmPValue !== null && srmPValue < 0.001;

  const crashExposureIds = new Set(crashes.map((event) => event.abExposureId).filter(Boolean));
  const crashAffectedA = byVariant("A", test.exposures).filter((exposure) => crashExposureIds.has(exposure.id)).length;
  const crashAffectedB = byVariant("B", test.exposures).filter((exposure) => crashExposureIds.has(exposure.id)).length;
  const crashRateA = exposedA > 0 ? crashAffectedA / exposedA : 0;
  const crashRateB = exposedB > 0 ? crashAffectedB / exposedB : 0;
  const crashDifference = crashRateB - crashRateA;
  const crashPValue = twoProportionPValue(crashAffectedA, exposedA, crashAffectedB, exposedB, "greater");
  const guardrailTriggered = exposedA >= 200 && exposedB >= 200 && crashDifference >= 0.02 && crashPValue !== null && crashPValue < 0.05;

  const requiredSample = test.minimumSamplePerVariant || 0;
  const expired = now.getTime() >= test.startedAt.getTime() + test.maxDurationDays * DAY_MS;
  let analysisStatus = test.analysisStatus;
  let recommendedWinner = test.recommendedWinner;
  if (analysisStatus === "collecting") {
    const minimumDurationReached = now.getTime() >= test.startedAt.getTime() + DAY_MS;
    const powered = analyzableA >= requiredSample && analyzableB >= requiredSample;
    const evidencePassed = scientific.sequentialEvidence >= 20;
    const bWins = statistics.absoluteDifference > 0 && scientific.posteriorProbabilityB >= 0.95 && scientific.expectedLossB <= 0.001;
    const aWins = statistics.absoluteDifference < 0 && scientific.posteriorProbabilityB <= 0.05 && scientific.expectedLossA <= 0.001;
    if (!srmDetected && !guardrailTriggered && minimumDurationReached && powered && evidencePassed && (aWins || bWins)) {
      analysisStatus = "conclusive";
      recommendedWinner = bWins ? "B" : "A";
    } else if (expired) {
      analysisStatus = "inconclusive";
      recommendedWinner = "A";
    }
  }

  const bucketStart = floorToQuarterHour(now);
  const snapshotData = {
    analysisStatus,
    exposedA,
    exposedB,
    analyzableA,
    analyzableB,
    conversionsA,
    conversionsB,
    conversionRateA: statistics.rateA,
    conversionRateB: statistics.rateB,
    absoluteDifference: statistics.absoluteDifference,
    liftPercent: statistics.liftPercent,
    confidenceIntervalLow: statistics.differenceInterval.low,
    confidenceIntervalHigh: statistics.differenceInterval.high,
    pValue: statistics.pValue,
    confidence: statistics.confidence,
    sequentialEvidence: scientific.sequentialEvidence,
    posteriorProbabilityB: scientific.posteriorProbabilityB,
    expectedLossA: scientific.expectedLossA,
    expectedLossB: scientific.expectedLossB,
    srmPValue,
    srmDetected,
    dataDelayMinutes: Math.max(0, Math.round(maturityMs / 60_000)),
    requiredSamplePerVariant: requiredSample,
    crashAffectedA,
    crashAffectedB,
    crashRateA,
    crashRateB,
    crashDifference,
    crashPValue,
    guardrailTriggered,
  };

  await prisma.$transaction(async (tx) => {
    await tx.bundleAbTestAnalysisSnapshots.upsert({
      where: { testId_bucketStart: { testId: test.id, bucketStart } },
      update: snapshotData,
      create: { id: crypto.randomUUID(), testId: test.id, bucketStart, ...snapshotData, createdAt: now },
    });
    await tx.bundleAbTests.update({
      where: { id: test.id },
      data: {
        analysisStatus,
        recommendedWinner,
        lastAnalyzedAt: now,
        ...((guardrailTriggered || srmDetected) && test.status === "running" ? {
          status: "paused_guardrail",
          pausedAt: now,
          pauseReason: srmDetected
            ? `Sample ratio mismatch detected (p=${srmPValue?.toFixed(6)}).`
            : `Crash rate increased by ${(crashDifference * 100).toFixed(2)} percentage points (p=${crashPValue?.toFixed(4)}).`,
          recommendedWinner: "A",
        } : {}),
      },
    });
  }, { isolationLevel: "Serializable" });

  if ((guardrailTriggered || srmDetected) && test.status === "running" && test.bundle.projectId) {
    await syncProjectFeatureFlags(test.bundle.projectId);
  }
  return { ...snapshotData, testId: test.id, bucketStart };
}

export async function analyzeActiveExperiments(limit = 50, now = new Date()) {
  const tests = await prisma.bundleAbTests.findMany({
    where: { status: { in: ["running", "paused_guardrail"] } },
    orderBy: { startedAt: "asc" },
    take: limit,
    select: { id: true },
  });
  const results = [];
  for (const test of tests) results.push(await analyzeExperiment(test.id, now));
  return results.filter(Boolean);
}
