import { NextResponse } from "next/server";

import { nativeErrorResponse, requireNativeProjectAccess } from "@/lib/server/native-platform/auth";
import { ingestReplay } from "@/lib/server/native-platform/telemetry";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = String(body.projectId || "");
    if (!projectId || !body.sessionId || !body.events) {
      return NextResponse.json({ error: "projectId, sessionId, and events are required." }, { status: 400 });
    }

    await requireNativeProjectAccess(request, projectId, "analytics:write", "viewer");
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const replay = await ingestReplay({
      projectId,
      sessionId: String(body.sessionId),
      events: body.events,
      url: body.url,
      userAgent: request.headers.get("user-agent"),
      ipAddress,
    });

    return NextResponse.json({ replay }, { status: 201 });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
