import { createHash } from "node:crypto";

import { hashDeviceId } from "@/lib/server/device-hash";
import { prisma } from "@/lib/server/prisma";
import { isDeviceEligible, type DeviceContext } from "./targeting";

function bucketFor(experimentId: string, installationId: string) {
  const digest = createHash("sha256").update(`${experimentId}:${installationId}`).digest();
  return digest.readUInt32BE(0) % 10_000;
}

export async function assignExperimentRelease(
  bundleId: string,
  activeExperimentId: string | null,
  installationId: string,
  context: DeviceContext,
) {
  if (!activeExperimentId) return null;
  const deviceId = hashDeviceId(installationId);
  const experiment = await prisma.bundleAbTests.findFirst({
    where: { id: activeExperimentId, bundleId, status: { in: ["running", "paused_guardrail"] } },
    include: { controlRelease: true, treatmentRelease: true },
  });
  if (!experiment?.controlRelease || !experiment.treatmentRelease) return null;
  const existing = await prisma.bundleAbTestExposures.findUnique({
    where: { testId_deviceId: { testId: experiment.id, deviceId } },
  });
  if (!existing && (experiment.status !== "running" || !isDeviceEligible(experiment, context))) return null;

  const bucket = existing?.bucket ?? bucketFor(experiment.id, deviceId);
  const variant = existing?.variant === "B" || (!existing && bucket < experiment.trafficSplit * 100) ? "B" as const : "A" as const;
  const assignedRelease = experiment.status === "paused_guardrail"
    ? experiment.controlRelease
    : variant === "B" ? experiment.treatmentRelease : experiment.controlRelease;
  const exposure = existing ?? await prisma.bundleAbTestExposures.upsert({
    where: { testId_deviceId: { testId: experiment.id, deviceId } },
    update: {},
    create: {
      id: crypto.randomUUID(),
      testId: experiment.id,
      deviceId,
      variant,
      assignedReleaseId: assignedRelease.id,
      bucket,
      countryCode: context.countryCode,
      locale: context.locale,
      platform: context.platform,
      osVersion: context.osVersion,
      exposedAt: new Date(),
    },
  });
  return {
    experimentId: experiment.id,
    exposureId: exposure.id,
    variant: exposure.variant === "B" ? "B" as const : "A" as const,
    bucket: exposure.bucket,
    release: assignedRelease,
    forcedRollback: experiment.status === "paused_guardrail" && exposure.variant === "B",
  };
}

export async function assignRolloutRelease(bundleId: string, rolloutId: string | null, installationId: string) {
  if (!rolloutId) return null;
  const hashedInstallationId = hashDeviceId(installationId);
  const rollout = await prisma.bundleDeliveryRollouts.findFirst({
    where: { id: rolloutId, bundleId, status: "running" },
    include: { baselineRelease: true, candidateRelease: true },
  });
  if (!rollout) return null;
  const existing = await prisma.bundleDeliveryRolloutExposures.findUnique({
    where: { rolloutId_installationId: { rolloutId, installationId: hashedInstallationId } },
  });
  const bucket = existing?.bucket ?? bucketFor(rollout.id, hashedInstallationId);
  const selected = existing?.releaseId === rollout.candidateReleaseId || (!existing && bucket < rollout.percentage * 100)
    ? rollout.candidateRelease
    : rollout.baselineRelease;
  const exposure = existing ?? await prisma.bundleDeliveryRolloutExposures.upsert({
    where: { rolloutId_installationId: { rolloutId, installationId: hashedInstallationId } },
    update: {},
    create: {
      id: crypto.randomUUID(), rolloutId, installationId: hashedInstallationId,
      releaseId: selected.id, bucket, exposedAt: new Date(),
    },
  });
  return { rolloutId, exposureId: exposure.id, bucket: exposure.bucket, release: selected };
}
