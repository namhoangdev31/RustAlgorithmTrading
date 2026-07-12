import { NextRequest, NextResponse } from "next/server";
import { runAutoRenewSslCron } from "@/lib/server/native-platform/ssl";
import { verifyCronAuth } from "@/lib/server/cron-auth";

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
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const report = await runAutoRenewSslCron();
    return NextResponse.json({ success: true, ...report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
