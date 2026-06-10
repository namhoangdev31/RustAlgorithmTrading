"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect, localizedHref } from "@/i18n/navigation";
import { OrganizationType } from "@/prisma/generated/enums";

import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { encryptSecret } from "@/lib/server/secret-crypto";
import {
  buildBundleDefaults,
  type SearchParamsInput,
} from "@/lib/server/admin-data";
import {
  getDefaultOrganizationName,
  getWorkspaceContext,
  setActiveOrganizationCookie,
} from "@/lib/server/workspace";
import { hasVercelApiKey, getVercelClient } from "@/lib/server/vercel";
import { buildIntegrationConfig } from "@/lib/server/platform-guardrails";
import { Octokit } from "octokit";
import { runLepoShipBuild } from "@/lib/server/lepoship-builder";


function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function readReturnTo(formData: FormData, fallback: string) {
  const value = readFormValue(formData, "returnTo");
  return localizedHref(value || fallback);
}

function readBoolean(formData: FormData, key: string) {
  return readFormValue(formData, key) === "true";
}

function readPriority(formData: FormData) {
  const value = Number(readFormValue(formData, "priority"));
  return Number.isInteger(value) ? value : 0;
}

function readAgeAsDateOfBirth(formData: FormData) {
  const age = Number(readFormValue(formData, "age"));

  if (!Number.isInteger(age) || age < 13 || age > 120) {
    return null;
  }

  return new Date(new Date().getFullYear() - age, 0, 1);
}

