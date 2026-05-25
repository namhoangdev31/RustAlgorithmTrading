import { cache } from "react";
import { cookies } from "next/headers";
import { OrganizationType } from "@/prisma/generated/enums";

import { prisma } from "@/lib/server/prisma";

const ACTIVE_ORG_COOKIE = "active_organization_id";

export type WorkspaceContext = Awaited<ReturnType<typeof getWorkspaceContext>>;

export function getDefaultOrganizationName(
  type: OrganizationType,
  displayName?: string | null,
  email?: string | null
) {
  const owner = displayName || email?.split("@")[0] || "Workspace";

  return type === OrganizationType.personal
    ? `${owner} Personal`
    : `${owner} Business`;
}

export async function ensureUserOrganizations(user: {
  id: string;
  fullName?: string | null;
  email?: string | null;
}) {
  const now = new Date();

  const [personal, corporate] = await prisma.$transaction([
    prisma.organization.upsert({
      where: {
        userId_type: {
          userId: user.id,
          type: OrganizationType.personal,
        },
      },
      create: {
        id: crypto.randomUUID(),
        name: getDefaultOrganizationName(
          OrganizationType.personal,
          user.fullName,
          user.email
        ),
        type: OrganizationType.personal,
        userId: user.id,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        deletedAt: null,
        updatedAt: now,
      },
    }),
    prisma.organization.upsert({
      where: {
        userId_type: {
          userId: user.id,
          type: OrganizationType.corporate,
        },
      },
      create: {
        id: crypto.randomUUID(),
        name: getDefaultOrganizationName(
          OrganizationType.corporate,
          user.fullName,
          user.email
        ),
        type: OrganizationType.corporate,
        userId: user.id,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        deletedAt: null,
        updatedAt: now,
      },
    }),
  ]);

  return [personal, corporate];
}

export const getWorkspaceContext = cache(async (userId: string) => {
  const cookieStore = await cookies();
  const activeOrganizationId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
    },
  });

  if (user) {
    await ensureUserOrganizations(user);
  }

  const organizations = await prisma.organization.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      projects: {
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          bundle: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      },
    },
  });

  const activeOrganization =
    organizations.find((organization) => organization.id === activeOrganizationId) ??
    organizations.find((organization) => organization.type === OrganizationType.personal) ??
    organizations[0] ??
    null;

  return {
    organizations,
    activeOrganization,
  };
});

export async function setActiveOrganizationCookie(organizationId: string) {
  const cookieStore = await cookies();

  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/dashboard",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearActiveOrganizationCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_ORG_COOKIE);
}

