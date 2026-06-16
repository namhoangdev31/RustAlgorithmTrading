import { NextRequest, NextResponse } from "next/server";

import { nativeErrorResponse, requireNativeInternalOrPat } from "@/lib/server/native-platform/auth";
import { ingestCrashReport } from "@/lib/server/native-platform/telemetry";
import {
  getCrashGroups,
  getCrashStats,
  getTopCrashes,
  updateCrashGroupStatus,
  deleteCrashGroup,
} from "@/lib/server/native-platform/error-tracking";

export async function GET(request: NextRequest) {
  try {
    await requireNativeInternalOrPat(request, "errors:read");
    const sp = request.nextUrl.searchParams;
    const projectId = sp.get("projectId");
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    const view = sp.get("view") || "groups";

    switch (view) {
      case "stats": {
        const from = sp.get("from") ? new Date(sp.get("from")!) : new Date(Date.now() - 7 * 86400000);
        const to = sp.get("to") ? new Date(sp.get("to")!) : new Date();
        const stats = await getCrashStats(projectId, { from, to });
        return NextResponse.json(stats);
      }
      case "top": {
        const limit = Number(sp.get("limit") || "10");
        const top = await getTopCrashes(projectId, limit);
        return NextResponse.json({ crashes: top });
      }
      case "groups":
      default: {
        const status = sp.get("status") || undefined;
        const limit = Number(sp.get("limit") || "50");
        const offset = Number(sp.get("offset") || "0");
        const groups = await getCrashGroups(projectId, { status, limit, offset });
        return NextResponse.json({ groups });
      }
    }
  } catch (error) {
    return nativeErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireNativeInternalOrPat(request, "errors:write");
    const body = await request.json();
    const { projectId, errorMessage, errorStack, environment, platform, releaseVersion, userAgent } = body;

    if (!projectId || !errorMessage || !errorStack) {
      return NextResponse.json({ error: "projectId, errorMessage, and errorStack are required" }, { status: 400 });
    }

    const report = await ingestCrashReport({
      projectId,
      errorMessage,
      errorStack,
      environment,
      platform,
      releaseVersion,
      userAgent,
      ipAddress: request.headers.get("x-forwarded-for"),
    });

    return NextResponse.json({ id: report.id, fingerprint: report.fingerprint }, { status: 201 });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireNativeInternalOrPat(request, "errors:write");
    const body = await request.json();
    const { projectId, fingerprint, status } = body;

    if (!projectId || !fingerprint || !status) {
      return NextResponse.json({ error: "projectId, fingerprint, and status are required" }, { status: 400 });
    }

    const result = await updateCrashGroupStatus(projectId, fingerprint, status);
    return NextResponse.json({ updated: result });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireNativeInternalOrPat(request, "errors:write");
    const sp = request.nextUrl.searchParams;
    const projectId = sp.get("projectId");
    const fingerprint = sp.get("fingerprint");

    if (!projectId || !fingerprint) {
      return NextResponse.json({ error: "projectId and fingerprint are required" }, { status: 400 });
    }

    const deleted = await deleteCrashGroup(projectId, fingerprint);
    return NextResponse.json({ deleted });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
