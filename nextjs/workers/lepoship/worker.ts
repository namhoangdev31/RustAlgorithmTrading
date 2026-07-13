import { Worker, type Job } from "bullmq";

import type { BuildJob } from "@/lib/server/build-queue";
import { runLepoShipBuild } from "@/lib/server/lepoship-builder";
import { getNativeRedis } from "@/lib/server/native-platform/redis";
import { prisma } from "@/lib/server/prisma";
import { assertLepoShipEnvironment } from "@/lib/server/lepoship/environment";

assertLepoShipEnvironment("worker");

function requiredRedisConnection() {
  const redis = getNativeRedis();
  if (!redis) throw new Error("REDIS_REQUIRED: LepoShip worker cannot start");
  return {
    host: redis.options.host || "127.0.0.1",
    port: redis.options.port || 6379,
    password: redis.options.password,
    username: redis.options.username,
  };
}

async function updateCanonicalJob(job: Job<BuildJob>, status: "running" | "succeeded" | "failed", error?: unknown) {
  if (!job.data.buildJobId) return;
  await prisma.bundleBuildJobs.update({
    where: { id: job.data.buildJobId },
    data: {
      status,
      attempt: job.attemptsMade + 1,
      workerId: process.env.HOSTNAME ?? "lepoship-worker",
      heartbeatAt: new Date(),
      ...(status === "running" ? { startedAt: new Date() } : { completedAt: new Date() }),
      ...(error ? { errorCode: "BUILD_FAILED", errorMessage: error instanceof Error ? error.message : String(error) } : {}),
    },
  });
}

const worker = new Worker<BuildJob>(
  "lepos-build-queue",
  async (job) => {
    await updateCanonicalJob(job, "running");
    try {
      await runLepoShipBuild(
        job.data.projectId,
        job.data.bundleId,
        job.data.buildNumber,
        job.data.version,
        job.data.config,
        job.data.trackId,
        job.data.buildJobId,
      );
      await updateCanonicalJob(job, "succeeded");
    } catch (error) {
      await updateCanonicalJob(job, "failed", error).catch(() => undefined);
      throw error;
    }
  },
  {
    connection: requiredRedisConnection(),
    concurrency: Number(process.env.LEPOSHIP_WORKER_CONCURRENCY ?? 2),
    lockDuration: 120_000,
    stalledInterval: 30_000,
    maxStalledCount: 2,
  },
);

worker.on("error", (error) => console.error("[lepoship-worker]", error));

async function shutdown() {
  await worker.close();
  await prisma.$disconnect();
}

process.once("SIGTERM", () => void shutdown());
process.once("SIGINT", () => void shutdown());
