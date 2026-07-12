import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { dispatchDelivery, pollBuilderWebhookEvents } from "@/lib/server/webhook-dispatcher";
import { verifyCronAuth } from "@/lib/server/cron-auth";

/**
 * Cron route run every 5 minutes to sweep and retry failed or pending webhook deliveries.
 */
export async function GET(request: NextRequest) {
  return handleWebhooksCron(request);
}

export async function POST(request: NextRequest) {
  return handleWebhooksCron(request);
}

async function handleWebhooksCron(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const now = new Date();

    // 1. Sync any recent build or release state changes into webhook events table
    await pollBuilderWebhookEvents();

    // 2. Fetch pending deliveries scheduled for now or in the past
    const pendingDeliveries = await prisma.bundleWebhookDeliveries.findMany({
      where: {
        status: "pending",
        nextRetryAt: { lte: now },
        webhook: { isActive: true },
      },
      select: { webhookId: true, eventKey: true },
      take: 100, // Batch limit per cron run
    });

    let successes = 0;
    let failures = 0;

    for (const d of pendingDeliveries) {
      const ok = await dispatchDelivery(d.webhookId, d.eventKey);
      if (ok) successes++;
      else failures++;
    }

    return NextResponse.json({
      success: true,
      processed: pendingDeliveries.length,
      successes,
      failures,
      runAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error("[Webhooks Dispatch Cron] Error:", error.message);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

