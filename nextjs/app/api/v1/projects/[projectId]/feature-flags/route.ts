import { NextResponse } from "next/server";
import { evaluateFeatureFlags } from "@/lib/server/feature-flags";

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;

    // Retrieve user ID from cookies or headers
    const cookieHeader = request.headers.get("cookie") || "";
    let userId = "anonymous";
    const match = cookieHeader.match(/lepos_user_id=([^;]+)/);
    if (match) {
      userId = match[1];
    }

    const flags = await evaluateFeatureFlags(projectId, userId, request.headers);
    return NextResponse.json({ flags });
  } catch (error: any) {
    console.error("[FeatureFlags API] Failed to evaluate flags:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to evaluate feature flags" },
      { status: 500 }
    );
  }
}
