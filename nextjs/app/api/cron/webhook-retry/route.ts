import { NextRequest, NextResponse } from "next/server";
import { retryFailedWebhooks } from "@/lib/server/webhooks";

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
  try {
    const authHeader = request.headers.get("authorization") || "";
    const cronSecret = process.env.CRON_SECRET || "lepos-cron-secret-token-2026";
    const [scheme, token] = authHeader.split(" ");
    
    // Authorization validation
    if (scheme?.toLowerCase() !== "bearer" || token !== cronSecret) {
      // Permit local development testing without strict token checking
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
      }
    }

    const result = await retryFailedWebhooks();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
