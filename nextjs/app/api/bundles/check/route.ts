import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get("projectId") || undefined;
    const bundleKey = searchParams.get("bundleKey") || undefined;
    const track = searchParams.get("track") || "production";
    const currentVersion = searchParams.get("currentVersion");
    const currentBuildNumberStr = searchParams.get("currentBuildNumber");

    if (!projectId && !bundleKey) {
      return NextResponse.json(
        { error: "Missing required query parameter: 'projectId' or 'bundleKey' must be provided." },
        { status: 400 }
      );
    }

    // Find the bundle associated with the project or bundleKey
    const bundle = await prisma.bundles.findFirst({
      where: {
        OR: [
          projectId ? { projectId } : undefined,
          bundleKey ? { bundleKey } : undefined,
        ].filter(Boolean) as any,
        deletedAt: null,
      },
    });

    if (!bundle) {
      return NextResponse.json(
        { error: "Bundle not found for the specified project or bundleKey" },
        { status: 404 }
      );
    }

    // Fetch the latest active release track for the bundle
    const latestRelease = await prisma.bundleReleaseTracks.findFirst({
      where: {
        bundleId: bundle.id,
        track: track,
        status: "active",
      },
      orderBy: [
        { buildNumber: "desc" },
        { createdAt: "desc" },
      ],
    });

    if (!latestRelease) {
      return NextResponse.json({
        updateAvailable: false,
        message: `No active release found for track '${track}'`,
      });
    }

    let currentBuildNumber: number | null = null;
    if (currentBuildNumberStr) {
      const parsed = parseInt(currentBuildNumberStr, 10);
      if (!isNaN(parsed)) {
        currentBuildNumber = parsed;
      }
    }

    // Evaluate if update is available
    let updateAvailable = false;
    if (currentBuildNumber !== null) {
      updateAvailable = latestRelease.buildNumber > currentBuildNumber;
    } else if (currentVersion) {
      // Simple version comparison (unequal signifies update/change)
      updateAvailable = latestRelease.version !== currentVersion;
    } else {
      // If client does not specify current version/build, we indicate update is available
      updateAvailable = true;
    }

    const origin = request.nextUrl.origin;
    const downloadUrl = latestRelease.storagePath.startsWith("http")
      ? latestRelease.storagePath
      : `${origin}${latestRelease.storagePath}`;

    return NextResponse.json({
      updateAvailable,
      latestRelease: {
        version: latestRelease.version,
        buildNumber: latestRelease.buildNumber,
        track: latestRelease.track,
        storagePath: latestRelease.storagePath,
        downloadUrl: downloadUrl,
        releaseNotes: latestRelease.releaseNotes,
        createdAt: latestRelease.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error checking for bundle updates:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
