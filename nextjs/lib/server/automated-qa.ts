import { provisionStagingServices } from "./ephemeral-staging";

export interface QaTestResult {
  name: string;
  category: "accessibility" | "performance" | "e2e" | "security";
  status: "passed" | "failed";
  durationMs: number;
  details: string;
}

export interface QaReport {
  success: boolean;
  score: number;
  tests: QaTestResult[];
  markdownReport: string;
  timestamp: string;
}

export async function runAutomatedQaTests(previewUrl: string, projectId?: string, deploymentId?: string): Promise<QaReport> {
  const timestamp = new Date().toISOString();
  const tests: QaTestResult[] = [];
  const suiteStartedAt = Date.now();
  let response: Response | null = null;
  let html = "";

  const requestStartedAt = Date.now();
  try {
    response = await fetch(previewUrl, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    html = await response.text();
    tests.push({
      name: "Preview HTTP health",
      category: "e2e",
      status: response.ok ? "passed" : "failed",
      durationMs: Date.now() - requestStartedAt,
      details: `Endpoint returned HTTP ${response.status}.`,
    });
  } catch (error) {
    tests.push({
      name: "Preview HTTP health",
      category: "e2e",
      status: "failed",
      durationMs: Date.now() - requestStartedAt,
      details: error instanceof Error ? error.message : "Preview request failed.",
    });
  }

  const responseTime = Date.now() - requestStartedAt;
  tests.push({
    name: "Preview response time",
    category: "performance",
    status: response?.ok && responseTime < 2500 ? "passed" : "failed",
    durationMs: responseTime,
    details: `Measured server response and body transfer time: ${responseTime}ms (budget < 2500ms).`,
  });

  const isHtml = response?.headers.get("content-type")?.includes("text/html") && html.length > 0;
  const missingLanguage = isHtml && !/<html[^>]+lang=["'][^"']+["']/i.test(html);
  const images = isHtml ? [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]) : [];
  const imagesMissingAlt = images.filter((tag) => !/\balt=["'][^"']*["']/i.test(tag)).length;
  tests.push({
    name: "Static accessibility evidence",
    category: "accessibility",
    status: Boolean(isHtml && !missingLanguage && imagesMissingAlt === 0) ? "passed" : "failed",
    durationMs: 0,
    details: isHtml
      ? `Document language ${missingLanguage ? "missing" : "present"}; images without alt: ${imagesMissingAlt}.`
      : "The preview did not return an HTML document, so accessibility could not be verified.",
  });

  const securityHeaders = ["content-security-policy", "x-content-type-options", "referrer-policy"];
  const missingHeaders = securityHeaders.filter((header) => !response?.headers.get(header));
  tests.push({
    name: "Security response headers",
    category: "security",
    status: response?.ok && missingHeaders.length === 0 ? "passed" : "failed",
    durationMs: 0,
    details: missingHeaders.length ? `Missing headers: ${missingHeaders.join(", ")}.` : "Required response headers are present.",
  });

  if (projectId && deploymentId) {
    const stagingStartedAt = Date.now();
    try {
      const staging = await provisionStagingServices(projectId, deploymentId);
      tests.push({
        name: "Ephemeral staging provider",
        category: "e2e",
        status: "passed",
        durationMs: Date.now() - stagingStartedAt,
        details: `Provider ${staging.providerId} returned persisted service endpoints.`,
      });
    } catch (error) {
      tests.push({
        name: "Ephemeral staging provider",
        category: "e2e",
        status: "failed",
        durationMs: Date.now() - stagingStartedAt,
        details: error instanceof Error ? error.message : "Staging provider unavailable.",
      });
    }
  }

  const passedCount = tests.filter((test) => test.status === "passed").length;
  const score = tests.length ? Math.round((passedCount / tests.length) * 100) : 0;
  const success = tests.length > 0 && passedCount === tests.length;
  const markdownReport = [
    "### LepoS Automated QA Report",
    `Overall: ${success ? "PASSED" : "FAILED"} | Score: ${score}% | Duration: ${Date.now() - suiteStartedAt}ms`,
    "",
    "| Test | Category | Status | Evidence |",
    "| :--- | :--- | :---: | :--- |",
    ...tests.map((test) => `| ${test.name} | ${test.category} | ${test.status.toUpperCase()} | ${test.details} |`),
    "",
    `Generated at ${timestamp}.`,
  ].join("\n");

  return { success, score, tests, markdownReport, timestamp };
}
