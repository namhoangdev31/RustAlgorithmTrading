import { prisma } from "@/lib/server/prisma";
import { syncProjectRouting } from "./deployments";

export async function checkCloudTargetsHealth(projectId: string) {
  const targets = await prisma.nativeCloudTarget.findMany({
    where: { projectId },
  });

  if (targets.length === 0) {
    return;
  }

  for (const target of targets) {
    const meta = (target.metadata as any) || {};
    const endpoint = target.endpoint;
    let healthStatus = "unhealthy";
    let latency: number | null = null;

    if (endpoint) {
      const start = Date.now();
      try {
        const response = await fetch(endpoint, {
          method: "HEAD",
          cache: "no-store",
          signal: AbortSignal.timeout(3000),
        });
        latency = Date.now() - start;
        healthStatus = response.ok || response.status < 500 ? "healthy" : "unhealthy";
      } catch {
        healthStatus = "unhealthy";
      }
    }

    await prisma.nativeCloudTarget.update({
      where: { id: target.id },
      data: {
        healthStatus,
        lastCheckAt: new Date(),
        metadata: {
          ...meta,
          latency,
        },
      },
    });
  }

  await syncProjectRouting(projectId);
}

export async function toggleCloudTargetHealth(
  projectId: string,
  targetId: string,
  statusOrEnabled: "healthy" | "unhealthy" | "overloaded" | boolean
) {
  const target = await prisma.nativeCloudTarget.findFirst({
    where: { id: targetId, projectId },
  });

  if (!target) {
    throw new Error("Target not found.");
  }

  let healthStatus = "healthy";
  if (typeof statusOrEnabled === "boolean") {
    healthStatus = statusOrEnabled ? "healthy" : "unhealthy";
  } else {
    healthStatus = statusOrEnabled;
  }
  await prisma.nativeCloudTarget.update({
    where: { id: targetId },
    data: {
      healthStatus,
      lastCheckAt: new Date(),
    },
  });

  await syncProjectRouting(projectId);
}
