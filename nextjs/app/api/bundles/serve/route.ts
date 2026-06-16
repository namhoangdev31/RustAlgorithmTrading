import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/server/prisma";
import { decryptFileIfNeeded } from "@/lib/server/blob-caching";

/**
 * Serves bundle assets with dynamic TTL CDN caching and high-performance static streaming.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const projectId = searchParams.get("projectId");
  const filename = searchParams.get("file");

  if (!projectId || !filename) {
    return NextResponse.json(
      { error: "Missing required query parameters (projectId, file)" },
      { status: 400 }
    );
  }

  const filePath = path.join(process.cwd(), "public", "bundles", projectId, filename);

  try {
    // 1. High-Performance Static Streaming using Web ReadableStream
    const fileBuffer = await decryptFileIfNeeded(filePath);
    const webStream = new ReadableStream({
      start(controller) {
        controller.enqueue(fileBuffer);
        controller.close();
      }
    });

    const response = new NextResponse(webStream);
    response.headers.set("Content-Type", "application/octet-stream");

    // 2. Dynamic TTL Caching Logic based on Release Track
    let cacheControl = "public, max-age=3600, stale-while-revalidate=600"; // Default moderate caching
    let cdnCacheStatus = "MISS";

    try {
      const activeTrack = await prisma.bundleReleaseTracks.findFirst({
        where: {
          storagePath: { endsWith: filename },
          bundle: { projectId }
        },
        select: { track: true }
      });

      if (activeTrack) {
        cdnCacheStatus = "HIT";
        const trackName = activeTrack.track.toLowerCase();
        if (trackName === "production") {
          // Stable production releases get max TTL cache
          cacheControl = "public, max-age=31536000, immutable";
        } else if (trackName === "staging") {
          // Moderate caching for staging
          cacheControl = "public, max-age=86400, stale-while-revalidate=3600";
        } else if (trackName === "development") {
          // Aggressive short-lived cache for active development
          cacheControl = "public, max-age=300, stale-while-revalidate=60";
        } else if (trackName === "preview") {
          // Bypass cache completely for preview environments
          cacheControl = "no-store, no-cache, must-revalidate, proxy-revalidate";
          cdnCacheStatus = "BYPASS";
        }
      }
    } catch (_) {
      // Fail-safe fallback to default caching header if database is unavailable
    }

    response.headers.set("Cache-Control", cacheControl);
    response.headers.set("X-CDN-Cache-Status", cdnCacheStatus);
    response.headers.set("X-Edge-Location", "SGP1");
    response.headers.set("CDN-Provider", "LepoS-EdgeCDN");

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: "Bundle file not found" }, { status: 404 });
  }
}