function trimToMax(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value;
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
          version: true,
          buildNumber: true,
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

async function requireProjectRole(
  userId: string,
  projectId: string,
  minRole: "admin" | "editor" | "viewer"
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    include: {
      organization: {
        select: {
          userId: true,
        },
      },
      bundle: {
        select: {
          id: true,
          collaborators: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!project) {
    return null;
  }

  const ownerId = project.organization.userId;
  if (userId === ownerId) {
    return project;
  }

  const collaborator = project.bundle?.collaborators[0];
  if (!collaborator) {
    return null;
  }

  const role = collaborator.role;
  if (minRole === "admin" && role !== "admin") {
    return null;
  }
  if (minRole === "editor" && role !== "admin" && role !== "editor") {
    return null;
  }

  return project;
}

async function requireBundleRole(
  userId: string,
  bundleId: string,
  minRole: "admin" | "editor" | "viewer"
) {
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

  const project = await requireProjectRole(userId, bundle.projectId, minRole);
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

export async function createOrganizationOnboardingAction(formData: FormData) {
  const user = await requireCurrentUser();
  const returnTo = await readReturnTo(formData, "/dashboard");
  const accountType = readFormValue(formData, "accountType");
  const organizationType =
    accountType === "corporate"
      ? OrganizationType.corporate
      : OrganizationType.personal;
  const organizationName = readFormValue(formData, "organizationName");
  const fullName = readFormValue(formData, "fullName");
  const phone = readFormValue(formData, "phone");
  const verificationEmail = readFormValue(formData, "verificationEmail");
  const developerRole = readFormValue(formData, "developerRole");
  const industry = readFormValue(formData, "industry");
  const profileType =
    organizationType === OrganizationType.corporate
      ? `corp:${industry || "general"}`
      : `dev:${developerRole || "developer"}`;

  if (!organizationName || !fullName || !phone) {
    redirect(returnTo);
  }

  const now = new Date();
  const organization = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        fullName,
        phone,
        email: user.email ?? (verificationEmail || null),
        dateOfBirth: readAgeAsDateOfBirth(formData),
        userType: profileType.slice(0, 50),
        updatedAt: now,
      },
    });

    return tx.organization.upsert({
      where: {
        userId_type: {
          userId: user.id,
          type: organizationType,
        },
      },
      create: {
        id: crypto.randomUUID(),
        name: organizationName,
        type: organizationType,
        userId: user.id,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        name: organizationName,
        deletedAt: null,
        updatedAt: now,
      },
    });
  });

  await setActiveOrganizationCookie(organization.id);
  revalidatePath("/dashboard");
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

  const deployToVercel = readFormValue(formData, "deployToVercel") === "on" || readFormValue(formData, "deployToVercel") === "true";
  let vercelProjectId: string | null = null;
  let vercelProjectName: string | null = null;

  if (deployToVercel) {
    const vercelConnected = await hasVercelApiKey(user.id);
    if (!vercelConnected) {
      redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=missing_vercel_key`);
    }

    let inputVercelName = readFormValue(formData, "vercelProjectName");
    if (!inputVercelName) {
      // Auto-slugify projectName
      inputVercelName = projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    if (inputVercelName.length < 1 || inputVercelName.length > 100 || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(inputVercelName)) {
      redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=invalid_vercel_name&name=${encodeURIComponent(inputVercelName)}`);
    }

    try {
      const vercel = await getVercelClient(user.id);
      const result = await vercel.projects.createProject({
        requestBody: {
          name: inputVercelName,
        },
      });
      vercelProjectId = result.id;
      vercelProjectName = result.name;
    } catch (err: any) {
      console.error("Vercel project creation failed:", err);
      const errorMsg = err?.message || "Vercel API error";
      redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=vercel_api_error&message=${encodeURIComponent(errorMsg)}`);
    }
  }

  const now = new Date();
  const bundleDefaults = buildBundleDefaults(
    projectName,
    readFormValue(formData, "bundleName")
  );

  const repoFullName = readFormValue(formData, "repoFullName");

  await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        id: crypto.randomUUID(),
        name: projectName,
        description: readFormValue(formData, "description") || null,
        organizationId,
        vercelProjectId,
        vercelProjectName,
        createdAt: now,
        updatedAt: now,
      },
    });

    const bundle = await tx.bundles.create({
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

    if (repoFullName) {
      const cookieStore = await cookies();
      const token = cookieStore.get("github_access_token")?.value;
      if (token) {
        const webhookSecret = "whsec_" + crypto.randomUUID().replace(/-/g, "");
        const encryptedToken = encryptSecret(token);
        const config = JSON.stringify({
          repoFullName,
          webhookSecret,
          githubAccessToken: encryptedToken,
          logs: [],
        });

        await tx.bundleExternalIntegrations.create({
          data: {
            id: crypto.randomUUID(),
            bundleId: bundle.id,
            integrationType: "github",
            displayName: repoFullName,
            config,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          },
        });
      }
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/[locale]/(developer)/projects", "layout");
  redirect(returnTo);
}

export async function createProjectFromGithubRepoAction(formData: FormData) {
  const user = await requireCurrentUser();
  const workspace = await getWorkspaceContext(user.id);
  const returnTo = await readReturnTo(formData, "/projects?tab=overview");
  const projectName = trimToMax(readFormValue(formData, "repoName"), 255);
  const repoDescription = trimToMax(
    readFormValue(formData, "repoDescription"),
    255
  );

  const organizationId = workspace.activeOrganization?.id;
  if (!projectName || !organizationId) {
    redirect(returnTo);
  }

  const now = new Date();
  const bundleDefaults = buildBundleDefaults(projectName, projectName);

  await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        id: crypto.randomUUID(),
        name: projectName,
        description: repoDescription || null,
        organizationId,
        createdAt: now,
        updatedAt: now,
      },
    });

    await tx.bundles.create({
      data: {
        id: crypto.randomUUID(),
        name: trimToMax(bundleDefaults.name, 255),
        slug: bundleDefaults.slug,
        shortDescription: repoDescription || null,
        category: "web",
        status: "draft",
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
  revalidatePath("/projects");
  revalidatePath("/[locale]/(developer)/projects", "layout");
  redirect(returnTo);
}

export async function connectGithubAction(formData: FormData) {
  await requireCurrentUser();
  const returnTo = await readReturnTo(formData, "/projects?tab=overview");
  const cookieStore = await cookies();
  cookieStore.delete("github_disconnected");
  redirect(`/api/github/connect?returnTo=${encodeURIComponent(returnTo)}`);
}

export async function disconnectGithubAction(formData: FormData) {
  await requireCurrentUser();
  const returnTo = await readReturnTo(formData, "/projects?tab=overview");
  const cookieStore = await cookies();
  cookieStore.delete("github_access_token");
  cookieStore.set("github_disconnected", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  revalidatePath("/projects");
  redirect(returnTo);
}

export async function saveVercelApiKeyAction(formData: FormData) {
  const user = await requireCurrentUser();
  const returnTo = await readReturnTo(formData, "/dashboard/settings");
  const apiKey = readFormValue(formData, "vercelApiKey");

  if (!apiKey) {
    redirect(returnTo);
  }

  const encrypted = encryptSecret(apiKey);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS user_secrets (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL,
      provider VARCHAR(64) NOT NULL,
      encrypted_value TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, provider)
    )
  `);

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO user_secrets (id, user_id, provider, encrypted_value, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    ON CONFLICT (user_id, provider)
    DO UPDATE SET encrypted_value = EXCLUDED.encrypted_value, updated_at = NOW()
    `,
    crypto.randomUUID(),
    user.id,
    "vercel",
    encrypted
  );

  revalidatePath("/dashboard/settings");
  redirect(returnTo);
}

export async function deleteVercelApiKeyAction(formData: FormData) {
  const user = await requireCurrentUser();
  const returnTo = await readReturnTo(formData, "/dashboard/settings");

  await prisma.$executeRawUnsafe(
    "DELETE FROM user_secrets WHERE user_id = $1 AND provider = $2",
    user.id,
    "vercel"
  );

  revalidatePath("/dashboard/settings");
  redirect(returnTo);
}

export async function testVercelApiKeyAction(formData: FormData) {
  const user = await requireCurrentUser();
  const returnTo = await readReturnTo(formData, "/dashboard/settings");
  const buildStatusUrl = (status: "ok" | "invalid_key" | "missing_key" | "test_failed") =>
    `${returnTo}${returnTo.includes("?") ? "&" : "?"}vercel=${status}`;

  const rows = await prisma.$queryRawUnsafe<Array<{ encrypted_value: string }>>(
    "SELECT encrypted_value FROM user_secrets WHERE user_id = $1 AND provider = $2 LIMIT 1",
    user.id,
    "vercel"
  );

  if (!rows.length) {
    redirect(buildStatusUrl("missing_key"));
  }

  let status: "ok" | "invalid_key" | "test_failed" = "ok";

  try {
    const vercel = await getVercelClient(user.id);
    await vercel.user.getAuthUser();
  } catch (error: any) {
    const message = String(error?.message ?? "").toLowerCase();
    status =
      message.includes("401") ||
      message.includes("403") ||
      message.includes("unauthorized") ||
      message.includes("forbidden")
        ? "invalid_key"
        : "test_failed";
  }

  redirect(buildStatusUrl(status));
}

export async function updateProjectBundleAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = await readReturnTo(formData, "/dashboard");
  const project = await requireProjectRole(user.id, projectId, "editor");
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
  revalidatePath("/projects");
  revalidatePath("/[locale]/(developer)/projects", "layout");
  redirect(returnTo);
}

export async function deleteProjectAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = await readReturnTo(formData, "/dashboard");
  const project = await requireProjectRole(user.id, projectId, "admin");

  if (project) {
    await prisma.project.delete({
      where: { id: project.id },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/[locale]/(developer)/projects", "layout");
  redirect(returnTo);
}

export async function createReviewTaskAction(formData: FormData) {
  const user = await requireCurrentUser();
  const bundleId = readFormValue(formData, "bundleId");
  const returnTo = await readReturnTo(formData, "/dashboard/projects");
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

  revalidatePath("/projects");
  redirect(returnTo);
}

export async function updateReviewTaskAction(formData: FormData) {
  const user = await requireCurrentUser();
  const taskId = readFormValue(formData, "taskId");
  const returnTo = await readReturnTo(formData, "/projects");
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

  revalidatePath("/projects");
  redirect(returnTo);
}

export async function deleteReviewTaskAction(formData: FormData) {
  const user = await requireCurrentUser();
  const taskId = readFormValue(formData, "taskId");
  const returnTo = await readReturnTo(formData, "/dashboard/projects");
  const task = await prisma.bundleReviewQueue.findUnique({
    where: { id: taskId },
    select: { id: true, bundleId: true },
  });

  if (task && (await requireOwnedBundle(user.id, task.bundleId))) {
    await prisma.bundleReviewQueue.delete({
      where: { id: task.id },
    });
  }

  revalidatePath("/dashboard/projects");
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

  const integration = buildIntegrationConfig(integrationType, {
    endpoint: readFormValue(formData, "endpoint"),
    notes: readFormValue(formData, "notes"),
  });
  const now = new Date();
  await prisma.bundleExternalIntegrations.upsert({
    where: {
      bundleId_integrationType: {
        bundleId: bundle.id,
        integrationType: integration.integrationType,
      },
    },
    create: {
      id: crypto.randomUUID(),
      bundleId: bundle.id,
      integrationType: integration.integrationType,
      displayName: readFormValue(formData, "displayName") || integration.integrationType,
      config: JSON.stringify(integration.config),
      isActive: true,
      lastSyncAt: now,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      displayName: readFormValue(formData, "displayName") || integration.integrationType,
      config: JSON.stringify(integration.config),
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
  const bundle = await requireBundleRole(user.id, bundleId, "admin");
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

  if (collaborator && (await requireBundleRole(user.id, collaborator.bundleId, "admin"))) {
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

  if (collaborator && (await requireBundleRole(user.id, collaborator.bundleId, "admin"))) {
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

export async function deleteOrganizationAction(formData: FormData) {
  const user = await requireCurrentUser();
  const organizationId = readFormValue(formData, "organizationId");
  const returnTo = await readReturnTo(formData, "/dashboard/settings/account");

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, userId: true, type: true },
  });

  if (!organization || organization.userId !== user.id) {
    redirect(returnTo);
  }

  // Count active organizations for this user
  const activeOrgsCount = await prisma.organization.count({
    where: {
      userId: user.id,
      deletedAt: null,
    },
  });

  if (activeOrgsCount <= 1) {
    redirect(`${returnTo}?error=cannot_delete_last_workspace`);
  }

  // Soft delete the organization and all its projects
  await prisma.$transaction([
    prisma.organization.update({
      where: { id: organizationId },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.project.updateMany({
      where: { organizationId },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    }),
  ]);

  // If the deleted organization is the one stored in the cookie, switch active organization
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get("active_organization_id")?.value;
  if (activeOrgId === organizationId) {
    const remainingOrg = await prisma.organization.findFirst({
      where: {
        userId: user.id,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (remainingOrg) {
      await setActiveOrganizationCookie(remainingOrg.id);
    } else {
      cookieStore.delete("active_organization_id");
    }
  }

  revalidatePath("/dashboard");
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

export async function linkProjectRepositoryAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const repoFullName = readFormValue(formData, "repoFullName");
  const returnTo = await readReturnTo(formData, "/projects");

  if (!projectId || !repoFullName) {
    redirect(returnTo);
  }

  const project = await requireOwnedProject(user.id, projectId);
  if (!project || !project.bundle) {
    redirect(returnTo);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("github_access_token")?.value;
  if (!token) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=github_not_connected`);
  }

  const webhookSecret = "whsec_" + crypto.randomUUID().replace(/-/g, "");
  const encryptedToken = encryptSecret(token);

  const config = JSON.stringify({
    repoFullName,
    webhookSecret,
    githubAccessToken: encryptedToken,
    logs: [],
  });

  const now = new Date();

  await prisma.bundleExternalIntegrations.upsert({
    where: {
      bundleId_integrationType: {
        bundleId: project.bundle.id,
        integrationType: "github",
      },
    },
    update: {
      displayName: repoFullName,
      config,
      isActive: true,
      updatedAt: now,
    },
    create: {
      id: crypto.randomUUID(),
      bundleId: project.bundle.id,
      integrationType: "github",
      displayName: repoFullName,
      config,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect(returnTo);
}

export async function unlinkProjectRepositoryAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = await readReturnTo(formData, "/projects");

  if (!projectId) {
    redirect(returnTo);
  }

  const project = await requireOwnedProject(user.id, projectId);
  if (!project || !project.bundle) {
    redirect(returnTo);
  }

  await prisma.bundleExternalIntegrations.deleteMany({
    where: {
      bundleId: project.bundle.id,
      integrationType: "github",
    },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect(returnTo);
}

export async function deployTemplateAction(formData: FormData) {
  const user = await requireCurrentUser();
  const workspace = await getWorkspaceContext(user.id);
  const organizationId = workspace.activeOrganization?.id;
  const returnTo = await readReturnTo(formData, "/projects");

  const templateName = readFormValue(formData, "templateName"); // nextjs, remix, vite
  const repoName = readFormValue(formData, "repoName");
  const vercelProjectName = readFormValue(formData, "vercelProjectName") || repoName;

  if (!organizationId || !templateName || !repoName) {
    redirect(returnTo);
  }

  // 1. Get tokens
  const cookieStore = await cookies();
  const githubToken = cookieStore.get("github_access_token")?.value;
  if (!githubToken) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=github_not_connected`);
  }

  let vercel;
  try {
    vercel = await getVercelClient(user.id);
  } catch (err: any) {
    console.error("Vercel token missing:", err);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=vercel_not_connected`);
  }

  try {
    // 2. Initialize Octokit
    const octokit = new Octokit({ auth: githubToken });
    const { data: ghUser } = await octokit.rest.users.getAuthenticated();
    const username = ghUser.login;
    const repoFullName = `${username}/${repoName}`;

    // 3. Create Github Repository
    await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      private: false,
      auto_init: false,
    });

    // 4. Generate Starter Template Files
    const files: Record<string, string> = {};
    if (templateName === "nextjs") {
      files["package.json"] = JSON.stringify({
        name: repoName,
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start"
        },
        dependencies: {
          "next": "14.2.3",
          "react": "18.3.1",
          "react-dom": "18.3.1",
          "tailwindcss": "^3.4.1"
        }
      }, null, 2);

      files["app/layout.tsx"] = `import "./globals.css";
export const metadata = {
  title: "Supabaze Next.js Starter",
  description: "Next.js template deploy",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}`;

      files["app/page.tsx"] = `export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 font-sans">
      <div className="max-w-md w-full border border-slate-800 bg-slate-900/40 backdrop-blur-md p-8 rounded-lg shadow-xl text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Supabaze Starter</h1>
        <p className="text-slate-400 text-sm mb-6">
          Your Next.js project has been deployed successfully with Vercel Edge Config connection.
        </p>
      </div>
    </div>
  );
}`;

      files["app/globals.css"] = `@tailwind base;
@tailwind components;
@tailwind utilities;`;

      files["tsconfig.json"] = JSON.stringify({
        compilerOptions: {
          target: "es5",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
          paths: { "@/*": ["./*"] }
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"]
      }, null, 2);
    } else if (templateName === "remix") {
      files["package.json"] = JSON.stringify({
        name: repoName,
        private: true,
        sideEffects: false,
        type: "module",
        scripts: {
          build: "remix vite:build",
          dev: "remix vite:dev",
          start: "remix-serve ./build/server/index.js"
        },
        dependencies: {
          "@remix-run/node": "^2.9.2",
          "@remix-run/react": "^2.9.2",
          "@remix-run/serve": "^2.9.2",
          "isbot": "^4.1.0",
          "react": "^18.2.0",
          "react-dom": "^18.2.0"
        },
        devDependencies: {
          "@remix-run/dev": "^2.9.2",
          "vite": "^5.1.0"
        }
      }, null, 2);

      files["app/root.tsx"] = `import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#0f172a", color: "#f8fafc", margin: 0, padding: 0 }}>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}`;

      files["app/routes/_index.tsx"] = `export default function Index() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem", textAlign: "center" }}>
      <h1>Supabaze Remix Starter</h1>
      <p>Deployed from one-click deploy.</p>
    </div>
  );
}`;

      files["vite.config.ts"] = `import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [remix()],
});`;
    } else {
      // vite React SPA
      files["package.json"] = JSON.stringify({
        name: repoName,
        private: true,
        version: "0.0.0",
        type: "module",
        scripts: {
          dev: "vite",
          build: "tsc && vite build",
          preview: "vite preview"
        },
        dependencies: {
          "react": "^18.2.0",
          "react-dom": "^18.2.0"
        },
        devDependencies: {
          "@types/react": "^18.2.56",
          "@types/react-dom": "^18.2.19",
          "@vitejs/plugin-react": "^4.2.1",
          "typescript": "^5.2.2",
          "vite": "^5.1.4"
        }
      }, null, 2);

      files["index.html"] = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Supabaze Vite Starter</title>
    <style>body { background: #0f172a; color: #f8fafc; margin: 0; font-family: sans-serif; }</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

      files["src/main.tsx"] = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;

      files["src/App.tsx"] = `import React from 'react'
export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <h1>Supabaze Vite + React</h1>
      <p>Deployed from one-click deploy.</p>
    </div>
  )
}`;

      files["vite.config.ts"] = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
})`;

      files["tsconfig.json"] = JSON.stringify({
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["DOM", "DOM.Iterable", "ES2020"],
          module: "ESNext",
          skipLibCheck: true,
          moduleResolution: "bundler",
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx",
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true
        },
        include: ["src"]
      }, null, 2);
    }

    // 5. Commit Files to GitHub
    for (const [filePath, content] of Object.entries(files)) {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: username,
        repo: repoName,
        path: filePath,
        message: `Add ${filePath} (Template Starter)`,
        content: Buffer.from(content).toString("base64"),
        branch: "main",
      });
    }

    // 6. Create Vercel Project and link Github Repo
    const vercelResult = await vercel.projects.createProject({
      requestBody: {
        name: vercelProjectName,
        framework: templateName === "nextjs" ? "nextjs" : templateName === "remix" ? "remix" : undefined,
        gitRepository: {
          type: "github",
          repo: repoFullName,
        },
      },
    });

    // 7. Save to local DB Project & Bundle & Integration
    const now = new Date();
    const bundleDefaults = buildBundleDefaults(repoName, repoName);
    const projectId = crypto.randomUUID();
    const bundleId = crypto.randomUUID();

    await prisma.$transaction(async (tx) => {
      await tx.project.create({
        data: {
          id: projectId,
          name: repoName,
          description: `Created from ${templateName} template starter.`,
          organizationId,
          vercelProjectId: vercelResult.id,
          vercelProjectName: vercelResult.name,
          createdAt: now,
          updatedAt: now,
        },
      });

      await tx.bundles.create({
        data: {
          id: bundleId,
          name: trimToMax(bundleDefaults.name, 255),
          slug: bundleDefaults.slug,
          shortDescription: `Created from ${templateName} template starter.`,
          category: "web",
          status: "published",
          storagePath: bundleDefaults.storagePath,
          bucket: bundleDefaults.bucket,
          projectId,
          developerId: user.id,
          developerName: user.fullName ?? user.email,
          developerEmail: user.email,
          createdAt: now,
          updatedAt: now,
        },
      });

      const webhookSecret = "whsec_" + crypto.randomUUID().replace(/-/g, "");
      const encryptedToken = encryptSecret(githubToken);
      const config = JSON.stringify({
        repoFullName,
        webhookSecret,
        githubAccessToken: encryptedToken,
        logs: [],
      });

      await tx.bundleExternalIntegrations.create({
        data: {
          id: crypto.randomUUID(),
          bundleId,
          integrationType: "github",
          displayName: repoFullName,
          config,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      });
    });

  } catch (error: any) {
    console.error("Template deploy action failed:", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=deploy_failed&message=${encodeURIComponent(error?.message || "")}`);
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect(returnTo);
}

