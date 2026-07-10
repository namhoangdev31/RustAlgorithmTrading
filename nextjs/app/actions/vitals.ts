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
  events: any;
}

export async function loadSpeedInsightsData(userId: string, projectId: string) {
  await requireProjectRole(userId, projectId, "viewer");

  const bundle = await prisma.bundles.findFirst({
    where: { projectId },
  });

  if (!bundle) {
    return {
      success: false,
      error: "No bundle found for this project",
      analysis: { totalAnalysed: 0, healthScore: 0, suggestions: [] },
      replays: [],
      clusters: [],
      bundleName: "",
      isMock: false,
    };
  }

  // 1. Fetch web vitals events
  const events = await prisma.bundleAnalyticsEvents.findMany({
    where: {
      bundleId: bundle.id,
      eventType: { startsWith: "web-vital:" },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // 2. Fetch session replays
  const replays = await prisma.nativeAnalyticsReplay.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Map events to WebVitalsRecord format
  const records = events.map((e) => {
    let parsedData = { name: "", value: 0 };
    try {
      parsedData = JSON.parse(e.eventData || "{}");
    } catch (_) {}

    const name = (parsedData.name || e.eventType.split(":")[1] || "").toUpperCase();
    const value = parsedData.value || 0;

    // Calculate rating based on standard performance thresholds
    let rating: "good" | "needs-improvement" | "poor" = "good";
    if (name === "LCP") {
      if (value > 4000) rating = "poor";
      else if (value > 2500) rating = "needs-improvement";
    } else if (name === "INP") {
      if (value > 500) rating = "poor";
      else if (value > 200) rating = "needs-improvement";
    } else if (name === "CLS") {
      if (value > 0.25) rating = "poor";
      else if (value > 0.1) rating = "needs-improvement";
    } else if (name === "FID") {
      if (value > 300) rating = "poor";
      else if (value > 100) rating = "needs-improvement";
    }

    return {
      id: e.id,
      name,
      value,
      rating,
      pathname: "/", 
      userAgent: e.platformVersion || "Unknown Device",
      sessionId: e.sessionId || "",
    };
  });

  // An empty dataset is a real product state; never synthesize telemetry.
  if (records.length === 0) {
    return {
      success: true,
      analysis: { totalAnalysed: 0, healthScore: 0, suggestions: [] },
      replays: [],
      clusters: [],
      bundleName: bundle.name,
      isMock: false,
      error: undefined,
    };
  }

  const analysis = analyseWebVitals(records);

  const mappedReplays: ReplaySession[] = replays.map((r) => {
    const sessionVitals = records
      .filter((rec) => rec.sessionId === r.sessionId)
      .map((sv) => ({
        name: sv.name,
        value: sv.value,
        rating: sv.rating,
      }));

    const hasIssues = sessionVitals.some((v) => v.rating !== "good");

    return {
      id: r.id,
      sessionId: r.sessionId,
      url: r.url,
      userAgent: r.userAgent,
      ipAddress: r.ipAddress,
      createdAt: r.createdAt.toISOString(),
      vitals: sessionVitals,
      hasIssues,
      events: r.events,
    };
  });

  return {
    success: true,
    analysis,
    replays: mappedReplays,
    clusters: clusterPerformanceIssues(mappedReplays),
    bundleName: bundle.name,
    isMock: false,
    error: undefined,
  };
}
