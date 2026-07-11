import { ArtifactMirrorManager } from "@/components/dashboard/artifact-mirror-manager";
import { EmptyState } from "@/components/portal/EmptyState";
import { PageHeader } from "@/components/portal/PageHeader";
import { ResourceTable } from "@/components/portal/ResourceTable";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProjectDeliverySurface({ project, data }: { project: { id: string; name: string }; data: any }) {
  const returnTo = `/projects/${project.id}/delivery`;
  return (
    <div className="space-y-6">
      <PageHeader title="Delivery" description={`Artifacts, mirrors, and release evidence for ${project.name}.`} />
      <ArtifactMirrorManager projectId={project.id} deployments={data.deployments || []} mirrors={data.artifactMirrors || []} returnTo={returnTo} />
      <Card>
        <CardHeader><CardTitle className="text-base">Native deployments</CardTitle><CardDescription>A release is shown only after it has a persisted deployment record.</CardDescription></CardHeader>
        <CardContent>
          {data.deployments?.length ? <ResourceTable data={data.deployments} columns={[
            { header: "Version", accessor: (deployment: any) => deployment.version },
            { header: "Target", accessor: (deployment: any) => deployment.target },
            { header: "Status", accessor: (deployment: any) => <StatusBadge status={deployment.status === "active" ? "active" : deployment.status === "failed" ? "error" : "pending"} label={deployment.status} /> },
            { header: "Created", accessor: (deployment: any) => new Date(deployment.createdAt).toLocaleString() },
          ]} /> : <EmptyState title="No deployment artifacts" description="Trigger a native deployment before publishing artifacts or an OTA release." />}
        </CardContent>
      </Card>
    </div>
  );
}
