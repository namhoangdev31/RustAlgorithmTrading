import { prisma } from "@/lib/server/prisma";

export interface RemediationResult {
  remediationTriggered: boolean;
  actionTaken: string;
  proposedAction: string;
  details: string;
}

/**
 * Automatically remediates production anomalies based on error rates and latency spikes.
 */
export async function executeAutoRemediation(
  bundleId: string,
  anomalyType: "latency" | "error_rate",
  currentValue: number,
  baselineValue: number
): Promise<RemediationResult> {
  try {
    // 1. Fetch bundle and linked project details
    const bundle = await prisma.bundles.findUnique({
      where: { id: bundleId },
      include: { project: true },
    });

    if (!bundle || !bundle.project) {
      return {
        remediationTriggered: false,
        actionTaken: "None",
        proposedAction: "None",
        details: "Bundle or project was not found in registry.",
      };
    }

    const project = bundle.project;
    const projectId = project.id;

    // 2. Classify anomaly and run remediation action

    // CASE A: Suspected DDoS / Botnet attack (Very high error rate, e.g., >50 errors/min)
    if (anomalyType === "error_rate" && currentValue > 50) {
      // Check if WAF rule already exists
      const existingRule = await prisma.firewallRule.findFirst({
        where: {
          projectId,
          name: "AUTO_WAF_UNDER_ATTACK",
        },
      });

      if (!existingRule) {
        // Automatically insert a path challenge rule for the entire site
        await prisma.firewallRule.create({
          data: {
            name: "AUTO_WAF_UNDER_ATTACK",
            action: "challenge",
            type: "path",
            value: "/*",
            active: true,
            projectId,
          },
        });
        console.warn(`[Auto-Remediation] Suspicious traffic/Botnet detected on ${project.name}. Enabled WAF JS Challenge on path '/*'.`);
      }

      return {
        remediationTriggered: true,
        actionTaken: "🔒 Enabled Edge WAF JS Challenge (Under Attack mode) for path '/*' to block bot scanning.",
        proposedAction: "Audit access logs to identify attacker IP subnets and configure permanent WAF IP blocks.",
        details: `Anomaly: Critical error count of ${currentValue} exceeds threshold of ${baselineValue}.`,
      };
    }

    // CASE B: API Error Rate Escalation -> Suspect deployment regression -> Rollback
    if (anomalyType === "error_rate") {
      const currentDeploymentId = project.activeNativeDeploymentId;

      // Find the last stable deployment that is ready/completed and not the current one
      const lastStable = await prisma.nativeDeployment.findFirst({
        where: {
          projectId,
          status: { in: ["completed", "ready", "published"] },
          NOT: currentDeploymentId ? { id: currentDeploymentId } : undefined,
        },
        orderBy: { createdAt: "desc" },
      });

      if (lastStable) {
        // Rollback active deployment in DB
        await prisma.project.update({
          where: { id: projectId },
          data: { activeNativeDeploymentId: lastStable.id },
        });

        console.warn(`[Auto-Remediation] Rolled back project ${project.name} to previous stable version: ${lastStable.version} (Build #${lastStable.buildNumber || "N/A"}).`);

        return {
          remediationTriggered: true,
          actionTaken: `🔄 Automatically rolled back project deployment to previous stable version: ${lastStable.version} (Build #${lastStable.buildNumber || "N/A"}).`,
          proposedAction: "Verify stack traces for the rolled-back deployment version and fix underlying bugs.",
          details: `Anomaly: Current error count of ${currentValue} exceeds threshold of ${baselineValue}.`,
        };
      } else {
        return {
          remediationTriggered: true,
          actionTaken: "⚠️ Skip Rollback: No previous successful deployment found in the registry to roll back to.",
          proposedAction: "Manually deploy a hotfix or scale down the environment to inspect logs.",
          details: "No fallback deployment available.",
        };
      }
    }

    // CASE C: API Latency Congestion (High Load) -> Scale out replicas
    if (anomalyType === "latency") {
      console.warn(`[Auto-Remediation] High latency detected for ${project.name}; no provider-backed scale action is configured.`);

      return {
        remediationTriggered: false,
        actionTaken: "No automatic scale action was executed.",
        proposedAction: "Connect a provider-backed scaling adapter, then review connection pools, cache eviction, and slow queries.",
        details: `Latency of ${currentValue}ms exceeds the P99 baseline of ${baselineValue}ms, but this workspace has no verified scaling adapter.`,
      };
    }

    return {
      remediationTriggered: false,
      actionTaken: "None",
      proposedAction: "None",
      details: "No matching remediation strategy defined.",
    };
  } catch (err: any) {
    console.error("[Auto-Remediation] Execution failed:", err.message);
    return {
      remediationTriggered: false,
      actionTaken: "None",
      proposedAction: "Manual intervention required.",
      details: `Execution failed with error: ${err.message}`,
    };
  }
}
