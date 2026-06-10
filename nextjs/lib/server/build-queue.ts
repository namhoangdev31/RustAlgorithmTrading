import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let buildQueue: any = null;
let redisConnection: any = null;

try {
  redisConnection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    connectTimeout: 2000,
  });

  buildQueue = new Queue("lepos-build-queue", {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    },
  });

  console.log("🚀 BullMQ build queue initialized successfully.");
} catch (e) {
  console.warn("⚠️ Redis connection failed. BullMQ build queue is in simulation/in-memory mode.", e);
}

// In-memory queue fallback for local development if Redis is unavailable
const memoryQueue: any[] = [];
let memoryQueueProcessing = false;

async function processMemoryQueue(processor: (job: any) => Promise<void>) {
  if (memoryQueueProcessing) return;
  memoryQueueProcessing = true;

  while (memoryQueue.length > 0) {
    const job = memoryQueue.shift();
    if (job) {
      console.log(`[MemoryQueue] Processing simulated build job: ${job.id}`);
      try {
        await processor(job);
      } catch (err) {
        console.error(`[MemoryQueue] Job ${job.id} failed:`, err);
      }
    }
  }

  memoryQueueProcessing = false;
}

export async function addBuildJob(
  projectId: string,
  buildNumber: number,
  data: Record<string, any>
): Promise<{ jobId: string; type: string }> {
  const jobPayload = { projectId, buildNumber, ...data, timestamp: new Date() };

  if (buildQueue) {
    try {
      const job = await buildQueue.add(`build-${projectId}-${buildNumber}`, jobPayload);
      console.log(`[BullMQ] Added build job ${job.id} for project ${projectId}`);
      return { jobId: job.id as string, type: "bullmq" };
    } catch (e) {
      console.error("[BullMQ] Failed to add build job to Redis. Falling back to memory queue.", e);
    }
  }

  // Fallback to memory queue
  const mockJobId = `mock-job-${crypto.randomUUID()}`;
  memoryQueue.push({ id: mockJobId, name: `build-${projectId}-${buildNumber}`, data: jobPayload });
  console.log(`[MemoryQueue] Added simulated build job ${mockJobId} for project ${projectId}`);

  // Auto-trigger simulated worker in background
  import("./lepoship-builder").then(({ runLepoShipBuild }) => {
    processMemoryQueue(async (job) => {
      await runLepoShipBuild(
        job.data.projectId,
        job.data.bundleId,
        job.data.buildNumber,
        job.data.version,
        job.data.config,
        job.data.trackId
      );
    });
  }).catch(err => {
    console.error("Failed to load lepoship-builder dynamically in memory queue:", err);
  });

  return { jobId: mockJobId, type: "in-memory" };
}

// Setup a global worker if Redis connection is active
if (redisConnection && buildQueue) {
  try {
    const worker = new Worker(
      "lepos-build-queue",
      async (job: Job) => {
        console.log(`[BullMQ Worker] Running job ${job.id} for project ${job.data.projectId}`);
        const { runLepoShipBuild } = await import("./lepoship-builder");
        await runLepoShipBuild(
          job.data.projectId,
          job.data.bundleId,
          job.data.buildNumber,
          job.data.version,
          job.data.config,
          job.data.trackId
        );
      },
      { connection: redisConnection }
    );

    worker.on("completed", (job: Job) => {
      console.log(`[BullMQ Worker] Job ${job.id} completed!`);
    });

    worker.on("failed", (job: Job | undefined, err: Error) => {
      console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err);
    });
  } catch (err) {
    console.error("Failed to start BullMQ worker:", err);
  }
}
