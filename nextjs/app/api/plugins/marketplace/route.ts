import { NextRequest, NextResponse } from "next/server";
import { nativeErrorResponse, requireNativeInternalOrPat } from "@/lib/server/native-platform/auth";
import { searchMarketplace, publishPlugin } from "@/lib/server/native-platform/plugins";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const query = sp.get("q") || undefined;
    const platform = sp.get("platform") || undefined;
    const limit = Number(sp.get("limit") || "20");
    const offset = Number(sp.get("offset") || "0");

    const result = await searchMarketplace(query, platform, limit, offset);
    return NextResponse.json(result);
  } catch (error) {
    return nativeErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireNativeInternalOrPat(request, "plugins:write");

    const body = await request.json();
    const { slug, name, version, bundleUrl, description, permissions, metadata } = body;

    if (!slug || !name || !version || !bundleUrl) {
      return NextResponse.json(
        { error: "slug, name, version, and bundleUrl are required fields" },
        { status: 400 }
      );
    }

    const plugin = await publishPlugin({
      slug,
      name,
      version,
      bundleUrl,
      description,
      permissions,
      metadata,
    });

    return NextResponse.json({ success: true, plugin }, { status: 201 });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
