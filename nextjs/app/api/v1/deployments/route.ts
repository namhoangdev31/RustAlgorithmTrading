import { NextResponse } from "next/server";

import { nativeErrorResponse, requireNativeProjectAccess } from "@/lib/server/native-platform/auth";
import { createNativeDeployment, listNativeDeployments } from "@/lib/server/native-platform/deployments";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || "";
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    await requireNativeProjectAccess(request, projectId, "project:read", "viewer");
    const deployments = await listNativeDeployments(projectId);
    return NextResponse.json({ deployments });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = String(body.projectId || "");
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    await requireNativeProjectAccess(request, projectId, "deployment:trigger", "editor");
    const deployment = await createNativeDeployment({
      projectId,
      version: body.version,
      changelog: body.changelog,
      target: body.target,
      storagePath: body.storagePath,
      bundleUrl: body.bundleUrl,
      sourceCommit: body.sourceCommit,
    });

    return NextResponse.json({ deployment }, { status: 201 });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
