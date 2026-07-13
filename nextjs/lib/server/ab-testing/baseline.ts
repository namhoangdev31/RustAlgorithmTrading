import { prisma } from "@/lib/server/prisma";

export async function estimateBaselineConversionRate(
  bundleId: string,
  metricType: string,
  metricEventName: string | null,
) {
  const since = new Date(Date.now() - 28 * 86_400_000);
  const [analytics, installs] = await Promise.all([
    prisma.bundleAnalyticsEvents.findMany({
      where: { bundleId, createdAt: { gte: since }, deviceFingerprint: { not: null } },
      select: { deviceFingerprint: true, eventType: true },
    }),
    prisma.bundleInstallEvents.findMany({
      where: { bundleId, createdAt: { gte: since }, deviceFingerprint: { not: null } },
      select: { deviceFingerprint: true, eventType: true },
    }),
  ]);

  const active = new Set<string>();
  const converted = new Set<string>();
  for (const event of analytics) {
    if (!event.deviceFingerprint) continue;
    active.add(event.deviceFingerprint);
    if (metricType === "analytics_event" && event.eventType === metricEventName) converted.add(event.deviceFingerprint);
    if (metricType.startsWith("retention_")) converted.add(event.deviceFingerprint);
  }
  for (const event of installs) {
    if (!event.deviceFingerprint) continue;
    active.add(event.deviceFingerprint);
    if (metricType === "install_event" && event.eventType === "install") converted.add(event.deviceFingerprint);
  }

  if (active.size < 30) return 0.5;
  const rate = converted.size / active.size;
  return Math.min(0.95, Math.max(0.01, rate));
}
