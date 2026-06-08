import { Link } from "@/i18n/navigation";
import { localizedHref } from "@/i18n/navigation";
import {
  Edit3,
  ExternalLink,
  Folder,
  GitBranch,
  Globe,
  Laptop,
  Layers,
  MoreHorizontal,
  Plus,
  Search,
  Server,
  Smartphone,
  Trash2,
  ChevronDown,
  SlidersHorizontal,
  LayoutGrid,
  List,
  AlertCircle,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  createProjectWithBundleAction,
  connectGithubAction,
  deleteProjectAction,
  updateProjectBundleAction,
  switchOrganizationAction,
} from "@/app/actions/admin";
import { GithubIcon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getProjectBundleData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getGithubOverviewData } from "@/lib/server/github";
import { IntegrationsTab } from "@/components/projects/tabs/IntegrationsTab";
import { ActivityTab } from "@/components/projects/tabs/ActivityTab";
import { DomainsTab } from "@/components/projects/tabs/DomainsTab";
import { SettingsTab } from "@/components/projects/tabs/SettingsTab";
import { OverviewTab } from "@/components/projects/tabs/OverviewTab";
import { ProjectForm } from "@/components/projects/dialogs/ProjectForm";
import { DeleteConfirmationDialog } from "@/components/projects/dialogs/DeleteConfirmationDialog";
import { hasVercelApiKey, getVercelClient } from "@/lib/server/vercel";
import { DeploymentsTab } from "@/components/projects/tabs/DeploymentsTab";

function buildQueryString(search: any, newParams: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  if (search.q) params.set("q", search.q);
  if (search.dialog) params.set("dialog", search.dialog);
  if (search.id) params.set("id", search.id);
  if (search.layout) params.set("layout", search.layout);
  if (search.tab) params.set("tab", search.tab);

  Object.entries(newParams).forEach(([key, value]) => {
    if (value === undefined) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  });

  const str = params.toString();
  return str ? `?${str}` : "";
}

type ProjectsPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string;
    dialog?: string;
    id?: string;
    layout?: string;
    tab?: string;
    error?: string;
    message?: string;
    name?: string;
    repoName?: string;
    repoDescription?: string;
    github?: string;
  }>;
};
type ProjectsData = Awaited<ReturnType<typeof getProjectBundleData>>;

