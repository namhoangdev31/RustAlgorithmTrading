import { NextRequest, NextResponse } from "next/server";
import { retryFailedWebhooks } from "@/lib/server/webhooks";
import { verifyCronAuth } from "@/lib/server/cron-auth";

/**
 * Cron job endpoint to trigger failed form webhooks retries.
 * Sweeps all failed deliveries that are due and retries them using exponential backoff.
 */
export async function GET(request: NextRequest) {
  return handleRetry(request);
}

export async function POST(request: NextRequest) {
  return handleRetry(request);
}

async function handleRetry(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const result = await retryFailedWebhooks();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
