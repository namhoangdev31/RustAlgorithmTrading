import { prisma } from "@/lib/server/prisma";
import { getNativeRedis, nativeRedisKeys, redisDelete, redisPublish } from "./redis";
import crypto from "node:crypto";
import fs from "node:fs";
import pathLib from "node:path";
import zlib from "node:zlib";
import { promisify } from "node:util";

const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);
const brotliCompressAsync = promisify(zlib.brotliCompress);
const brotliDecompressAsync = promisify(zlib.brotliDecompress);

const ISR_DISK_CACHE_DIR = pathLib.join(process.cwd(), "public", "cache", "isr");
const MAX_DISK_CACHE_SIZE = 1024 * 1024 * 1024; // 1GB
const DEFAULT_MAX_AGE = 60; // 60s
const DEFAULT_SWR = 300; // 5 min stale-while-revalidate

export type CompressionType = "none" | "gzip" | "brotli";

export interface IsrCacheEntry {
  body: string; // base64 encoded compressed data
  contentType: string;
  status: number;
  headers: Record<string, string>;
  tags: string[];
  surrogateKeys: string[];
  compressionType: CompressionType;
  timestamp: number;
  maxAge: number;
  staleWhileRevalidate: number;
  rawSize: number;
  compressedSize: number;
}

export interface IsrCacheSetOptions {
  maxAge?: number;
  staleWhileRevalidate?: number;
  tags?: string[];
  surrogateKeys?: string[];
  contentType?: string;
  statusCode?: number;
  headers?: Record<string, string>;
}

export interface IsrCacheGetResult {
  entry: IsrCacheEntry;
  state: "fresh" | "stale";
  compressionType: CompressionType;
}

// ---------------------------------------------------------------------------
// Compression helpers
// ---------------------------------------------------------------------------

/** Select optimal compression based on content MIME type */
export function selectCompression(contentType: string): CompressionType {
  const textTypes = [
    "text/html", "application/json", "text/css",
    "application/javascript", "text/javascript",
    "text/xml", "application/xml", "text/plain",
    "image/svg+xml", "application/manifest+json",
  ];
  const ct = contentType.toLowerCase().split(";")[0].trim();
  if (textTypes.includes(ct)) return "brotli";
  if (ct.startsWith("text/")) return "gzip";
  return "none";
}

/** Compress a buffer using the specified algorithm */
export async function compressData(data: Buffer, type: CompressionType): Promise<Buffer> {
  switch (type) {
    case "brotli":
      return brotliCompressAsync(data) as Promise<Buffer>;
    case "gzip":
      return gzipAsync(data) as Promise<Buffer>;
    default:
      return data;
  }
}

/** Decompress a buffer using the specified algorithm */
export async function decompressData(data: Buffer, type: CompressionType): Promise<Buffer> {
  switch (type) {
    case "brotli":
      return brotliDecompressAsync(data) as Promise<Buffer>;
    case "gzip":
      return gunzipAsync(data) as Promise<Buffer>;
    default:
      return data;
  }
}

// ---------------------------------------------------------------------------
// Disk helpers
// ---------------------------------------------------------------------------

function getExtension(ct: CompressionType): string {
  if (ct === "brotli") return ".br";
  if (ct === "gzip") return ".gz";
  return ".raw";
}

