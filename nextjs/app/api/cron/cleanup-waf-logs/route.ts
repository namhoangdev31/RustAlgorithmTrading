import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  try {
    // 1. Fetch all projects with their bundles and privacy declarations
    const projects = await prisma.project.findMany({
      include: {
        bundle: {
          include: {
            privacyDeclarations: true,
          },
        },
      },
    });

    let totalDeleted = 0;
    const details = [];

    for (const project of projects) {
      // Resolve data retention days: privacy declaration config or fallback to 30 days
      const retentionDays = project.bundle?.privacyDeclarations?.dataRetentionDays ?? 30;
      const thresholdDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      // Delete expired WAF logs for this project
      const result = await prisma.nativeWafEvent.deleteMany({
        where: {
          projectId: project.id,
          createdAt: { lt: thresholdDate },
        },
      });

      if (result.count > 0) {
        totalDeleted += result.count;
        details.push({
          projectId: project.id,
          projectName: project.name,
          retentionDays,
          deletedCount: result.count,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalDeleted,
      details,
    });
  } catch (error: any) {
    console.error("[Cron WAF Log Cleanup Error] Failed to execute cleanup:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
