import * as React from "react";
import { getLepoShipProjectDetail } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, GitBranch, Terminal } from "lucide-react";
import { MetricCard } from "@/components/portal/MetricCard";

type PageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function LepoShipOverviewPage({ params }: PageProps) {
  const { locale, projectId } = await params;
  const user = await requireCurrentUser();
  const data = await getLepoShipProjectDetail(user.id, projectId);

  if (!data.project) {
    redirect(`/${locale}/lepoship`);
  }

  const project = data.project;
  const bundle = project.bundle;
  const hasConfig = bundle?.externalIntegrations && bundle.externalIntegrations.length > 0;
  
  let configData: any = {};
  if (hasConfig) {
    try {
      configData = JSON.parse(bundle.externalIntegrations[0].config);
    } catch (e) {}
  }

  const platform = configData.platform || null;
  const branch = configData.gitBranch || "main";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Platform"
          value={platform ? platform.toUpperCase() : "Unconfigured"}
        />
        <MetricCard
          title="Latest Version"
          value={bundle?.version || "1.0.0"}
        />
        <MetricCard
          title="Build Number"
          value={`#${bundle?.buildNumber || 0}`}
        />
      </div>

      <Card className="bg-card border border-hairline">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <GitBranch className="size-4 text-emerald-400" />
            Git Integration
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Tracking codebase and remote compilation trigger settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-hairline">
            <span className="text-muted-foreground">Repository URL</span>
            <span className="font-mono text-muted-foreground">{configData.gitRepoUrl || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-hairline">
            <span className="text-muted-foreground">Active Branch</span>
            <span className="font-mono text-muted-foreground">{branch}</span>
          </div>
          {platform === "expo" && (
            <>
              <div className="flex justify-between items-center pb-2 border-b border-hairline">
                <span className="text-muted-foreground">Expo SDK Version</span>
                <span className="font-mono text-muted-foreground">{configData.expoSdkVersion || "51.0.0"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">EAS Build Profile</span>
                <span className="font-mono text-muted-foreground">{configData.expoBuildProfile || "production"}</span>
              </div>
            </>
          )}
          {platform === "flutter" && (
            <>
              <div className="flex justify-between items-center pb-2 border-b border-hairline">
                <span className="text-muted-foreground">Flutter Target</span>
                <span className="font-mono text-muted-foreground">{configData.flutterTargetPlatform || "web"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Build Mode</span>
                <span className="font-mono text-muted-foreground">{configData.flutterBuildMode || "release"}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
