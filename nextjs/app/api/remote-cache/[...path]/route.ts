import { NextRequest, NextResponse } from "next/server";
import {
  getArtifact,
  putArtifact,
  checkArtifactExists,
  recordCacheEvent,
  type RemoteCacheEventPayload,
} from "@/lib/server/remote-cache-engine";

// ---------------------------------------------------------------------------
// Auth & route helpers
// ---------------------------------------------------------------------------

function extractAuth(request: NextRequest): { token: string; teamId: string } | null {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const teamId =
    request.headers.get("x-artifact-team-id") ||
    request.nextUrl.searchParams.get("teamId") ||
    "default";

  return { token, teamId };
}

/**
 * Parse catch-all path segments:
 *   /api/remote-cache/v8/artifacts/:hash  → { version: "v8", hash }
 *   /api/remote-cache/v8/artifacts/events → { version: "v8", events: true }
 */
function parsePath(params: { path: string[] }): {
  version: string;
  hash?: string;
  isEvents: boolean;
} {
  const segments = params.path || [];
  const version = segments[0] || "v8";
  const lastSegment = segments[segments.length - 1];

  if (lastSegment === "events") {
    return { version, isEvents: true };
  }

  // /v8/artifacts/:hash → hash is segments[2]
  const hash = segments.length >= 3 ? segments[2] : segments[1];
  return { version, hash, isEvents: false };
}

// ---------------------------------------------------------------------------
// GET /api/remote-cache/v8/artifacts/:hash — Download artifact
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const auth = extractAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const { hash } = parsePath(resolvedParams);
  if (!hash) {
    return NextResponse.json({ error: "Artifact hash is required" }, { status: 400 });
  }

  const result = await getArtifact(hash, auth.teamId);
  if (!result) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(result.stream, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(result.size),
      "x-artifact-tag": hash,
    },
  });
}

// ---------------------------------------------------------------------------
// PUT /api/remote-cache/v8/artifacts/:hash — Upload artifact
// ---------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const auth = extractAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const { hash } = parsePath(resolvedParams);
  if (!hash) {
    return NextResponse.json({ error: "Artifact hash is required" }, { status: 400 });
  }

  const duration = parseInt(request.headers.get("x-artifact-duration") || "0", 10) || undefined;
  const tag = request.headers.get("x-artifact-tag") || undefined;

  const arrayBuffer = await request.arrayBuffer();
  const data = Buffer.from(arrayBuffer);
  const result = await putArtifact(hash, auth.teamId, data, duration, tag);

  return NextResponse.json(
    { urls: [`/api/remote-cache/v8/artifacts/${hash}`], size: result.size },
    { status: 202 }
  );
}

// ---------------------------------------------------------------------------
// HEAD /api/remote-cache/v8/artifacts/:hash — Check artifact exists
// ---------------------------------------------------------------------------

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const auth = extractAuth(request);
  if (!auth) {
    return new NextResponse(null, { status: 401 });
  }

  const resolvedParams = await params;
  const { hash } = parsePath(resolvedParams);
  if (!hash) {
    return new NextResponse(null, { status: 400 });
  }

  const exists = await checkArtifactExists(hash, auth.teamId);
  return new NextResponse(null, { status: exists ? 200 : 404 });
}

// ---------------------------------------------------------------------------
// POST /api/remote-cache/v8/artifacts/events — Cache analytics events
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const auth = extractAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const { isEvents } = parsePath(resolvedParams);

  if (!isEvents) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const events: RemoteCacheEventPayload[] = Array.isArray(body) ? body : [body];
    await recordCacheEvent(auth.teamId, events);

    return NextResponse.json({ received: events.length });
  } catch {
    return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
  }
}
