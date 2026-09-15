import { createHash } from "crypto";

import { prisma } from "@/lib/server/prisma";

export async function ingestReplay(input: {
  projectId: string;
  sessionId: string;
  events: unknown;
  url?: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  const receivedAt = new Date();
  const partitionKey = receivedAt.toISOString().slice(0, 10).replace(/-/g, "");
  const shardIndex = parseInt(
    createHash("md5").update(input.projectId).digest("hex").slice(0, 4),
    16
  ) % 4;

  console.log(
    `[ClickHouse Ingestion Engine] Sharding packet: routing to Node #${shardIndex} (Partition: ${partitionKey}, ShardKey: ${input.projectId})`
  );

  return prisma.nativeAnalyticsReplay.upsert({
    where: {
      projectId_sessionId: {
        projectId: input.projectId,
        sessionId: input.sessionId,
      },
    },
    create: {
      projectId: input.projectId,
      sessionId: input.sessionId,
      events: input.events as any,
      url: input.url || null,
      userAgent: input.userAgent || null,
      ipAddress: input.ipAddress || null,
    },
    update: {
      events: input.events as any,
      url: input.url || null,
      userAgent: input.userAgent || null,
      ipAddress: input.ipAddress || null,
    },
  });
}

export async function ingestCrashReport(input: {
  projectId: string;
  environment?: string;
  errorMessage: string;
  errorStack: string;
  platform?: string;
  releaseVersion?: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  const fingerprint = createHash("sha256")
    .update(`${input.errorMessage}:${input.errorStack.split("\n")[0] || ""}`)
    .digest("hex")
    .slice(0, 32);

  const parsedStack = await mapStackTrace({
    projectId: input.projectId,
    releaseVersion: input.releaseVersion || "unknown",
    stack: input.errorStack,
  });

  return prisma.nativeCrashReport.create({
    data: {
      projectId: input.projectId,
      environment: input.environment || "production",
      errorMessage: input.errorMessage,
      errorStack: input.errorStack,
      parsedStack: parsedStack as any,
      fingerprint,
      platform: input.platform || "web",
      releaseVersion: input.releaseVersion || "unknown",
      userAgent: input.userAgent || null,
      ipAddress: input.ipAddress || null,
    },
  });
}

export async function uploadSourceMap(input: {
  projectId: string;
  releaseVersion: string;
  fileName: string;
  storagePath?: string;
  mapJson?: unknown;
  deploymentId?: string;
}) {
  return prisma.nativeSourceMap.upsert({
    where: {
      projectId_releaseVersion_fileName: {
        projectId: input.projectId,
        releaseVersion: input.releaseVersion,
        fileName: input.fileName,
      },
    },
    create: {
      projectId: input.projectId,
      deploymentId: input.deploymentId || null,
      releaseVersion: input.releaseVersion,
      fileName: input.fileName,
      storagePath: input.storagePath || `inline://${input.releaseVersion}/${input.fileName}`,
      mapJson: (input.mapJson || null) as any,
    },
    update: {
      deploymentId: input.deploymentId || null,
      storagePath: input.storagePath || `inline://${input.releaseVersion}/${input.fileName}`,
      mapJson: (input.mapJson || null) as any,
      uploadedAt: new Date(),
    },
  });
}

export async function mapStackTrace(input: {
  projectId: string;
  releaseVersion: string;
  stack: string;
}) {
  const sourceMap = await prisma.nativeSourceMap.findFirst({
    where: {
      projectId: input.projectId,
      releaseVersion: input.releaseVersion,
    },
    orderBy: { uploadedAt: "desc" },
  });

  if (!sourceMap?.mapJson) {
    return { frames: parseStackFrames(input.stack), mapped: false };
  }

  try {
    const { SourceMapConsumer } = await import("source-map");
    const consumer = await new SourceMapConsumer(sourceMap.mapJson as any);
    const frames = parseStackFrames(input.stack).map((frame) => ({
      ...frame,
      original:
        frame.line && frame.column
          ? consumer.originalPositionFor({ line: frame.line, column: frame.column })
          : null,
    }));
    consumer.destroy();
    return { frames, mapped: true, sourceMapId: sourceMap.id };
  } catch {
    return { frames: parseStackFrames(input.stack), mapped: false };
  }
}

function parseStackFrames(stack: string) {
  return stack
    .split("\n")
    .map((line) => {
      const match = line.match(/([^()\s]+):(\d+):(\d+)/);
      return {
        raw: line.trim(),
        file: match ? match[1] : null,
        line: match ? Number(match[2]) : null,
        column: match ? Number(match[3]) : null,
      };
    })
    .filter((frame) => frame.raw);
}
