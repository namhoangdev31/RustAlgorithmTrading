"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect, localizedHref } from "@/i18n/navigation";

import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import {
  buildBundleDefaults,
  type SearchParamsInput,
} from "@/lib/server/admin-data";
import {
  getDefaultOrganizationName,
  getWorkspaceContext,
  setActiveOrganizationCookie,
} from "@/lib/server/workspace";

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function readReturnTo(formData: FormData, fallback: string) {
  const value = readFormValue(formData, "returnTo");
  return value || (await localizedHref(fallback));
}

function readBoolean(formData: FormData, key: string) {
  return readFormValue(formData, key) === "true";
}

function readPriority(formData: FormData) {
  const value = Number(readFormValue(formData, "priority"));
  return Number.isInteger(value) ? value : 0;
}

async function getUserOrganizationIds(userId: string) {
  const workspace = await getWorkspaceContext(userId);
  return workspace.organizations.map((organization) => organization.id);
}

async function requireOwnedProject(userId: string, projectId: string) {
  const organizationIds = await getUserOrganizationIds(userId);

  return prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId: { in: organizationIds },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      organizationId: true,
      bundle: {
        select: {
          id: true,
        },
      },
    },
  });
}

async function requireOwnedBundle(userId: string, bundleId: string) {
  const organizationIds = await getUserOrganizationIds(userId);
  const bundle = await prisma.bundles.findUnique({
    where: { id: bundleId },
    select: {
      id: true,
      projectId: true,
    },
  });

  if (!bundle?.projectId) {
    return null;
  }

  const project = await prisma.project.findFirst({
    where: {
      id: bundle.projectId,
      organizationId: { in: organizationIds },
      deletedAt: null,
    },
    select: { id: true },
  });

  return project ? bundle : null;
}

export async function switchOrganizationAction(formData: FormData) {
  const user = await requireCurrentUser();
  const organizationId = readFormValue(formData, "organizationId");
  const returnTo = await readReturnTo(formData, "/dashboard");
  const organizationIds = await getUserOrganizationIds(user.id);

  if (organizationIds.includes(organizationId)) {
    await setActiveOrganizationCookie(organizationId);
  }

  redirect(returnTo);
}

export async function createProjectWithBundleAction(formData: FormData) {
  const user = await requireCurrentUser();
  const workspace = await getWorkspaceContext(user.id);
  const organizationId =
    readFormValue(formData, "organizationId") || workspace.activeOrganization?.id;
  const organizationIds = workspace.organizations.map((organization) => organization.id);
  const returnTo = await readReturnTo(formData, "/dashboard");
  const projectName = readFormValue(formData, "projectName");

  if (!projectName || !organizationId || !organizationIds.includes(organizationId)) {
    redirect(returnTo);
  }

  const now = new Date();
  const bundleDefaults = buildBundleDefaults(
    projectName,
    readFormValue(formData, "bundleName")
  );

  await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        id: crypto.randomUUID(),
        name: projectName,
        description: readFormValue(formData, "description") || null,
        organizationId,
        createdAt: now,
        updatedAt: now,
      },
    });

    await tx.bundles.create({
      data: {
        id: crypto.randomUUID(),
        name: bundleDefaults.name,
        slug: bundleDefaults.slug,
        shortDescription: readFormValue(formData, "shortDescription") || null,
        category: readFormValue(formData, "category") || null,
        status: readFormValue(formData, "status") || "draft",
        storagePath: bundleDefaults.storagePath,
        bucket: bundleDefaults.bucket,
        projectId: project.id,
        developerId: user.id,
        developerName: user.fullName ?? user.email,
        developerEmail: user.email,
        createdAt: now,
        updatedAt: now,
      },
    });
  });

  revalidatePath("/dashboard");
  redirect(returnTo);
}

