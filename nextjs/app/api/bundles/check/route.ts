import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Endpoint to check for newer compiled LepoShip OTA WebView bundles.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get("projectId");
    const currentBuildNumber = parseInt(searchParams.get("currentBuildNumber") || "0", 10);

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    // Find the bundle container linked to this project
    const bundle = await prisma.bundles.findFirst({
      where: { projectId },
      select: { id: true },
    });

    if (!bundle) {
      return NextResponse.json({ error: "No bundle found for this project." }, { status: 404 });
    }

    // Find the latest active release track that is newer than current build number
    const latestRelease = await prisma.bundleReleaseTracks.findFirst({
      where: {
        bundleId: bundle.id,
        status: "active",
        buildNumber: { gt: currentBuildNumber },
        storagePath: { not: "" },
      },
      orderBy: { buildNumber: "desc" },
    });

    if (!latestRelease) {
      return NextResponse.json({ updateAvailable: false });
    }

    // Check if delta archive patch exists on disk for currentBuildNumber -> latestRelease.buildNumber
    let downloadUrl = latestRelease.storagePath;
    let isDelta = false;

    if (currentBuildNumber > 0) {
      const deltaFileName = `delta-${currentBuildNumber}-to-${latestRelease.buildNumber}.zip`;
      const deltaFilePath = path.join(process.cwd(), "public", "bundles", bundle.id, deltaFileName);
      
      try {
        await fs.access(deltaFilePath);
        downloadUrl = `/bundles/${bundle.id}/${deltaFileName}`;
        isDelta = true;
      } catch {
        // Delta file not found or not readable, fallback to full zip
      }
    }

    return NextResponse.json({
      updateAvailable: true,
      latestRelease: {
        version: latestRelease.version,
        buildNumber: latestRelease.buildNumber,
        track: latestRelease.track,
        downloadUrl,
        isDelta,
        releaseNotes: latestRelease.releaseNotes || "",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
