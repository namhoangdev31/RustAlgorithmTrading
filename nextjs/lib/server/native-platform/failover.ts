import { prisma } from "@/lib/server/prisma";
import { syncProjectRouting } from "./deployments";

export async function seedCloudTargets(projectId: string) {
  const existing = await prisma.nativeCloudTarget.findMany({
    where: { projectId },
  });

  if (existing.length > 0) {
    return existing;
  }

  // Seed default 3 targets
  const targets = [
    {
      projectId,
      provider: "aws",
      region: "us-east-1",
      bucket: "lepos-assets-us-east-1",
      endpoint: "https://s3.us-east-1.amazonaws.com",
      priority: 10,
      healthStatus: "healthy",
      metadata: {
        providerName: "AWS S3",
        regionName: "US East (Virginia)",
        latency: 12,
        mockStatus: "healthy",
      },
    },
    {
      projectId,
      provider: "cloudflare",
      region: "ap-southeast-1",
      bucket: "lepos-assets-ap-southeast-1",
      endpoint: "https://r2.ap-southeast-1.cloudflare.com",
      priority: 20,
      healthStatus: "healthy",
      metadata: {
        providerName: "Cloudflare R2",
        regionName: "Asia Pacific (Singapore)",
        latency: 15,
        mockStatus: "healthy",
      },
    },
    {
      projectId,
      provider: "gcp",
      region: "eu-west-1",
      bucket: "lepos-assets-eu-west-1",
      endpoint: "https://storage.googleapis.com",
      priority: 30,
      healthStatus: "healthy",
      metadata: {
        providerName: "GCP Cloud Storage",
        regionName: "Europe (Ireland)",
        latency: 18,
        mockStatus: "healthy",
      },
    },
  ];

  await prisma.nativeCloudTarget.createMany({
    data: targets,
  });

  const created = await prisma.nativeCloudTarget.findMany({
    where: { projectId },
  });

  await syncProjectRouting(projectId);
  return created;
}

export async function checkCloudTargetsHealth(projectId: string) {
  const targets = await prisma.nativeCloudTarget.findMany({
    where: { projectId },
  });

  if (targets.length === 0) {
    await seedCloudTargets(projectId);
    return;
  }

  for (const target of targets) {
    const meta = (target.metadata as any) || {};
    const mockStatus = meta.mockStatus || "healthy";

    let healthStatus = "healthy";
    let latency = Math.floor(Math.random() * 40) + 10; // random latency 10-50ms

    if (mockStatus === "unhealthy") {
      healthStatus = "unhealthy";
      latency = 0;
    } else if (mockStatus === "overloaded") {
      healthStatus = "overloaded";
      latency = 350;
    } else {
      // Perform simulated network check
      try {
        const start = Date.now();
        const endpoint = target.endpoint;
        if (endpoint) {
          const res = await fetch(endpoint, {
            method: "HEAD",
            signal: AbortSignal.timeout(1500),
          }).catch(() => null);

          // Even if the endpoint HEAD fails in local environments (e.g. no internet/DNS block),
          // we default to healthy for local testing unless explicitly mockStatus === "unhealthy".
          if (res && res.status >= 500) {
            healthStatus = "unhealthy";
            latency = 0;
          } else {
            latency = Date.now() - start;
          }
        }
      } catch (e) {
        // Safe fallback for local offline testing
        latency = Math.floor(Math.random() * 40) + 10;
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

  const meta = (target.metadata as any) || {};
  let healthStatus = "healthy";
  if (typeof statusOrEnabled === "boolean") {
    healthStatus = statusOrEnabled ? "healthy" : "unhealthy";
  } else {
    healthStatus = statusOrEnabled;
  }
  const mockStatus = healthStatus;

  let latency = 0;
  if (healthStatus === "healthy") {
    latency = Math.floor(Math.random() * 30) + 10;
  } else if (healthStatus === "overloaded") {
    latency = 350;
  }

  await prisma.nativeCloudTarget.update({
    where: { id: targetId },
    data: {
      healthStatus,
      lastCheckAt: new Date(),
      metadata: {
        ...meta,
        mockStatus,
        latency,
      },
    },
  });

  await syncProjectRouting(projectId);
}
