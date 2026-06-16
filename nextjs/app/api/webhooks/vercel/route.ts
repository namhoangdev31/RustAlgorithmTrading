import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const eventType = req.headers.get("x-vercel-event") || payload.type || "";

    console.log(`[Vercel Webhook] Received event: ${eventType}`);

    const deploymentId = payload.payload?.deploymentId || payload.id;

    if (deploymentId) {
      const bundle = await prisma.bundles.findFirst({
        where: { vercelDeploymentId: deploymentId },
      });

      if (bundle) {
        let status = "published";
        if (eventType.includes("error") || eventType.includes("failed")) {
          status = "failed";
        } else if (eventType.includes("created")) {
          status = "ready";
        }

        await prisma.bundles.update({
          where: { id: bundle.id },
          data: {
            status,
            updatedAt: new Date(),
          },
        });
        console.log(`[Vercel Webhook] Synced bundle ${bundle.id} status to ${status}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Vercel Webhook] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
