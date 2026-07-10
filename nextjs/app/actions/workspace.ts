"use server";

import { revalidatePath } from "next/cache";
import { localizedHref, redirect } from "@/i18n/navigation";

import { requireCurrentUser } from "@/lib/server/current-user";
import { requireWorkspaceRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";
import { streamWorkspaceAudit } from "@/lib/server/audit-stream";

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
  const actor = await prisma.user.findUnique({
    where: { id: input.actorId },
    select: { email: true },
  });
  const auditEvent = await prisma.workspaceAuditEvent.create({
    data: {
      workspaceId: input.organizationId,
      actorId: input.actorId,
      actorEmail: actor?.email ?? "unknown",
      action: input.metadata?.action ?? "workspace.update",
      resourceType: input.metadata?.resourceType ?? "workspace",
      resourceId: input.organizationId,
      metadata: {
        ...input.metadata,
        title: input.title,
        body: input.body,
        recipientId: input.recipientId,
      },
      timestamp: now,
    },
  });

  streamWorkspaceAudit(input.organizationId, {
    id: auditEvent.id,
    title: input.title,
    body: input.body,
    actorId: input.actorId,
    recipientId: input.recipientId,
    metadata: input.metadata,
    createdAt: now,
  }).catch((err) => {
    console.error("[AuditStream] Workspace background stream failed:", err);
  });
}

export async function inviteWorkspaceMemberAction(formData: FormData) {
  const user = await requireCurrentUser();
  const organizationId = readFormValue(formData, "organizationId");
  const email = readFormValue(formData, "email").toLowerCase();
  const role = readMemberRole(formData);
  const returnTo = await readReturnTo(formData, "/settings/workspace");

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
  const projectIds = await prisma.project.findMany({
    where: { organizationId, deletedAt: null },
    select: { id: true },
  });
  const now = new Date();

  await prisma.$transaction([
    prisma.organizationMembership.upsert({
      where: { organizationId_userId: { organizationId, userId: invitedUser.id } },
      create: {
        organizationId,
        userId: invitedUser.id,
        role,
        inviteStatus: "accepted",
        invitedById: user.id,
      },
      update: { role, inviteStatus: "accepted", invitedById: user.id },
    }),
    ...projectIds.map(({ id: projectId }) =>
      prisma.projectMembership.upsert({
        where: { projectId_userId: { projectId, userId: invitedUser.id } },
        create: { projectId, userId: invitedUser.id, role, inviteStatus: "accepted" },
        update: { role, inviteStatus: "accepted" },
      })
    ),
    ...bundleIds.map((bundleId) =>
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
    ),
  ]);

  await recordWorkspaceAudit({
    organizationId,
    actorId: user.id,
    recipientId: access.organization.userId,
    title: "Workspace member invited",
    body: `${invitedUser.email ?? email} was added as ${role}.`,
    metadata: { memberId: invitedUser.id, role, action: "member.invite", resourceType: "member" },
  });

  revalidatePath("/settings/workspace");
  redirect(withQueryParam(returnTo, "workspace", "member_invited"));
}

export async function updateWorkspaceMemberRoleAction(formData: FormData) {
  const user = await requireCurrentUser();
  const organizationId = readFormValue(formData, "organizationId");
  const memberId = readFormValue(formData, "memberId");
  const role = readMemberRole(formData);
  const returnTo = await readReturnTo(formData, "/settings/workspace");

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

  await prisma.$transaction([
    prisma.organizationMembership.updateMany({
      where: { organizationId, userId: memberId },
      data: { role, inviteStatus: "accepted" },
    }),
    prisma.projectMembership.updateMany({
      where: { userId: memberId, project: { organizationId, deletedAt: null } },
      data: { role, inviteStatus: "accepted" },
    }),
    prisma.bundleCollaborators.updateMany({
      where: {
        userId: memberId,
        bundle: { project: { organizationId, deletedAt: null } },
      },
      data: { role },
    }),
  ]);

  await recordWorkspaceAudit({
    organizationId,
    actorId: user.id,
    recipientId: access.organization.userId,
    title: "Workspace member role changed",
    body: `A workspace member role was changed to ${role}.`,
    metadata: { memberId, role, action: "member.role.update", resourceType: "member" },
  });

  revalidatePath("/settings/workspace");
  redirect(withQueryParam(returnTo, "workspace", "role_updated"));
}

export async function removeWorkspaceMemberAction(formData: FormData) {
  const user = await requireCurrentUser();
  const organizationId = readFormValue(formData, "organizationId");
  const memberId = readFormValue(formData, "memberId");
  const returnTo = await readReturnTo(formData, "/settings/workspace");

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

  await prisma.$transaction([
    prisma.projectMembership.deleteMany({
      where: { userId: memberId, project: { organizationId, deletedAt: null } },
    }),
    prisma.organizationMembership.deleteMany({ where: { organizationId, userId: memberId } }),
    prisma.bundleCollaborators.deleteMany({
      where: {
        userId: memberId,
        bundle: { project: { organizationId, deletedAt: null } },
      },
    }),
  ]);

  await recordWorkspaceAudit({
    organizationId,
    actorId: user.id,
    recipientId: access.organization.userId,
    title: "Workspace member removed",
    body: "A workspace member was removed from all projects.",
    metadata: { memberId, action: "member.remove", resourceType: "member" },
  });

  revalidatePath("/settings/workspace");
  redirect(withQueryParam(returnTo, "workspace", "member_removed"));
}

export async function transferWorkspaceOwnershipAction(formData: FormData) {
  const user = await requireCurrentUser();
  const organizationId = readFormValue(formData, "organizationId");
  const email = readFormValue(formData, "email").toLowerCase();
  const returnTo = await readReturnTo(formData, "/settings/workspace");

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
    prisma.organizationMembership.upsert({
      where: { organizationId_userId: { organizationId, userId: nextOwner.id } },
      create: {
        organizationId,
        userId: nextOwner.id,
        role: "owner",
        inviteStatus: "accepted",
        invitedById: user.id,
      },
      update: { role: "owner", inviteStatus: "accepted" },
    }),
    prisma.organizationMembership.upsert({
      where: { organizationId_userId: { organizationId, userId: user.id } },
      create: {
        organizationId,
        userId: user.id,
        role: "admin",
        inviteStatus: "accepted",
        invitedById: nextOwner.id,
      },
      update: { role: "admin", inviteStatus: "accepted", invitedById: nextOwner.id },
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
    metadata: {
      previousOwnerId: user.id,
      action: "workspace.owner.transfer",
      resourceType: "workspace",
    },
  });

  revalidatePath("/overview");
  revalidatePath("/settings/workspace");
  redirect(withQueryParam(returnTo, "workspace", "ownership_transferred"));
}
