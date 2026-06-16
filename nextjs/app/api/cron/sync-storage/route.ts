import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { verifyAndAutoHealReplicas } from "@/lib/server/blob-caching";
import path from "path";

/**
 * Cron endpoint to check cross-region storage integrity and auto-heal missing/corrupted files.
 */
export async function GET(request: NextRequest) {
  try {
    // Get all active release tracks
    const releases = await prisma.bundleReleaseTracks.findMany({
      where: {
        status: "active",
        storagePath: { not: "" }
      },
      include: {
        bundle: {
          select: {
            projectId: true
          }
        }
      }
    });

    const report: any[] = [];

    for (const rel of releases) {
      const projectId = rel.bundle?.projectId;
      if (!projectId) continue;

      // Extract filename from storagePath (e.g. /bundles/[projectId]/[filename])
      const filename = path.basename(rel.storagePath);
      const sourceFilePath = path.join(process.cwd(), "public", "bundles", projectId, filename);

      try {
        const syncResults = await verifyAndAutoHealReplicas(projectId, filename, sourceFilePath);
        report.push({
          bundleId: rel.bundleId,
          version: rel.version,
          buildNumber: rel.buildNumber,
          filename,
          syncResults
        });
      } catch (err: any) {
        report.push({
          bundleId: rel.bundleId,
          version: rel.version,
          buildNumber: rel.buildNumber,
          filename,
          error: err.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      verifiedCount: report.length,
      report
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
