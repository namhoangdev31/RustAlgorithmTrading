import { NextResponse } from "next/server";

import type { AccessRole } from "@/lib/server/permissions";
import { requireProjectRole, validatePersonalAccessToken } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";
import { compareServiceSecret } from "./zero-trust";

export class NativePlatformError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export type NativeApiAccess = {
  mode: "internal" | "pat" | "service";
  userId?: string;
  serviceName?: string;
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

async function validateServiceIdentity(
  request: Request,
  projectId: string,
  requiredScope: string
): Promise<NativeApiAccess | null> {
  const serviceName = request.headers.get("x-lepos-service-id") || "";
  const serviceSecret = request.headers.get("x-lepos-service-secret") || "";
  if (!serviceName || !serviceSecret) {
    return null;
  }

  const identity = await prisma.nativeServiceIdentity.findUnique({
    where: {
      projectId_serviceName: {
        projectId,
        serviceName,
      },
    },
  });

  if (!identity || identity.status !== "active") {
    throw new NativePlatformError("Unknown service identity.", 401);
  }

  if (!compareServiceSecret(serviceSecret, identity.sharedSecretHash)) {
    throw new NativePlatformError("Invalid service identity secret.", 401);
  }

  const targetService = request.headers.get("x-lepos-target-service") || "nextjs-control-plane";
  const trustPolicy = await prisma.nativeServiceTrustPolicy.findUnique({
    where: {
      projectId_sourceService_targetService: {
        projectId,
        sourceService: serviceName,
        targetService,
      },
    },
  });

  if (trustPolicy && trustPolicy.status === "active") {
    if (trustPolicy.enforceMtls && request.headers.get("x-lepos-service-tls") !== "enabled") {
      throw new NativePlatformError("mTLS is required for this service path.", 403);
    }

    if (!hasScope(trustPolicy.allowedScopes, requiredScope)) {
      throw new NativePlatformError(`Missing required scope: ${requiredScope}.`, 403);
    }
  } else if (!hasScope(identity.scopes, requiredScope)) {
    throw new NativePlatformError(`Missing required scope: ${requiredScope}.`, 403);
  }

  await prisma.nativeServiceIdentity.update({
    where: { id: identity.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    mode: "service",
    serviceName,
    scopes: trustPolicy?.allowedScopes?.length ? trustPolicy.allowedScopes : identity.scopes,
  };
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

  const serviceAccess = await validateServiceIdentity(request, projectId, requiredScope);
  if (serviceAccess) {
    return serviceAccess;
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
