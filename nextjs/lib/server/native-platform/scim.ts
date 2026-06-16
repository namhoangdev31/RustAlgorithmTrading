import { prisma } from "@/lib/server/prisma";

export async function listScimUsers(organizationId?: string) {
  const mappings = await prisma.nativeScimMapping.findMany({
    where: {
      resourceType: "User",
      ...(organizationId ? { organizationId } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  return {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: mappings.length,
    Resources: mappings.map((mapping) => ({
      id: mapping.externalId,
      userName: (mapping.metadata as any)?.userName || mapping.externalId,
      active: (mapping.metadata as any)?.active ?? true,
      meta: { resourceType: "User" },
    })),
  };
}

import crypto from "crypto";

function normalizeScimRole(role: string): string {
  const r = role.toLowerCase();
  if (r === "admin" || r === "owner") return "admin";
  if (r === "editor" || r === "developer" || r === "writer") return "editor";
  return "viewer";
}

async function syncUserWorkspaceRole(organizationId: string, userId: string, role: string) {
  const normalized = normalizeScimRole(role);

  // Find all projects in organization
  const projects = await prisma.project.findMany({
    where: { organizationId, deletedAt: null },
    include: { bundle: true },
  });

  for (const project of projects) {
    if (project.bundle) {
      await prisma.bundleCollaborators.upsert({
        where: {
          bundleId_userId: {
            bundleId: project.bundle.id,
            userId,
          },
        },
        create: {
          id: crypto.randomUUID(),
          bundleId: project.bundle.id,
          userId,
          role: normalized,
          createdAt: new Date(),
        },
        update: {
          role: normalized,
        },
      });
    }
  }
}

export async function upsertScimUser(input: {
  organizationId: string;
  externalId: string;
  userName?: string;
  active?: boolean;
  role?: string;
}) {
  const email = input.userName && input.userName.includes("@")
    ? input.userName
    : `${input.userName || input.externalId}@sso.lepos.dev`;

  // 1. Resolve or provision local User
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email,
        fullName: input.userName ? input.userName.split("@")[0] : input.externalId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  const normalizedRole = normalizeScimRole(input.role || "viewer");

  // 2. Upsert SCIM mapping
  const mapping = await prisma.nativeScimMapping.upsert({
    where: {
      organizationId_provider_resourceType_externalId: {
        organizationId: input.organizationId,
        provider: "scim",
        resourceType: "User",
        externalId: input.externalId,
      },
    },
    create: {
      organizationId: input.organizationId,
      provider: "scim",
      resourceType: "User",
      externalId: input.externalId,
      localUserId: user.id,
      localRole: normalizedRole,
      metadata: {
        userName: input.userName || input.externalId,
        active: input.active ?? true,
      },
    },
    update: {
      localUserId: user.id,
      localRole: normalizedRole,
      metadata: {
        userName: input.userName || input.externalId,
        active: input.active ?? true,
      },
    },
  });

  // 3. Propigate role to workspace projects/bundles collaborators
  if (input.active !== false) {
    await syncUserWorkspaceRole(input.organizationId, user.id, normalizedRole);
  } else {
    // If user is deactivated/disabled, we can remove them from project collaborators
    const projects = await prisma.project.findMany({
      where: { organizationId: input.organizationId },
      include: { bundle: true },
    });
    for (const project of projects) {
      if (project.bundle) {
        await prisma.bundleCollaborators.deleteMany({
          where: {
            bundleId: project.bundle.id,
            userId: user.id,
          },
        }).catch(() => {});
      }
    }
  }

  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: mapping.externalId,
    userName: input.userName || input.externalId,
    active: input.active ?? true,
  };
}

export async function listScimGroups(organizationId?: string) {
  const mappings = await prisma.nativeScimMapping.findMany({
    where: {
      resourceType: "Group",
      ...(organizationId ? { organizationId } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  return {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: mappings.length,
    Resources: mappings.map((mapping) => ({
      id: mapping.externalId,
      displayName: (mapping.metadata as any)?.displayName || mapping.externalId,
      meta: { resourceType: "Group" },
    })),
  };
}

export async function upsertScimGroup(input: {
  organizationId: string;
  externalId: string;
  displayName?: string;
  role?: string;
  members?: Array<{ value: string; display?: string }>;
}) {
  const groupName = input.displayName || input.externalId;
  
  // Auto-map AD/Okta group name to local role
  const mapGroupNameToRole = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes("admin") || n.includes("owner") || n.includes("manager")) {
      return "admin";
    }
    if (n.includes("developer") || n.includes("editor") || n.includes("builder") || n.includes("writer")) {
      return "editor";
    }
    return "viewer";
  };

  const mappedRole = input.role || mapGroupNameToRole(groupName);

  const mapping = await prisma.nativeScimMapping.upsert({
    where: {
      organizationId_provider_resourceType_externalId: {
        organizationId: input.organizationId,
        provider: "scim",
        resourceType: "Group",
        externalId: input.externalId,
      },
    },
    create: {
      organizationId: input.organizationId,
      provider: "scim",
      resourceType: "Group",
      externalId: input.externalId,
      localRole: mappedRole,
      metadata: {
        displayName: groupName,
      },
    },
    update: {
      localRole: mappedRole,
      metadata: {
        displayName: groupName,
      },
    },
  });

  // If group has members, sync their roles to the workspace projects/bundles
  if (Array.isArray(input.members)) {
    for (const member of input.members) {
      const userMapping = await prisma.nativeScimMapping.findFirst({
        where: {
          organizationId: input.organizationId,
          provider: "scim",
          resourceType: "User",
          externalId: member.value,
        },
      });

      if (userMapping && userMapping.localUserId) {
        await prisma.nativeScimMapping.update({
          where: { id: userMapping.id },
          data: { localRole: mappedRole },
        });

        await syncUserWorkspaceRole(input.organizationId, userMapping.localUserId, mappedRole);
      }
    }
  }

  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
    id: mapping.externalId,
    displayName: groupName,
    members: input.members || [],
  };
}

export async function deleteScimUser(organizationId: string, externalId: string) {
  const mapping = await prisma.nativeScimMapping.findFirst({
    where: {
      organizationId,
      provider: "scim",
      resourceType: "User",
      externalId,
    },
  });

  if (!mapping) {
    throw new Error(`User not found: ${externalId}`);
  }

  if (mapping.localUserId) {
    const projects = await prisma.project.findMany({
      where: { organizationId, deletedAt: null },
      include: { bundle: true },
    });

    for (const project of projects) {
      if (project.bundle) {
        await prisma.bundleCollaborators.deleteMany({
          where: {
            bundleId: project.bundle.id,
            userId: mapping.localUserId,
          },
        });
      }
    }
  }

  await prisma.nativeScimMapping.delete({
    where: { id: mapping.id },
  });

  return { success: true };
}

export async function deleteScimGroup(organizationId: string, externalId: string) {
  const mapping = await prisma.nativeScimMapping.findFirst({
    where: {
      organizationId,
      provider: "scim",
      resourceType: "Group",
      externalId,
    },
  });

  if (!mapping) {
    throw new Error(`Group not found: ${externalId}`);
  }

  await prisma.nativeScimMapping.delete({
    where: { id: mapping.id },
  });

  return { success: true };
}

export async function executeScimBulk(
  organizationId: string,
  operations: Array<{ method: string; path: string; data?: any }>
) {
  const results = [];

  for (const op of operations) {
    try {
      if (op.path.startsWith("/Users")) {
        if (op.method === "DELETE") {
          const externalId = op.path.split("/").pop() || "";
          await deleteScimUser(organizationId, externalId);
          results.push({
            status: "204",
            method: "DELETE",
            location: op.path,
          });
        } else {
          const res = await upsertScimUser({ organizationId, ...op.data });
          results.push({
            status: "201",
            method: op.method,
            location: `/Users/${res.id}`,
            response: res,
          });
        }
      } else if (op.path.startsWith("/Groups")) {
        if (op.method === "DELETE") {
          const externalId = op.path.split("/").pop() || "";
          await deleteScimGroup(organizationId, externalId);
          results.push({
            status: "204",
            method: "DELETE",
          });
        } else {
          const res = await upsertScimGroup({ organizationId, ...op.data });
          results.push({
            status: "201",
            method: op.method,
            location: `/Groups/${res.id}`,
            response: res,
          });
        }
      }
    } catch (err: any) {
      results.push({
        status: "400",
        method: op.method,
        location: op.path,
        response: {
          schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
          detail: err.message,
          status: "400",
        },
      });
    }
  }

  return {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:BulkResponse"],
    Operations: results,
  };
}

export function verifyScimBearerToken(authHeader: string | null): { valid: boolean; organizationId?: string } {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false };
  }

  const token = authHeader.slice(7);
  const scimSecret = process.env.SCIM_BEARER_TOKEN;

  if (!scimSecret) {
    return { valid: false };
  }

  if (token === scimSecret) {
    return { valid: true };
  }

  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [orgId, secret] = decoded.split(":");
    if (secret === scimSecret && orgId) {
      return { valid: true, organizationId: orgId };
    }
  } catch {
    // Not valid base64
  }

  return { valid: false };
}

