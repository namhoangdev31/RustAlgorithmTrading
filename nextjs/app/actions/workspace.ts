"use server";

import { revalidatePath } from "next/cache";
import { localizedHref, redirect } from "@/i18n/navigation";

import { requireCurrentUser } from "@/lib/server/current-user";
import { requireWorkspaceRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function readReturnTo(formData: FormData, fallback: string) {
  return localizedHref(readFormValue(formData, "returnTo") || fallback);
}

function withQueryParam(href: string, key: string, value: string) {
  return `${href}${href.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

function readMemberRole(formData: FormData) {
  const role = readFormValue(formData, "role");
  return role === "admin" || role === "viewer" ? role : "editor";
}

async function getWorkspaceBundleIds(organizationId: string) {
  const projects = await prisma.project.findMany({
    where: { organizationId, deletedAt: null },
    select: {
      bundle: {
        select: { id: true },
      },
    },
  });

  return projects.flatMap((project) => (project.bundle ? [project.bundle.id] : []));
}

async function recordWorkspaceAudit(input: {
  organizationId: string;
  actorId: string;
  recipientId: string;
  title: string;
  body: string;
  metadata?: Record<string, string>;
}) {
  const now = new Date();

  await prisma.notifications.create({
    data: {
      id: crypto.randomUUID(),
      title: input.title,
      body: input.body,
      type: "workspace_audit",
      recipientId: input.recipientId,
      actorId: input.actorId,
      resourceId: input.organizationId,
      resourceType: "workspace",
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt: now,
      updatedAt: now,
    },
  });
}

export async function inviteWorkspaceMemberAction(formData: FormData) {
  const user = await requireCurrentUser();
  const organizationId = readFormValue(formData, "organizationId");
  const email = readFormValue(formData, "email").toLowerCase();
  const role = readMemberRole(formData);
  const returnTo = await readReturnTo(formData, "/dashboard/settings/account");

  if (!organizationId || !email) {
    redirect(withQueryParam(returnTo, "workspace", "missing_member"));
  }

  let access: Awaited<ReturnType<typeof requireWorkspaceRole>>;
  try {
    access = await requireWorkspaceRole(user.id, organizationId, "admin");
  } catch {
    redirect(withQueryParam(returnTo, "workspace", "access_denied"));
  }

  const invitedUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!invitedUser) {
    redirect(withQueryParam(returnTo, "workspace", "user_not_found"));
  }

  const bundleIds = await getWorkspaceBundleIds(organizationId);
  const now = new Date();

  await prisma.$transaction(
    bundleIds.map((bundleId) =>
      prisma.bundleCollaborators.upsert({
        where: {
          bundleId_userId: {
            bundleId,
            userId: invitedUser.id,
          },
        },
        create: {
          id: crypto.randomUUID(),
          bundleId,
          userId: invitedUser.id,
          role,
          invitedBy: user.id,
          acceptedAt: now,
          createdAt: now,
        },
        update: {
          role,
          invitedBy: user.id,
          acceptedAt: now,
        },
      })
    )
  );

  await recordWorkspaceAudit({
    organizationId,
    actorId: user.id,
    recipientId: access.organization.userId,
    title: "Workspace member invited",
    body: `${invitedUser.email ?? email} was added as ${role}.`,
    metadata: { memberId: invitedUser.id, role },
  });

  revalidatePath("/dashboard/settings/account");
  redirect(withQueryParam(returnTo, "workspace", "member_invited"));
}

export async function updateWorkspaceMemberRoleAction(formData: FormData) {
  const user = await requireCurrentUser();
  const organizationId = readFormValue(formData, "organizationId");
  const memberId = readFormValue(formData, "memberId");
  const role = readMemberRole(formData);
  const returnTo = await readReturnTo(formData, "/dashboard/settings/account");

  if (!organizationId || !memberId) {
    redirect(withQueryParam(returnTo, "workspace", "missing_member"));
  }

  let access: Awaited<ReturnType<typeof requireWorkspaceRole>>;
  try {
    access = await requireWorkspaceRole(user.id, organizationId, "admin");
  } catch {
    redirect(withQueryParam(returnTo, "workspace", "access_denied"));
  }

  if (memberId === access.organization.userId) {
    redirect(withQueryParam(returnTo, "workspace", "owner_role_locked"));
  }

  await prisma.bundleCollaborators.updateMany({
    where: {
      userId: memberId,
      bundle: {
        project: {
          organizationId,
          deletedAt: null,
        },
      },
    },
    data: { role },
  });

  await recordWorkspaceAudit({
    organizationId,
    actorId: user.id,
    recipientId: access.organization.userId,
    title: "Workspace member role changed",
    body: `A workspace member role was changed to ${role}.`,
    metadata: { memberId, role },
  });

  revalidatePath("/dashboard/settings/account");
  redirect(withQueryParam(returnTo, "workspace", "role_updated"));
}

export async function removeWorkspaceMemberAction(formData: FormData) {
  const user = await requireCurrentUser();
  const organizationId = readFormValue(formData, "organizationId");
  const memberId = readFormValue(formData, "memberId");
  const returnTo = await readReturnTo(formData, "/dashboard/settings/account");

  if (!organizationId || !memberId) {
    redirect(withQueryParam(returnTo, "workspace", "missing_member"));
  }

  let access: Awaited<ReturnType<typeof requireWorkspaceRole>>;
  try {
    access = await requireWorkspaceRole(user.id, organizationId, "admin");
  } catch {
    redirect(withQueryParam(returnTo, "workspace", "access_denied"));
  }

  if (memberId === access.organization.userId) {
    redirect(withQueryParam(returnTo, "workspace", "owner_remove_locked"));
  }

  await prisma.bundleCollaborators.deleteMany({
    where: {
      userId: memberId,
      bundle: {
        project: {
          organizationId,
          deletedAt: null,
        },
      },
    },
  });

  await recordWorkspaceAudit({
    organizationId,
    actorId: user.id,
    recipientId: access.organization.userId,
    title: "Workspace member removed",
    body: "A workspace member was removed from all projects.",
    metadata: { memberId },
  });

  revalidatePath("/dashboard/settings/account");
  redirect(withQueryParam(returnTo, "workspace", "member_removed"));
}

export async function transferWorkspaceOwnershipAction(formData: FormData) {
  const user = await requireCurrentUser();
  const organizationId = readFormValue(formData, "organizationId");
  const email = readFormValue(formData, "email").toLowerCase();
  const returnTo = await readReturnTo(formData, "/dashboard/settings/account");

  if (!organizationId || !email) {
    redirect(withQueryParam(returnTo, "workspace", "missing_owner"));
  }

  let access: Awaited<ReturnType<typeof requireWorkspaceRole>>;
  try {
    access = await requireWorkspaceRole(user.id, organizationId, "owner");
  } catch {
    redirect(withQueryParam(returnTo, "workspace", "owner_required"));
  }

  const nextOwner = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!nextOwner) {
    redirect(withQueryParam(returnTo, "workspace", "user_not_found"));
  }

  if (nextOwner.id === user.id) {
    redirect(withQueryParam(returnTo, "workspace", "already_owner"));
  }

  const conflictingWorkspace = await prisma.organization.findFirst({
    where: {
      userId: nextOwner.id,
      type: access.organization.type,
      deletedAt: null,
      NOT: { id: organizationId },
    },
    select: { id: true },
  });

  if (conflictingWorkspace) {
    redirect(withQueryParam(returnTo, "workspace", "owner_conflict"));
  }

  const bundleIds = await getWorkspaceBundleIds(organizationId);
  const now = new Date();

  await prisma.$transaction([
    prisma.organization.update({
      where: { id: organizationId },
      data: {
        userId: nextOwner.id,
        updatedAt: now,
      },
    }),
    ...bundleIds.map((bundleId) =>
      prisma.bundleCollaborators.upsert({
        where: {
          bundleId_userId: {
            bundleId,
            userId: user.id,
          },
        },
        create: {
          id: crypto.randomUUID(),
          bundleId,
          userId: user.id,
          role: "admin",
          invitedBy: nextOwner.id,
          acceptedAt: now,
          createdAt: now,
        },
        update: {
          role: "admin",
          acceptedAt: now,
        },
      })
    ),
  ]);

  await recordWorkspaceAudit({
    organizationId,
    actorId: user.id,
    recipientId: nextOwner.id,
    title: "Workspace ownership transferred",
    body: "You are now the workspace owner.",
    metadata: { previousOwnerId: user.id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings/account");
  redirect(withQueryParam(returnTo, "workspace", "ownership_transferred"));
}