// Keep avatar accents restrained to the Supabaze monochrome + emerald system.
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

  // Auto-connect to GitHub if disconnected and not explicitly opted out
  if (!github.connected) {
    const cookieStore = await cookies();
    const isDisconnected = cookieStore.get("github_disconnected")?.value === "true";
    const hasGithubParam = search.github; // If github param is present (e.g. error, callback redirect)

    if (!isDisconnected && !hasGithubParam) {
      redirect(`/api/github/connect?returnTo=${encodeURIComponent("/projects?tab=overview")}`);
    }
  }

  // Check Vercel key connection
  const vercelConnected = await hasVercelApiKey(user.id);
  let vercelAliases: any[] = [];
  let vercelDeployments: any[] = [];
  let vercelConnectionError = false;

  if (vercelConnected) {
    try {
      const vercel = await getVercelClient(user.id);
      const [
        aliasesRes,
        deploymentsRes,
      ] = await Promise.allSettled([
        vercel.aliases.listAliases({ limit: 50 }),
        vercel.deployments.getDeployments({ limit: 50 }),
      ]);

      if (aliasesRes.status === "fulfilled") {
        vercelAliases = aliasesRes.value.aliases || [];
      } else {
        console.error("Error fetching Vercel aliases:", aliasesRes.reason);
        vercelConnectionError = true;
      }

      if (deploymentsRes.status === "fulfilled") {
        vercelDeployments = (deploymentsRes.value as any).deployments || [];
      } else {
        console.error("Error fetching Vercel deployments:", deploymentsRes.reason);
        vercelConnectionError = true;
      }
    } catch (err) {
      console.error("Error fetching Vercel data:", err);
      vercelConnectionError = true;
    }
  }

  const t = await getTranslations("Dashboard");
  const tProjects = await getTranslations("Projects");
  const projectsPath = "/projects";
  const localizedProjectsPath = await localizedHref("/projects");

  const selectedProject = data.projects.find((project) => project.id === search.id);
  const layout = search.layout || "grid";
  const activeTab = search.tab || "overview";

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 w-full">
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

      {/* Vercel-like Header Section */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 select-none text-xs font-medium text-ink-mute">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2.5 py-1.5 -ml-2 rounded-md hover:bg-canvas-soft text-ink transition-all cursor-pointer select-none border border-transparent hover:border-hairline">
                <div className="size-5 rounded-md bg-canvas-night flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm select-none">
                  {(data.workspace.activeOrganization?.name || "O").charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-ink text-sm">
                  {data.workspace.activeOrganization?.name || "Organization"}
                </span>
                <ChevronDown className="size-3.5 text-ink-mute" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px] bg-canvas border border-hairline rounded-lg shadow-dark p-1.5 z-50">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-ink-mute uppercase tracking-wider">
                Switch Organization
              </div>
              {data.workspace.organizations.map((org) => (
                <DropdownMenuItem key={org.id} asChild className="cursor-pointer text-xs font-medium py-2 rounded-md focus:bg-canvas-soft">
                  <form action={switchOrganizationAction} className="w-full">
                    <input type="hidden" name="organizationId" value={org.id} />
                    <input type="hidden" name="returnTo" value={projectsPath} />
                    <button type="submit" className="w-full text-left flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="size-4.5 rounded bg-canvas-soft border border-hairline flex items-center justify-center text-[8px] font-bold text-ink-secondary">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-ink-secondary font-medium">{org.name}</span>
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
          <span className="text-ink font-semibold text-sm">Projects</span>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-6 border-b border-hairline pb-px overflow-x-auto select-none no-scrollbar">
        <Link href={`/projects${buildQueryString(search, { tab: "overview" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "overview" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
          Overview
        </Link>
        <Link href={`/projects${buildQueryString(search, { tab: "deployments" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "deployments" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
          Deployments
        </Link>
        <Link href={`/projects${buildQueryString(search, { tab: "domains" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "domains" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
          Domains
        </Link>
        <Link href={`/projects${buildQueryString(search, { tab: "integrations" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "integrations" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
          Integrations
        </Link>
        <Link href={`/projects${buildQueryString(search, { tab: "activity" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "activity" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
          Activity
        </Link>
        <Link href={`/projects${buildQueryString(search, { tab: "settings" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "settings" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
          Settings
        </Link>
      </div>

      {/* Filter and Search Section */}
      <div className="w-full flex flex-row items-center gap-3">
        <form action={localizedProjectsPath} className="flex flex-1 flex-row items-center gap-3" method="get">
          {search.layout && <input type="hidden" name="layout" value={search.layout} />}
          {search.tab && <input type="hidden" name="tab" value={search.tab} />}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-mute-2" />
            <Input
              className="pl-10 h-10 w-full bg-canvas border border-hairline focus-visible:ring-1 focus-visible:ring-primary transition-all text-sm rounded-sm placeholder:text-ink-faint shadow-light"
              name="q"
              placeholder={t("projects_and_bundles.search_placeholder") || "Search projects..."}
              defaultValue={search.q || ""}
            />
          </div>

          <Button
            className="h-10 text-xs font-semibold px-4 rounded-sm border border-hairline-strong hover:bg-canvas-soft transition-colors shadow-light bg-canvas text-ink-secondary"
            type="submit"
            variant="outline"
          >
            <SlidersHorizontal className="size-3.5 mr-2 text-ink-mute-2" />
            {t("projects_and_bundles.filter") || "Filter"}
          </Button>
        </form>

        <div className="flex items-center gap-2">
          {search.q ? (
            <Button className="h-10 text-xs font-semibold text-ink-mute hover:text-ink" asChild variant="ghost">
              <Link href={projectsPath}>{tProjects("reset") || "Reset"}</Link>
            </Button>
          ) : null}

          {github.connected ? (
            <Button asChild className="h-10 text-xs font-semibold bg-primary hover:bg-primary-deep text-primary-foreground transition-colors rounded-sm px-3.5 shadow-light cursor-pointer shrink-0">
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
              <input type="hidden" name="returnTo" value={`${projectsPath}?tab=overview`} />
              <Button type="submit" className="h-10 text-xs font-semibold bg-primary hover:bg-primary-deep text-primary-foreground transition-colors rounded-sm px-5 shadow-light cursor-pointer shrink-0">
                <GithubIcon className="size-4 mr-1.5" />
                Connect GitHub
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Projects Grid/List Section */}
      <div className="w-full">
        {activeTab === "integrations" ? (
          <IntegrationsTab data={data} />
        ) : activeTab === "activity" ? (
          <ActivityTab data={data} locale={locale} />
        ) : activeTab === "domains" ? (
          <DomainsTab
            vercelConnected={vercelConnected}
            vercelAliases={vercelAliases}
            vercelConnectionError={vercelConnectionError}
            locale={locale}
          />
        ) : activeTab === "deployments" ? (
          <DeploymentsTab
            vercelConnected={vercelConnected}
            vercelDeployments={vercelDeployments}
            vercelConnectionError={vercelConnectionError}
            locale={locale}
          />
        ) : activeTab === "settings" ? (
          <SettingsTab github={github} />
        ) : (
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
        )}
      </div>

      {/* Modal Dialog Form for Create */}
      {search.dialog === "create" ? (
        <div className="fixed inset-x-0 -top-20 h-[calc(100vh+5rem)] z-[120] flex items-center justify-center p-4 bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <Link href={projectsPath} className="absolute inset-0 cursor-default" aria-hidden="true" />
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
        <div className="fixed inset-x-0 -top-20 h-[calc(100vh+5rem)] z-[120] flex items-center justify-center p-4 bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <Link href={projectsPath} className="absolute inset-0 cursor-default" aria-hidden="true" />
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
        <div className="fixed inset-x-0 -top-20 h-[calc(100vh+5rem)] z-[120] flex items-center justify-center p-4 bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <Link href={projectsPath} className="absolute inset-0 cursor-default" aria-hidden="true" />
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
