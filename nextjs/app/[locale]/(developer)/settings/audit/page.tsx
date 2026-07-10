import { AuditLogClient } from "@/components/dashboard/audit-log-client";
import { Separator } from "@/components/ui/separator";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getOrganizationAuditContext, listAuditLogEntries } from "@/lib/server/audit-logs";
import { prisma } from "@/lib/server/prisma";

export default async function AuditSettingsPage() {
  const currentUser = await requireCurrentUser();
  const organization = await prisma.organization.findFirst({
    where: { userId: currentUser.id },
    select: { id: true, name: true },
  });

  if (!organization) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted-foreground">
          Please create an organization on the dashboard first.
        </p>
      </div>
    );
  }

  const auditContext = await getOrganizationAuditContext(organization.id);
  const entries = auditContext
    ? await listAuditLogEntries(auditContext.bundleIds, {}, 300)
    : [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Workspace Audit Log</h3>
        <p className="text-sm text-muted-foreground">
          Persisted activity trail across projects in {organization.name}.
        </p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-6">
        <AuditLogClient
          title="Workspace Audit Log"
          description="Filter and export persisted audit events across all bundles in the current workspace."
          entries={entries}
          organizationId={organization.id}
          projectOptions={auditContext?.projectOptions.map((project) => ({
            id: project.id,
            name: project.name,
          })) || []}
          allowProjectFilter
        />
      </div>
    </div>
  );
}
