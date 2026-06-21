import { AuditLogClient } from "@/components/dashboard/audit-log-client";
import { getProjectAuditContext, listAuditLogEntries } from "@/lib/server/audit-logs";

import type { ProjectTabData } from "./types";

export async function ActivityTab({ data }: { data: ProjectTabData; locale: string }) {
  const projectIds = data.projects.map((project) => project.id).filter(Boolean) as string[];
  const contexts = await Promise.all(projectIds.map((projectId) => getProjectAuditContext(projectId)));
  const bundleIds = contexts.flatMap((context) => context?.bundleIds || []);
  const entries = await listAuditLogEntries(bundleIds, {}, 250);
  const projectOptions = data.projects.map((project) => ({
    id: project.id,
    name: project.name,
  }));

  return (
    <AuditLogClient
      title="Project Audit Log"
      description="Persisted bundle audit events for this project surface. Synthetic timeline fallbacks are intentionally disabled."
      entries={entries}
      organizationId={data.workspace?.id}
      projectId={projectIds.length === 1 ? projectIds[0] : undefined}
      projectOptions={projectOptions}
      allowProjectFilter={projectOptions.length > 1}
    />
  );
}
