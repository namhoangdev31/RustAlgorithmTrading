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
