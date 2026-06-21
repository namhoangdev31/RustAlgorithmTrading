"use server";

import crypto from "crypto";

import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import {
  getOrganizationAuditContext,
  getProjectAuditContext,
  listAuditLogEntries,
  type AuditLogFilters,
  type AuditTimeRange,
} from "@/lib/server/audit-logs";
import { prisma } from "@/lib/server/prisma";

type ExportAuditLogsInput = {
  format: "csv" | "json";
  organizationId?: string;
  projectId?: string;
  action?: string;
  actorUserId?: string;
  timeRange?: AuditTimeRange;
};

function buildCsv(rows: Awaited<ReturnType<typeof listAuditLogEntries>>) {
  const headers = "id,action,actorName,actorType,projectName,fieldName,oldValue,createdAt\n";
  const dataRows = rows
    .map((row) =>
      [
        row.id,
        row.action,
        row.actorName,
        row.actorType,
        row.projectName,
        row.fieldName || "",
        row.oldValue || "",
        row.createdAt,
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  return headers + dataRows;
}

export async function exportAuditLogsAction(input: ExportAuditLogsInput) {
  const user = await requireCurrentUser();
  const filters: AuditLogFilters = {
    action: input.action || "all",
    actorUserId: input.actorUserId || "all",
    timeRange: input.timeRange || "all",
  };

  let scopeLabel = "audit";
  let bundleIds: string[] = [];

  if (input.projectId) {
    await requireProjectRole(user.id, input.projectId, "viewer");
    const context = await getProjectAuditContext(input.projectId);
    if (!context) {
      throw new Error("Project audit context is unavailable.");
    }

    bundleIds = context.bundleIds;
    scopeLabel = `project-${input.projectId}`;
  } else if (input.organizationId) {
    const organization = await prisma.organization.findFirst({
      where: {
        id: input.organizationId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!organization) {
      throw new Error("Organization audit export requires workspace ownership.");
    }

    const context = await getOrganizationAuditContext(input.organizationId);
    if (!context) {
      throw new Error("Organization audit context is unavailable.");
    }

    bundleIds = context.bundleIds;
    scopeLabel = `workspace-${input.organizationId}`;
  } else {
    throw new Error("Either organizationId or projectId is required.");
  }

  const rows = await listAuditLogEntries(bundleIds, filters, 500);
  const fileContent = input.format === "json" ? JSON.stringify(rows, null, 2) : buildCsv(rows);
  const signature = crypto.createHash("sha256").update(fileContent).digest("hex");

  return {
    fileContent,
    signature,
    fileName: `${scopeLabel}-audit-${Date.now()}.${input.format}`,
  };
}
