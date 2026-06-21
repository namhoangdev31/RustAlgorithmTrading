import { prisma } from "@/lib/server/prisma";

export type AuditTimeRange = "all" | "24h" | "7d" | "30d" | "90d";

export type AuditLogFilters = {
  action?: string;
  actorUserId?: string;
  timeRange?: AuditTimeRange;
};

export type AuditLogEntry = {
  id: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  createdAt: string;
  bundleId: string;
  projectId: string | null;
  projectName: string;
  bundleName: string;
  actorUserId: string | null;
  actorName: string;
  actorType: "user" | "system";
};

function readTimeRangeStart(timeRange: AuditTimeRange) {
  if (timeRange === "all") {
    return null;
  }

  const now = Date.now();
  const offsets: Record<Exclude<AuditTimeRange, "all">, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
  };

  return new Date(now - offsets[timeRange]);
}

export async function getProjectAuditContext(projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: {
      id: true,
      name: true,
      bundle: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!project?.bundle) {
    return null;
  }

  return {
    project,
    bundleIds: [project.bundle.id],
  };
}

export async function getOrganizationAuditContext(organizationId: string) {
  const organization = await prisma.organization.findFirst({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      projects: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          bundle: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!organization) {
    return null;
  }

  const projectOptions = organization.projects
    .filter((project) => project.bundle)
    .map((project) => ({
      id: project.id,
      name: project.name,
      bundleId: project.bundle!.id,
      bundleName: project.bundle!.name,
    }));

  return {
    organization,
    projectOptions,
    bundleIds: projectOptions.map((project) => project.bundleId),
  };
}

export async function listAuditLogEntries(
  bundleIds: string[],
  filters: AuditLogFilters = {},
  limit = 250
): Promise<AuditLogEntry[]> {
  if (!bundleIds.length) {
    return [];
  }

  const timeRange = filters.timeRange || "all";
  const createdAtGte = readTimeRangeStart(timeRange);
  const actorUserId =
    filters.actorUserId === "all" || !filters.actorUserId ? undefined : filters.actorUserId;

  const logs = await prisma.bundleAuditLog.findMany({
    where: {
      bundleId: { in: bundleIds },
      ...(filters.action && filters.action !== "all" ? { action: filters.action } : {}),
      ...(createdAtGte ? { createdAt: { gte: createdAtGte } } : {}),
      ...(actorUserId
        ? actorUserId === "system"
          ? { userId: null }
          : { userId: actorUserId }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
        },
      },
      bundle: {
        select: {
          id: true,
          name: true,
          projectId: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return logs.map((log) => {
    const actorName = log.user
      ? log.user.fullName ||
        `${log.user.firstName || ""} ${log.user.lastName || ""}`.trim() ||
        log.user.email ||
        "Member"
      : "System";

    return {
      id: log.id,
      action: log.action,
      fieldName: log.fieldName || null,
      oldValue: log.oldValue || null,
      createdAt: log.createdAt.toISOString(),
      bundleId: log.bundleId,
      projectId: log.bundle?.project?.id || log.bundle?.projectId || null,
      projectName: log.bundle?.project?.name || log.bundle?.name || "Unknown Project",
      bundleName: log.bundle?.name || "Unknown Bundle",
      actorUserId: log.userId || null,
      actorName,
      actorType: log.userId ? "user" : "system",
    };
  });
}
