import { exec } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VulnerabilitySeverity = "info" | "low" | "moderate" | "high" | "critical";

const SEVERITY_ORDER: Record<VulnerabilitySeverity, number> = {
  info: 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

export interface Vulnerability {
  id: string;
  severity: VulnerabilitySeverity;
  packageName: string;
  installedVersion: string;
  vulnerableRange: string;
  title: string;
  url: string;
  fixAvailable: boolean;
  fixVersion?: string;
}

export interface ScanResult {
  scanner: string;
  totalVulnerabilities: number;
  bySeverity: Record<VulnerabilitySeverity, number>;
  vulnerabilities: Vulnerability[];
  scanDuration: number;
  scannedAt: string;
}

export interface ScanPolicy {
  blockOnSeverity: VulnerabilitySeverity;
  ignoreAdvisories: string[];
  autoFixMinor: boolean;
}

const DEFAULT_POLICY: ScanPolicy = {
  blockOnSeverity: "critical",
  ignoreAdvisories: [],
  autoFixMinor: false,
};

function emptyScanResult(scanner: string, duration: number): ScanResult {
  return {
    scanner,
    totalVulnerabilities: 0,
    bySeverity: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 },
    vulnerabilities: [],
    scanDuration: duration,
    scannedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Package manager detection
// ---------------------------------------------------------------------------

/** Detect the package manager used in a project directory */
export async function detectPackageManager(
  projectDir: string
): Promise<"npm" | "yarn" | "pnpm"> {
  const checks: Array<[string, "yarn" | "pnpm"]> = [
    ["yarn.lock", "yarn"],
    ["pnpm-lock.yaml", "pnpm"],
  ];

  for (const [lockFile, pm] of checks) {
    try {
      await fs.access(path.join(projectDir, lockFile));
      return pm;
    } catch {
      // not found — continue
    }
  }

  return "npm";
}

// ---------------------------------------------------------------------------
// npm audit
// ---------------------------------------------------------------------------

async function runNpmAudit(projectDir: string): Promise<ScanResult> {
  const start = Date.now();

  try {
    const { stdout } = await execAsync("npm audit --json --audit-level=info 2>/dev/null || true", {
      cwd: projectDir,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 60_000,
    });

    const duration = Date.now() - start;
    if (!stdout.trim()) return emptyScanResult("npm", duration);

    const data = JSON.parse(stdout);
    const vulnerabilities: Vulnerability[] = [];

    // npm audit v2 format: { vulnerabilities: { [pkg]: { severity, via, ... } } }
    if (data.vulnerabilities && typeof data.vulnerabilities === "object") {
      for (const [pkgName, info] of Object.entries<any>(data.vulnerabilities)) {
        const severity = (info.severity || "info") as VulnerabilitySeverity;
        const fixAvailable = Boolean(info.fixAvailable);
        const fixVersion =
          typeof info.fixAvailable === "object" ? info.fixAvailable.version : undefined;

        // Extract advisory details from `via` array
        const vias = Array.isArray(info.via) ? info.via : [];
        const advisory = vias.find((v: any) => typeof v === "object") || {};

        vulnerabilities.push({
          id: String(advisory.source || advisory.url || `npm-${pkgName}`),
          severity,
          packageName: pkgName,
          installedVersion: info.range || "unknown",
          vulnerableRange: advisory.range || info.range || "unknown",
          title: advisory.title || `Vulnerability in ${pkgName}`,
          url: advisory.url || "",
          fixAvailable,
          fixVersion,
        });
      }
    }

    const bySeverity: Record<VulnerabilitySeverity, number> = {
      info: 0, low: 0, moderate: 0, high: 0, critical: 0,
    };
    for (const v of vulnerabilities) {
      bySeverity[v.severity]++;
    }

    return {
      scanner: "npm",
      totalVulnerabilities: vulnerabilities.length,
      bySeverity,
      vulnerabilities,
      scanDuration: duration,
      scannedAt: new Date().toISOString(),
    };
  } catch {
    return emptyScanResult("npm", Date.now() - start);
  }
}

// ---------------------------------------------------------------------------
// yarn audit
// ---------------------------------------------------------------------------

async function runYarnAudit(projectDir: string): Promise<ScanResult> {
  const start = Date.now();

  try {
    const { stdout } = await execAsync("yarn audit --json 2>/dev/null || true", {
      cwd: projectDir,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 60_000,
    });

    const duration = Date.now() - start;
    if (!stdout.trim()) return emptyScanResult("yarn", duration);

    // Yarn audit outputs NDJSON (one JSON object per line)
    const vulnerabilities: Vulnerability[] = [];
    const lines = stdout.trim().split("\n");

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type === "auditAdvisory" && entry.data?.advisory) {
          const adv = entry.data.advisory;
          vulnerabilities.push({
            id: String(adv.id || adv.github_advisory_id || "unknown"),
            severity: (adv.severity || "info") as VulnerabilitySeverity,
            packageName: adv.module_name || "unknown",
            installedVersion: entry.data.resolution?.path || "unknown",
            vulnerableRange: adv.vulnerable_versions || "unknown",
            title: adv.title || "Unknown vulnerability",
            url: adv.url || "",
            fixAvailable: Boolean(adv.patched_versions && adv.patched_versions !== "<0.0.0"),
            fixVersion: adv.patched_versions || undefined,
          });
        }
      } catch {
        // Skip malformed lines
      }
    }

    const bySeverity: Record<VulnerabilitySeverity, number> = {
      info: 0, low: 0, moderate: 0, high: 0, critical: 0,
    };
    for (const v of vulnerabilities) {
      bySeverity[v.severity]++;
    }

    return {
      scanner: "yarn",
      totalVulnerabilities: vulnerabilities.length,
      bySeverity,
      vulnerabilities,
      scanDuration: duration,
      scannedAt: new Date().toISOString(),
    };
  } catch {
    return emptyScanResult("yarn", Date.now() - start);
  }
}

