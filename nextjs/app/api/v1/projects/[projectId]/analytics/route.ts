import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getInstallAnalytics } from "@/lib/server/marketplace-analytics";
import { nativeErrorResponse, requireNativeProjectAccess } from "@/lib/server/native-platform/auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    
    // Auth & Permission verification
    await requireNativeProjectAccess(request, projectId, "project:read", "viewer");

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    // Retrieve bundle associated with this project
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      include: { bundle: true },
    });

    if (!project || !project.bundle) {
      return NextResponse.json({ error: "Bundle not found for project" }, { status: 404 });
    }

    const analytics = await getInstallAnalytics(project.bundle.id, days);
    return NextResponse.json({ analytics });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
