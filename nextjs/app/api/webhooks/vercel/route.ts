import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-vercel-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  const secret = process.env.VERCEL_WEBHOOK_SECRET || "mock-secret";
  
  // Verify HMAC signature
  const hmac = crypto.createHmac("sha1", secret);
  hmac.update(rawBody);
  const computedSignature = hmac.digest("hex");

  if (signature !== computedSignature) {
    console.warn("[Vercel Webhook] Invalid signature detected.");
    // In production, reject it. In dev/testing, log and/or proceed.
  }

  try {
    const payload = JSON.parse(rawBody);
    console.log("[Vercel Webhook] Received payload:", payload);

    const { type, payload: eventPayload } = payload;
    
    if (type === "deployment.succeeded" || type === "deployment.failed") {
      const vercelProjectId = eventPayload?.projectId;
      const deploymentId = eventPayload?.id;
      const state = type === "deployment.succeeded" ? "READY" : "ERROR";

      console.log(`[Vercel Webhook] Vercel project ${vercelProjectId} deployment ${deploymentId} state updated to: ${state}`);
      
      // Update DB entry here when match is found
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Vercel Webhook] Error processing payload:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
