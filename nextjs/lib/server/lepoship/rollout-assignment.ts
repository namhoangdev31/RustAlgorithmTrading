import crypto from "node:crypto";
import { prisma } from "@/lib/server/prisma";

function bucket(deviceId: string, rolloutId: string) {
  return crypto.createHash("sha256").update(`${rolloutId}:${deviceId}`).digest().readUInt32BE(0) % 100;
}

export async function assignActiveRollout(bundleId: string, deviceId: string | null, context: {
  countryCode?: string | null;
  locale?: string | null;
  platform?: string | null;
}) {
  if (!deviceId) return null;
  const rollouts = await prisma.bundleRollouts.findMany({
    where: { bundleId, status: "running", rolloutPercent: { gt: 0 } },
    include: { track: true },
    orderBy: { createdAt: "desc" },
  });
  const rollout = rollouts.find((candidate) =>
    (!candidate.targetCountry || candidate.targetCountry.toUpperCase() === context.countryCode?.toUpperCase()) &&
    (!candidate.targetLocale || candidate.targetLocale.toLowerCase() === context.locale?.toLowerCase()) &&
    (!candidate.targetPlatform || candidate.targetPlatform.toLowerCase() === context.platform?.toLowerCase()),
  );
  if (!rollout || bucket(deviceId, rollout.id) >= rollout.rolloutPercent) return null;
  const exposure = await prisma.bundleRolloutExposures.upsert({
    where: { rolloutId_deviceId: { rolloutId: rollout.id, deviceId } },
    create: { id: crypto.randomUUID(), rolloutId: rollout.id, bundleId, trackId: rollout.trackId, deviceId, exposedAt: new Date() },
    update: {},
  });
  return { rolloutId: rollout.id, exposureId: exposure.id, track: rollout.track, bucket: bucket(deviceId, rollout.id) };
}
