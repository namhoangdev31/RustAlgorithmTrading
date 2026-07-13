import { createHash } from "crypto";
import { prisma } from "@/lib/server/prisma";

export interface SdkAuthResult {
  bundleId: string;
  projectId: string | null;
  method: "sdk_token" | "pat" | "service_identity";
  scopes: string[];
  identityId: string;
}

/**
 * Authenticate an incoming API request using one of:
 * 1. lp_sdk_* bundle-scoped ingestion tokens
 * 2. Scoped Personal Access Tokens (PATs)
 * 3. Project service identities (via x-project-id header)
 *
 * The authenticated identity always overrides any client-supplied tenant identifiers.
 */
export async function authenticateSdkRequest(
  authHeader: string | null,
  projectIdHeader: string | null
): Promise<SdkAuthResult | null> {
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");

  // 1. SDK token: "Bearer lp_sdk_..."
  if (scheme?.toLowerCase() === "bearer" && token?.startsWith("lp_sdk_")) {
    return authenticateSdkToken(token);
  }

  // 2. PAT: "Bearer pat_..."
  if (scheme?.toLowerCase() === "bearer" && token?.startsWith("pat_")) {
    return authenticatePat(token, projectIdHeader);
  }

  // 3. Service identity via x-project-id with any bearer
  if (scheme?.toLowerCase() === "bearer" && projectIdHeader) {
    return authenticateServiceIdentity(projectIdHeader);
  }

  return null;
}

async function authenticateSdkToken(fullToken: string): Promise<SdkAuthResult | null> {
  // Token format: lp_sdk_<prefix>_<secret>
  // tokenPrefix = first 8 chars after "lp_sdk_"
  const withoutPrefix = fullToken.slice(7); // Remove "lp_sdk_"
  const prefix = withoutPrefix.slice(0, 8);
  const tokenHash = createHash("sha256").update(fullToken).digest("hex");

  const sdkToken = await prisma.bundleSdkTokens.findFirst({
    where: {
      tokenPrefix: prefix,
      tokenHash,
      isRevoked: false,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }, { rotationGraceUntil: { gt: new Date() } }],
    },
  });

  if (!sdkToken) return null;

  // Update lastUsedAt (fire-and-forget)
  prisma.bundleSdkTokens
    .update({
      where: { id: sdkToken.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {}); // non-blocking

  // Resolve projectId from bundle
  const bundle = await prisma.bundles.findUnique({
    where: { id: sdkToken.bundleId },
    select: { projectId: true },
  });

  return {
    bundleId: sdkToken.bundleId,
    projectId: bundle?.projectId || null,
    method: "sdk_token",
    scopes: sdkToken.scopes,
    identityId: sdkToken.id,
  };
}

async function authenticatePat(
  token: string,
  projectIdHeader: string | null
): Promise<SdkAuthResult | null> {
  // Look up PAT by hashed value
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const pat = await prisma.personalAccessToken.findFirst({
    where: {
      tokenHash,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    select: {
      userId: true,
      scopes: true,
    },
  });

  if (!pat || !projectIdHeader) return null;

  // Verify user has access to the project
  const project = await prisma.project.findFirst({
    where: {
      id: projectIdHeader,
      OR: [
        { members: { some: { userId: pat.userId } } },
        { organization: { members: { some: { userId: pat.userId } } } },
      ],
    },
    include: {
      bundle: true,
    },
  });

  if (!project || !project.bundle) return null;

  return {
    bundleId: project.bundle.id,
    projectId: project.id,
    method: "pat",
    scopes: pat.scopes,
    identityId: pat.userId,
  };
}

async function authenticateServiceIdentity(
  projectId: string
): Promise<SdkAuthResult | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      bundle: true,
    },
  });

  if (!project || !project.bundle) return null;

  return {
    bundleId: project.bundle.id,
    projectId: project.id,
    method: "service_identity",
    scopes: [],
    identityId: projectId,
  };
}

export function hasSdkScope(auth: SdkAuthResult | null, scope: string): auth is SdkAuthResult {
  return Boolean(auth?.method === "sdk_token" && (auth.scopes.includes(scope) || auth.scopes.includes("*")));
}
