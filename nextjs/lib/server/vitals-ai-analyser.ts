export interface WebVitalsRecord {
  id: string;
  name: string; // "LCP" | "FID" | "CLS" | "INP"
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  pathname: string;
  userAgent: string;
}

export function analyseWebVitals(records: WebVitalsRecord[]) {
  const badRecords = records.filter((r) => r.rating !== "good");
  const suggestions: {
    metric: string;
    score: number;
    pathname: string;
    diagnosis: string;
    recommendation: string;
  }[] = [];

  const lcpRecords = badRecords.filter((r) => r.name === "LCP");
  if (lcpRecords.length > 0) {
    const avgScore = lcpRecords.reduce((acc, r) => acc + r.value, 0) / lcpRecords.length;
    suggestions.push({
      metric: "LCP (Largest Contentful Paint)",
      score: avgScore,
      pathname: lcpRecords[0].pathname,
      diagnosis: `Largest element rendering is slow (${(avgScore / 1000).toFixed(2)}s). Common causes include render-blocking resources, slow server response times, or heavy hero images.`,
      recommendation: "Consider adding fetchpriority=\"high\" to the primary hero image, preloading key fonts, optimizing server response times (TTFB), and deferring non-essential CSS/JS.",
    });
  }

  const inpRecords = badRecords.filter((r) => r.name === "INP");
  if (inpRecords.length > 0) {
    const avgScore = inpRecords.reduce((acc, r) => acc + r.value, 0) / inpRecords.length;
    suggestions.push({
      metric: "INP (Interaction to Next Paint)",
      score: avgScore,
      pathname: inpRecords[0].pathname,
      diagnosis: `User interactions suffer from input delay or long-running CPU tasks (${avgScore.toFixed(0)}ms).`,
      recommendation: "Split long tasks using setTimeout() or requestIdleCallback(), avoid heavy synchronous client-side state recalculations, and verify event handlers are lightweight.",
    });
  }

  const clsRecords = badRecords.filter((r) => r.name === "CLS");
  if (clsRecords.length > 0) {
    const avgScore = clsRecords.reduce((acc, r) => acc + r.value, 0) / clsRecords.length;
    suggestions.push({
      metric: "CLS (Cumulative Layout Shift)",
      score: avgScore,
      pathname: clsRecords[0].pathname,
      diagnosis: `Layout instability detected (${avgScore.toFixed(3)}). Elements are shifting during render.`,
      recommendation: "Always specify width and height attributes for images/videos, allocate space for dynamic ads/widgets, and avoid inserting content above existing content unless responding to user action.",
    });
  }

  return {
    totalAnalysed: records.length,
    healthScore: records.length ? ((records.length - badRecords.length) / records.length) * 100 : 100,
    suggestions,
  };
}

export interface ReplayEvent {
  type: string;
  timestamp: number;
  url?: string;
  name?: string;
  element?: string;
  sizeBytes?: number;
  top?: number;
  left?: number;
  target?: string;
  delayMs?: number;
  score?: number;
  description?: string;
}

export interface PerformanceCluster {
  id: string;
  type: "layout-shift" | "input-lag" | "lcp-slow-paint";
  signature: string;
  occurrences: number;
  affectedSessionsCount: number;
  affectedSessionIds: string[];
  averageImpactValue: number;
  impactScore: number;
  diagnosis: string;
  recommendation: string;
}

export function clusterPerformanceIssues(replays: any[]): PerformanceCluster[] {
  const clusters: { [key: string]: PerformanceCluster } = {};

  replays.forEach((session) => {
    const events: ReplayEvent[] = Array.isArray(session.events) ? session.events : [];
    
    events.forEach((event) => {
      let type: "layout-shift" | "input-lag" | "lcp-slow-paint" | null = null;
      let signature = "";
      let impactValue = 0;
      let diagnosis = "";
      let recommendation = "";

      if (event.type === "layout-shift" && event.score && event.score > 0.05) {
        type = "layout-shift";
        signature = event.element || "unknown-element";
        impactValue = event.score;
        diagnosis = `Layout shift of ${event.score.toFixed(3)} caused by element '${signature}'.`;
        recommendation = `Set explicit size limits or use aspect-ratio css rules to prevent layout shifting when dynamic content loads.`;
      } else if (event.type === "click" && event.delayMs && event.delayMs > 100) {
        type = "input-lag";
        signature = event.target || "unknown-target";
        impactValue = event.delayMs;
        diagnosis = `High input latency (${event.delayMs}ms) detected on clicking target '${signature}'.`;
        recommendation = `Defer non-critical client actions, use asynchronous execution wrappers, and optimize DOM reflow calls inside the handler.`;
      } else if (event.type === "paint" && event.name === "LCP" && event.element) {
        type = "lcp-slow-paint";
        signature = event.element;
        // Search if session has LCP vital to get its total value, or use timestamp
        const lcpVital = Array.isArray(session.vitals) 
          ? session.vitals.find((v: any) => v.name === "LCP") 
          : null;
        const lcpValue = lcpVital ? lcpVital.value : event.timestamp;
        
        // Only classify as slow if LCP > 2500ms
        if (lcpValue > 2500) {
          type = "lcp-slow-paint";
          impactValue = lcpValue;
          diagnosis = `Slow Largest Contentful Paint (LCP) element '${signature}' rendering at ${(lcpValue / 1000).toFixed(2)}s.`;
          recommendation = `Optimize load times with fetchpriority="high", preloading critical fonts/images, and compression.`;
        }
      }

      if (type && signature) {
        const key = `${type}:${signature}`;
        if (!clusters[key]) {
          clusters[key] = {
            id: `cluster-${type}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            signature,
            occurrences: 0,
            affectedSessionsCount: 0,
            affectedSessionIds: [],
            averageImpactValue: 0,
            impactScore: 0,
            diagnosis,
            recommendation,
          };
        }

        const cluster = clusters[key];
        cluster.occurrences += 1;
        if (!cluster.affectedSessionIds.includes(session.sessionId)) {
          cluster.affectedSessionIds.push(session.sessionId);
          cluster.affectedSessionsCount += 1;
        }
        
        // Sum values first
        cluster.averageImpactValue += impactValue;
      }
    });
  });

  // Calculate averages and final impactScore
  const resultList = Object.values(clusters).map((cluster) => {
    cluster.averageImpactValue = cluster.averageImpactValue / cluster.occurrences;
    
    // Compute impactScore
    // Layout shifts average score is small (e.g. 0.15), multiply by 1000 to normalize with ms.
    const severityFactor = cluster.type === "layout-shift" ? 1000 : 1;
    cluster.impactScore = cluster.occurrences * cluster.averageImpactValue * severityFactor;

    return cluster;
  });

  // Sort descending by impactScore
  return resultList.sort((a, b) => b.impactScore - a.impactScore);
}

