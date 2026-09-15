import { prisma } from "@/lib/server/prisma";

import { nativeRedisKeys, redisPublish, redisSetJson } from "./redis";
import { buildRoutingSnapshot } from "./routing";

export type CreateNativeDeploymentInput = {
  projectId: string;
  version?: string;
  changelog?: string;
  target?: string;
  storagePath?: string;
  bundleUrl?: string;
  sourceCommit?: string;
};

export async function listNativeDeployments(projectId: string) {
  return prisma.nativeDeployment.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function createNativeDeployment(input: CreateNativeDeploymentInput) {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, deletedAt: null },
    include: { bundle: true },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const count = await prisma.nativeDeployment.count({ where: { projectId: input.projectId } });
  const buildNumber = (project.bundle?.buildNumber || 0) + count + 1;
  const version = input.version || `${project.bundle?.version || "1.0.0"}-native.${buildNumber}`;
  const storagePath =
    input.storagePath || project.bundle?.storagePath || `internal://native/${input.projectId}/${buildNumber}`;

  const deployment = await prisma.nativeDeployment.create({
    data: {
      projectId: input.projectId,
      version,
      buildNumber,
      target: input.target || "production",
      status: "ready",
      storagePath,
      bundleUrl: input.bundleUrl || null,
      sourceCommit: input.sourceCommit || null,
      metadata: {
        changelog: input.changelog || "Native deployment queued by LepoS control plane.",
      },
    },
  });

  await syncProjectRouting(input.projectId);
  return deployment;
}

export async function activateNativeDeployment(projectId: string, deploymentId: string) {
  const deployment = await prisma.nativeDeployment.findFirst({
    where: { id: deploymentId, projectId },
  });

  if (!deployment) {
    throw new Error("Native deployment not found.");
  }

  const activated = await prisma.$transaction(async (tx) => {
    await tx.nativeDeployment.updateMany({
      where: { projectId, target: deployment.target, id: { not: deployment.id } },
      data: { status: "ready" },
    });

    const nextDeployment = await tx.nativeDeployment.update({
      where: { id: deployment.id },
      data: { status: "active", activatedAt: new Date() },
    });

    await tx.project.update({
      where: { id: projectId },
      data: { activeNativeDeploymentId: deployment.id, updatedAt: new Date() },
    });

    return nextDeployment;
  });

  await syncProjectRouting(projectId);
  await redisPublish("lepos:purge", { projectId, deploymentId: deployment.id, reason: "rollback" });
  return activated;
}

export async function syncProjectRouting(projectId: string) {
  const snapshot = await buildRoutingSnapshot(projectId);
  if (!snapshot) {
    return false;
  }

  const ttlSeconds = snapshot.routingPolicy?.snapshotTtlSeconds || undefined;

  await redisSetJson(nativeRedisKeys.activeDeployment(projectId), snapshot, ttlSeconds);
  await redisSetJson(`rc:backup:deployment:${projectId}`, snapshot, ttlSeconds);
  
  await Promise.all(
    snapshot.domains.map(async (domain) => {
      const payload = {
        ...snapshot,
        domain: domain.domain,
        sslStatus: domain.sslStatus,
      };
      await redisSetJson(nativeRedisKeys.domain(domain.domain), payload, ttlSeconds);
      await redisSetJson(`rc:backup:domain:${domain.domain}`, payload, ttlSeconds);
    })
  );

  return true;
}

export async function getSafeProjectEnv(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      activeNativeDeployment: true,
      nativeDomainConfigs: true,
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  return {
    LEPOS_PROJECT_ID: project.id,
    LEPOS_PROJECT_NAME: project.name,
    LEPOS_ACTIVE_DEPLOYMENT_ID: project.activeNativeDeploymentId || "",
    LEPOS_ACTIVE_STORAGE_PATH: project.activeNativeDeployment?.storagePath || "",
    LEPOS_DOMAINS: project.nativeDomainConfigs.map((domain) => domain.domain).join(","),
  };
}
