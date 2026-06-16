import { NextResponse } from "next/server";

import type { AccessRole } from "@/lib/server/permissions";
import { requireProjectRole, validatePersonalAccessToken } from "@/lib/server/permissions";

export class NativePlatformError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export type NativeApiAccess = {
  mode: "internal" | "pat";
  userId?: string;
  scopes: string[];
};

function readBearerToken(request: Request) {
  const header = request.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : "";
}

function hasScope(scopes: string[], requiredScope: string) {
  return scopes.includes("*") || scopes.includes(requiredScope);
}

export async function requireNativeProjectAccess(
  request: Request,
  projectId: string,
  requiredScope = "project:read",
  minimumRole: AccessRole = "viewer"
): Promise<NativeApiAccess> {
  const internalKey = process.env.LEPOS_INTERNAL_API_KEY;
  const providedInternalKey = request.headers.get("x-lepos-internal-key");

  if (internalKey && providedInternalKey && providedInternalKey === internalKey) {
    return { mode: "internal", scopes: ["*"] };
  }

  const token = readBearerToken(request);
  if (!token) {
    throw new NativePlatformError("Missing bearer token.", 401);
  }

  const record = await validatePersonalAccessToken(token);
  if (!record) {
    throw new NativePlatformError("Invalid bearer token.", 401);
  }

  if (!hasScope(record.scopes, requiredScope)) {
    throw new NativePlatformError(`Missing required scope: ${requiredScope}.`, 403);
  }

  await requireProjectRole(record.user.id, projectId, minimumRole);
  return { mode: "pat", userId: record.user.id, scopes: record.scopes };
}

export async function requireNativeInternalOrPat(
  request: Request,
  requiredScope = "project:read"
): Promise<NativeApiAccess> {
  const internalKey = process.env.LEPOS_INTERNAL_API_KEY;
  const providedInternalKey = request.headers.get("x-lepos-internal-key");

  if (internalKey && providedInternalKey && providedInternalKey === internalKey) {
    return { mode: "internal", scopes: ["*"] };
  }

  const token = readBearerToken(request);
  if (!token) {
    throw new NativePlatformError("Missing bearer token.", 401);
  }

  const record = await validatePersonalAccessToken(token);
  if (!record) {
    throw new NativePlatformError("Invalid bearer token.", 401);
  }

  if (!hasScope(record.scopes, requiredScope)) {
    throw new NativePlatformError(`Missing required scope: ${requiredScope}.`, 403);
  }

  return { mode: "pat", userId: record.user.id, scopes: record.scopes };
}

export function nativeErrorResponse(error: unknown) {
  if (error instanceof NativePlatformError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "Native platform request failed.";
  return NextResponse.json({ error: message }, { status: 500 });
}
