import { FederatedRoutingPanel } from "@/components/dashboard/federated-routing-panel";
import { EmptyState } from "@/components/portal/EmptyState";
import { PageHeader } from "@/components/portal/PageHeader";
import { ResourceTable } from "@/components/portal/ResourceTable";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProjectRoutingSurface({ project, data, locale }: { project: { id: string; name: string }; data: any; locale: string }) {
  const returnTo = `/projects/${project.id}/routing`;
  return (
    <div className="space-y-6">
      <PageHeader title="Routing" description={`Traffic policy, replicas, and cloud targets for ${project.name}.`} />
      <FederatedRoutingPanel projectId={project.id} policy={data.routingPolicy} replicas={data.regionReplicas || []} deployments={data.deployments || []} locale={locale} returnTo={returnTo} />
      <Card>
        <CardHeader><CardTitle className="text-base">Cloud targets</CardTitle><CardDescription>Only provider-synced or heartbeat-backed targets are listed.</CardDescription></CardHeader>
        <CardContent>
          {data.cloudTargets?.length ? <ResourceTable data={data.cloudTargets} columns={[
            { header: "Provider", accessor: (target: any) => target.provider },
            { header: "Region", accessor: (target: any) => target.region },
            { header: "Health", accessor: (target: any) => <StatusBadge status={target.healthStatus === "healthy" ? "active" : "inactive"} label={target.healthStatus} /> },
            { header: "Last heartbeat", accessor: (target: any) => target.lastHealthCheck ? new Date(target.lastHealthCheck).toLocaleString() : "Never" },
          ]} /> : <EmptyState title="No cloud targets" description="Create a target, sync a provider, or wait for a real heartbeat before routing traffic." />}
        </CardContent>
      </Card>
    </div>
  );
}
