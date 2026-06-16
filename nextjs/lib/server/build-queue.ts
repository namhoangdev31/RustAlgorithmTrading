import { Queue, Worker } from "bullmq";
import { getNativeRedis } from "./native-platform/redis";
import { runLepoShipBuild } from "./lepoship-builder";
import { promises as fs } from "fs";
import path from "path";

import { prisma } from "./prisma";

export interface BuildJob {
  projectId: string;
  bundleId: string;
  buildNumber: number;
  version: string;
  config: any;
  trackId: string;
}

let buildQueue: Queue | null = null;
let buildWorker: Worker | null = null;

export function getBuildQueue() {
  if (buildQueue) return buildQueue;

  const redis = getNativeRedis();
  if (!redis) return null;

  const redisOptions = {
    host: redis.options.host || "127.0.0.1",
    port: redis.options.port || 6379,
    password: redis.options.password,
    username: redis.options.username,
  };

  buildQueue = new Queue("lepos-build-queue", {
    connection: redisOptions,
  });

  return buildQueue;
}

export function startBuildWorker() {
  if (buildWorker) return buildWorker;

  const redis = getNativeRedis();
  if (!redis) return null;

  const redisOptions = {
    host: redis.options.host || "127.0.0.1",
    port: redis.options.port || 6379,
    password: redis.options.password,
    username: redis.options.username,
  };

  buildWorker = new Worker(
    "lepos-build-queue",
    async (job) => {
      const data = job.data as BuildJob;
      await runLepoShipBuild(
        data.projectId,
        data.bundleId,
        data.buildNumber,
        data.version,
        data.config,
        data.trackId
      );
    },
    {
      connection: redisOptions,
      concurrency: 2,
    }
  );

  buildWorker.on("failed", (job, err) => {
    console.error(`Build job ${job?.id} failed:`, err);
  });

  return buildWorker;
}

async function checkBuildRateLimit(
  projectId: string,
  limit: number,
  durationSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getNativeRedis();
  if (!redis) {
    return { allowed: true, remaining: 999 };
  }

  try {
    const key = `build-limit:${projectId}`;
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, durationSeconds);
    }

    if (current > limit) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: limit - current };
  } catch (error) {
    console.error("[RateLimiter ERROR] Failed to check rate limit in Redis:", error);
    return { allowed: true, remaining: 999 };
  }
}

export async function enqueueBuild(job: BuildJob) {
  let priority = 5; // Default: Free tier priority (Lowest)
  let plan: "free" | "pro" | "enterprise" = "free";
  let orgName = "";

  try {
    const project = await prisma.project.findUnique({
      where: { id: job.projectId },
      include: { organization: true },
    });

    if (project?.organization) {
      orgName = project.organization.name;
      const orgType = project.organization.type;
      const nameLower = orgName.toLowerCase();
      
      if (orgType === "corporate" || nameLower.includes("enterprise")) {
        plan = "enterprise";
        priority = 1; // High priority
      } else if (nameLower.includes("pro") || nameLower.includes("business")) {
        plan = "pro";
        priority = 2; // Medium priority
      } else {
        plan = "free";
        priority = 5; // Low priority
      }
    }
  } catch (err) {
    console.warn("Failed to determine build priority, falling back to default:", err);
  }

  // Enforce rate limiting for Free tier (max 5 builds per hour)
  if (plan === "free") {
    const limitWindowSeconds = 3600; // 1 hour
    const limitMaxBuilds = 5;
    
    const rateLimitCheck = await checkBuildRateLimit(job.projectId, limitMaxBuilds, limitWindowSeconds);
    if (!rateLimitCheck.allowed) {
      const errMsg = `Build rejected: Free tier rate limit exceeded (${limitMaxBuilds} builds per hour). Upgrade to Pro or Enterprise for unlimited builds.`;
      
      // Write error directly to build log so it shows on UI console
      const bundleDir = path.join(process.cwd(), "public", "bundles", job.projectId);
      await fs.mkdir(bundleDir, { recursive: true });
      const logFile = path.join(bundleDir, `${job.buildNumber}.log`);
      const timestamp = new Date().toLocaleTimeString();
      await fs.writeFile(logFile, `[${timestamp}] [RATE LIMIT ERROR] ${errMsg}\n`);
      
      // Update release track status to failed in database
      await prisma.bundleReleaseTracks.update({
        where: { id: job.trackId },
        data: {
          status: "failed",
          releaseNotes: errMsg
        }
      });
      
      throw new Error(errMsg);
    }
  }

  const queue = getBuildQueue();
  if (!queue) {
    await runLepoShipBuild(
      job.projectId,
      job.bundleId,
      job.buildNumber,
      job.version,
      job.config,
      job.trackId
    );
    return;
  }

  startBuildWorker();

  await queue.add(`build-${job.projectId}-${job.buildNumber}`, job, { priority });
}
