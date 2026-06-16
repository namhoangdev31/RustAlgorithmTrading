"use server";

import { prisma } from "@/lib/server/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";
import { upsertScimUser, upsertScimGroup } from "@/lib/server/native-platform/scim";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

/**
 * Returns the SCIM configuration settings (Base URL and secure Token shims)
 * alongside all synced mapped users and groups.
 */
export async function getScimConfigAction(organizationId: string) {
  const user = await requireCurrentUser();
  
  const org = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      userId: user.id,
    },
  });

  if (!org) {
    throw new Error("Access denied to organization directory settings");
  }

  // Generate dynamic, unique SCIM details for the organization
  const scimBaseUrl = `https://lepos.dev/api/scim/v2?organizationId=${organizationId}`;
  const scimToken = `scim_pat_` + crypto
    .createHash("sha256")
    .update(organizationId + "lepos-scim-salt-2026")
    .digest("hex")
    .slice(0, 24);

  const mappings = await prisma.nativeScimMapping.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    scimBaseUrl,
    scimToken,
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
 * Simulates a SCIM directory synchronization event triggered from Okta or Azure AD.
 */
export async function triggerScimSyncSimulationAction(
  organizationId: string,
  provider: "okta" | "azure"
) {
  const user = await requireCurrentUser();

  const org = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      userId: user.id,
    },
  });

  if (!org) {
    throw new Error("Access denied");
  }

  console.log(`[SCIM Sync Job] Triggering manual SCIM mapping simulation for provider [${provider}]`);

  const mockDomain = provider === "okta" ? "okta-identity.com" : "azure-directory.com";

  // Upsert simulated users
  const mockUsers = [
    { externalId: `usr-${provider}-01`, userName: `clara.oss@${mockDomain}`, active: true, role: "editor" },
    { externalId: `usr-${provider}-02`, userName: `bill.gates@${mockDomain}`, active: true, role: "admin" },
    { externalId: `usr-${provider}-03`, userName: `legacy.bot@${mockDomain}`, active: false, role: "viewer" }
  ];

  for (const u of mockUsers) {
    await upsertScimUser({
      organizationId,
      externalId: u.externalId,
      userName: u.userName,
      active: u.active,
      role: u.role,
    });
  }

  // Upsert simulated groups
  const mockGroups = [
    {
      externalId: `grp-${provider}-01`,
      displayName: `${provider.toUpperCase()} Global Admins`,
      role: "admin",
      members: [{ value: `usr-${provider}-02` }]
    },
    {
      externalId: `grp-${provider}-02`,
      displayName: `${provider.toUpperCase()} Developers Group`,
      role: "developer",
      members: [{ value: `usr-${provider}-01` }]
    }
  ];

  for (const g of mockGroups) {
    await upsertScimGroup({
      organizationId,
      externalId: g.externalId,
      displayName: g.displayName,
      role: g.role,
      members: g.members,
    });
  }

  revalidatePath("/dashboard/settings");

  return {
    success: true,
    usersSynced: mockUsers.length,
    groupsSynced: mockGroups.length,
  };
}