export async function updateProjectBundleAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = await readReturnTo(formData, "/dashboard");
  const project = await requireOwnedProject(user.id, projectId);
  const projectName = readFormValue(formData, "projectName");

  if (!project || !projectName) {
    redirect(returnTo);
  }

  const now = new Date();
  const bundleDefaults = buildBundleDefaults(
    projectName,
    readFormValue(formData, "bundleName")
  );

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: project.id },
      data: {
        name: projectName,
        description: readFormValue(formData, "description") || null,
        updatedAt: now,
      },
    });

    if (project.bundle) {
      await tx.bundles.update({
        where: { id: project.bundle.id },
        data: {
          name: bundleDefaults.name,
          shortDescription: readFormValue(formData, "shortDescription") || null,
          category: readFormValue(formData, "category") || null,
          status: readFormValue(formData, "status") || "draft",
          updatedAt: now,
        },
      });
    } else {
      await tx.bundles.create({
        data: {
          id: crypto.randomUUID(),
          name: bundleDefaults.name,
          slug: bundleDefaults.slug,
          shortDescription: readFormValue(formData, "shortDescription") || null,
          category: readFormValue(formData, "category") || null,
          status: readFormValue(formData, "status") || "draft",
          storagePath: bundleDefaults.storagePath,
          bucket: bundleDefaults.bucket,
          projectId: project.id,
          developerId: user.id,
          developerName: user.fullName ?? user.email,
          developerEmail: user.email,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  });

  revalidatePath("/dashboard");
  redirect(returnTo);
}

export async function deleteProjectAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = await readReturnTo(formData, "/dashboard");
  const project = await requireOwnedProject(user.id, projectId);

  if (project) {
    await prisma.project.delete({
      where: { id: project.id },
    });
  }

  revalidatePath("/dashboard");
  redirect(returnTo);
}

export async function createReviewTaskAction(formData: FormData) {
  const user = await requireCurrentUser();
  const bundleId = readFormValue(formData, "bundleId");
  const returnTo = await readReturnTo(formData, "/dashboard/tasks");
  const bundle = await requireOwnedBundle(user.id, bundleId);

  if (!bundle) {
    redirect(returnTo);
  }

  const now = new Date();
  await prisma.bundleReviewQueue.create({
    data: {
      id: crypto.randomUUID(),
      bundleId: bundle.id,
      status: readFormValue(formData, "status") || "pending",
      priority: readPriority(formData),
      notes: readFormValue(formData, "notes") || null,
      reviewerId: readBoolean(formData, "assignToMe") ? user.id : null,
      createdAt: now,
      updatedAt: now,
    },
  });

  revalidatePath("/dashboard/tasks");
  redirect(returnTo);
}

export async function updateReviewTaskAction(formData: FormData) {
  const user = await requireCurrentUser();
  const taskId = readFormValue(formData, "taskId");
  const returnTo = await readReturnTo(formData, "/dashboard/tasks");
  const task = await prisma.bundleReviewQueue.findUnique({
    where: { id: taskId },
    select: { id: true, bundleId: true },
  });

  if (task && (await requireOwnedBundle(user.id, task.bundleId))) {
    await prisma.bundleReviewQueue.update({
      where: { id: task.id },
      data: {
        status: readFormValue(formData, "status") || "pending",
        priority: readPriority(formData),
        notes: readFormValue(formData, "notes") || null,
        reviewerId: readBoolean(formData, "assignToMe") ? user.id : null,
        reviewedAt:
          readFormValue(formData, "status") === "approved" ||
            readFormValue(formData, "status") === "rejected"
            ? new Date()
            : null,
        updatedAt: new Date(),
      },
    });
  }

  revalidatePath("/dashboard/tasks");
  redirect(returnTo);
}

export async function deleteReviewTaskAction(formData: FormData) {
  const user = await requireCurrentUser();
  const taskId = readFormValue(formData, "taskId");
  const returnTo = await readReturnTo(formData, "/dashboard/tasks");
  const task = await prisma.bundleReviewQueue.findUnique({
    where: { id: taskId },
    select: { id: true, bundleId: true },
  });

  if (task && (await requireOwnedBundle(user.id, task.bundleId))) {
    await prisma.bundleReviewQueue.delete({
      where: { id: task.id },
    });
  }

  revalidatePath("/dashboard/tasks");
  redirect(returnTo);
}

