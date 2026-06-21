import { promisify } from "node:util";
import { execFile } from "node:child_process";
import path from "node:path";

import { purgeNativeCache } from "./cache";
import { activateNativeDeployment, syncProjectRouting } from "./deployments";
import { setRegionReplicaDrainState } from "./routing";
import { prisma } from "@/lib/server/prisma";

const execFileAsync = promisify(execFile);

type CreateRemediationRunInput = {
  projectId: string;
  actionType: "cache_purge" | "routing_refresh" | "deployment_rollback" | "replica_drain";
  mode?: "observe" | "suggest" | "approve" | "auto-apply";
  summary: string;
  payload?: Record<string, unknown>;
  dryRun?: boolean;
  diagnosticId?: string | null;
  requestedByUserId?: string | null;
};

async function writeRemediationAudit(projectId: string, userId: string | null | undefined, action: string, value: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { bundle: true },
  });

  if (!project?.bundle || !userId) {
    return;
  }

  await prisma.bundleAuditLog.create({
    data: {
      id: crypto.randomUUID(),
      bundleId: project.bundle.id,
      userId,
      action,
      fieldName: "native_remediation",
      oldValue: value,
      createdAt: new Date(),
    },
  });
}

export async function listRemediationRuns(projectId: string) {
  return prisma.nativeRemediationRun.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
}

export async function createRemediationRun(input: CreateRemediationRunInput) {
  return prisma.nativeRemediationRun.create({
    data: {
      projectId: input.projectId,
      diagnosticId: input.diagnosticId || null,
      actionType: input.actionType,
      mode: input.mode || "suggest",
      status: input.mode === "observe" ? "observed" : "suggested",
      summary: input.summary,
      dryRun: input.dryRun ?? true,
      payload: (input.payload || null) as any,
      requestedByUserId: input.requestedByUserId || null,
      evidence: {
        createdFrom: "native-platform-control-plane",
      },
    },
  });
}

export async function approveRemediationRun(runId: string, approvedByUserId: string) {
  return prisma.nativeRemediationRun.update({
    where: { id: runId },
    data: {
      status: "approved",
      approvedByUserId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function executeRemediationRun(runId: string, actorUserId?: string | null) {
  const run = await prisma.nativeRemediationRun.findUnique({
    where: { id: runId },
  });

  if (!run) {
    throw new Error("Remediation run not found.");
  }

  const payload = (run.payload || {}) as Record<string, unknown>;
  const evidence = {
    startedAt: new Date().toISOString(),
    dryRun: run.dryRun,
  } as Record<string, unknown>;
  const scriptEvidence = await executeRemediationScript(run, payload, true);
  evidence.preflight = scriptEvidence;

  if (run.actionType === "cache_purge") {
    const path = typeof payload.path === "string" && payload.path ? payload.path : "/";
    evidence.path = path;

    if (!run.dryRun) {
      evidence.apply = await executeRemediationScript(run, payload, false);
      await purgeNativeCache(run.projectId, path);
    }
  } else if (run.actionType === "routing_refresh") {
    evidence.projectId = run.projectId;
    if (!run.dryRun) {
      evidence.apply = await executeRemediationScript(run, payload, false);
      await syncProjectRouting(run.projectId);
    }
  } else if (run.actionType === "deployment_rollback") {
    const deploymentId = typeof payload.deploymentId === "string" ? payload.deploymentId : "";
    if (!deploymentId) {
      throw new Error("deploymentId is required for deployment rollback remediation.");
    }
    evidence.deploymentId = deploymentId;
    if (!run.dryRun) {
      evidence.apply = await executeRemediationScript(run, payload, false);
      await activateNativeDeployment(run.projectId, deploymentId);
    }
  } else if (run.actionType === "replica_drain") {
    const region = typeof payload.region === "string" ? payload.region : "";
    const drainState =
      payload.drainState === "drained" || payload.drainState === "draining"
        ? (payload.drainState as "draining" | "drained")
        : "draining";

    if (!region) {
      throw new Error("region is required for replica drain remediation.");
    }

    evidence.region = region;
    evidence.drainState = drainState;
    if (!run.dryRun) {
      evidence.apply = await executeRemediationScript(run, payload, false);
      await setRegionReplicaDrainState(run.projectId, region, drainState);
      await syncProjectRouting(run.projectId);
    }
  }

  const postCheck = await collectRemediationPostCheck(run.projectId);

  const updated = await prisma.nativeRemediationRun.update({
    where: { id: run.id },
    data: {
      status: run.dryRun ? "dry-run-complete" : "completed",
      executedAt: new Date(),
      evidence: evidence as any,
      postCheck: postCheck as any,
      updatedAt: new Date(),
    },
  });

  await writeRemediationAudit(run.projectId, actorUserId || run.requestedByUserId, run.actionType, updated.status);
  return updated;
}

async function executeRemediationScript(
  run: {
    id: string;
    projectId: string;
    actionType: string;
  },
  payload: Record<string, unknown>,
  dryRun: boolean
) {
  const scriptPath =
    process.env.LEPOS_NATIVE_REMEDIATION_SCRIPT ||
    path.resolve(process.cwd(), "../ops/scripts/native_remediation.sh");

  const env = {
    ...process.env,
    LEPOS_REMEDIATION_RUN_ID: run.id,
    LEPOS_REMEDIATION_PROJECT_ID: run.projectId,
    LEPOS_REMEDIATION_ACTION: run.actionType,
    LEPOS_REMEDIATION_PAYLOAD: JSON.stringify(payload),
    LEPOS_REMEDIATION_DRY_RUN: dryRun ? "1" : "0",
  };

  const { stdout, stderr } = await execFileAsync("/bin/bash", [scriptPath, run.actionType], {
    env,
    cwd: path.resolve(process.cwd(), ".."),
    timeout: 15_000,
  });

  return {
    dryRun,
    scriptPath,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  };
}

async function collectRemediationPostCheck(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      activeNativeDeploymentId: true,
      nativeRegionReplicas: {
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
        take: 5,
        select: {
          region: true,
          healthStatus: true,
          drainState: true,
          lastHeartbeatAt: true,
        },
      },
    },
  });

  return {
    verifiedAt: new Date().toISOString(),
    status: project ? "ok" : "unknown",
    activeDeploymentId: project?.activeNativeDeploymentId || null,
    replicas:
      project?.nativeRegionReplicas.map((replica) => ({
        region: replica.region,
        healthStatus: replica.healthStatus,
        drainState: replica.drainState,
        lastHeartbeatAt: replica.lastHeartbeatAt?.toISOString() || null,
      })) || [],
  };
}
