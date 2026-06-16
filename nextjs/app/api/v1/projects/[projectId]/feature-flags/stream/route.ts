import { NextRequest, NextResponse } from "next/server";
import { evaluateFeatureFlags, flagEvents } from "@/lib/server/feature-flags";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  // Retrieve user ID from cookies or headers
  const cookieHeader = request.headers.get("cookie") || "";
  let userId = "anonymous";
  const match = cookieHeader.match(/lepos_user_id=([^;]+)/);
  if (match) {
    userId = match[1];
  }

  const responseHeaders = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
  });

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Helper function to fetch and write current flags
  const sendFlags = async () => {
    try {
      const flags = await evaluateFeatureFlags(projectId, userId, request.headers);
      const data = `data: ${JSON.stringify({ flags })}\n\n`;
      await writer.write(encoder.encode(data));
    } catch (e) {
      console.error("[FeatureFlags SSE] Error writing flags to stream:", e);
    }
  };

  // Send initial evaluation immediately
  await sendFlags();

  // Listen to the central flagEvents change notifier
  const onChange = async (eventData: { projectId: string }) => {
    if (eventData.projectId === projectId) {
      await sendFlags();
    }
  };

  flagEvents.on("change", onChange);

  const cleanup = () => {
    flagEvents.off("change", onChange);
    try {
      writer.close();
    } catch {}
  };

  request.signal.addEventListener("abort", cleanup);

  return new NextResponse(readable, { headers: responseHeaders });
}
