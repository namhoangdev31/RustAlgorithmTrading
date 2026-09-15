import { prisma } from "@/lib/server/prisma";
import { requireProjectRole } from "@/lib/server/permissions";
import { analyseWebVitals, clusterPerformanceIssues } from "@/lib/server/vitals-ai-analyser";

export interface ReplaySession {
  id: string;
  sessionId: string;
  url: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  vitals: {
    name: string;
    value: number;
    rating: "good" | "needs-improvement" | "poor";
  }[];
  hasIssues: boolean;
  events: unknown;
}

export async function loadSpeedInsightsData(userId: string, projectId: string) {
  await requireProjectRole(userId, projectId, "viewer");

  const bundle = await prisma.bundles.findFirst({ where: { projectId } });
  if (!bundle) {
    return {
      success: false,
      error: "No bundle found for this project",
      analysis: { totalAnalysed: 0, healthScore: 0, suggestions: [] },
      replays: [],
      clusters: [],
      bundleName: "",
    };
  }

  const [events, replays] = await Promise.all([
    prisma.bundleAnalyticsEvents.findMany({
      where: { bundleId: bundle.id, eventType: { startsWith: "web-vital:" } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.nativeAnalyticsReplay.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const records = events.map((event) => {
    let parsedData: { name?: string; value?: number } = {};
    try {
      parsedData = JSON.parse(event.eventData || "{}");
    } catch {
      // Invalid persisted payloads do not become invented telemetry.
    }

    const name = (parsedData.name || event.eventType.split(":")[1] || "").toUpperCase();
    const value = parsedData.value || 0;
    let rating: "good" | "needs-improvement" | "poor" = "good";
    if (name === "LCP") rating = value > 4000 ? "poor" : value > 2500 ? "needs-improvement" : "good";
    if (name === "INP") rating = value > 500 ? "poor" : value > 200 ? "needs-improvement" : "good";
    if (name === "CLS") rating = value > 0.25 ? "poor" : value > 0.1 ? "needs-improvement" : "good";
    if (name === "FID") rating = value > 300 ? "poor" : value > 100 ? "needs-improvement" : "good";

    return {
      id: event.id,
      name,
      value,
      rating,
      pathname: "/",
      userAgent: event.platformVersion || "Unknown Device",
      sessionId: event.sessionId || "",
    };
  });

  if (records.length === 0) {
    return {
      success: true,
      analysis: { totalAnalysed: 0, healthScore: 0, suggestions: [] },
      replays: [],
      clusters: [],
      bundleName: bundle.name,
    };
  }

  const mappedReplays: ReplaySession[] = replays.map((replay) => {
    const vitals = records
      .filter((record) => record.sessionId === replay.sessionId)
      .map(({ name, value, rating }) => ({ name, value, rating }));

    return {
      id: replay.id,
      sessionId: replay.sessionId,
      url: replay.url,
      userAgent: replay.userAgent,
      ipAddress: replay.ipAddress,
      createdAt: replay.createdAt.toISOString(),
      vitals,
      hasIssues: vitals.some((vital) => vital.rating !== "good"),
      events: replay.events,
    };
  });

  const analysis = analyseWebVitals(records);
  return {
    success: true,
    analysis,
    replays: mappedReplays,
    clusters: clusterPerformanceIssues(mappedReplays),
    bundleName: bundle.name,
  };
}
