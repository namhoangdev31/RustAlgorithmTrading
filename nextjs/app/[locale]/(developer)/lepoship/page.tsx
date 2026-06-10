import { getTranslations } from "next-intl/server";
import { FolderGit, Wrench, Plus, Cpu, GitBranch, RefreshCw, AlertCircle, Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getLepoShipData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { ProjectForm } from "@/components/projects/dialogs/ProjectForm";
import { getGithubOverviewData } from "@/lib/server/github";
import { triggerMobileBuildAction, createProjectWithBundleAction } from "@/app/actions/admin";

type LeposhipPageProps = {
  searchParams: Promise<{
    dialog?: string;
    repoName?: string;
    repoDescription?: string;
  }>;
};

export default async function LeposhipPage({ searchParams }: LeposhipPageProps) {
  const search = await searchParams;
  const user = await requireCurrentUser();
  const data = await getLepoShipData(user.id);
  const githubOverview = await getGithubOverviewData();
  const t = await getTranslations("Dashboard.shell.nav");
  const commonT = await getTranslations("Dashboard.projects_and_bundles");
  const vercelConnected = false;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 select-none">
            <FolderGit className="size-6 text-emerald-400" />
            {t("lepoship_projects")}
          </h2>
          <p className="text-sm text-ink-mute">
            Manage, build, and distribute mobile webview bundles for Expo and Flutter apps.
          </p>
        </div>
        <div>
          {data.workspace.activeOrganization && (
            <Button asChild className="bg-primary hover:bg-primary-deep text-primary-foreground font-semibold px-4 rounded-sm shadow-light text-xs flex items-center gap-1.5 cursor-pointer">
              <Link href="/lepoship?dialog=create">
                <Plus className="size-4" />
                New Mobile Project
              </Link>
            </Button>
          )}
        </div>
      </div>

      {data.projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 px-4 text-center border border-dashed border-hairline-strong rounded-xl bg-canvas-soft/50">
          <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Cpu className="size-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-ink mb-2">No Mobile Projects</h3>
          <p className="text-sm text-ink-mute max-w-md mb-6">
            Create a mobile-typed project to upload, configure, and compile Expo or Flutter bundles with over-the-air (OTA) updates.
          </p>
          {data.workspace.activeOrganization && (
            <Button asChild className="bg-primary hover:bg-primary-deep text-primary-foreground font-semibold px-6 rounded-sm shadow-light text-xs flex items-center gap-1.5 cursor-pointer">
              <Link href="/lepoship?dialog=create">
                <Plus className="size-4" />
                Create Mobile Project
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.projects.map((project) => {
            const bundle = project.bundle;
            const hasLepoShipConfig = bundle?.externalIntegrations && bundle.externalIntegrations.length > 0;
            let configData: any = {};
            if (hasLepoShipConfig) {
              try {
                configData = JSON.parse(bundle.externalIntegrations[0].config);
              } catch (e) {}
            }

            const platform = configData.platform || null;
            const branch = configData.gitBranch || "main";

            return (
              <Card key={project.id} className="bg-canvas border border-hairline hover:border-emerald-500/40 transition-all duration-300 rounded-lg flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-bold text-ink truncate max-w-[200px]">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-ink-mute truncate max-w-[220px]">
                        {project.description || "No description"}
                      </CardDescription>
                    </div>
                    {platform ? (
                      <Badge variant="outline" className="capitalize text-[10px] font-semibold bg-emerald-500/5 text-emerald-400 border-emerald-500/20 px-2 py-0.5">
                        {platform}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-semibold bg-amber-500/5 text-amber-400 border-amber-500/20 px-2 py-0.5 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        Unconfigured
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pb-4 pt-1 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-hairline pb-2">
                    <span className="text-ink-mute">Version</span>
                    <span className="font-mono text-ink font-semibold">{bundle?.version || "1.0.0"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-b border-hairline pb-2">
                    <span className="text-ink-mute">Build Number</span>
                    <span className="font-mono text-ink font-semibold">#{bundle?.buildNumber || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-mute">Git Branch</span>
                    <span className="font-mono text-ink font-semibold flex items-center gap-1">
                      <GitBranch className="size-3 text-emerald-400" />
                      {branch}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 pb-4 border-t border-hairline bg-canvas-soft/10 flex items-center justify-between gap-2">
                  <Button asChild size="sm" variant="ghost" className="text-xs text-ink-mute hover:text-ink cursor-pointer px-3">
                    <Link href={`/lepoship/${project.id}`}>
                      Configure
                    </Link>
                  </Button>
                  
                  {hasLepoShipConfig ? (
                    <form action={triggerMobileBuildAction}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="returnTo" value="/lepoship" />
                      <Button type="submit" size="sm" className="bg-primary hover:bg-primary-deep text-primary-foreground font-semibold px-3 h-8 text-xs flex items-center gap-1 rounded-sm cursor-pointer shadow-light">
                        <Play className="size-3 fill-current" />
                        Build
                      </Button>
                    </form>
                  ) : (
                    <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 h-8 text-xs flex items-center gap-1 rounded-sm cursor-pointer shadow-light">
                      <Link href={`/lepoship/${project.id}`}>
                        Configure Settings
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {search.dialog === "create" ? (
        <div className="fixed inset-x-0 -top-20 h-[calc(100vh+5rem)] z-[120] flex items-center justify-center p-4 bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <Link href="/lepoship" className="absolute inset-0 cursor-default" aria-hidden="true" />
          <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 relative z-10">
            <ProjectForm
              action={createProjectWithBundleAction}
              organizations={data.workspace.organizations}
              activeOrganizationId={data.workspace.activeOrganization?.id}
              returnTo="/lepoship"
              title="Create Mobile Project"
              vercelConnected={vercelConnected}
              initialName={search.repoName}
              initialDescription={search.repoDescription}
              github={githubOverview}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
