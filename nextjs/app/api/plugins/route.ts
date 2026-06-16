import { NextResponse } from "next/server";

import { nativeErrorResponse, requireNativeProjectAccess } from "@/lib/server/native-platform/auth";
import { installNativePlugin, listNativePlugins, upsertNativePlugin } from "@/lib/server/native-platform/plugins";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;
    if (projectId) {
      await requireNativeProjectAccess(request, projectId, "project:read", "viewer");
    }

    const plugins = await listNativePlugins(projectId);
    return NextResponse.json({ plugins });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body.action || "upsert");

    if (action === "install") {
      const projectId = String(body.projectId || "");
      const pluginId = String(body.pluginId || "");
      if (!projectId || !pluginId) {
        return NextResponse.json({ error: "projectId and pluginId are required." }, { status: 400 });
      }
      await requireNativeProjectAccess(request, projectId, "project:write", "editor");
      const installation = await installNativePlugin(projectId, pluginId, body.config);
      return NextResponse.json({ installation }, { status: 201 });
    }

    const projectId = String(body.projectId || "");
    if (projectId) {
      await requireNativeProjectAccess(request, projectId, "project:write", "editor");
    }
    const plugin = await upsertNativePlugin({
      slug: String(body.slug || ""),
      name: String(body.name || ""),
      version: String(body.version || "0.1.0"),
      bundleUrl: String(body.bundleUrl || ""),
      permissions: Array.isArray(body.permissions) ? body.permissions : [],
      description: body.description,
    });

    return NextResponse.json({ plugin }, { status: 201 });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
