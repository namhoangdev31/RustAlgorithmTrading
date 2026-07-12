import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { hashString } from "@/lib/server/feature-flags";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Endpoint to check for newer compiled LepoShip OTA WebView bundles.
 *
 * Query params:
 *   - projectId (required)
 *   - currentBuildNumber (required)
 *   - deviceId (optional) — when present, enables deterministic A/B experiment routing
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get("projectId");
    const currentBuildNumber = parseInt(searchParams.get("currentBuildNumber") || "0", 10);
    const deviceId = searchParams.get("deviceId") || null;

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

    // ------------------------------------------------------------------
    // A/B experiment routing (only when deviceId is provided)
    // ------------------------------------------------------------------
    if (deviceId) {
      const runningTest = await prisma.bundleAbTests.findFirst({
        where: { bundleId: bundle.id, status: "running" },
        select: { id: true, trafficSplit: true, variantBConfig: true },
      });

      if (runningTest) {
        let targetBuildNumber: number | null = null;
        try {
          const config = JSON.parse(runningTest.variantBConfig);
          targetBuildNumber = config.targetBuildNumber ?? null;
        } catch {
          // Config parse failed — fall through to legacy
        }

        if (targetBuildNumber !== null) {
          // Verify the target track is still active
          const targetTrack = await prisma.bundleReleaseTracks.findFirst({
            where: {
              bundleId: bundle.id,
              buildNumber: targetBuildNumber,
              status: "active",
              storagePath: { not: "" },
            },
          });

          if (targetTrack) {
            // Deterministic assignment: hash(deviceId + testId) % 100
            const bucket = hashString(deviceId + runningTest.id) % 100;
            const isExperiment = bucket < runningTest.trafficSplit;

            let selectedTrack;

            if (isExperiment) {
              // Variant B — serve the target track
              selectedTrack = targetTrack;
            } else {
              // Variant A (control) — serve latest active track EXCLUDING the target build
              selectedTrack = await prisma.bundleReleaseTracks.findFirst({
                where: {
                  bundleId: bundle.id,
                  status: "active",
                  buildNumber: { gt: currentBuildNumber, not: targetBuildNumber },
                  storagePath: { not: "" },
                },
                orderBy: { buildNumber: "desc" },
              });
            }

            if (selectedTrack && selectedTrack.buildNumber > currentBuildNumber) {
              const downloadInfo = await resolveDelta(bundle.id, currentBuildNumber, selectedTrack);
              return NextResponse.json({
                updateAvailable: true,
                experiment: {
                  testId: runningTest.id,
                  variant: isExperiment ? "B" : "A",
                  bucket,
                },
                latestRelease: {
                  version: selectedTrack.version,
                  buildNumber: selectedTrack.buildNumber,
                  track: selectedTrack.track,
                  downloadUrl: downloadInfo.downloadUrl,
                  isDelta: downloadInfo.isDelta,
                  releaseNotes: selectedTrack.releaseNotes || "",
                },
              });
            }

            // No update available from experiment perspective
            return NextResponse.json({
              updateAvailable: false,
              experiment: {
                testId: runningTest.id,
                variant: isExperiment ? "B" : "A",
                bucket,
              },
            });
          }
          // Target track unavailable — fall through to legacy
        }
      }
    }

    // ------------------------------------------------------------------
    // Legacy behavior: latest active track newer than current build
    // ------------------------------------------------------------------
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

    const downloadInfo = await resolveDelta(bundle.id, currentBuildNumber, latestRelease);

    return NextResponse.json({
      updateAvailable: true,
      latestRelease: {
        version: latestRelease.version,
        buildNumber: latestRelease.buildNumber,
        track: latestRelease.track,
        downloadUrl: downloadInfo.downloadUrl,
        isDelta: downloadInfo.isDelta,
        releaseNotes: latestRelease.releaseNotes || "",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
// ---------------------------------------------------------------------------
// Delta resolution helper
// ---------------------------------------------------------------------------

async function resolveDelta(
  bundleId: string,
  currentBuildNumber: number,
  track: { buildNumber: number; storagePath: string },
) {
  let downloadUrl = track.storagePath;
  let isDelta = false;

  if (currentBuildNumber > 0) {
    const deltaFileName = `delta-${currentBuildNumber}-to-${track.buildNumber}.zip`;
    const deltaFilePath = path.join(process.cwd(), "public", "bundles", bundleId, deltaFileName);

    try {
      await fs.access(deltaFilePath);
      downloadUrl = `/bundles/${bundleId}/${deltaFileName}`;
      isDelta = true;
    } catch {
      // Delta file not found or not readable, fallback to full zip
    }
  }

  return { downloadUrl, isDelta };
}
