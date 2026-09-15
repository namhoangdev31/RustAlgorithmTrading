import * as React from "react";
import { getProjectBundleData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { redirect } from "next/navigation";
import { hasVercelApiKey, getVercelClient } from "@/lib/server/vercel";
import { getGithubOverviewData } from "@/lib/server/github";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GithubIcon } from "@/components/ui/icon";
import { VercelEnvVarsCard } from "@/components/projects/VercelEnvVarsCard";
import {
  deleteProjectAction,
  updateProjectBundleAction,
  linkProjectRepositoryAction,
  unlinkProjectRepositoryAction,
} from "@/app/actions/admin";
import { Link } from "@/i18n/navigation";
import { Edit3, Trash2 } from "lucide-react";
import { DangerZone } from "@/components/portal/DangerZone";
import { SettingsSection } from "@/components/portal/SettingsSection";

type PageProps = {
  params: Promise<{ locale: string; projectId: string }>;
  searchParams: Promise<{ dialog?: string }>;
};

export default async function ProjectSettingsPage({ params, searchParams }: PageProps) {
  const { locale, projectId } = await params;
  const search = await searchParams;
  const user = await requireCurrentUser();
  const data = await getProjectBundleData(user.id, {});
  const project = data.projects.find((p) => p.id === projectId);

  if (!project) {
    redirect(`/${locale}/projects`);
  }

  const vercelConnected = await hasVercelApiKey(user.id);
  const github = await getGithubOverviewData();
  const returnTo = `/${locale}/projects/${projectId}/settings`;

  let vercelProjectEnvVars: any[] = [];
  if (vercelConnected && project.vercelProjectId) {
    try {
      const vercel = await getVercelClient(user.id);
      const envVarsRes = await vercel.projects.filterProjectEnvs({ idOrName: project.vercelProjectId });
      vercelProjectEnvVars = (envVarsRes as any).envs || [];
    } catch (err) {
      console.error("Error loading Vercel Env Vars in settings page:", err);
    }
  }

  const githubIntegration = project.bundle?.externalIntegrations?.find(
    (i: any) => i.integrationType === "github"
  );

  let webhookLogs: any[] = [];
  let webhookUrl = "";
  if (githubIntegration?.config) {
    try {
      const configData = JSON.parse(githubIntegration.config);
      webhookLogs = configData.logs || [];
      webhookUrl = `https://api.github.com/webhooks/github`;
    } catch {}
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in duration-200">
      <div className="xl:col-span-2 space-y-6">
        {/* Rename Project */}
        <SettingsSection
          title="Rename Project"
          description="Change the display name of this project in the workspace."
        >
          <form action={updateProjectBundleAction} className="space-y-4">
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <div className="space-y-2">
              <label className="text-xs font-semibold">Project Name</label>
              <Input
                name="name"
                defaultValue={project.name}
                required
                className="h-9 text-xs"
              />
            </div>
            <Button type="submit" size="sm">
              Save Changes
            </Button>
          </form>
        </SettingsSection>

        {/* Vercel Project link details */}
        <SettingsSection
          title="Vercel Integration"
          description="Link project build and deployment pipelines with Vercel."
        >
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2.5 border-b border-hairline">
              <span className="text-muted-foreground">Vercel Status</span>
              <span className={project.vercelProjectId ? "text-green-500 font-semibold" : "text-muted-foreground"}>
                {project.vercelProjectId ? "Connected" : "Disconnected"}
              </span>
            </div>
            {project.vercelProjectId && (
              <>
                <div className="flex justify-between items-center pb-2.5 border-b border-hairline">
                  <span className="text-muted-foreground">Vercel Project ID</span>
                  <span className="font-mono text-muted-foreground">{project.vercelProjectId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Vercel Project Name</span>
                  <span className="font-mono text-muted-foreground">{project.vercelProjectName || "N/A"}</span>
                </div>
              </>
            )}
          </div>
        </SettingsSection>

        {/* GitHub Repository integration section */}
        <SettingsSection
          title="GitHub Integration"
          description="Connect GitHub repositories to enable auto-triggered deployments and commits mapping."
        >
          {githubIntegration ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-secondary/50 border border-hairline rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="font-semibold">Linked Repository</div>
                  <div className="font-mono mt-0.5 text-muted-foreground">{githubIntegration.displayName}</div>
                </div>
                <form action={unlinkProjectRepositoryAction}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Button type="submit" variant="destructive" size="sm">
                    Disconnect
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {github.connected ? (
                <form action={linkProjectRepositoryAction} className="flex gap-2">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Select name="repoFullName" required>
                    <SelectTrigger className="h-9 bg-card border-hairline flex-1 text-left text-xs">
                      <SelectValue placeholder="Select a repository" />
                    </SelectTrigger>
                    <SelectContent>
                      {github.repos.map((repo) => (
                        <SelectItem key={repo.id} value={repo.fullName} className="text-xs">
                          {repo.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="submit" size="sm">
                    Link Repository
                  </Button>
                </form>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                  <p className="text-muted-foreground">Connect your GitHub account in workspace settings first.</p>
                </div>
              )}
            </div>
          )}
        </SettingsSection>

        {project.vercelProjectId && (
          <VercelEnvVarsCard
            vercelProjectEnvVars={vercelProjectEnvVars}
            vercelProjectId={project.vercelProjectId}
            projectId={project.id}
            locale={locale}
            returnTo={returnTo}
          />
        )}

        {/* Danger Zone */}
        <form id="delete-project-form" action={deleteProjectAction}>
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="returnTo" value={`/${locale}/projects`} />
          <DangerZone
            title="Delete Project"
            description="Permanently delete the project and all related logs and analytics. This action cannot be undone."
            actionLabel="Delete Project"
            formId="delete-project-form"
          />
        </form>
      </div>
    </div>
  );
}
