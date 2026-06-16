"use server";

import { prisma } from "@/lib/server/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";
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

export async function getSpeedInsightsDataAction(projectId: string) {
  const user = await requireCurrentUser();
  await requireProjectRole(user.id, projectId, "viewer");

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

  // If there are no real vitals in the database, return high-fidelity seed data
  if (records.length === 0) {
    return getMockSpeedInsightsData(bundle.name);
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

function getMockSpeedInsightsData(bundleName: string) {
  const timestamp = new Date().toISOString();
  
  // Seed mock web vitals records
  const mockRecords = [
    { id: "v1", name: "LCP", value: 4200, rating: "poor" as const, pathname: "/shop/checkout", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15" },
    { id: "v2", name: "LCP", value: 3100, rating: "needs-improvement" as const, pathname: "/shop/checkout", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15" },
    { id: "v3", name: "INP", value: 680, rating: "poor" as const, pathname: "/products/gaming-keyboard", userAgent: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36" },
    { id: "v4", name: "INP", value: 240, rating: "needs-improvement" as const, pathname: "/products/gaming-keyboard", userAgent: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36" },
    { id: "v5", name: "CLS", value: 0.28, rating: "poor" as const, pathname: "/", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    { id: "v6", name: "CLS", value: 0.12, rating: "needs-improvement" as const, pathname: "/", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    { id: "v7", name: "LCP", value: 1200, rating: "good" as const, pathname: "/about", userAgent: "Chrome 120.0" },
    { id: "v8", name: "INP", value: 95, rating: "good" as const, pathname: "/about", userAgent: "Chrome 120.0" },
    { id: "v9", name: "CLS", value: 0.02, rating: "good" as const, pathname: "/about", userAgent: "Chrome 120.0" }
  ];

  const analysis = analyseWebVitals(mockRecords);

  // High-fidelity mock session replays with event logs representing user interaction patterns
  const mockReplays: ReplaySession[] = [
    {
      id: "mock-rep-1",
      sessionId: "sess_lcp_checkout_01",
      url: "/shop/checkout",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      ipAddress: "198.51.100.12",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      vitals: [
        { name: "LCP", value: 4200, rating: "poor" },
        { name: "CLS", value: 0.05, rating: "good" }
      ],
      hasIssues: true,
      events: [
        { type: "navigation", timestamp: 0, url: "/shop/checkout" },
        { type: "dom-content-loaded", timestamp: 850 },
        { type: "paint", timestamp: 1200, name: "FP" },
        { type: "paint", timestamp: 1400, name: "FCP" },
        { type: "scroll", timestamp: 2200, top: 150 },
        { type: "scroll", timestamp: 3100, top: 400 },
        { type: "paint", timestamp: 4200, name: "LCP", element: "img.hero-checkout-banner", sizeBytes: 1540000 },
        { type: "click", timestamp: 5000, target: "button#submit-payment" }
      ]
    },
    {
      id: "mock-rep-2",
      sessionId: "sess_inp_keyboard_02",
      url: "/products/gaming-keyboard",
      userAgent: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
      ipAddress: "203.0.113.88",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      vitals: [
        { name: "INP", value: 680, rating: "poor" },
        { name: "LCP", value: 1800, rating: "good" }
      ],
      hasIssues: true,
      events: [
        { type: "navigation", timestamp: 0, url: "/products/gaming-keyboard" },
        { type: "dom-content-loaded", timestamp: 450 },
        { type: "paint", timestamp: 600, name: "FCP" },
        { type: "paint", timestamp: 1000, name: "LCP", element: "div.product-image" },
        { type: "click", timestamp: 2500, target: "button#add-to-cart", delayMs: 680, description: "CPU Long Task: State mutation blocked UI thread" },
        { type: "scroll", timestamp: 4000, top: 300 },
        { type: "click", timestamp: 5500, target: "a#reviews-tab", delayMs: 120 }
      ]
    },
    {
      id: "mock-rep-3",
      sessionId: "sess_cls_home_03",
      url: "/",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      ipAddress: "198.51.100.45",
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      vitals: [
        { name: "CLS", value: 0.28, rating: "poor" },
        { name: "INP", value: 80, rating: "good" }
      ],
      hasIssues: true,
      events: [
        { type: "navigation", timestamp: 0, url: "/" },
        { type: "dom-content-loaded", timestamp: 300 },
        { type: "paint", timestamp: 450, name: "FCP" },
        { type: "layout-shift", timestamp: 1200, score: 0.15, element: "div.ad-banner-top", description: "Banner loaded without reserved dimensions" },
        { type: "scroll", timestamp: 2000, top: 200 },
        { type: "layout-shift", timestamp: 2800, score: 0.13, element: "div.lazy-loaded-carousel", description: "Dynamic carousel popped into viewport" },
        { type: "click", timestamp: 4500, target: "a#view-promo" }
      ]
    }
  ];

  return {
    success: true,
    analysis,
    replays: mockReplays,
    clusters: clusterPerformanceIssues(mockReplays),
    bundleName,
    isMock: true,
    error: undefined,
  };
}
