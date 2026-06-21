import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { nativeErrorResponse, requireNativeProjectAccess } from "@/lib/server/native-platform/auth";
import { uploadSourceMap } from "@/lib/server/native-platform/telemetry";
import { listProjectSourceMaps } from "@/lib/server/native-platform/source-maps";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projectId = String(body.projectId || "");
    if (!projectId || !body.releaseVersion || !body.fileName) {
      return NextResponse.json({ error: "projectId, releaseVersion, and fileName are required." }, { status: 400 });
    }

    await requireNativeProjectAccess(request, projectId, "project:write", "editor");
    const sourceMap = await uploadSourceMap({
      projectId,
      releaseVersion: String(body.releaseVersion),
      fileName: String(body.fileName),
      storagePath: body.storagePath,
      mapJson: body.mapJson,
      deploymentId: body.deploymentId,
    });

    return NextResponse.json({ sourceMap }, { status: 201 });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const projectId = sp.get("projectId") || "";
    if (!projectId) {
      return NextResponse.json({ error: "projectId parameter is required." }, { status: 400 });
    }

    await requireNativeProjectAccess(request, projectId, "project:read", "viewer");
    
    const releaseVersion = sp.get("releaseVersion") || undefined;
    
    const sourceMaps = await listProjectSourceMaps(projectId);

    return NextResponse.json({
      sourceMaps: releaseVersion
        ? sourceMaps.filter((sourceMap) => sourceMap.releaseVersion === releaseVersion)
        : sourceMaps,
    });
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
      return NextResponse.json({ error: "projectId and id parameters are required." }, { status: 400 });
    }

    await requireNativeProjectAccess(request, projectId, "project:write", "editor");

    await prisma.nativeSourceMap.delete({
      where: {
        id,
        projectId,
      },
    });

    return NextResponse.json({ success: true, message: "Source map deleted successfully." });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
