import { twoProportionPValue } from "@/lib/ab-testing/statistics";
import { enqueueOutboxEvent } from "@/lib/server/lepoship/outbox";
import { prisma } from "@/lib/server/prisma";

export async function evaluateRolloutCrashGuardrails(bundleId: string) {
  const bundle = await prisma.bundles.findUnique({
    where: { id: bundleId },
    include: { activeRollout: true },
  });
  const rollout = bundle?.activeRollout;
  if (!rollout || rollout.status !== "running" || !rollout.startedAt) return null;
  const [baselineExposures, candidateExposures, baselineCrashes, candidateCrashes] = await Promise.all([
    prisma.bundleDeliveryRolloutExposures.count({ where: { rolloutId: rollout.id, releaseId: rollout.baselineReleaseId } }),
    prisma.bundleDeliveryRolloutExposures.count({ where: { rolloutId: rollout.id, releaseId: rollout.candidateReleaseId } }),
    prisma.bundleCrashEvents.findMany({
      where: { bundleId, releaseId: rollout.baselineReleaseId, occurredAt: { gte: rollout.startedAt }, deviceId: { not: null } },
      distinct: ["deviceId"], select: { deviceId: true },
    }),
    prisma.bundleCrashEvents.findMany({
      where: { bundleId, releaseId: rollout.candidateReleaseId, occurredAt: { gte: rollout.startedAt }, deviceId: { not: null } },
      distinct: ["deviceId"], select: { deviceId: true },
    }),
  ]);
  if (baselineExposures < 200 || candidateExposures < 200) return null;
  const baselineRate = baselineCrashes.length / baselineExposures;
  const candidateRate = candidateCrashes.length / candidateExposures;
  const difference = candidateRate - baselineRate;
  const pValue = twoProportionPValue(baselineCrashes.length, baselineExposures, candidateCrashes.length, candidateExposures, "greater");
  if (difference < 0.02 || pValue === null || pValue >= 0.05) return { triggered: false, difference, pValue };
  await prisma.$transaction(async (tx) => {
    const paused = await tx.bundleDeliveryRollouts.updateMany({
      where: { id: rollout.id, status: "running" },
      data: { status: "paused_guardrail", pausedAt: new Date(), updatedAt: new Date() },
    });
    if (!paused.count) return;
    await tx.bundles.update({
      where: { id: bundleId },
      data: { activeRolloutId: null, activeDeliveryMode: "none" },
    });
    await enqueueOutboxEvent(tx, {
      eventKey: `rollout.crash_guardrail:${rollout.id}`,
      aggregateType: "bundle_rollout", aggregateId: rollout.id, eventType: "rollout.paused",
      payload: { bundleId, rolloutId: rollout.id, difference, pValue, baselineRate, candidateRate },
    });
  }, { isolationLevel: "Serializable" });
  return { triggered: true, difference, pValue };
}
