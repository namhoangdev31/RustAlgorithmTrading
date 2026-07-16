import { getNativeRedis } from "./native-platform/redis";
import { getSchedulingRecommendation } from "./native-platform/finops";
import { enqueueOutboxEvent } from "./lepoship/outbox";
import { Prisma } from "@/prisma/generated/client";

import { prisma } from "./prisma";

export interface BuildJob {
  projectId: string;
  bundleId: string;
  buildNumber: number;
  version: string;
  config: any;
  trackId: string;
  releaseId?: string;
  buildJobId?: string;
}

async function checkBuildRateLimit(
  projectId: string,
  limit: number,
  durationSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getNativeRedis();
  if (!redis) {
    throw new Error("REDIS_REQUIRED: build rate limiting is unavailable");
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
    throw new Error("REDIS_REQUIRED: build rate limiting failed");
  }
}

export async function enqueueBuild(job: BuildJob) {
  let priority = 5; // Default: Free tier priority (Lowest)
  let plan: "free" | "pro" | "enterprise" = "free";
  let orgName = "";
  let ownerUserId = "";
  let schedulingDelayMs = 0;
  let schedulingReason = "default";

  try {
    const project = await prisma.project.findUnique({
      where: { id: job.projectId },
      include: { organization: true },
    });

    if (project?.organization) {
      orgName = project.organization.name;
      ownerUserId = project.organization.userId;
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

  try {
    const recommendation = await getSchedulingRecommendation(job.projectId, "deferrable");
    schedulingDelayMs = recommendation.delayMs;
    schedulingReason = recommendation.reason;
    priority = Math.max(priority, recommendation.priority);

    if (schedulingDelayMs > 0) {
      if (ownerUserId) {
        await prisma.bundleAuditLog.create({
          data: {
            id: crypto.randomUUID(),
            bundleId: job.bundleId,
            userId: ownerUserId,
            action: "finops_reschedule",
            fieldName: "native_finops_scheduler",
            oldValue: JSON.stringify({
              reason: schedulingReason,
              delayMs: schedulingDelayMs,
              workloadClass: "deferrable",
            }),
            createdAt: new Date(),
          },
        }).catch(() => null);
      }
    }
  } catch (err) {
    console.warn("Failed to compute FinOps scheduling recommendation:", err);
  }

  // Enforce rate limiting for Free tier (max 5 builds per hour)
  if (plan === "free") {
    const limitWindowSeconds = 3600; // 1 hour
    const limitMaxBuilds = 5;
    
    const rateLimitCheck = await checkBuildRateLimit(job.projectId, limitMaxBuilds, limitWindowSeconds);
    if (!rateLimitCheck.allowed) {
      const errMsg = `Build rejected: Free tier rate limit exceeded (${limitMaxBuilds} builds per hour). Upgrade to Pro or Enterprise for unlimited builds.`;
      
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

  const buildIdentity = job.buildJobId ?? `${job.projectId}:${job.buildNumber}`;
  const notBefore = new Date(Date.now() + schedulingDelayMs);
  await prisma.$transaction(async (tx) => {
    const event = await enqueueOutboxEvent(tx, {
      eventKey: `bundle.build_requested.v1:${buildIdentity}`,
      aggregateType: "bundle_build_job",
      aggregateId: buildIdentity,
      eventType: "bundle.build_requested.v1",
      payload: JSON.parse(JSON.stringify({ schemaVersion: 1, job, priority, notBefore: notBefore.toISOString(), schedulingReason })) as Prisma.InputJsonValue,
    });
    if (schedulingDelayMs > 0 && event.status === "pending") {
      await tx.bundleOutboxEvents.update({ where: { id: event.id }, data: { nextAttemptAt: notBefore } });
    }
  });
}
