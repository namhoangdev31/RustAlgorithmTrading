import { prisma } from "@/lib/server/prisma";
import { createHash } from "crypto";

export type AccessRole = "viewer" | "editor" | "admin" | "owner";

export async function validatePersonalAccessToken(token: string) {
  if (!token.startsWith("lp_pat_")) {
    return null;
  }
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await prisma.personalAccessToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record) {
    return null;
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    return null;
  }

  // Update lastUsedAt asynchronously
  prisma.personalAccessToken.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return {
    user: record.user,
    scopes: record.scopes,
  };
}

const ROLE_WEIGHT: Record<AccessRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

export function normalizeRole(role?: string | null): AccessRole {
  if (role === "owner" || role === "admin" || role === "editor") {
    return role;
  }

  return "viewer";
}

export function hasMinimumRole(role: AccessRole, minimum: AccessRole) {
  return ROLE_WEIGHT[role] >= ROLE_WEIGHT[minimum];
}

function strongestRole(roles: Array<string | null | undefined>): AccessRole | null {
  return roles.reduce<AccessRole | null>((best, role) => {
    const normalized = normalizeRole(role);
    if (!best || ROLE_WEIGHT[normalized] > ROLE_WEIGHT[best]) {
      return normalized;
    }

    return best;
  }, null);
}

export async function getWorkspaceAccess(userId: string, organizationId: string) {
  const organization = await prisma.organization.findFirst({
    where: { id: organizationId, deletedAt: null },
    select: {
      id: true,
      name: true,
      type: true,
      userId: true,
      projects: {
        where: { deletedAt: null },
        select: {
          id: true,
          bundle: {
            select: {
              id: true,
              collaborators: {
                where: { userId },
                select: { role: true },
              },
            },
          },
        },
      },
    },
  });

  if (!organization) {
    return null;
  }

  if (organization.userId === userId) {
    return {
      organization,
      role: "owner" as AccessRole,
      bundleIds: organization.projects.flatMap((project) =>
        project.bundle ? [project.bundle.id] : []
      ),
    };
  }

  const collaboratorRoles = organization.projects.flatMap((project) =>
    project.bundle?.collaborators.map((collaborator) => collaborator.role) ?? []
  );
  const role = strongestRole(collaboratorRoles);

  if (!role) {
    return null;
  }

  return {
    organization,
    role,
    bundleIds: organization.projects.flatMap((project) =>
      project.bundle ? [project.bundle.id] : []
    ),
  };
}

export async function requireWorkspaceRole(
  userId: string,
  organizationId: string,
  minimum: AccessRole
) {
  const access = await getWorkspaceAccess(userId, organizationId);

  if (!access || !hasMinimumRole(access.role, minimum)) {
    throw new Error("Workspace access denied.");
  }

  return access;
}

export async function requireProjectRole(
  userId: string,
  projectId: string,
  minimum: AccessRole
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: {
      id: true,
      organizationId: true,
      vercelProjectId: true,
      bundle: {
        select: {
          id: true,
          collaborators: {
            where: { userId },
            select: { role: true },
          },
        },
      },
      organization: {
        select: { userId: true },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const role =
    project.organization.userId === userId
      ? "owner"
      : strongestRole(project.bundle?.collaborators.map((item) => item.role) ?? []);

  if (!role || !hasMinimumRole(role, minimum)) {
    throw new Error("Project access denied.");
  }

  return { project, role };
}

export async function requireBundleRole(
  userId: string,
  bundleId: string,
  minimum: AccessRole
) {
  const bundle = await prisma.bundles.findFirst({
    where: { id: bundleId, deletedAt: null },
    select: {
      id: true,
      projectId: true,
      collaborators: {
        where: { userId },
        select: { role: true },
      },
      project: {
        select: {
          id: true,
          organization: {
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!bundle) {
    throw new Error("Bundle not found.");
  }

  const role =
    bundle.project?.organization.userId === userId
      ? "owner"
      : strongestRole(bundle.collaborators.map((item) => item.role));

  if (!role || !hasMinimumRole(role, minimum)) {
    throw new Error("Bundle access denied.");
  }

  return { bundle, role };
}

export async function getWorkspaceMembers(organizationId: string) {
  const organization = await prisma.organization.findFirst({
    where: { id: organizationId, deletedAt: null },
    select: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      },
    },
  });

  const collaborators = await prisma.bundleCollaborators.findMany({
    where: {
      bundle: {
        project: {
          organizationId,
          deletedAt: null,
        },
      },
    },
    select: {
      role: true,
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      },
      bundleId: true,
    },
  });

  const members = new Map<
    string,
    {
      id: string;
      email: string | null;
      fullName: string | null;
      role: AccessRole;
      projectCount: number;
    }
  >();

  if (organization?.user) {
    members.set(organization.user.id, {
      ...organization.user,
      role: "owner",
      projectCount: 0,
    });
  }

  for (const collaborator of collaborators) {
    const current = members.get(collaborator.user.id);
    const role = normalizeRole(collaborator.role);

    if (!current) {
      members.set(collaborator.user.id, {
        ...collaborator.user,
        role,
        projectCount: 1,
      });
      continue;
    }

    current.projectCount += 1;
    if (ROLE_WEIGHT[role] > ROLE_WEIGHT[current.role]) {
      current.role = role;
    }
  }

  return Array.from(members.values()).sort(
    (first, second) => ROLE_WEIGHT[second.role] - ROLE_WEIGHT[first.role]
  );
}
