import { Link, localizedHref } from "@/i18n/navigation";
import { Globe, Laptop, Layers, Search, Server, Smartphone, ChevronDown, SlidersHorizontal, AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createProjectWithBundleAction, connectGithubAction, deleteProjectAction, updateProjectBundleAction, switchOrganizationAction } from "@/app/actions/admin";
import { GithubIcon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getProjectBundleData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getTranslations } from "next-intl/server";
import { getGithubOverviewData } from "@/lib/server/github";
import { OverviewTab } from "@/components/projects/tabs/OverviewTab";
import { ProjectForm } from "@/components/projects/dialogs/ProjectForm";
import { DeleteConfirmationDialog } from "@/components/projects/dialogs/DeleteConfirmationDialog";
import { hasVercelApiKey } from "@/lib/server/vercel";

type ProjectsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    dialog?: string;
    id?: string;
    layout?: string;
    error?: string;
    message?: string;
    name?: string;
    repoName?: string;
    repoDescription?: string;
    github?: string;
  }>;
};

function getProjectAvatarStyles(name: string) {
  const colors = [
    "from-primary/20 to-primary/5 text-ink border-primary/25",
    "from-canvas-soft to-canvas text-ink-secondary border-hairline",
    "from-hairline-cool to-canvas-soft text-ink border-hairline-strong",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default async function ProjectsPage({ params, searchParams }: ProjectsPageProps) {
  const { locale } = await params;
  const search = await searchParams;
  const user = await requireCurrentUser();
  const data = await getProjectBundleData(user.id, search);
  const github = await getGithubOverviewData();
  const vercelConnected = await hasVercelApiKey(user.id);

  const t = await getTranslations("Dashboard");
  const tProjects = await getTranslations("Projects");
  const projectsPath = "/projects";
  const localizedProjectsPath = await localizedHref("/projects");

  const selectedProject = data.projects.find((project) => project.id === search.id);
  const layout = search.layout || "grid";
  const hasProjects = data.projects.length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-350 w-full">
      {search.error && (
        <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive rounded-lg animate-in slide-in-from-top-2 duration-300">
          <AlertCircle className="size-4" />
          <AlertTitle className="font-bold text-xs uppercase tracking-wider">Error Creating Project</AlertTitle>
          <AlertDescription className="text-xs font-semibold mt-1">
            {search.error === "missing_vercel_key" && "Vercel deployment is enabled, but your Vercel API key is not configured. Please connect your Vercel account under Settings > Integrations."}
            {search.error === "invalid_vercel_name" && `The Vercel project name "${search.name || ""}" is invalid. It must match Vercel subdomain requirements (only lowercase, numbers, and hyphens; start/end with alpha-numeric).`}
            {search.error === "vercel_api_error" && `Vercel API Error: ${search.message || "An unknown error occurred during Vercel project creation."}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Organization selector and title */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 select-none text-xs font-medium text-muted-foreground">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2.5 py-1.5 -ml-2 rounded-md hover:bg-secondary/80 text-foreground transition-all cursor-pointer border border-transparent select-none">
                <div className="size-5 rounded bg-canvas-night flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm">
                  {(data.workspace.activeOrganization?.name || "O").charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-sm">
                  {data.workspace.activeOrganization?.name || "Organization"}
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px]">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Switch Organization
              </div>
              {data.workspace.organizations.map((org) => (
                <DropdownMenuItem key={org.id} asChild className="cursor-pointer text-xs">
                  <form action={switchOrganizationAction} className="w-full">
                    <input type="hidden" name="organizationId" value={org.id} />
                    <input type="hidden" name="returnTo" value={projectsPath} />
                    <button type="submit" className="w-full text-left flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="size-4.5 rounded bg-secondary border border-hairline flex items-center justify-center text-[8px] font-bold">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{org.name}</span>
                      </div>
                      {org.id === data.workspace.activeOrganization?.id && (
                        <span className="size-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  </form>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-hairline-strong font-normal">/</span>
          <span className="text-foreground font-semibold text-sm">Projects</span>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="w-full flex flex-row items-center gap-3">
        <form action={localizedProjectsPath} className="flex flex-1 flex-row items-center gap-3" method="get">
          {search.layout && <input type="hidden" name="layout" value={search.layout} />}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9 w-full bg-card border border-hairline focus-visible:ring-1 focus-visible:ring-primary text-xs rounded-md placeholder:text-muted-foreground"
              name="q"
              placeholder="Search projects..."
              defaultValue={search.q || ""}
            />
          </div>

          <Button
            className="h-9 text-xs font-semibold px-3 rounded-md border border-hairline bg-card hover:bg-secondary"
            type="submit"
            variant="outline"
          >
            <SlidersHorizontal className="size-3.5 mr-2 text-muted-foreground" />
            Filter
          </Button>
        </form>

        <div className="flex items-center gap-2">
          {search.q ? (
            <Button className="h-9 text-xs text-muted-foreground hover:text-foreground" asChild variant="ghost">
              <Link href={projectsPath}>{tProjects("reset") || "Reset"}</Link>
            </Button>
          ) : null}

          {github.connected ? (
            <Button asChild className="h-9 text-xs font-semibold bg-card border border-hairline hover:bg-secondary text-foreground rounded-md px-3 shrink-0">
              <a
                href={github.profileUrl || `https://github.com/${github.login}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Avatar className="size-5">
                  <AvatarImage src={github.avatarUrl} alt={github.login || "GitHub"} />
                  <AvatarFallback>{(github.login || "GH").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span>@{github.login || "github-user"}</span>
              </a>
            </Button>
          ) : (
            <form action={connectGithubAction}>
              <input type="hidden" name="returnTo" value={projectsPath} />
              <Button type="submit" className="h-9 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-4 shrink-0">
                <GithubIcon className="size-4 mr-1.5" />
                Connect GitHub
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Projects Grid/List View using OverviewTab */}
      <div className="w-full">
        <OverviewTab
          data={data}
          github={github}
          layout={layout}
          locale={locale}
          user={user}
          t={t}
          getProjectAvatarStyles={getProjectAvatarStyles}
          mapBundleStatus={mapBundleStatus}
          getCategoryIcon={getCategoryIcon}
        />
      </div>

      {/* Modal Dialog Form for Create */}
      {search.dialog === "create" ? (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in flex justify-center items-start p-4 md:py-12">
          <Link href={projectsPath} className="fixed inset-0 cursor-default" aria-hidden="true" />
          <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 relative z-10">
            <ProjectForm
              action={createProjectWithBundleAction}
              organizations={data.workspace.organizations}
              activeOrganizationId={data.workspace.activeOrganization?.id}
              returnTo={projectsPath}
              title={t("form.create_title") || "Create Project"}
              vercelConnected={vercelConnected}
              initialName={search.repoName}
              initialDescription={search.repoDescription}
            />
          </div>
        </div>
      ) : null}

      {/* Modal Dialog Form for Edit */}
      {search.dialog === "edit" && selectedProject ? (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in flex justify-center items-start p-4 md:py-12">
          <Link href={projectsPath} className="fixed inset-0 cursor-default" aria-hidden="true" />
          <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 relative z-10">
            <ProjectForm
              action={updateProjectBundleAction}
              project={selectedProject}
              returnTo={projectsPath}
              title={t("form.edit_title") || "Edit Project"}
              vercelConnected={vercelConnected}
            />
          </div>
        </div>
      ) : null}

      {/* Modal Dialog for Delete Confirmation */}
      {search.dialog === "delete" && selectedProject ? (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in flex justify-center items-start p-4 md:py-12">
          <Link href={projectsPath} className="fixed inset-0 cursor-default" aria-hidden="true" />
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200 relative z-10">
            <DeleteConfirmationDialog
              project={selectedProject}
              action={deleteProjectAction}
              returnTo={projectsPath}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function mapBundleStatus(status: string | null | undefined, t: any) {
  switch (status) {
    case "published":
      return {
        label: t("form.status_options.published") || "Published",
        dotClass: "bg-primary shadow-[0_0_8px_rgba(62,207,142,0.35)]",
      };
    case "review":
      return {
        label: t("form.status_options.review") || "Review",
        dotClass: "bg-accent-yellow animate-pulse shadow-[0_0_8px_rgba(255,219,19,0.35)]",
      };
    case "archived":
      return {
        label: t("form.status_options.archived") || "Archived",
        dotClass: "bg-destructive shadow-[0_0_8px_rgba(255,34,1,0.35)]",
      };
    case "draft":
    default:
      return {
        label: t("form.status_options.draft") || "Draft",
        dotClass: "bg-ink-faint",
      };
  }
}

function getCategoryIcon(category: string | null | undefined) {
  switch (category) {
    case "web":
      return Globe;
    case "mobile":
      return Smartphone;
    case "desktop":
      return Laptop;
    case "api":
      return Server;
    default:
      return Layers;
  }
}
