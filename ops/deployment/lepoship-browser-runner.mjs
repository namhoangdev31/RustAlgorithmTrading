import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const run = promisify(execFile);
const inputIndex = process.argv.indexOf("--input");
if (inputIndex < 0 || !process.argv[inputIndex + 1]) throw new Error("--input is required");
const input = JSON.parse(await readFile(process.argv[inputIndex + 1], "utf8"));

const finding = (dimension, severity, ruleId, title, confirmed = false) => ({
  fingerprint: createHash("sha256").update(`${dimension}:${ruleId}:${String(title).slice(0, 2000)}`).digest("hex"),
  dimension, severity, confidence: 1, ruleId, title: String(title).slice(0, 2000), confirmed,
});
const healthy = (findings, metrics, evidence = [], coverage = 1, reproducibility = 1) => ({
  status: findings.some((item) => item.confirmed && ["critical", "high"].includes(item.severity)) ? "bundle_failed" : "succeeded",
  findings, metrics, evidence, coverage, completeness: 1, reproducibility, engineHealth: 1,
});

const server = await serve(input.root);
const baseURL = `http://127.0.0.1:${server.address().port}/`;
let browser;
try {
  let result;
  if (input.engine === "lighthouse-performance") {
    result = await lighthouse(baseURL, input.workspace);
  } else {
    browser = await chromium.launch({ headless: true });
    result = input.engine === "axe-accessibility"
      ? await accessibility(browser, baseURL, input.workspace)
      : await runtime(browser, baseURL, input.workspace);
  }
  process.stdout.write(JSON.stringify(result));
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}

async function runtime(browser, baseURL, workspace) {
  const context = await browser.newContext({ serviceWorkers: "block", viewport: { width: 1280, height: 720 } });
  await restrictNetwork(context, baseURL);
  const page = await context.newPage();
  const findings = [];
  page.on("console", (message) => { if (message.type() === "error") findings.push(finding("runtime", "medium", "CONSOLE_ERROR", message.text())); });
  page.on("pageerror", (error) => findings.push(finding("runtime", "high", "RUNTIME_EXCEPTION", error.message, true)));
  page.on("requestfailed", (request) => findings.push(finding("api", "medium", "REQUEST_FAILED", `${request.method()} ${request.url()}`)));
  const queue = [baseURL];
  const visited = new Set();
  while (queue.length && visited.size < 25) {
    const target = queue.shift();
    if (visited.has(target)) continue;
    try {
      await page.goto(target, { waitUntil: "networkidle", timeout: 30_000 });
      visited.add(target);
      const links = await page.locator("a[href]").evaluateAll((items) => items.map((item) => item.href));
      for (const link of links.sort()) if (allowed(link, baseURL) && !visited.has(link)) queue.push(link);
    } catch (error) {
      findings.push(finding("runtime", "high", "ROUTE_CRASH", `${target}: ${error.message}`, true));
    }
  }
  const screenshot = path.join(workspace, "runtime.png");
  await page.screenshot({ path: screenshot, fullPage: true });
  await context.close();
  const crashes = findings.filter((item) => ["ROUTE_CRASH", "RUNTIME_EXCEPTION"].includes(item.ruleId));
  if (crashes.length >= 2) findings.push(finding("runtime", "critical", "REPRODUCIBLE_CRASH", "Runtime crash reproduced on multiple routes", true));
  return healthy(findings, { routesVisited: visited.size }, [{ kind: "screenshot", path: screenshot, contentType: "image/png" }], Math.min(1, visited.size / 5));
}

async function accessibility(browser, baseURL, workspace) {
  const context = await browser.newContext({ serviceWorkers: "block" });
  await restrictNetwork(context, baseURL);
  const page = await context.newPage();
  await page.goto(baseURL, { waitUntil: "networkidle", timeout: 30_000 });
  const audit = await new AxeBuilder({ page }).analyze();
  const report = path.join(workspace, "axe.json");
  await writeFile(report, JSON.stringify(audit), { mode: 0o600 });
  await context.close();
  const findings = audit.violations.map((item) => finding("accessibility", item.impact === "critical" ? "high" : "medium", item.id, item.help));
  return healthy(findings, { violations: findings.length }, [{ kind: "accessibility-report", path: report, contentType: "application/json" }]);
}

async function lighthouse(baseURL, workspace) {
  const report = path.join(workspace, "lighthouse.json");
  try {
    await run("/opt/lepoship/node_modules/.bin/lighthouse", [baseURL, "--quiet", "--output=json", `--output-path=${report}`, "--only-categories=performance,seo", "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage --host-resolver-rules=MAP * 0.0.0.0,EXCLUDE localhost,EXCLUDE 127.0.0.1"], { timeout: 120_000, maxBuffer: 2 << 20 });
    const audit = JSON.parse(await readFile(report, "utf8"));
    const performance = Number(audit.categories?.performance?.score ?? 0) * 100;
    const seo = Number(audit.categories?.seo?.score ?? 0) * 100;
    const findings = [];
    if (performance < 70) findings.push(finding("performance", "medium", "LIGHTHOUSE_PERFORMANCE", `Performance score is ${performance}`));
    if (seo < 70) findings.push(finding("seo", "medium", "LIGHTHOUSE_SEO", `SEO score is ${seo}`));
    return healthy(findings, { performance, seo }, [{ kind: "performance-report", path: report, contentType: "application/json" }], 1, 0.9);
  } catch (error) {
    return { status: "infrastructure_failed", findings: [], metrics: {}, evidence: [], coverage: 0, completeness: 0, reproducibility: 0, engineHealth: 0, errorCode: "LIGHTHOUSE_FAILED", errorMessage: error.message };
  }
}

async function restrictNetwork(context, baseURL) {
  await context.route("**/*", async (route) => allowed(route.request().url(), baseURL) ? route.continue() : route.abort());
}
function allowed(value, baseURL) {
  try {
    const url = new URL(value, baseURL);
    return ["data:", "blob:"].includes(url.protocol) || (url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname));
  } catch { return false; }
}
async function serve(root) {
  const absoluteRoot = path.resolve(root);
  const server = createServer(async (request, response) => {
    const relative = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname).replace(/^\/+/, "") || "index.html";
    const resolved = path.resolve(absoluteRoot, relative);
    if (!resolved.startsWith(`${absoluteRoot}${path.sep}`)) { response.writeHead(403).end(); return; }
    try {
      const body = await readFile(resolved);
      const type = resolved.endsWith(".html") ? "text/html" : resolved.endsWith(".js") ? "text/javascript" : resolved.endsWith(".css") ? "text/css" : "application/octet-stream";
      response.writeHead(200, { "Content-Type": type, "Content-Length": body.length, "Cache-Control": "no-store" });
      response.end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise((resolve, reject) => server.listen(0, "127.0.0.1", resolve).once("error", reject));
  return server;
}