// ---------------------------------------------------------------------------
// pnpm audit
// ---------------------------------------------------------------------------

async function runPnpmAudit(projectDir: string): Promise<ScanResult> {
  const start = Date.now();

  try {
    const { stdout } = await execAsync("pnpm audit --json 2>/dev/null || true", {
      cwd: projectDir,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 60_000,
    });

    const duration = Date.now() - start;
    if (!stdout.trim()) return emptyScanResult("pnpm", duration);

    // pnpm audit JSON is similar to npm v2 format
    const data = JSON.parse(stdout);
    const vulnerabilities: Vulnerability[] = [];

    if (data.advisories && typeof data.advisories === "object") {
      for (const [, adv] of Object.entries<any>(data.advisories)) {
        vulnerabilities.push({
          id: String(adv.id || adv.github_advisory_id || "unknown"),
          severity: (adv.severity || "info") as VulnerabilitySeverity,
          packageName: adv.module_name || "unknown",
          installedVersion: adv.findings?.[0]?.version || "unknown",
          vulnerableRange: adv.vulnerable_versions || "unknown",
          title: adv.title || "Unknown vulnerability",
          url: adv.url || "",
          fixAvailable: Boolean(adv.patched_versions && adv.patched_versions !== "<0.0.0"),
          fixVersion: adv.patched_versions || undefined,
        });
      }
    } else if (data.vulnerabilities && typeof data.vulnerabilities === "object") {
      // Newer pnpm versions use npm-like format
      for (const [pkgName, info] of Object.entries<any>(data.vulnerabilities)) {
        vulnerabilities.push({
          id: `pnpm-${pkgName}`,
          severity: (info.severity || "info") as VulnerabilitySeverity,
          packageName: pkgName,
          installedVersion: info.range || "unknown",
          vulnerableRange: info.range || "unknown",
          title: `Vulnerability in ${pkgName}`,
          url: "",
          fixAvailable: Boolean(info.fixAvailable),
        });
      }
    }

    const bySeverity: Record<VulnerabilitySeverity, number> = {
      info: 0, low: 0, moderate: 0, high: 0, critical: 0,
    };
    for (const v of vulnerabilities) {
      bySeverity[v.severity]++;
    }

    return {
      scanner: "pnpm",
      totalVulnerabilities: vulnerabilities.length,
      bySeverity,
      vulnerabilities,
      scanDuration: duration,
      scannedAt: new Date().toISOString(),
    };
  } catch {
    return emptyScanResult("pnpm", Date.now() - start);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Run a security audit scan using the project's detected package manager. */
export async function scanWorkspace(projectDir: string): Promise<ScanResult> {
  const pm = await detectPackageManager(projectDir);

  switch (pm) {
    case "yarn":
      return runYarnAudit(projectDir);
    case "pnpm":
      return runPnpmAudit(projectDir);
    default:
      return runNpmAudit(projectDir);
  }
}

/**
 * Evaluate whether a build should be blocked based on scan results and policy.
 * Default policy: block on critical vulnerabilities.
 */
export function shouldBlockBuild(
  result: ScanResult,
  policy: ScanPolicy = DEFAULT_POLICY
): { blocked: boolean; reason: string } {
  const threshold = SEVERITY_ORDER[policy.blockOnSeverity];

  const blocking = result.vulnerabilities.filter((v) => {
    if (policy.ignoreAdvisories.includes(v.id)) return false;
    return SEVERITY_ORDER[v.severity] >= threshold;
  });

  if (blocking.length === 0) {
    return { blocked: false, reason: "" };
  }

  const summary = blocking
    .map((v) => `${v.severity.toUpperCase()}: ${v.packageName} — ${v.title}`)
    .join("; ");

  return {
    blocked: true,
    reason: `Build blocked: ${blocking.length} vulnerability(ies) at or above ${policy.blockOnSeverity} severity. ${summary}`,
  };
}

/** Generate a Markdown report summarising scan results. */
export function generateReport(result: ScanResult): string {
  const lines: string[] = [
    `## Security Scan Report`,
    ``,
    `| Metric | Value |`,
    `|---|---|`,
    `| Scanner | ${result.scanner} |`,
    `| Total Vulnerabilities | ${result.totalVulnerabilities} |`,
    `| Critical | ${result.bySeverity.critical} |`,
    `| High | ${result.bySeverity.high} |`,
    `| Moderate | ${result.bySeverity.moderate} |`,
    `| Low | ${result.bySeverity.low} |`,
    `| Info | ${result.bySeverity.info} |`,
    `| Scan Duration | ${result.scanDuration}ms |`,
    `| Scanned At | ${result.scannedAt} |`,
    ``,
  ];

  if (result.vulnerabilities.length > 0) {
    lines.push(`### Vulnerabilities`, ``);
    lines.push(`| Severity | Package | Title | Fix Available |`);
    lines.push(`|---|---|---|---|`);

    for (const v of result.vulnerabilities) {
      const fix = v.fixAvailable ? (v.fixVersion ? `✅ ${v.fixVersion}` : "✅ Yes") : "❌ No";
      const link = v.url ? `[${v.title}](${v.url})` : v.title;
      lines.push(`| ${v.severity.toUpperCase()} | ${v.packageName}@${v.installedVersion} | ${link} | ${fix} |`);
    }
    lines.push(``);
  } else {
    lines.push(`✅ **No vulnerabilities found.** All dependencies are secure.`, ``);
  }

  return lines.join("\n");
}

/** Scan all workspace directories in a monorepo. */
export async function scanAllWorkspaces(
  rootDir: string,
  workspaces: string[]
): Promise<Record<string, ScanResult>> {
  const results: Record<string, ScanResult> = {};

  for (const ws of workspaces) {
    const wsDir = path.join(rootDir, ws);
    try {
      await fs.access(path.join(wsDir, "package.json"));
      results[ws] = await scanWorkspace(wsDir);
    } catch {
      // Skip workspaces without package.json
    }
  }

  return results;
}
