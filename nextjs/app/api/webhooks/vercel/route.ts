import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const vercelPayload = payload?.payload || payload;
    
    const vercelProjectId = vercelPayload?.projectId || vercelPayload?.project?.id;
    const deploymentId = vercelPayload?.deployment?.id || vercelPayload?.id;
    const status = vercelPayload?.deployment?.status || vercelPayload?.status;
    const url = vercelPayload?.deployment?.url || vercelPayload?.url;

    if (!vercelProjectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    // Find the Project matching this vercelProjectId
    const project = await prisma.project.findFirst({
      where: { vercelProjectId },
    });

    if (!project) {
      return NextResponse.json({ error: "No project found for this Vercel project" }, { status: 404 });
    }

    // Update deployment status if we find a matching record
    if (deploymentId) {
      const activeBundle = await prisma.bundles.findFirst({
        where: {
          projectId: project.id,
        },
      });

      if (activeBundle) {
        let internalStatus = "building";
        if (status === "READY" || status === "SUCCEEDED" || status === "ready") {
          internalStatus = "ready";
        } else if (status === "ERROR" || status === "FAILED" || status === "error") {
          internalStatus = "failed";
        } else if (status === "CANCELED" || status === "cancelled") {
          internalStatus = "cancelled";
        }

        await prisma.bundles.update({
          where: { id: activeBundle.id },
          data: {
            status: internalStatus,
            vercelDeploymentId: deploymentId,
            vercelDeploymentUrl: url ? `https://${url}` : activeBundle.vercelDeploymentUrl,
            updatedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Vercel webhook error:", err);
    return NextResponse.json({ error: err?.message || "Webhook processing error" }, { status: 500 });
  }
}
