import { NextRequest, NextResponse } from "next/server";

/**
 * Fail-closed cron authorization.
 * - 503 if CRON_SECRET is not configured.
 * - 401 if bearer token does not match.
 * - null if authorized (proceed with handler).
 */
export function verifyCronAuth(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "Cron service is not configured. Set CRON_SECRET." },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization") || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || token !== cronSecret) {
    return NextResponse.json(
      { error: "Unauthorized. Invalid or missing bearer token." },
      { status: 401 }
    );
  }

  return null; // Authorized
}
