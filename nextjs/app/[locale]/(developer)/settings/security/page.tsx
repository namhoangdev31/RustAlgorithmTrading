import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";

export default async function SecuritySettingsPage() {
  const user = await requireCurrentUser();
  const organization = await prisma.organization.findFirst({
    where: {
      OR: [
        { userId: user.id },
        { members: { some: { userId: user.id, inviteStatus: "accepted" } } },
      ],
    },
    select: {
      providerConnections: { select: { id: true, provider: true, status: true, updatedAt: true }, orderBy: { provider: "asc" } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Security" description="Review workspace credentials, directory access, and scoped automation tokens." />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Provider credentials</CardTitle>
          <CardDescription>Secret values remain encrypted and are never returned to this page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {!organization?.providerConnections.length ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No workspace provider credentials configured.</div>
          ) : organization.providerConnections.map((connection) => (
            <div key={connection.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="font-mono text-sm">{connection.provider}</p>
                <p className="text-xs text-muted-foreground">Updated {connection.updatedAt.toLocaleString()}</p>
              </div>
              <StatusBadge status={connection.status === "active" ? "active" : "inactive"} label={connection.status} />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Personal access tokens</CardTitle><CardDescription>Create and revoke scoped API credentials.</CardDescription></CardHeader>
          <CardContent><Button asChild variant="outline"><Link href="/settings/tokens">Manage tokens</Link></Button></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Directory provisioning</CardTitle><CardDescription>Rotate SCIM credentials and review received mappings.</CardDescription></CardHeader>
          <CardContent><Button asChild variant="outline"><Link href="/settings/directory">Manage SCIM</Link></Button></CardContent>
        </Card>
      </div>
    </div>
  );
}
