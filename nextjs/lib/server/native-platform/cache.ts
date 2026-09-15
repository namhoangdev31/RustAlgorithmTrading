import { prisma } from "@/lib/server/prisma";
import { nativeRedisKeys, redisDelete, redisPublish, redisSetJson } from "./redis";
import crypto from "node:crypto";
import fs from "node:fs";
import pathLib from "node:path";

const MAX_CACHE_LIMIT = 100;

export function getDiskCachePath(projectId: string, normalizedPath: string) {
  const hash = crypto.createHash("md5").update(normalizedPath).digest("hex");
  return pathLib.join(process.cwd(), "public", "cache", "html", projectId, `${hash}.html`);
}

export async function purgeNativeCache(projectId: string, path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const cacheKey = nativeRedisKeys.cache(projectId, normalizedPath);

  await prisma.nativeCacheEntry.updateMany({
    where: { projectId, path: normalizedPath },
    data: { status: "purged", updatedAt: new Date() },
  });

  await redisDelete(cacheKey);

  const diskPath = getDiskCachePath(projectId, normalizedPath);
  try {
    if (fs.existsSync(diskPath)) {
      await fs.promises.unlink(diskPath);
    }
  } catch (err) {
    console.error("[Disk Cache] Failed to delete file:", err);
  }

  await redisPublish("lepos:purge", { projectId, path: normalizedPath, cacheKey });

  return { projectId, path: normalizedPath, cacheKey };
}

export async function recordNativeCacheHit(projectId: string, path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return prisma.nativeCacheEntry.upsert({
    where: { cacheKey: nativeRedisKeys.cache(projectId, normalizedPath) },
    create: {
      projectId,
      path: normalizedPath,
      cacheKey: nativeRedisKeys.cache(projectId, normalizedPath),
      status: "fresh",
      hitCount: 1,
    },
    update: {
      hitCount: { increment: 1 },
      updatedAt: new Date(),
    },
  });
}

export async function setNativeCache(
  projectId: string,
  path: string,
  htmlContent: string,
  contentType = "text/html"
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const cacheKey = nativeRedisKeys.cache(projectId, normalizedPath);

  await redisSetJson(cacheKey, { html: htmlContent, contentType });

  const diskPath = getDiskCachePath(projectId, normalizedPath);
  try {
    const dir = pathLib.dirname(diskPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.writeFile(diskPath, htmlContent, "utf8");
  } catch (err) {
    console.error("[Disk Cache] Failed to write file:", err);
  }

  const entry = await prisma.nativeCacheEntry.upsert({
    where: { cacheKey },
    create: {
      projectId,
      path: normalizedPath,
      cacheKey,
      status: "fresh",
      contentType,
      bodyRef: `file://${diskPath}`,
      hitCount: 1,
    },
    update: {
      status: "fresh",
      contentType,
      bodyRef: `file://${diskPath}`,
      updatedAt: new Date(),
    },
  });

  try {
    const count = await prisma.nativeCacheEntry.count({
      where: { projectId },
    });

    if (count > MAX_CACHE_LIMIT) {
      
      const entriesToEvict = await prisma.nativeCacheEntry.findMany({
        where: { projectId },
        orderBy: { updatedAt: "asc" },
        take: count - MAX_CACHE_LIMIT,
      });

      for (const oldEntry of entriesToEvict) {
        
        await redisDelete(oldEntry.cacheKey);

        if (oldEntry.bodyRef?.startsWith("file://")) {
          const oldDiskPath = oldEntry.bodyRef.replace("file://", "");
          if (fs.existsSync(oldDiskPath)) {
            await fs.promises.unlink(oldDiskPath).catch(() => {});
          }
        }

        await prisma.nativeCacheEntry.delete({
          where: { id: oldEntry.id },
        });

        await redisPublish("lepos:purge", {
          projectId,
          path: oldEntry.path,
          cacheKey: oldEntry.cacheKey,
        });
      }
    }
  } catch (evictErr) {
    console.error("[LRU Eviction] Failed to evict old cache entries:", evictErr);
  }

  return entry;
}
