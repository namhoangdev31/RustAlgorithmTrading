import { Activity, FolderKanban, Globe, Rocket } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { ActivityFeed } from "@/components/portal/ActivityFeed";
import { EmptyState } from "@/components/portal/EmptyState";
import { MetricCard } from "@/components/portal/MetricCard";
import { PageHeader } from "@/components/portal/PageHeader";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";

export default async function WorkspaceOverviewPage() {
  const user = await requireCurrentUser();
  const workspace = await prisma.organization.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { userId: user.id },
        { members: { some: { userId: user.id, inviteStatus: "accepted" } } },
      ],
    },
    select: { id: true, name: true },
  });

  if (!workspace) {
    return (
      <EmptyState
        title="Create your first workspace"
        description="A workspace owns projects, provider connections, members, and audit events."
        actionLabel="Open workspace settings"
        actionHref="/settings/workspace"
      />
    );
  }

  const [projects, deployments, domainCount, auditEvents] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: workspace.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        activeNativeDeployment: { select: { status: true, version: true } },
        _count: { select: { nativeDomainConfigs: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.nativeDeployment.findMany({
      where: { project: { organizationId: workspace.id, deletedAt: null } },
      select: {
        id: true,
        projectId: true,
        status: true,
        version: true,
        target: true,
        sourceCommit: true,
        createdAt: true,
        project: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.nativeDomainConfig.count({ where: { project: { organizationId: workspace.id, deletedAt: null } } }),
    prisma.workspaceAuditEvent.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { timestamp: "desc" },
      take: 8,
    }),
  ]);

  const healthyProjects = projects.filter((project) => project.activeNativeDeployment?.status === "active").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={workspace.name}
        description="Workspace health, recent delivery activity, and operational changes."
        actions={<Button asChild><Link href="/projects?dialog=create">Create project</Link></Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Projects" value={projects.length} icon={FolderKanban} />
        <MetricCard title="Healthy projects" value={healthyProjects} icon={Activity} />
        <MetricCard title="Recent deployments" value={deployments.length} icon={Rocket} />
        <MetricCard title="Domains" value={domainCount} icon={Globe} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div><CardTitle className="text-base">Projects</CardTitle><CardDescription>Current production evidence for this workspace.</CardDescription></div>
                <Button asChild size="sm" variant="outline"><Link href="/projects">View all</Link></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {projects.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No projects yet.</div>
              ) : projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}/overview`} className="flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                  <div className="min-w-0"><p className="truncate font-medium">{project.name}</p><p className="truncate text-xs text-muted-foreground">{project.description || `${project._count.nativeDomainConfigs} configured domains`}</p></div>
                  <StatusBadge
                    status={project.activeNativeDeployment?.status === "active" ? "active" : "inactive"}
                    label={project.activeNativeDeployment ? `${project.activeNativeDeployment.version} · ${project.activeNativeDeployment.status}` : "No production deployment"}
                  />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Recent deployments</CardTitle><CardDescription>Native deployment records ordered by creation time.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {deployments.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No deployments recorded.</div>
              ) : deployments.map((deployment) => (
                <Link key={deployment.id} href={`/projects/${deployment.projectId}/deployments`} className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                  <div><p className="text-sm font-medium">{deployment.project.name} · {deployment.version}</p><p className="font-mono text-xs text-muted-foreground">{deployment.sourceCommit?.slice(0, 12) || "No commit"} · {deployment.target}</p></div>
                  <StatusBadge status={deployment.status === "active" ? "active" : deployment.status === "failed" ? "error" : "pending"} label={deployment.status} />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent activity</CardTitle><CardDescription>Persisted workspace audit events.</CardDescription></CardHeader>
          <CardContent>
            <ActivityFeed items={auditEvents.map((event) => ({
              id: event.id,
              actorName: event.actorEmail,
              action: event.action,
              resourceName: `${event.resourceType}${event.resourceId ? ` ${event.resourceId}` : ""}`,
              timestamp: event.timestamp,
              metadata: event.metadata && typeof event.metadata === "object" ? event.metadata as Record<string, unknown> : undefined,
            }))} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