function getDiskPath(projectId: string, cacheKey: string, compression: CompressionType): string {
  const hash = crypto.createHash("sha256").update(cacheKey).digest("hex");
  return pathLib.join(ISR_DISK_CACHE_DIR, projectId, `${hash}${getExtension(compression)}`);
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieve a cached ISR entry from Redis (L1) or Disk (L2).
 * Returns `null` on cache miss. Returns `state: "stale"` when the entry is
 * past its `maxAge` but within the `staleWhileRevalidate` window.
 */
export async function get(projectId: string, routePath: string): Promise<IsrCacheGetResult | null> {
  const normalizedPath = routePath.startsWith("/") ? routePath : `/${routePath}`;
  const cacheKey = nativeRedisKeys.cache(projectId, normalizedPath);
  const now = Date.now();

  // --- L1: Redis ---
  let entry: IsrCacheEntry | null = null;

  try {
    const redis = getNativeRedis();
    if (redis) {
      const raw = await redis.get(`isr:${cacheKey}`);
      if (raw) {
        entry = JSON.parse(raw) as IsrCacheEntry;
      }
    }
  } catch {
    // Redis unavailable — fall through to disk
  }

  // --- L2: Disk ---
  if (!entry) {
    for (const ct of ["brotli", "gzip", "none"] as CompressionType[]) {
      const diskPath = getDiskPath(projectId, cacheKey, ct);
      if (fs.existsSync(diskPath)) {
        try {
          const metaPath = `${diskPath}.meta.json`;
          if (fs.existsSync(metaPath)) {
            const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
            const body = fs.readFileSync(diskPath);
            entry = { ...meta, body: body.toString("base64"), compressionType: ct } as IsrCacheEntry;
            break;
          }
        } catch {
          // Corrupted disk cache — treat as miss
        }
      }
    }
  }

  if (!entry) return null;

  // --- Freshness check ---
  const ageMs = now - entry.timestamp;
  const maxAgeMs = (entry.maxAge ?? DEFAULT_MAX_AGE) * 1000;
  const swrMs = (entry.staleWhileRevalidate ?? DEFAULT_SWR) * 1000;

  if (ageMs > maxAgeMs + swrMs) {
    // Beyond SWR window — treat as miss
    return null;
  }

  const state: "fresh" | "stale" = ageMs <= maxAgeMs ? "fresh" : "stale";

  // Fire-and-forget DB hit tracking
  prisma.nativeCacheEntry.updateMany({
    where: { projectId, path: normalizedPath },
    data: { hitCount: { increment: 1 }, lastAccessedAt: new Date() },
  }).catch(() => {});

  return { entry, state, compressionType: entry.compressionType };
}

/**
 * Store an ISR cache entry with automatic compression, persisting to
 * Redis (L1), Disk (L2), and Prisma DB (metadata).
 */
export async function set(
  projectId: string,
  routePath: string,
  body: Buffer,
  options: IsrCacheSetOptions = {}
): Promise<void> {
  const normalizedPath = routePath.startsWith("/") ? routePath : `/${routePath}`;
  const cacheKey = nativeRedisKeys.cache(projectId, normalizedPath);
  const contentType = options.contentType || "text/html";
  const maxAge = options.maxAge ?? DEFAULT_MAX_AGE;
  const swr = options.staleWhileRevalidate ?? DEFAULT_SWR;
  const tags = options.tags || [];
  const surrogateKeys = options.surrogateKeys || [];
  const compressionType = selectCompression(contentType);

  const compressed = await compressData(body, compressionType);
  const now = Date.now();
  const staleAt = new Date(now + maxAge * 1000);
  const expiresAt = new Date(now + (maxAge + swr) * 1000);

  const entry: IsrCacheEntry = {
    body: compressed.toString("base64"),
    contentType,
    status: options.statusCode || 200,
    headers: options.headers || {},
    tags,
    surrogateKeys,
    compressionType,
    timestamp: now,
    maxAge,
    staleWhileRevalidate: swr,
    rawSize: body.length,
    compressedSize: compressed.length,
  };

  // --- L1: Redis (with TTL) ---
  try {
    const redis = getNativeRedis();
    if (redis) {
      const ttl = maxAge + swr;
      await redis.set(`isr:${cacheKey}`, JSON.stringify(entry), "EX", ttl);

      // Index tags for fast purge
      for (const tag of tags) {
        await redis.sadd(`isr:tags:${projectId}:${tag}`, cacheKey);
      }
      for (const sk of surrogateKeys) {
        await redis.sadd(`isr:sk:${projectId}:${sk}`, cacheKey);
      }
    }
  } catch {
    // Redis write failure — disk will still work
  }

  // --- L2: Disk ---
  try {
    const diskPath = getDiskPath(projectId, cacheKey, compressionType);
    ensureDir(pathLib.dirname(diskPath));
    fs.writeFileSync(diskPath, compressed);

    // Store metadata alongside the file
    const { body: _b, ...meta } = entry;
    fs.writeFileSync(`${diskPath}.meta.json`, JSON.stringify(meta), "utf8");
  } catch (err) {
    console.error("[ISR Cache] Disk write error:", err);
  }

  // --- DB record ---
  try {
    const dbKey = `isr:${cacheKey}`;
    await prisma.nativeCacheEntry.upsert({
      where: { cacheKey: dbKey },
      create: {
        projectId,
        path: normalizedPath,
        cacheKey: dbKey,
        contentType,
        bodyRef: getDiskPath(projectId, cacheKey, compressionType),
        status: "fresh",
        tags,
        surrogateKeys,
        compressionType,
        compressedSize: compressed.length,
        rawSize: body.length,
        hitCount: 0,
        lastAccessedAt: new Date(),
        staleAt,
        expiresAt,
      },
      update: {
        status: "fresh",
        contentType,
        bodyRef: getDiskPath(projectId, cacheKey, compressionType),
        tags,
        surrogateKeys,
        compressionType,
        compressedSize: compressed.length,
        rawSize: body.length,
        lastAccessedAt: new Date(),
        staleAt,
        expiresAt,
      },
    });
  } catch (err) {
    console.error("[ISR Cache] DB upsert error:", err);
  }

  // LRU eviction (fire-and-forget)
  evictLRU(projectId).catch(() => {});
  evictGlobalLRU().catch(() => {});
}

/**
 * Purge cache entries matching a path pattern.
 * Supports exact paths (`/blog/post-1`) and wildcard globs (`/blog/*`).
 */
export async function purgeByPath(projectId: string, pathPattern: string): Promise<number> {
  const normalizedPattern = pathPattern.startsWith("/") ? pathPattern : `/${pathPattern}`;
  const isWildcard = normalizedPattern.includes("*");

  const entries = await prisma.nativeCacheEntry.findMany({
    where: {
      projectId,
      ...(isWildcard
        ? { path: { startsWith: normalizedPattern.replace(/\*+$/, "") } }
        : { path: normalizedPattern }),
    },
    select: { id: true, cacheKey: true, path: true, bodyRef: true, compressionType: true },
  });

  if (entries.length === 0) return 0;

  for (const e of entries) {
    await deleteEntry(projectId, e);
  }

  return entries.length;
}

/** Purge all cache entries matching a cache tag */
export async function purgeByTag(projectId: string, tag: string): Promise<number> {
  const entries = await prisma.nativeCacheEntry.findMany({
    where: { projectId, tags: { has: tag } },
    select: { id: true, cacheKey: true, path: true, bodyRef: true, compressionType: true },
  });

  for (const e of entries) {
    await deleteEntry(projectId, e);
  }

  // Clean up Redis tag index
  try {
    const redis = getNativeRedis();
    if (redis) await redis.del(`isr:tags:${projectId}:${tag}`);
  } catch {}

  return entries.length;
}

/** Purge all cache entries matching a Surrogate-Key / Cache-Tag header */
export async function purgeBySurrogateKey(projectId: string, key: string): Promise<number> {
  const entries = await prisma.nativeCacheEntry.findMany({
    where: { projectId, surrogateKeys: { has: key } },
    select: { id: true, cacheKey: true, path: true, bodyRef: true, compressionType: true },
  });

  for (const e of entries) {
    await deleteEntry(projectId, e);
  }

  try {
    const redis = getNativeRedis();
    if (redis) await redis.del(`isr:sk:${projectId}:${key}`);
  } catch {}

  return entries.length;
}

/** Flush the entire ISR cache for a project */
export async function purgeAll(projectId: string): Promise<number> {
  const entries = await prisma.nativeCacheEntry.findMany({
    where: { projectId },
    select: { id: true, cacheKey: true, path: true, bodyRef: true, compressionType: true },
  });

  for (const e of entries) {
    await deleteEntry(projectId, e);
  }

  // Clean up project disk cache directory
  const projectDir = pathLib.join(ISR_DISK_CACHE_DIR, projectId);
  try {
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  } catch {}

  return entries.length;
}

/** LRU eviction: remove oldest entries when total disk usage exceeds MAX_DISK_CACHE_SIZE */
export async function evictLRU(projectId: string): Promise<void> {
  const projectDir = pathLib.join(ISR_DISK_CACHE_DIR, projectId);
  if (!fs.existsSync(projectDir)) return;

  let totalSize = 0;
  try {
    const files = fs.readdirSync(projectDir).filter((f) => !f.endsWith(".meta.json"));
    for (const file of files) {
      const stat = fs.statSync(pathLib.join(projectDir, file));
      totalSize += stat.size;
    }
  } catch {
    return;
  }

  if (totalSize <= MAX_DISK_CACHE_SIZE) return;

  // Evict oldest entries until we're under the limit
  const entries = await prisma.nativeCacheEntry.findMany({
    where: { projectId, cacheKey: { startsWith: "isr:" } },
    orderBy: [{ lastAccessedAt: "asc" }, { updatedAt: "asc" }],
    select: { id: true, cacheKey: true, path: true, bodyRef: true, compressedSize: true, compressionType: true },
  });

  let freed = 0;
  const target = totalSize - MAX_DISK_CACHE_SIZE;

  for (const e of entries) {
    if (freed >= target) break;
    freed += e.compressedSize || 0;
    await deleteEntry(projectId, e);
  }
}

/** Global LRU eviction: limit total disk cache usage across all projects to 1GB */
export async function evictGlobalLRU(): Promise<void> {
  if (!fs.existsSync(ISR_DISK_CACHE_DIR)) return;

  const GLOBAL_MAX_DISK_CACHE_SIZE = 1024 * 1024 * 1024; // 1GB

  const getDirSize = (dir: string): number => {
    let total = 0;
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = pathLib.join(dir, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          total += getDirSize(itemPath);
        } else if (!item.endsWith(".meta.json")) {
          total += stat.size;
        }
      }
    } catch {}
    return total;
  };

  const currentGlobalSize = getDirSize(ISR_DISK_CACHE_DIR);
  if (currentGlobalSize <= GLOBAL_MAX_DISK_CACHE_SIZE) return;

  const entries = await prisma.nativeCacheEntry.findMany({
    orderBy: [{ lastAccessedAt: "asc" }, { updatedAt: "asc" }],
    select: { id: true, projectId: true, cacheKey: true, path: true, bodyRef: true, compressedSize: true, compressionType: true },
  });

  let freed = 0;
  const target = currentGlobalSize - GLOBAL_MAX_DISK_CACHE_SIZE;

  for (const e of entries) {
    if (freed >= target) break;
    freed += e.compressedSize || 0;
    await deleteEntry(e.projectId, e);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function deleteEntry(
  projectId: string,
  entry: { id: string; cacheKey: string; path: string; bodyRef?: string | null; compressionType?: string }
) {
  // Redis
  try {
    await redisDelete(`isr:${entry.cacheKey}`, entry.cacheKey);
  } catch {}

  // Disk — delete all possible compression variants
  for (const ct of ["brotli", "gzip", "none"] as CompressionType[]) {
    const diskPath = getDiskPath(projectId, entry.cacheKey, ct);
    try {
      if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
      const metaPath = `${diskPath}.meta.json`;
      if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
    } catch {}
  }

  // Also try bodyRef path
  if (entry.bodyRef) {
    try {
      if (fs.existsSync(entry.bodyRef)) fs.unlinkSync(entry.bodyRef);
    } catch {}
  }

  // DB
  try {
    await prisma.nativeCacheEntry.delete({ where: { id: entry.id } });
  } catch {}

  // Publish purge event
  await redisPublish("lepos:purge", { projectId, path: entry.path, cacheKey: entry.cacheKey }).catch(() => {});
}
