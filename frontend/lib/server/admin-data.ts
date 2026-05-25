import { prisma } from "@/lib/server/prisma";
import { getWorkspaceContext } from "@/lib/server/workspace";

export type SearchParamsInput = {
  [key: string]: string | string[] | undefined;
};

export function readParam(params: SearchParamsInput, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function takeText(value: string, fallback = "") {
  return value.trim() || fallback;
}

function parseMetadata(value?: string | null) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value) as Record<string, string>;
  } catch {
    return {};
  }
}

async function getWorkspaceProjects(userId: string) {
  const workspace = await getWorkspaceContext(userId);

  if (!workspace.activeOrganization) {
    return {
      workspace,
      projects: [],
      bundleIds: [],
    };
  }

  const projects = await prisma.project.findMany({
    where: {
      organizationId: workspace.activeOrganization.id,
      deletedAt: null,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      organizationId: true,
      createdAt: true,
      updatedAt: true,
      bundle: {
        select: {
          id: true,
          name: true,
          slug: true,
          version: true,
          status: true,
          category: true,
          shortDescription: true,
          storagePath: true,
          bucket: true,
          updatedAt: true,
          stats: {
            select: {
              rating: true,
              ratingCount: true,
              downloadCount: true,
            },
          },
        },
      },
    },
  });

  return {
    workspace,
    projects,
    bundleIds: projects.flatMap((project) =>
      project.bundle ? [project.bundle.id] : []
    ),
  };
}

