import { NextRequest, NextResponse } from "next/server";
import { nativeErrorResponse, requireNativeProjectAccess } from "@/lib/server/native-platform/auth";
import { runFullDiagnostic, getDiagnosticHistory, rateDiagnostic } from "@/lib/server/native-platform/ai-copilot";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projectId = String(body.projectId || "");
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    await requireNativeProjectAccess(request, projectId, "project:write", "editor");

    const action = body.action || "diagnose";

    if (action === "rate") {
      const { diagnosticId, rating } = body;
      if (!diagnosticId || !rating) {
        return NextResponse.json({ error: "diagnosticId and rating are required for action=rate" }, { status: 400 });
      }
      const updated = await rateDiagnostic(diagnosticId, rating);
      return NextResponse.json({ success: true, diagnostic: updated });
    }

    const report = await runFullDiagnostic(projectId);
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const projectId = sp.get("projectId") || "";
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    await requireNativeProjectAccess(request, projectId, "project:read", "viewer");

    const limit = Number(sp.get("limit") || "20");
    const offset = Number(sp.get("offset") || "0");

    const history = await getDiagnosticHistory(projectId, { limit, offset });
    return NextResponse.json({ history });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