export async function saveLepoShipConfigAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = await readReturnTo(formData, `/lepoship/${projectId}`);

  const project = await requireOwnedProject(user.id, projectId);
  if (!project || !project.bundle) {
    redirect(returnTo);
  }

  const platform = readFormValue(formData, "platform"); // expo, flutter
  const gitRepoUrl = readFormValue(formData, "gitRepoUrl");
  const gitBranch = readFormValue(formData, "gitBranch") || "main";
  
  // Expo specific
  const expoSdkVersion = readFormValue(formData, "expoSdkVersion") || "";
  const expoBuildProfile = readFormValue(formData, "expoBuildProfile") || "";
  
  // Flutter specific
  const flutterTargetPlatform = readFormValue(formData, "flutterTargetPlatform") || "web";
  const flutterFlavor = readFormValue(formData, "flutterFlavor") || "";
  const flutterBuildMode = readFormValue(formData, "flutterBuildMode") || "release";

  const config = JSON.stringify({
    platform,
    gitRepoUrl,
    gitBranch,
    expoSdkVersion,
    expoBuildProfile,
    flutterTargetPlatform,
    flutterFlavor,
    flutterBuildMode,
    updatedAt: new Date().toISOString(),
  });

  const now = new Date();

  await prisma.bundleExternalIntegrations.upsert({
    where: {
      bundleId_integrationType: {
        bundleId: project.bundle.id,
        integrationType: "lepoship",
      },
    },
    update: {
      displayName: `${platform.toUpperCase()} Config`,
      config,
      isActive: true,
      updatedAt: now,
    },
    create: {
      id: crypto.randomUUID(),
      bundleId: project.bundle.id,
      integrationType: "lepoship",
      displayName: `${platform.toUpperCase()} Config`,
      config,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  revalidatePath(`/lepoship/${projectId}`);
  redirect(returnTo);
}

export async function triggerMobileBuildAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = await readReturnTo(formData, `/lepoship/${projectId}`);

  const project = await requireOwnedProject(user.id, projectId);
  if (!project || !project.bundle) {
    redirect(returnTo);
  }

  const currentBundle = project.bundle;
  const newBuildNumber = currentBundle.buildNumber + 1;
  
  // Auto bump patch version
  let newVersion = "1.0.0";
  const parts = currentBundle.version.split(".");
  if (parts.length === 3) {
    const patch = parseInt(parts[2], 10);
    if (!isNaN(patch)) {
      parts[2] = String(patch + 1);
      newVersion = parts.join(".");
    }
  } else {
    newVersion = currentBundle.version;
  }

  // Load configuration
  const integration = await prisma.bundleExternalIntegrations.findFirst({
    where: {
      bundleId: currentBundle.id,
      integrationType: "lepoship",
      isActive: true,
    },
    select: { config: true },
  });

  let configData = { platform: "expo", gitRepoUrl: "", gitBranch: "main" };
  if (integration?.config) {
    try {
      configData = JSON.parse(integration.config);
    } catch (_) {}
  }

  const trackId = crypto.randomUUID();
  const now = new Date();

  // Update bundle details & Create release track
  await prisma.$transaction(async (tx) => {
    // Increment buildNumber immediately to reserve it
    await tx.bundles.update({
      where: { id: currentBundle.id },
      data: {
        buildNumber: newBuildNumber,
        updatedAt: now,
      },
    });

    // Create a release track entry in "building" state
    await tx.bundleReleaseTracks.create({
      data: {
        id: trackId,
        bundleId: currentBundle.id,
        track: "production",
        version: newVersion,
        buildNumber: newBuildNumber,
        storagePath: "", // Will be filled upon completion
        releaseNotes: `Automated build #${newBuildNumber} triggered by ${user.fullName || user.email}`,
        status: "building",
        createdAt: now,
      },
    });
  });

  // Trigger background build compilation process
  await runLepoShipBuild(
    projectId,
    currentBundle.id,
    newBuildNumber,
    newVersion,
    configData,
    trackId
  );

  revalidatePath(`/lepoship/${projectId}`);
  redirect(returnTo);
}
