"use server";

import { prisma } from "@/lib/server/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { encryptSecret } from "@/lib/server/secret-crypto";
import { requireWorkspaceRole } from "@/lib/server/permissions";

/**
 * Returns the SCIM configuration settings (Base URL and secure Token shims)
 * alongside all synced mapped users and groups.
 */
export async function getScimConfigAction(organizationId: string) {
  const user = await requireCurrentUser();
  await requireWorkspaceRole(user.id, organizationId, "viewer");

  const [connection, mappings] = await Promise.all([
    prisma.workspaceProviderConnection.findUnique({
      where: {
        organizationId_provider: { organizationId, provider: "scim" },
      },
      select: { status: true, updatedAt: true },
    }),
    prisma.nativeScimMapping.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    success: true,
    configured: connection?.status === "active",
    scimBaseUrl: connection ? "/api/scim/v2" : null,
    scimToken: null,
    updatedAt: connection?.updatedAt.toISOString() || null,
    mappings: mappings.map((m) => ({
      id: m.id,
      provider: m.provider,
      resourceType: m.resourceType,
      externalId: m.externalId,
      localRole: m.localRole,
      metadata: m.metadata,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    })),
  };
}

/**
 * Creates or rotates the workspace SCIM credential. The raw token is returned once.
 */
export async function generateScimCredentialsAction(organizationId: string) {
  const user = await requireCurrentUser();
  await requireWorkspaceRole(user.id, organizationId, "admin");

  const secret = `scim_${randomBytes(32).toString("base64url")}`;
  const rawToken = Buffer.from(`${organizationId}:${secret}`, "utf8").toString("base64");

  await prisma.$transaction([
    prisma.workspaceProviderConnection.upsert({
      where: {
        organizationId_provider: { organizationId, provider: "scim" },
      },
      create: {
        organizationId,
        provider: "scim",
        encryptedCredential: encryptSecret(secret),
        status: "active",
      },
      update: {
        encryptedCredential: encryptSecret(secret),
        status: "active",
      },
    }),
    prisma.workspaceAuditEvent.create({
      data: {
        workspaceId: organizationId,
        actorId: user.id,
        actorEmail: user.email || "unknown",
        action: "scim.credential.rotated",
        resourceType: "workspace_provider_connection",
        resourceId: organizationId,
        metadata: { provider: "scim" },
      },
    }),
  ]);

  revalidatePath("/settings/directory");

  return {
    success: true,
    scimBaseUrl: "/api/scim/v2",
    scimToken: rawToken,
  };
}
