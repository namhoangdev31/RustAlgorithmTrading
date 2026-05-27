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

export const getWorkspaceContext = cache(async (userId: string) => {
  const cookieStore = await cookies();
  const activeOrganizationId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

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
