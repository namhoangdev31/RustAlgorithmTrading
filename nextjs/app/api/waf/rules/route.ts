import { NextRequest, NextResponse } from "next/server";
import { nativeErrorResponse, requireNativeProjectAccess } from "@/lib/server/native-platform/auth";
import {
  createWafRule,
  listWafRules,
  updateWafRule,
  deleteWafRule,
} from "@/lib/server/native-platform/waf-engine";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const projectId = sp.get("projectId") || "";
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    await requireNativeProjectAccess(request, projectId, "project:read", "viewer");
    const rules = await listWafRules(projectId);
    
    return NextResponse.json({ rules });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projectId = String(body.projectId || "");
    const { name, action, type, pattern, description } = body;

    if (!projectId || !name || !action || !type || !pattern) {
      return NextResponse.json(
        { error: "projectId, name, action, type, and pattern are required." },
        { status: 400 }
      );
    }

    await requireNativeProjectAccess(request, projectId, "project:write", "editor");
    const rule = await createWafRule({
      projectId,
      name,
      action,
      type,
      pattern,
      description,
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const projectId = String(body.projectId || "");
    const id = String(body.id || "");
    const { name, action, type, pattern, description, enabled } = body;

    if (!projectId || !id) {
      return NextResponse.json({ error: "projectId and id are required." }, { status: 400 });
    }

    await requireNativeProjectAccess(request, projectId, "project:write", "editor");
    const rule = await updateWafRule(id, projectId, {
      ...(name !== undefined ? { name } : {}),
      ...(action !== undefined ? { action } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(pattern !== undefined ? { pattern } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(enabled !== undefined ? { enabled } : {}),
    });

    return NextResponse.json({ rule });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const projectId = sp.get("projectId") || "";
    const id = sp.get("id") || "";

    if (!projectId || !id) {
      return NextResponse.json({ error: "projectId and id are required." }, { status: 400 });
    }

    await requireNativeProjectAccess(request, projectId, "project:write", "editor");
    await deleteWafRule(id, projectId);

    return NextResponse.json({ success: true, message: "WAF rule deleted successfully." });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
