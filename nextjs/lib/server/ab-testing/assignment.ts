import { hashString } from "@/lib/server/feature-flags";
import { hashDeviceId } from "@/lib/server/device-hash";
import { prisma } from "@/lib/server/prisma";
import { isDeviceEligible, type DeviceContext } from "./targeting";

export type ExperimentAssignment = {
  testId: string;
  exposureId: string;
  variant: "A" | "B";
  bucket: number;
  track: {
    id: string;
    version: string;
    buildNumber: number;
    track: string;
    storagePath: string;
    releaseNotes: string | null;
  };
  forceRollback: boolean;
};

export async function assignActiveExperiment(
  bundleId: string,
  activeAbTestId: string | null,
  rawDeviceId: string | null,
  context: DeviceContext,
): Promise<ExperimentAssignment | null> {
  if (!activeAbTestId || !rawDeviceId) return null;
  const deviceId = hashDeviceId(rawDeviceId);
  const test = await prisma.bundleAbTests.findFirst({
    where: { id: activeAbTestId, bundleId, status: { in: ["running", "paused_guardrail"] } },
    include: { controlTrack: true, treatmentTrack: true },
  });
  if (!test?.controlTrack || !test.treatmentTrack) return null;

  const existing = await prisma.bundleAbTestExposures.findUnique({
    where: { testId_deviceId: { testId: test.id, deviceId } },
  });

  if (test.status === "paused_guardrail") {
    if (!existing) return null;
    return {
      testId: test.id,
      exposureId: existing.id,
      variant: existing.variant === "B" ? "B" : "A",
      bucket: existing.bucket,
      track: test.controlTrack,
      forceRollback: existing.variant === "B",
    };
  }

  if (!existing && !isDeviceEligible(test, context)) return null;
  const bucket = existing?.bucket ?? hashString(`${deviceId}:${test.id}`);
  const variant: "A" | "B" = existing?.variant === "B" || (!existing && bucket < test.trafficSplit) ? "B" : "A";
  const assignedTrack = variant === "B" ? test.treatmentTrack : test.controlTrack;
  const exposure = existing ?? await prisma.bundleAbTestExposures.upsert({
    where: { testId_deviceId: { testId: test.id, deviceId } },
    update: {},
    create: {
      id: crypto.randomUUID(),
      testId: test.id,
      deviceId,
      variant,
      assignedTrackId: assignedTrack.id,
      bucket,
      countryCode: context.countryCode,
      locale: context.locale,
      platform: context.platform,
      osVersion: context.osVersion,
      exposedAt: new Date(),
    },
  });

  const stableVariant = exposure.variant === "B" ? "B" : "A";
  return {
    testId: test.id,
    exposureId: exposure.id,
    variant: stableVariant,
    bucket: exposure.bucket,
    track: stableVariant === "B" ? test.treatmentTrack : test.controlTrack,
    forceRollback: false,
  };
}
