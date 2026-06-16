import { NextRequest, NextResponse } from "next/server";
import { requireNativeProjectAccess, nativeErrorResponse } from "@/lib/server/native-platform/auth";
import {
  purgeByPath,
  purgeByTag,
  purgeBySurrogateKey,
  purgeAll,
} from "@/lib/server/native-platform/isr-cache-manager";

/**
 * POST /api/revalidate — Advanced cache purge API
 *
 * Supports purging by:
 * - `type: "path"`          → exact path or wildcard glob (`/blog/*`)
 * - `type: "tag"`           → cache tag label
 * - `type: "surrogate-key"` → CDN Surrogate-Key / Cache-Tag header
 * - `type: "all"`           → flush entire project cache
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      type,
      path: routePath,
      tag,
      surrogateKey,
      secret,
    } = body as {
      projectId?: string;
      type?: string;
      path?: string;
      tag?: string;
      surrogateKey?: string;
      secret?: string;
    };

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Authenticate via secret token OR project-level RBAC
    const revalidationSecret = process.env.REVALIDATION_SECRET;
    if (!revalidationSecret || secret !== revalidationSecret) {
      await requireNativeProjectAccess(
        request,
        projectId,
        "deployment:trigger",
        "editor"
      );
    }

    let purgedCount = 0;
    const purgeType = type || "path";

    switch (purgeType) {
      case "path":
        if (!routePath) {
          return NextResponse.json(
            { error: "path is required for type=path" },
            { status: 400 }
          );
        }
        purgedCount = await purgeByPath(projectId, routePath);
        break;

      case "tag":
        if (!tag) {
          return NextResponse.json(
            { error: "tag is required for type=tag" },
            { status: 400 }
          );
        }
        purgedCount = await purgeByTag(projectId, tag);
        break;

      case "surrogate-key":
        if (!surrogateKey) {
          return NextResponse.json(
            { error: "surrogateKey is required for type=surrogate-key" },
            { status: 400 }
          );
        }
        purgedCount = await purgeBySurrogateKey(projectId, surrogateKey);
        break;

      case "all":
        purgedCount = await purgeAll(projectId);
        break;

      default:
        return NextResponse.json(
          { error: `Invalid type: ${purgeType}. Use path, tag, surrogate-key, or all` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      revalidated: true,
      type: purgeType,
      purgedKeys: purgedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Revalidate API] Error:", error);
    return nativeErrorResponse(error);
  }
}

/**
 * GET /api/revalidate?projectId=...&path=...
 * Simple path-based revalidation (backward compatible with existing clients).
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    const routePath = searchParams.get("path");

    if (!projectId || !routePath) {
      return NextResponse.json(
        { error: "projectId and path are required" },
        { status: 400 }
      );
    }

    await requireNativeProjectAccess(
      request,
      projectId,
      "deployment:trigger",
      "editor"
    );

    const purgedCount = await purgeByPath(projectId, routePath);

    return NextResponse.json({
      success: true,
      message: `Cache purged for path: ${routePath}`,
      purged: purgedCount,
    });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
