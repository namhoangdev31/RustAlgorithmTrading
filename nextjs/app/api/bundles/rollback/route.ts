import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

/**
 * Verify database schema compatibility to ensure rollback does not break existing database state.
 */
async function verifyDbSchemaCompatibility(
  projectId: string,
  fallbackVersion: string,
  failedVersion: string
): Promise<{ compatible: boolean; reason?: string }> {
  const fallbackDep = await prisma.nativeDeployment.findFirst({
    where: { projectId, version: fallbackVersion },
    orderBy: { createdAt: "desc" }
  });
  const failedDep = await prisma.nativeDeployment.findFirst({
    where: { projectId, version: failedVersion },
    orderBy: { createdAt: "desc" }
  });

  if (!fallbackDep || !failedDep) {
    return { compatible: true };
  }

  const fallbackMeta = (fallbackDep.metadata as any) || {};
  const failedMeta = (failedDep.metadata as any) || {};

  const fallbackSchemaVal = parseInt(fallbackMeta.schemaVersion || "1", 10);
  const failedSchemaVal = parseInt(failedMeta.schemaVersion || "1", 10);

  if (failedSchemaVal > fallbackSchemaVal) {
    const destructiveMigrations = failedMeta.destructiveMigrations || [];
    if (destructiveMigrations.length > 0) {
      return {
        compatible: false,
        reason: `Destructive database migrations detected in current version (${failedVersion}): [${destructiveMigrations.join(
          ", "
        )}]. Fallback version (${fallbackVersion}) only supports schema version ${fallbackSchemaVal} but current is ${failedSchemaVal}. Rollback blocked to prevent database corruption.`,
      };
    }
  }

  return { compatible: true };
}

/**
 * Emergency automatic rollback endpoint.
 * Triggered by WebView SDK when it detects 3 consecutive crash events on a newly deployed bundle.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, failedVersion, reason } = body;

    if (!projectId || !failedVersion) {
      return NextResponse.json(
        { error: "projectId and failedVersion are required." },
        { status: 400 }
      );
    }

    // Find the bundle linked to this project
    const bundle = await prisma.bundles.findFirst({
      where: { projectId },
      select: { id: true },
    });

    if (!bundle) {
      return NextResponse.json({ error: "No bundle found for this project." }, { status: 404 });
    }

    // 1. Locate the failing release track
    const failedTrack = await prisma.bundleReleaseTracks.findFirst({
      where: {
        bundleId: bundle.id,
        version: failedVersion,
      },
    });

    if (!failedTrack) {
      return NextResponse.json(
        { error: `Release track for version ${failedVersion} not found.` },
        { status: 404 }
      );
    }

    // 2. Locate the most recent stable active release track (not the failing one)
    const fallbackTrack = await prisma.bundleReleaseTracks.findFirst({
      where: {
        bundleId: bundle.id,
        id: { not: failedTrack.id },
        status: "active",
        storagePath: { not: "" },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!fallbackTrack) {
      return NextResponse.json(
        { error: "No previous stable release track available for rollback fallback." },
        { status: 400 }
      );
    }

    // Verify database migration compatibility
    const compatibility = await verifyDbSchemaCompatibility(projectId, fallbackTrack.version, failedVersion);
    if (!compatibility.compatible) {
      console.error(`[Emergency Rollback Blocked] ${compatibility.reason}`);
      return NextResponse.json(
        { error: compatibility.reason || "Database schema incompatibility blocked rollback." },
        { status: 409 }
      );
    }

    // 3. Mark the bad release as "rolled_back" and restore the stable track details to the active bundle
    await prisma.$transaction([
      prisma.bundleReleaseTracks.update({
        where: { id: failedTrack.id },
        data: { status: "rolled_back" },
      }),
      prisma.bundles.update({
        where: { id: bundle.id },
        data: {
          version: fallbackTrack.version,
          buildNumber: fallbackTrack.buildNumber,
          storagePath: fallbackTrack.storagePath,
          status: "published",
          updatedAt: new Date(),
        },
      }),
    ]);

    console.warn(
      `[Emergency Rollback Engine] Automatically rolled back project ${projectId} due to version ${failedVersion} crashes. Fallback version: ${fallbackTrack.version}. Reason: ${reason || "Not specified"}`
    );

    return NextResponse.json({
      success: true,
      rolledBackTo: fallbackTrack.version,
      buildNumber: fallbackTrack.buildNumber,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