export async function upsertIntegrationAction(formData: FormData) {
  const user = await requireCurrentUser();
  const bundleId = readFormValue(formData, "bundleId");
  const returnTo = await readReturnTo(formData, "/dashboard/apps");
  const bundle = await requireOwnedBundle(user.id, bundleId);
  const integrationType = readFormValue(formData, "integrationType").toLowerCase();

  if (!bundle || !integrationType) {
    redirect(returnTo);
  }

  const now = new Date();
  await prisma.bundleExternalIntegrations.upsert({
    where: {
      bundleId_integrationType: {
        bundleId: bundle.id,
        integrationType,
      },
    },
    create: {
      id: crypto.randomUUID(),
      bundleId: bundle.id,
      integrationType,
      displayName: readFormValue(formData, "displayName") || integrationType,
      config: JSON.stringify({
        endpoint: readFormValue(formData, "endpoint"),
        notes: readFormValue(formData, "notes"),
      }),
      isActive: true,
      lastSyncAt: now,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      displayName: readFormValue(formData, "displayName") || integrationType,
      config: JSON.stringify({
        endpoint: readFormValue(formData, "endpoint"),
        notes: readFormValue(formData, "notes"),
      }),
      isActive: readFormValue(formData, "isActive") !== "false",
      lastSyncAt: now,
      updatedAt: now,
    },
  });

  revalidatePath("/dashboard/apps");
  redirect(returnTo);
}

export async function toggleIntegrationAction(formData: FormData) {
  const user = await requireCurrentUser();
  const integrationId = readFormValue(formData, "integrationId");
  const returnTo = await readReturnTo(formData, "/dashboard/apps");
  const integration = await prisma.bundleExternalIntegrations.findUnique({
    where: { id: integrationId },
    select: { id: true, bundleId: true, isActive: true },
  });

  if (integration && (await requireOwnedBundle(user.id, integration.bundleId))) {
    await prisma.bundleExternalIntegrations.update({
      where: { id: integration.id },
      data: {
        isActive: !integration.isActive,
        updatedAt: new Date(),
      },
    });
  }

  revalidatePath("/dashboard/apps");
  redirect(returnTo);
}

export async function deleteIntegrationAction(formData: FormData) {
  const user = await requireCurrentUser();
  const integrationId = readFormValue(formData, "integrationId");
  const returnTo = await readReturnTo(formData, "/dashboard/apps");
  const integration = await prisma.bundleExternalIntegrations.findUnique({
    where: { id: integrationId },
    select: { id: true, bundleId: true },
  });

  if (integration && (await requireOwnedBundle(user.id, integration.bundleId))) {
    await prisma.bundleExternalIntegrations.delete({
      where: { id: integration.id },
    });
  }

  revalidatePath("/dashboard/apps");
  redirect(returnTo);
}

export async function sendChatMessageAction(formData: FormData) {
  const user = await requireCurrentUser();
  const recipientId = readFormValue(formData, "recipientId");
  const body = readFormValue(formData, "body");
  const returnTo = await readReturnTo(formData, "/dashboard/chats");

  if (!recipientId || !body) {
    redirect(returnTo);
  }

  const recipient = await prisma.user.findFirst({
    where: {
      id: recipientId,
      deletedAt: null,
    },
    select: { id: true, fullName: true, email: true },
  });

  if (!recipient) {
    redirect(returnTo);
  }

  const now = new Date();
  await prisma.notifications.create({
    data: {
      id: crypto.randomUUID(),
      title: `Message from ${user.fullName ?? user.email ?? "Dashboard"}`,
      body,
      type: "chat_message",
      recipientId: recipient.id,
      actorId: user.id,
      metadata: JSON.stringify({
        threadKey: [user.id, recipient.id].sort().join(":"),
      }),
      createdAt: now,
      updatedAt: now,
    },
  });

  revalidatePath("/dashboard/chats");
  redirect(returnTo);
}