export async function getDashboardOverview(userId: string) {
  const { workspace, projects, bundleIds } = await getWorkspaceProjects(userId);

  const [
    publishedBundleCount,
    reviewTaskCount,
    integrationCount,
    unreadChatCount,
    collaboratorCount,
    orderSummary,
    recentTasks,
    recentChats,
  ] = await Promise.all([
    prisma.bundles.count({
      where: {
        id: { in: bundleIds },
        deletedAt: null,
        status: "published",
      },
    }),
    prisma.bundleReviewQueue.count({
      where: {
        bundleId: { in: bundleIds },
      },
    }),
    prisma.bundleExternalIntegrations.count({
      where: {
        bundleId: { in: bundleIds },
        isActive: true,
      },
    }),
    prisma.notifications.count({
      where: {
        recipientId: userId,
        type: "chat_message",
        isRead: false,
        deletedAt: null,
      },
    }),
    prisma.bundleCollaborators.count({
      where: {
        bundleId: { in: bundleIds },
      },
    }),
    prisma.bundleOrders.aggregate({
      where: {
        bundleId: { in: bundleIds },
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    }),
    prisma.bundleReviewQueue.findMany({
      where: {
        bundleId: { in: bundleIds },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        status: true,
        priority: true,
        notes: true,
        createdAt: true,
        bundle: {
          select: {
            name: true,
            status: true,
          },
        },
      },
    }),
    prisma.notifications.findMany({
      where: {
        recipientId: userId,
        type: "chat_message",
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        body: true,
        isRead: true,
        createdAt: true,
        actor: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const projectRows = projects.slice(0, 6);
  const totalDownloads = projects.reduce((sum, project) => {
    const downloads = project.bundle?.stats?.downloadCount;
    return sum + (downloads ? Number(downloads) : 0);
  }, 0);

  return {
    workspace,
    projects: projectRows,
    metrics: {
      projectCount: projects.length,
      bundleCount: bundleIds.length,
      publishedBundleCount,
      reviewTaskCount,
      integrationCount,
      unreadChatCount,
      collaboratorCount,
      totalRevenue: orderSummary._sum.totalAmount ?? 0,
      orderCount: orderSummary._count,
      totalDownloads,
    },
    recentTasks,
    recentChats,
  };
}

export async function getProjectBundleData(
  userId: string,
  params: SearchParamsInput
) {
  const { workspace, projects } = await getWorkspaceProjects(userId);
  const q = readParam(params, "q").toLowerCase();

  return {
    workspace,
    projects: q
      ? projects.filter((project) => {
          const bundle = project.bundle;
          return [project.name, project.description, bundle?.name, bundle?.status]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(q));
        })
      : projects,
  };
}

export async function getTasksData(userId: string, params: SearchParamsInput) {
  const { workspace, projects, bundleIds } = await getWorkspaceProjects(userId);
  const q = readParam(params, "q").toLowerCase();
  const status = readParam(params, "status");
  const priority = Number(readParam(params, "priority"));

  const tasks = await prisma.bundleReviewQueue.findMany({
    where: {
      bundleId: { in: bundleIds },
      ...(status ? { status } : {}),
      ...(Number.isInteger(priority) ? { priority } : {}),
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      status: true,
      priority: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      reviewer: {
        select: {
          fullName: true,
          email: true,
        },
      },
      bundle: {
        select: {
          id: true,
          name: true,
          status: true,
          project: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return {
    workspace,
    bundles: projects.flatMap((project) =>
      project.bundle
        ? [
            {
              id: project.bundle.id,
              name: project.bundle.name,
              projectName: project.name,
            },
          ]
        : []
    ),
    tasks: q
      ? tasks.filter((task) =>
          [task.bundle.name, task.bundle.project?.name, task.notes, task.status]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(q))
        )
      : tasks,
  };
}

export async function getAppsData(userId: string, params: SearchParamsInput) {
  const { workspace, projects, bundleIds } = await getWorkspaceProjects(userId);
  const q = readParam(params, "q").toLowerCase();
  const active = readParam(params, "active");

  const integrations = await prisma.bundleExternalIntegrations.findMany({
    where: {
      bundleId: { in: bundleIds },
      ...(active === "true" ? { isActive: true } : {}),
      ...(active === "false" ? { isActive: false } : {}),
    },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      integrationType: true,
      displayName: true,
      config: true,
      isActive: true,
      lastSyncAt: true,
      updatedAt: true,
      bundle: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    workspace,
    bundles: projects.flatMap((project) =>
      project.bundle ? [{ id: project.bundle.id, name: project.bundle.name }] : []
    ),
    integrations: q
      ? integrations.filter((integration) =>
          [
            integration.displayName,
            integration.integrationType,
            integration.bundle.name,
          ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(q))
        )
      : integrations,
  };
}

export async function getChatsData(userId: string, params: SearchParamsInput) {
  const workspace = await getWorkspaceContext(userId);
  const q = readParam(params, "q").toLowerCase();

  const [messages, users] = await Promise.all([
    prisma.notifications.findMany({
      where: {
        type: "chat_message",
        deletedAt: null,
        OR: [{ recipientId: userId }, { actorId: userId }],
      },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        title: true,
        body: true,
        isRead: true,
        metadata: true,
        createdAt: true,
        recipientId: true,
        actorId: true,
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        recipient: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        deletedAt: null,
        id: { not: userId },
      },
      orderBy: [{ fullName: "asc" }, { email: "asc" }],
      take: 25,
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    }),
  ]);

  const mappedMessages = messages.map((message) => ({
    ...message,
    metadataObject: parseMetadata(message.metadata),
  }));

  return {
    workspace,
    users,
    messages: q
      ? mappedMessages.filter((message) =>
          [
            message.title,
            message.body,
            message.actor?.fullName,
            message.actor?.email,
            message.recipient.fullName,
            message.recipient.email,
          ]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(q))
        )
      : mappedMessages,
  };
}

export async function getUsersData(userId: string, params: SearchParamsInput) {
  const { workspace, projects, bundleIds } = await getWorkspaceProjects(userId);
  const q = readParam(params, "q").toLowerCase();

  const collaborators = await prisma.bundleCollaborators.findMany({
    where: {
      bundleId: { in: bundleIds },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      role: true,
      acceptedAt: true,
      createdAt: true,
      bundle: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          provider: true,
          createdAt: true,
        },
      },
    },
  });

  return {
    workspace,
    bundles: projects.flatMap((project) =>
      project.bundle ? [{ id: project.bundle.id, name: project.bundle.name }] : []
    ),
    collaborators: q
      ? collaborators.filter((collaborator) =>
          [
            collaborator.user.fullName,
            collaborator.user.email,
            collaborator.bundle.name,
            collaborator.role,
          ]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(q))
        )
      : collaborators,
  };
}

export async function getSettingsData(userId: string) {
  const workspace = await getWorkspaceContext(userId);
  const [user, notifications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        phone: true,
        gender: true,
        userType: true,
        provider: true,
      },
    }),
    prisma.notifications.findMany({
      where: {
        recipientId: userId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        isRead: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    workspace,
    user,
    notifications,
  };
}

export function buildBundleDefaults(projectName: string, bundleName?: string) {
  const name = takeText(bundleName ?? "", projectName);
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return {
    name,
    slug: slug ? `${slug}-${crypto.randomUUID().slice(0, 8)}` : null,
    storagePath: `bundles/${crypto.randomUUID()}`,
    bucket: "bundles",
  };
}
