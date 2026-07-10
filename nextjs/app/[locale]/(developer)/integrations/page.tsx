import { PageHeader } from "@/components/portal/PageHeader";
import { ProviderConnections } from "@/components/portal/ProviderConnections";
import { EmptyState } from "@/components/portal/EmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";

export default async function WorkspaceIntegrationsPage() {
  const user = await requireCurrentUser();
  const workspace = await prisma.organization.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { userId: user.id },
        { members: { some: { userId: user.id, inviteStatus: "accepted" } } },
      ],
    },
    select: {
      id: true,
      providerConnections: {
        select: { id: true, provider: true, status: true, updatedAt: true, _count: { select: { projectBindings: true } } },
        orderBy: { provider: "asc" },
      },
    },
  });

  if (!workspace) {
    return <EmptyState title="No workspace available" description="Create or join a workspace before connecting providers." actionLabel="Workspace settings" actionHref="/settings/workspace" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Integrations" description="Workspace provider credentials and their project bindings." />
      <Card>
        <CardHeader><CardTitle className="text-base">Provider connections</CardTitle><CardDescription>GitHub, Vercel, Cloudflare, and Stripe connections are shared within this workspace.</CardDescription></CardHeader>
        <CardContent>
          <ProviderConnections
            organizationId={workspace.id}
            connections={workspace.providerConnections.map((connection) => ({
              id: connection.id,
              provider: connection.provider,
              status: connection.status,
              updatedAt: connection.updatedAt.toISOString(),
              bindingCount: connection._count.projectBindings,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
