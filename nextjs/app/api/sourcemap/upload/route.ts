import { NextRequest, NextResponse } from "next/server";
import { uploadSourceMap } from "@/lib/server/native-platform/telemetry";
import { requireNativeProjectAccess, nativeErrorResponse } from "@/lib/server/native-platform/auth";

/**
 * API Route to upload Source Maps (.map files) dynamically from build pipeline.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, releaseVersion, fileName, mapJson, deploymentId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId parameter is required." }, { status: 400 });
    }
    if (!releaseVersion) {
      return NextResponse.json({ error: "releaseVersion parameter is required." }, { status: 400 });
    }
    if (!fileName) {
      return NextResponse.json({ error: "fileName parameter is required." }, { status: 400 });
    }
    if (!mapJson) {
      return NextResponse.json({ error: "mapJson payload is required." }, { status: 400 });
    }

    // Authenticate project write access (requires PAT token or session with editor permissions)
    await requireNativeProjectAccess(request, projectId, "project:write", "editor");

    const sourceMap = await uploadSourceMap({
      projectId,
      releaseVersion,
      fileName,
      mapJson,
      deploymentId,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Successfully uploaded source map for ${fileName} (${releaseVersion})`,
        sourceMapId: sourceMap.id,
      },
      { status: 201 }
    );
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
