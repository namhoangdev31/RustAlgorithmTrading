import * as React from "react";
import { getProjectBundleData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { redirect } from "next/navigation";
import { hasVercelApiKey, getVercelClient } from "@/lib/server/vercel";
import { getGithubOverviewData } from "@/lib/server/github";
import { getNativePlatformData } from "@/lib/server/native-platform/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Globe } from "lucide-react";
import { GithubIcon } from "@/components/ui/icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { getTranslations } from "next-intl/server";
import { MetricCard } from "@/components/portal/MetricCard";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { EmptyState } from "@/components/portal/EmptyState";
import { ResourceTable } from "@/components/portal/ResourceTable";

type PageProps = {
  params: Promise<{ locale: string; projectId: string }>;
  searchParams: Promise<{ page?: string; track?: string }>;
};

export default async function ProjectOverviewPage({ params, searchParams }: PageProps) {
  const { locale, projectId } = await params;
  const search = await searchParams;
  const user = await requireCurrentUser();
  const data = await getProjectBundleData(user.id, {});
  const project = data.projects.find((p) => p.id === projectId);

  if (!project) {
    redirect(`/${locale}/projects`);
  }

  const vercelConnected = await hasVercelApiKey(user.id);
  let vercelDeployments: any[] = [];
  if (vercelConnected && project.vercelProjectId) {
    try {
      const vercel = await getVercelClient(user.id);
      const deploymentsRes = await vercel.deployments.getDeployments({ projectId: project.vercelProjectId, limit: 5 });
      vercelDeployments = deploymentsRes.deployments || [];
    } catch (err) {
      console.error("Error loading overview deployments:", err);
    }
  }

  const bundle = project.bundle;
  const productionDeployment = vercelDeployments.find((d) => d.target === "production") || vercelDeployments[0];
  const nativePlatformData = await getNativePlatformData(project.id);
  const github = await getGithubOverviewData();

  // Release tracks
  const rawTracks = bundle?.releaseTracks || [];
  const tracksPageSize = 5;
  const tracksCurrentPage = Number(search.page) || 1;
  const paginatedTracks = rawTracks.slice((tracksCurrentPage - 1) * tracksPageSize, tracksCurrentPage * tracksPageSize);

  return (
    <div className="space-y-6">
      {/* Vercel production deployment status */}
      {vercelConnected && project.vercelProjectId && (
        <Card className="overflow-hidden border border-hairline bg-card py-0">
          <CardHeader className="border-b border-hairline bg-secondary/50 flex flex-row items-center justify-between gap-3 p-5">
            <div>
              <CardTitle className="text-base font-bold">Production Deployment</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                The active deployment serving web requests for this project.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {productionDeployment ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Deployment Name</p>
                    <p className="text-sm font-semibold mt-0.5">{productionDeployment.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">URL</p>
                    <a
                      href={`https://${productionDeployment.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-foreground hover:underline flex items-center gap-1 mt-0.5"
                    >
                      {productionDeployment.url}
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  </div>
                  <div className="flex gap-12">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</p>
                      <div className="mt-1">
                        <StatusBadge
                          status={productionDeployment.state === "READY" ? "success" : productionDeployment.state === "ERROR" ? "error" : "pending"}
                          label={productionDeployment.state}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Age</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {productionDeployment.created ? formatDistanceToNow(new Date(productionDeployment.created), { addSuffix: true }) : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Deployment preview link */}
                <div className="w-full h-44 rounded-lg border border-hairline bg-secondary/30 relative overflow-hidden flex flex-col shadow-inner">
                  <div className="h-7 border-b border-hairline bg-secondary flex items-center px-3 gap-1.5 shrink-0 select-none">
                    <span className="size-2 rounded-full bg-red-500/40" />
                    <span className="size-2 rounded-full bg-amber-500/40" />
                    <span className="size-2 rounded-full bg-green-500/40" />
                    <div className="flex-1 max-w-xs h-4.5 bg-card border border-hairline rounded-sm mx-auto flex items-center justify-center text-[9px] text-muted-foreground truncate px-2 font-mono">
                      {productionDeployment.url}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center bg-card p-4 text-center">
                    <Globe className="size-7 text-muted-foreground mb-2 animate-bounce" />
                    <p className="text-xs font-semibold">Production deployment active</p>
                    <a
                      href={`https://${productionDeployment.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-foreground hover:underline mt-1"
                    >
                      Open Live Site
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No deployments yet"
                description="Connect a deployment pipeline to get started."
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Bundle Status"
          value={bundle?.status || "None"}
        />
        <MetricCard
          title="Version"
          value={bundle?.version || "0.0.0"}
          trendLabel={bundle?.category ? `Category: ${bundle.category}` : undefined}
        />
        <MetricCard
          title="Active Installs"
          value={bundle?.stats?.activeInstalls ? Number(bundle.stats.activeInstalls) : 0}
          trendLabel={bundle?.stats?.downloadCount ? `Downloads: ${bundle.stats.downloadCount}` : undefined}
        />
      </div>

      {/* Release track log if any */}
      {paginatedTracks.length > 0 && (
        <Card className="border border-hairline bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold">Release History</CardTitle>
          </CardHeader>
          <CardContent>
            <ResourceTable
              data={paginatedTracks}
              columns={[
                { header: "Track", accessor: (item) => <span className="capitalize font-semibold">{item.track}</span> },
                { header: "Version", accessor: (item) => <span className="font-mono text-xs">{item.version}</span> },
                { header: "Build", accessor: (item) => <span className="font-mono text-xs text-muted-foreground">{item.buildNumber}</span> },
                { header: "Status", accessor: (item) => <StatusBadge status={item.status === "released" ? "success" : "pending"} label={item.status} /> },
                { header: "Created At", accessor: (item) => <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span> },
              ]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
