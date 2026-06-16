import { prisma } from "@/lib/server/prisma";
import { getProjectProvidersAction } from "@/app/actions/vercel";
import { syncCentralEdgeConfig } from "@/lib/server/vercel";
import { EventEmitter } from "events";

export interface TargetingRule {
  type: "geo" | "device" | "percentage";
  countries?: string[];
  devices?: string[];
  split?: number;
  variant: "A" | "B";
}

export interface FeatureFlagConfig {
  id: string;
  name: string;
  status: string; // "draft" | "running" | "ended"
  trafficSplit: number;
  variantAConfig: string;
  variantBConfig: string;
  targetingRules: TargetingRule[];
}

// Global event emitter for Server-Sent Events to sync flags changes in real-time
export const flagEvents = new EventEmitter();
flagEvents.setMaxListeners(100);

/**
 * Consistently hashes a string to a number between 0 and 99.
 * Fully compatible with standard JS/TS runtimes including Edge middleware.
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 100;
}

/**
 * Sync feature flags for a project to all linked providers (Vercel Edge Config, Cloudflare KV)
 */
export async function syncProjectFeatureFlags(projectId: string): Promise<FeatureFlagConfig[]> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    include: { bundle: true }
  });
  if (!project || !project.bundle) return [];

  const abTests = await prisma.bundleAbTests.findMany({
    where: { bundleId: project.bundle.id },
  });

  const flags: FeatureFlagConfig[] = abTests.map((t) => {
    let targetingRules: TargetingRule[] = [];
    if (t.hypothesis) {
      try {
        const parsed = JSON.parse(t.hypothesis);
        if (Array.isArray(parsed.targetingRules)) {
          targetingRules = parsed.targetingRules;
        }
      } catch {}
    }

    return {
      id: t.id,
      name: t.testName,
      status: t.status,
      trafficSplit: t.trafficSplit,
      variantAConfig: t.variantAConfig,
      variantBConfig: t.variantBConfig,
      targetingRules,
    };
  });

  // Replicate configurations to all linked multi-providers (Vercel & Cloudflare KV) in parallel
  const providersRes = await getProjectProvidersAction(projectId);
  if (providersRes.success && providersRes.providers && providersRes.providers.length > 0) {
    const items = [
      {
        operation: "upsert" as const,
        key: `flags:${projectId}`,
        value: flags
      }
    ];
    await syncCentralEdgeConfig(project.id, providersRes.providers, items);
  }

  console.log(`[FeatureFlag Sync] Synced ${flags.length} flags for project ${projectId}.`);
  return flags;
}

/**
 * Evaluates feature flags for a specific user request context.
 */
export async function evaluateFeatureFlags(
  projectId: string,
  userId: string,
  requestHeaders: Headers
): Promise<Record<string, boolean>> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    include: { bundle: true }
  });
  if (!project || !project.bundle) return {};

  const abTests = await prisma.bundleAbTests.findMany({
    where: { bundleId: project.bundle.id },
  });

  const country = (requestHeaders.get("x-vercel-ip-country") || requestHeaders.get("cf-ipcountry") || "US").toUpperCase();
  const userAgent = requestHeaders.get("user-agent") || "";
  const device = /mobile|android|iphone|ipad/i.test(userAgent) ? "mobile" : "desktop";

  const results: Record<string, boolean> = {};

  for (const t of abTests) {
    if (t.status !== "running") {
      results[t.testName] = false;
      continue;
    }

    let targetingRules: TargetingRule[] = [];
    if (t.hypothesis) {
      try {
        const parsed = JSON.parse(t.hypothesis);
        if (Array.isArray(parsed.targetingRules)) {
          targetingRules = parsed.targetingRules;
        }
      } catch {}
    }

    let matchedVariant: "A" | "B" | null = null;

    // Evaluate rules in order of precedence
    for (const rule of targetingRules) {
      if (rule.type === "geo" && rule.countries) {
        const matchesGeo = rule.countries.map(c => c.toUpperCase()).includes(country);
        if (matchesGeo) {
          matchedVariant = rule.variant;
          break;
        }
      } else if (rule.type === "device" && rule.devices) {
        const matchesDevice = rule.devices.map(d => d.toLowerCase()).includes(device);
        if (matchesDevice) {
          matchedVariant = rule.variant;
          break;
        }
      } else if (rule.type === "percentage" && rule.split !== undefined) {
        const hash = hashString(userId + t.id);
        if (hash < rule.split) {
          matchedVariant = rule.variant;
          break;
        }
      }
    }

    // Default to trafficSplit assignment if no rules matched
    if (matchedVariant === null) {
      const hash = hashString(userId + t.id);
      matchedVariant = hash < t.trafficSplit ? "B" : "A";
    }

    results[t.testName] = matchedVariant === "B";
  }

  return results;
}
