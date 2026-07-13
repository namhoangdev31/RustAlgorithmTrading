import { prisma } from "@/lib/server/prisma";

export type AttributionInput = {
  key: string;
  deviceId: string | null;
  occurredAt: Date;
};

export type ExperimentAttribution = {
  testId: string;
  exposureId: string;
  variant: string;
} | null;

export async function resolveExperimentAttributions(bundleId: string, inputs: AttributionInput[]) {
  const deviceIds = [...new Set(inputs.map((entry) => entry.deviceId).filter((value): value is string => Boolean(value)))];
  const result = new Map<string, ExperimentAttribution>();
  if (deviceIds.length === 0) return result;

  const earliest = new Date(Math.min(...inputs.map((entry) => entry.occurredAt.getTime())));
  const latest = new Date(Math.max(...inputs.map((entry) => entry.occurredAt.getTime())));
  const exposures = await prisma.bundleAbTestExposures.findMany({
    where: {
      deviceId: { in: deviceIds },
      exposedAt: { lte: latest },
      test: {
        bundleId,
        startedAt: { lte: latest },
        OR: [{ endedAt: null }, { endedAt: { gte: earliest } }],
      },
    },
    include: { test: { select: { startedAt: true, endedAt: true, maxDurationDays: true } } },
    orderBy: { exposedAt: "desc" },
  });

  for (const input of inputs) {
    if (!input.deviceId) {
      result.set(input.key, null);
      continue;
    }
    const exposure = exposures.find((candidate) => {
      if (candidate.deviceId !== input.deviceId || candidate.exposedAt > input.occurredAt) return false;
      const startedAt = candidate.test.startedAt;
      if (!startedAt || startedAt > input.occurredAt) return false;
      const maximumEnd = new Date(startedAt.getTime() + candidate.test.maxDurationDays * 86_400_000);
      const endedAt = candidate.test.endedAt && candidate.test.endedAt < maximumEnd ? candidate.test.endedAt : maximumEnd;
      return input.occurredAt <= endedAt;
    });
    result.set(input.key, exposure ? { testId: exposure.testId, exposureId: exposure.id, variant: exposure.variant } : null);
  }

  return result;
}