export async function markChatReadAction(formData: FormData) {
  const user = await requireCurrentUser();
  const notificationId = readFormValue(formData, "notificationId");
  const returnTo = await readReturnTo(formData, "/dashboard/chats");

  await prisma.notifications.updateMany({
    where: {
      id: notificationId,
      recipientId: user.id,
      type: "chat_message",
    },
    data: {
      isRead: true,
      readAt: new Date(),
      updatedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/chats");
  redirect(returnTo);
}

export async function deleteChatMessageAction(formData: FormData) {
  const user = await requireCurrentUser();
  const notificationId = readFormValue(formData, "notificationId");
  const returnTo = await readReturnTo(formData, "/dashboard/chats");

  await prisma.notifications.updateMany({
    where: {
      id: notificationId,
      type: "chat_message",
      OR: [{ recipientId: user.id }, { actorId: user.id }],
    },
    data: {
      deletedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/chats");
  redirect(returnTo);
}

export async function inviteCollaboratorAction(formData: FormData) {
  const user = await requireCurrentUser();
  const bundleId = readFormValue(formData, "bundleId");
  const email = readFormValue(formData, "email").toLowerCase();
  const role = readFormValue(formData, "role") || "editor";
  const returnTo = await readReturnTo(formData, "/dashboard/users");
  const bundle = await requireOwnedBundle(user.id, bundleId);
  const invitedUser = email
    ? await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    : null;

  if (!bundle || !invitedUser) {
    redirect(returnTo);
  }

  await prisma.bundleCollaborators.upsert({
    where: {
      bundleId_userId: {
        bundleId: bundle.id,
        userId: invitedUser.id,
      },
    },
    create: {
      id: crypto.randomUUID(),
      bundleId: bundle.id,
      userId: invitedUser.id,
      role,
      invitedBy: user.id,
      acceptedAt: new Date(),
      createdAt: new Date(),
    },
    update: {
      role,
      invitedBy: user.id,
      acceptedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/users");
  redirect(returnTo);
}

export async function updateCollaboratorRoleAction(formData: FormData) {
  const user = await requireCurrentUser();
  const collaboratorId = readFormValue(formData, "collaboratorId");
  const returnTo = await readReturnTo(formData, "/dashboard/users");
  const collaborator = await prisma.bundleCollaborators.findUnique({
    where: { id: collaboratorId },
    select: { id: true, bundleId: true },
  });

  if (collaborator && (await requireOwnedBundle(user.id, collaborator.bundleId))) {
    await prisma.bundleCollaborators.update({
      where: { id: collaborator.id },
      data: {
        role: readFormValue(formData, "role") || "viewer",
      },
    });
  }

  revalidatePath("/dashboard/users");
  redirect(returnTo);
}

export async function removeCollaboratorAction(formData: FormData) {
  const user = await requireCurrentUser();
  const collaboratorId = readFormValue(formData, "collaboratorId");
  const returnTo = await readReturnTo(formData, "/dashboard/users");
  const collaborator = await prisma.bundleCollaborators.findUnique({
    where: { id: collaboratorId },
    select: { id: true, bundleId: true },
  });

  if (collaborator && (await requireOwnedBundle(user.id, collaborator.bundleId))) {
    await prisma.bundleCollaborators.delete({
      where: { id: collaborator.id },
    });
  }

  revalidatePath("/dashboard/users");
  redirect(returnTo);
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireCurrentUser();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: readFormValue(formData, "firstName") || null,
      lastName: readFormValue(formData, "lastName") || null,
      fullName: readFormValue(formData, "fullName") || null,
      phone: readFormValue(formData, "phone") || null,
      gender: readFormValue(formData, "gender") || null,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/settings");
  redirect(await readReturnTo(formData, "/dashboard/settings"));
}

export async function updateOrganizationAction(formData: FormData) {
  const user = await requireCurrentUser();
  const organizationId = readFormValue(formData, "organizationId");
  const name = readFormValue(formData, "name");
  const returnTo = await readReturnTo(formData, "/dashboard/settings/account");
  const organizationIds = await getUserOrganizationIds(user.id);

  if (organizationIds.includes(organizationId)) {
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name:
          name ||
          getDefaultOrganizationName(
            readFormValue(formData, "type") === "corporate"
              ? "corporate"
              : "personal",
            user.fullName,
            user.email
          ),
        updatedAt: new Date(),
      },
    });
  }

  revalidatePath("/dashboard/settings/account");
  redirect(returnTo);
}

export async function updateDisplayPreferenceAction(formData: FormData) {
  await requireCurrentUser();
  const cookieStore = await cookies();
  const params: SearchParamsInput = {
    density: readFormValue(formData, "density"),
    theme: readFormValue(formData, "theme"),
  };

  cookieStore.set("dashboard_display", JSON.stringify(params), {
    httpOnly: true,
    sameSite: "lax",
    path: "/dashboard",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect(await readReturnTo(formData, "/dashboard/settings/display"));
}

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireCurrentUser();
  const notificationId = readFormValue(formData, "notificationId");
  const returnTo = await readReturnTo(formData, "/dashboard/settings/notifications");

  await prisma.notifications.updateMany({
    where: {
      id: notificationId,
      recipientId: user.id,
    },
    data: {
      isRead: true,
      readAt: new Date(),
      updatedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/settings/notifications");
  redirect(returnTo);
}
