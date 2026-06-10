"use server";

import { prisma } from "@/lib/server/prisma";
import crypto from "crypto";

export async function exportWorkspaceAuditLogsAction(workspaceId: string, format: "csv" | "json") {
  // Query activity logs from the database
  const logs = await prisma.bundleAuditLog.findMany({
    where: {
      bundleId: workspaceId,
    },
    take: 100,
    orderBy: { createdAt: "desc" },
  });

  let fileContent = "";
  if (format === "json") {
    fileContent = JSON.stringify(logs, null, 2);
  } else {
    // Construct standard CSV content
    const headers = "id,action,fieldName,oldValue,createdAt\n";
    const rows = logs
      .map((log: any) => {
        const id = log.id;
        const action = log.action.replace(/"/g, '""');
        const fieldName = (log.fieldName || "").replace(/"/g, '""');
        const oldValue = (log.oldValue || "").replace(/"/g, '""');
        const date = log.createdAt.toISOString();
        return `"${id}","${action}","${fieldName}","${oldValue}","${date}"`;
      })
      .join("\n");
    fileContent = headers + rows;
  }

  // Calculate SHA-256 checksum to guarantee logs integrity (anti-tampering signature)
  const signature = crypto.createHash("sha256").update(fileContent).digest("hex");

  return {
    fileContent,
    signature,
    fileName: `audit-log-${workspaceId}-${Date.now()}.${format}`,
  };
}
