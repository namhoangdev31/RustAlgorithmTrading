import { Link } from "@/i18n/navigation";
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
} from "lucide-react";

import {
  createProjectWithBundleAction,
  deleteProjectAction,
  updateProjectBundleAction,
  switchOrganizationAction,
} from "@/app/actions/admin";
import { GithubIcon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { getGithubOverviewData } from "@/lib/server/github";
import { IntegrationsTab } from "@/components/projects/tabs/IntegrationsTab";
import { ActivityTab } from "@/components/projects/tabs/ActivityTab";
import { DomainsTab } from "@/components/projects/tabs/DomainsTab";
import { SettingsTab } from "@/components/projects/tabs/SettingsTab";
import { OverviewTab } from "@/components/projects/tabs/OverviewTab";
import { ProjectForm } from "@/components/projects/dialogs/ProjectForm";
import { DeleteConfirmationDialog } from "@/components/projects/dialogs/DeleteConfirmationDialog";

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

  const t = await getTranslations("Dashboard");
  const tProjects = await getTranslations("Projects");

  const selectedProject = data.projects.find((project) => project.id === search.id);
  const layout = search.layout || "grid";
  const activeTab = search.tab || "overview";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300 w-full">
      {/* Vercel-like Header Section */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 select-none text-xs font-medium text-ink-mute">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2.5 py-1.5 -ml-2 rounded-md hover:bg-canvas-soft text-ink transition-all cursor-pointer select-none border border-transparent hover:border-hairline">
                <div className="size-5 rounded-md bg-canvas-night flex items-center justify-center text-[10px] font-bold text-canvas shrink-0 shadow-sm select-none">
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
                    <input type="hidden" name="returnTo" value="/projects" />
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
        <Link href={`/projects${buildQueryString(search, { tab: "integrations" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "integrations" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
          Integrations
        </Link>
        <Link href={`/projects${buildQueryString(search, { tab: "activity" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "activity" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
          Activity
        </Link>
        <Link href={`/projects${buildQueryString(search, { tab: "domains" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "domains" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
          Domains
        </Link>
        <Link href={`/projects${buildQueryString(search, { tab: "settings" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "settings" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
          Settings
        </Link>
      </div>

      {/* Filter and Search Section */}
      <div className="w-full">
        <form action="/projects" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full" method="get">
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

          <div className="flex items-center gap-2">
            <Button
              className="h-10 text-xs font-semibold px-4 rounded-sm border border-hairline-strong hover:bg-canvas-soft transition-colors shadow-light bg-canvas text-ink-secondary"
              type="submit"
              variant="outline"
            >
              <SlidersHorizontal className="size-3.5 mr-2 text-ink-mute-2" />
              {t("projects_and_bundles.filter") || "Filter"}
            </Button>

            {search.q ? (
              <Button className="h-10 text-xs font-semibold text-ink-mute hover:text-ink" asChild variant="ghost">
                <Link href="/projects">{tProjects("reset") || "Reset"}</Link>
              </Button>
            ) : null}

            <Button asChild className="h-10 text-xs font-semibold bg-primary hover:bg-primary-deep text-primary-foreground transition-colors rounded-sm px-5 shadow-light cursor-pointer shrink-0">
              <Link href="/projects?dialog=create">
                <Plus className="size-4 mr-1.5" />
                New Project
              </Link>
            </Button>
          </div>
        </form>
      </div>

      {/* Projects Grid/List Section */}
      <div className="w-full">
        {activeTab === "integrations" ? (
          <IntegrationsTab data={data} />
        ) : activeTab === "activity" ? (
          <ActivityTab data={data} locale={locale} formatRelativeTime={formatRelativeTime} />
        ) : activeTab === "domains" ? (
          <DomainsTab data={data} locale={locale} formatRelativeTime={formatRelativeTime} />
        ) : activeTab === "settings" ? (
          <SettingsTab />
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
            formatRelativeTime={formatRelativeTime}
          />
        )}
      </div>

      {/* Modal Dialog Form for Create */}
      {search.dialog === "create" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <Link href="/projects" className="absolute inset-0 cursor-default" aria-hidden="true" />
          <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 relative z-10">
            <ProjectForm
              action={createProjectWithBundleAction}
              organizations={data.workspace.organizations}
              activeOrganizationId={data.workspace.activeOrganization?.id}
              returnTo="/projects"
              title={t("form.create_title") || "Create Project"}
              t={t}
            />
          </div>
        </div>
      ) : null}

      {/* Modal Dialog Form for Edit */}
      {search.dialog === "edit" && selectedProject ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <Link href="/projects" className="absolute inset-0 cursor-default" aria-hidden="true" />
          <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 relative z-10">
            <ProjectForm
              action={updateProjectBundleAction}
              project={selectedProject}
              returnTo="/projects"
              title={t("form.edit_title") || "Edit Project"}
              t={t}
            />
          </div>
        </div>
      ) : null}

      {/* Modal Dialog for Delete Confirmation */}
      {search.dialog === "delete" && selectedProject ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <Link href="/projects" className="absolute inset-0 cursor-default" aria-hidden="true" />
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200 relative z-10">
            <DeleteConfirmationDialog
              project={selectedProject}
              action={deleteProjectAction}
              returnTo="/projects"
              t={t}
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

function formatRelativeTime(dateInput: Date | string | null | undefined, locale: string = "en") {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const isVi = locale === "vi";

  if (diffInSeconds < 60) return isVi ? "Vừa xong" : "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return isVi ? `${diffInMinutes} phút trước` : `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return isVi ? `${diffInHours} giờ trước` : `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return isVi ? `${diffInDays} ngày trước` : `${diffInDays}d ago`;

  return date.toLocaleDateString(isVi ? "vi-VN" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
