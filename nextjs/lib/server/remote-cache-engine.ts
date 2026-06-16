import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { getNativeRedis } from "@/lib/server/native-platform/redis";

const execAsync = promisify(exec);

export async function compressWithZstd(inputPath: string, outputPath: string): Promise<boolean> {
  try {
    await execAsync(`zstd -f -q -o "${outputPath}" "${inputPath}"`);
    return true;
  } catch (err: any) {
    console.warn("[ZSTD] zstd compression failed or not installed. Falling back to gzip...", err.message);
    try {
      await execAsync(`gzip -c "${inputPath}" > "${outputPath}"`);
      return false;
    } catch (gzipErr) {
      throw new Error(`Fallback compression failed: ${gzipErr}`);
    }
  }
}

export async function decompressWithZstd(inputPath: string, outputPath: string): Promise<boolean> {
  try {
    await execAsync(`zstd -d -f -q -o "${outputPath}" "${inputPath}"`);
    return true;
  } catch (err: any) {
    console.warn("[ZSTD] zstd decompression failed or not installed. Falling back to gunzip...", err.message);
    try {
      await execAsync(`gunzip -c "${inputPath}" > "${outputPath}"`);
      return false;
    } catch (gunzipErr) {
      throw new Error(`Fallback decompression failed: ${gunzipErr}`);
    }
  }
}

const REMOTE_CACHE_DIR = path.join(process.cwd(), "public", "cache", "remote-artifacts");
const MAX_ARTIFACT_AGE_DAYS = 30;
const MAX_CACHE_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5GB

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RemoteCacheArtifact {
  hash: string;
  teamId: string;
  size: number;
  duration?: number;
  tag?: string;
  createdAt: number;
  lastAccessedAt: number;
}

export interface RemoteCacheEventPayload {
  sessionId: string;
  source: string;
  event: "HIT" | "MISS";
  hash: string;
  duration?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function artifactDir(teamId: string): string {
  return path.join(REMOTE_CACHE_DIR, teamId);
}

function artifactPath(teamId: string, hash: string): string {
  return path.join(artifactDir(teamId), `${hash}.tar.gz`);
}

function redisArtifactKey(hash: string): string {
  return `rc:artifact:${hash}`;
}

function redisTeamSetKey(teamId: string): string {
  return `rc:team:${teamId}:artifacts`;
}

function redisEventsKey(teamId: string): string {
  return `rc:events:${teamId}`;
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Public API — Turborepo-compatible Remote Cache
// ---------------------------------------------------------------------------

/**
 * Download a build artifact by content hash.
 * Returns a ReadableStream + size for streaming to the client, or null on miss.
 */
export async function getArtifact(
  hash: string,
  teamId: string
): Promise<{ stream: ReadableStream; size: number } | null> {
  const redis = getNativeRedis();

  // Verify metadata exists and belongs to the requesting team
  if (redis) {
    try {
      const raw = await redis.get(redisArtifactKey(hash));
      if (!raw) return null;
      const meta = JSON.parse(raw) as RemoteCacheArtifact;
      if (meta.teamId !== teamId) return null;

      // Update last accessed timestamp
      meta.lastAccessedAt = Date.now();
      await redis.set(redisArtifactKey(hash), JSON.stringify(meta));
    } catch {
      // Redis miss — fall through to disk check
    }
  }

  const filePath = artifactPath(teamId, hash);
  try {
    const stat = await fs.stat(filePath);
    const fileHandle = await fs.open(filePath, "r");
    const nodeStream = fileHandle.createReadStream();

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return { stream: webStream, size: stat.size };
  } catch {
    return null;
  }
}

/**
 * Upload a build artifact. Stores the data on disk and records metadata in Redis.
 */
export async function putArtifact(
  hash: string,
  teamId: string,
  data: Buffer,
  duration?: number,
  tag?: string
): Promise<{ size: number }> {
  await ensureDir(artifactDir(teamId));
  const filePath = artifactPath(teamId, hash);
  await fs.writeFile(filePath, data);

  const now = Date.now();
  const meta: RemoteCacheArtifact = {
    hash,
    teamId,
    size: data.length,
    duration,
    tag,
    createdAt: now,
    lastAccessedAt: now,
  };

  const redis = getNativeRedis();
  if (redis) {
    try {
      await redis.set(
        redisArtifactKey(hash),
        JSON.stringify(meta),
        "EX",
        MAX_ARTIFACT_AGE_DAYS * 24 * 60 * 60
      );
      await redis.zadd(redisTeamSetKey(teamId), now, hash);
    } catch {
      // Redis optional — disk is primary persistence
    }
  }

  return { size: data.length };
}

/**
 * HEAD-style existence check for an artifact (no data transfer).
 */
export async function checkArtifactExists(hash: string, teamId: string): Promise<boolean> {
  const redis = getNativeRedis();
  if (redis) {
    try {
      const raw = await redis.get(redisArtifactKey(hash));
      if (raw) {
        const meta = JSON.parse(raw) as RemoteCacheArtifact;
        return meta.teamId === teamId;
      }
    } catch {}
  }

  // Fallback to disk
  try {
    await fs.access(artifactPath(teamId, hash));
    return true;
  } catch {
    return false;
  }
}

/**
 * Record cache analytics events (HIT / MISS) emitted by Turborepo clients.
 */
export async function recordCacheEvent(
  teamId: string,
  events: RemoteCacheEventPayload[]
): Promise<void> {
  const redis = getNativeRedis();
  if (!redis || events.length === 0) return;

  try {
    const serialized = events.map((e) => JSON.stringify({ ...e, receivedAt: Date.now() }));
    await redis.lpush(redisEventsKey(teamId), ...serialized);
    await redis.ltrim(redisEventsKey(teamId), 0, 999); // keep last 1000
  } catch {
    // Event recording is best-effort
  }
}

/**
 * Evict artifacts older than MAX_ARTIFACT_AGE_DAYS.
 * Returns the number of evicted artifacts.
 */
export async function evictOldArtifacts(teamId: string): Promise<number> {
  const redis = getNativeRedis();
  const cutoff = Date.now() - MAX_ARTIFACT_AGE_DAYS * 24 * 60 * 60 * 1000;
  let evicted = 0;

  if (redis) {
    try {
      // Find old hashes from sorted set
      const oldHashes = await redis.zrangebyscore(redisTeamSetKey(teamId), 0, cutoff);

      for (const hash of oldHashes) {
        // Remove file
        try {
          await fs.unlink(artifactPath(teamId, hash));
        } catch {}

        // Remove Redis entries
        await redis.del(redisArtifactKey(hash));
        await redis.zrem(redisTeamSetKey(teamId), hash);
        evicted++;
      }
    } catch {}
  } else {
    // Fallback: scan disk directory
    try {
      const dir = artifactDir(teamId);
      const files = await fs.readdir(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        if (stat.mtimeMs < cutoff) {
          await fs.unlink(filePath);
          evicted++;
        }
      }
    } catch {}
  }

  return evicted;
}

/**
 * Calculate total cache usage for a team.
 */
export async function getTeamCacheUsage(
  teamId: string
): Promise<{ totalSize: number; artifactCount: number }> {
  let totalSize = 0;
  let artifactCount = 0;

  try {
    const dir = artifactDir(teamId);
    const files = await fs.readdir(dir);
    for (const file of files) {
      const stat = await fs.stat(path.join(dir, file));
      totalSize += stat.size;
      artifactCount++;
    }
  } catch {
    // Directory may not exist
  }

  return { totalSize, artifactCount };
}
