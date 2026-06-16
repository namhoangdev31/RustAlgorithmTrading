import { NextRequest, NextResponse } from "next/server";
import { runAutoRenewSslCron } from "@/lib/server/native-platform/ssl";

/**
 * Cron job endpoint to trigger SSL certificates renewal check.
 * Sweeps all verified custom domains and renews any expiring within 15 days.
 */
export async function GET(request: NextRequest) {
  return handleRenew(request);
}

export async function POST(request: NextRequest) {
  return handleRenew(request);
}

async function handleRenew(request: NextRequest) {
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

    const report = await runAutoRenewSslCron();
    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
