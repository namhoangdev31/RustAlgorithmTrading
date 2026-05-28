import { Link } from "@/i18n/navigation";
import {
  AlertCircle,
  Clock,
  Edit3,
  ExternalLink,
  Folder,
  GitBranch,
  GitCommit,
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
  ArrowRight,
  Sparkles,
} from "lucide-react";

import {
  createProjectWithBundleAction,
  deleteProjectAction,
  updateProjectBundleAction,
  switchOrganizationAction,
} from "@/app/actions/admin";
import { GithubIcon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getProjectBundleData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getTranslations } from "next-intl/server";

function buildQueryString(search: any, newParams: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  if (search.q) params.set("q", search.q);
  if (search.dialog) params.set("dialog", search.dialog);
  if (search.id) params.set("id", search.id);
  if (search.layout) params.set("layout", search.layout);

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
  }>;
};

// Generates a beautiful gradient background and text color based on the project name
function getProjectAvatarStyles(name: string) {
  const colors = [
    "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/10",
    "from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/10",
    "from-purple-500/10 to-fuchsia-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/10",
    "from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/10",
    "from-rose-500/10 to-pink-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/10",
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

  const t = await getTranslations("Dashboard");
  const tProjects = await getTranslations("Projects");

  const selectedProject = data.projects.find((project) => project.id === search.id);
  const layout = search.layout || "grid";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Vercel-like Header Section */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 select-none text-xs font-medium text-zinc-400 dark:text-zinc-500">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2.5 py-1.5 -ml-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-900 dark:text-zinc-100 transition-all cursor-pointer select-none border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                <div className="size-5 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-100 dark:text-zinc-900 shrink-0 shadow-sm select-none">
                  {(data.workspace.activeOrganization?.name || "O").charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-zinc-850 dark:text-zinc-250 text-sm">
                  {data.workspace.activeOrganization?.name || "Organization"}
                </span>
                <ChevronDown className="size-3.5 text-zinc-400 dark:text-zinc-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-lg shadow-lg p-1.5 z-50">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Switch Organization
              </div>
              {data.workspace.organizations.map((org) => (
                <DropdownMenuItem key={org.id} asChild className="cursor-pointer text-xs font-medium py-2 rounded-md focus:bg-zinc-100 dark:focus:bg-zinc-900">
                  <form action={switchOrganizationAction} className="w-full">
                    <input type="hidden" name="organizationId" value={org.id} />
                    <input type="hidden" name="returnTo" value="/projects" />
                    <button type="submit" className="w-full text-left flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="size-4.5 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-700 dark:text-zinc-350">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-zinc-800 dark:text-zinc-200 font-medium">{org.name}</span>
                      </div>
                      {org.id === data.workspace.activeOrganization?.id && (
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  </form>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-zinc-300 dark:text-zinc-800 font-normal">/</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold text-sm">Projects</span>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-px overflow-x-auto select-none no-scrollbar">
        <Link href="/projects" className="border-b border-zinc-900 dark:border-zinc-100 pb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50 transition-all shrink-0">
          Overview
        </Link>
        <span className="pb-3 text-sm font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer transition-all shrink-0 border-b border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
          Integrations
        </span>
        <span className="pb-3 text-sm font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer transition-all shrink-0 border-b border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
          Activity
        </span>
        <span className="pb-3 text-sm font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer transition-all shrink-0 border-b border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
          Domains
        </span>
        <span className="pb-3 text-sm font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer transition-all shrink-0 border-b border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
          Settings
        </span>
      </div>

      {/* Filter and Search Section */}
      <div className="w-full">
        <form action="/projects" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full" method="get">
          {search.layout && <input type="hidden" name="layout" value={search.layout} />}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 dark:text-zinc-500" />
            <Input 
              className="pl-10 h-10 w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-700 transition-all text-sm rounded-lg placeholder-zinc-400 dark:placeholder-zinc-500 shadow-sm" 
              name="q" 
              placeholder={t("projects_and_bundles.search_placeholder") || "Search projects..."}
              defaultValue={search.q || ""}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              className="h-10 text-xs font-semibold px-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-sm bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300" 
              type="submit" 
              variant="outline"
            >
              <SlidersHorizontal className="size-3.5 mr-2 text-zinc-400 dark:text-zinc-500" />
              {t("projects_and_bundles.filter") || "Filter"}
            </Button>

            {search.q ? (
              <Button className="h-10 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200" asChild variant="ghost">
                <Link href="/projects">{tProjects("reset") || "Reset"}</Link>
              </Button>
            ) : null}

            <div className="hidden md:flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 bg-zinc-50/50 dark:bg-zinc-900/10 gap-0.5 select-none shadow-sm">
              <Link 
                href={`/projects${buildQueryString(search, { layout: "grid" })}`}
                className={`size-8 rounded-md flex items-center justify-center transition-all ${
                  layout === "grid" 
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm border border-zinc-200 dark:border-zinc-800/60" 
                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200"
                }`}
              >
                <LayoutGrid className="size-4" />
              </Link>
              <Link 
                href={`/projects${buildQueryString(search, { layout: "list" })}`}
                className={`size-8 rounded-md flex items-center justify-center transition-all ${
                  layout === "list" 
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm border border-zinc-200 dark:border-zinc-800/60" 
                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200"
                }`}
              >
                <List className="size-4" />
              </Link>
            </div>

            <Button asChild className="h-10 text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-950 transition-colors rounded-lg px-4.5 shadow-md cursor-pointer shrink-0">
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
        {data.projects.length > 0 ? (
          layout === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.projects.map((project) => {
                const bundle = project.bundle;
                const statusInfo = mapBundleStatus(bundle?.status, t);
                const CategoryIcon = getCategoryIcon(bundle?.category);
                const projectSlug = bundle?.slug || project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                const avatarStyles = getProjectAvatarStyles(project.name);

                return (
                  <Card 
                    key={project.id} 
                    className="group flex flex-col justify-between bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300 rounded-xl p-5 min-h-[220px] relative overflow-hidden"
                  >
                    {/* Background visual detail */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-zinc-500/5 to-transparent dark:from-zinc-400/5 rounded-bl-full pointer-events-none" />

                    <div>
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rich Gradient Monogram Icon */}
                          <div className={`size-10 rounded-lg bg-gradient-to-br ${avatarStyles} border flex items-center justify-center text-sm font-bold shrink-0 shadow-inner select-none`}>
                            {project.name.charAt(0).toUpperCase()}
                          </div>
                          
                          <div className="min-w-0">
                            <Link 
                              href={`/projects?dialog=edit&id=${project.id}`} 
                              className="font-bold text-base text-zinc-900 dark:text-zinc-50 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors tracking-tight block truncate"
                            >
                              {project.name}
                            </Link>
                            
                            {/* Connected Git repo info */}
                            <div className="flex items-center gap-1.5 mt-0.5 text-zinc-400 dark:text-zinc-500">
                              <GithubIcon className="size-3.5 shrink-0" />
                              <span className="text-xs font-mono truncate max-w-[140px]" title={`namhoangdev31/${projectSlug}`}>
                                {`namhoangdev31/${projectSlug}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Dropdown Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="size-8 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg shrink-0 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[140px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-lg shadow-lg p-1 z-50">
                            <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold py-2 rounded-md">
                              <Link href={`/projects?dialog=edit&id=${project.id}`}>
                                <Edit3 className="size-3.5 mr-2 text-zinc-500" />
                                {t("table.edit") || "Edit"}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 text-xs font-semibold py-2 rounded-md">
                              <Link href={`/projects?dialog=delete&id=${project.id}`}>
                                <Trash2 className="size-3.5 mr-2 text-destructive" />
                                {t("table.delete") || "Delete"}
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Description */}
                      <p className="mt-3.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed" title={project.description || bundle?.shortDescription || "No description."}>
                        {project.description || bundle?.shortDescription || "No description provided."}
                      </p>

                      {/* Vercel production URL Bar */}
                      <div className="flex items-center gap-2 bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80 px-2.5 py-1.5 rounded-lg mt-4 group-hover:border-zinc-200 dark:group-hover:border-zinc-700 transition-colors">
                        <span className={`size-2 rounded-full shrink-0 ${statusInfo.dotClass}`} />
                        <a 
                          href={`https://${projectSlug}.rustalgorithm.net`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[11px] font-mono font-medium text-zinc-650 dark:text-zinc-350 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors truncate flex-1"
                        >
                          {`${projectSlug}.rustalgorithm.net`}
                        </a>
                        <ExternalLink className="size-3 text-zinc-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-900/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/50 px-2 py-1 rounded-md text-[10px] font-semibold text-zinc-600 dark:text-zinc-450 uppercase tracking-wide">
                        <CategoryIcon className="size-3" />
                        <span>{bundle?.category || "web"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          {formatRelativeTime(project.updatedAt, locale)}
                        </span>
                        <div className="size-5 rounded-full bg-gradient-to-tr from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-700 dark:text-zinc-300 border border-white dark:border-zinc-950 shadow-sm" title={(user.fullName || user.email) ?? undefined}>
                          {(user.firstName || user.fullName || "U").charAt(0).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {data.projects.map((project) => {
                const bundle = project.bundle;
                const statusInfo = mapBundleStatus(bundle?.status, t);
                const CategoryIcon = getCategoryIcon(bundle?.category);
                const projectSlug = bundle?.slug || project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                const avatarStyles = getProjectAvatarStyles(project.name);

                return (
                  <div 
                    key={project.id}
                    className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 rounded-xl p-4.5"
                  >
                    <div className="flex items-center gap-4.5 min-w-0 flex-1">
                      {/* Monogram avatar icon */}
                      <div className={`size-10 rounded-lg bg-gradient-to-br ${avatarStyles} border flex items-center justify-center text-sm font-bold shrink-0 shadow-inner select-none`}>
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Project details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Link 
                            href={`/projects?dialog=edit&id=${project.id}`}
                            className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-50 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors truncate"
                          >
                            {project.name}
                          </Link>
                          
                          <a 
                            href={`https://${projectSlug}.rustalgorithm.net`}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs font-mono font-medium text-zinc-450 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors flex items-center gap-1 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150/40 dark:border-zinc-800 px-2 py-0.5 rounded-md"
                          >
                            <span>{`${projectSlug}.rustalgorithm.net`}</span>
                            <ExternalLink className="size-3 shrink-0 opacity-60" />
                          </a>
                        </div>
                        
                        {/* Repo/Commit info */}
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                          <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-900/30 px-1.5 py-0.5 rounded border border-zinc-150/30 dark:border-zinc-900/30">
                            <GithubIcon className="size-3 text-zinc-700 dark:text-zinc-300 shrink-0" />
                            <span className="font-mono truncate max-w-[150px]" title={`namhoangdev31/${projectSlug}`}>
                              {`namhoangdev31/${projectSlug}`}
                            </span>
                            <span className="text-zinc-300 dark:text-zinc-800 select-none">•</span>
                            <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-450 flex items-center gap-0.5">
                              <GitBranch className="size-2.5" />
                              main
                            </span>
                          </div>
                          <span className="text-zinc-300 dark:text-zinc-800 select-none">•</span>
                          <span className="truncate max-w-[320px] text-zinc-400 dark:text-zinc-500" title={project.description || bundle?.shortDescription || "No description provided."}>
                            {project.description || bundle?.shortDescription || "No description provided."}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right section: status + updated time + dropdown menu */}
                    <div className="flex items-center justify-between md:justify-end gap-5 border-t border-zinc-100 dark:border-zinc-900 md:border-t-0 pt-3 md:pt-0 shrink-0">
                      <div className="flex flex-row items-center gap-4 text-xs text-zinc-550 dark:text-zinc-400">
                        {/* Status dot */}
                        <div className="flex items-center gap-1.5 bg-zinc-50/50 dark:bg-zinc-900/50 px-2 py-1 rounded-md border border-zinc-150/20 dark:border-zinc-800/40">
                          <span className={`size-1.5 rounded-full ${statusInfo.dotClass}`} />
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">{statusInfo.label}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500 capitalize">
                          <CategoryIcon className="size-3" />
                          <span>{bundle?.category || "web"}</span>
                        </div>

                        <span className="text-zinc-300 dark:text-zinc-800 select-none">•</span>

                        <span className="font-sans text-[11px] text-zinc-450 dark:text-zinc-550">
                          {formatRelativeTime(project.updatedAt, locale)}
                        </span>

                        <div className="size-5 rounded-full bg-gradient-to-tr from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-700 dark:text-zinc-300 border border-white dark:border-zinc-950 shadow-sm" title={(user.fullName || user.email) ?? undefined}>
                          {(user.firstName || user.fullName || "U").charAt(0).toUpperCase()}
                        </div>
                      </div>
                      
                      {/* Action menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="size-8 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg shrink-0 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[140px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-lg shadow-lg p-1 z-50">
                          <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold py-2 rounded-md">
                            <Link href={`/projects?dialog=edit&id=${project.id}`}>
                              <Edit3 className="size-3.5 mr-2 text-zinc-500" />
                              {t("table.edit") || "Edit"}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 text-xs font-semibold py-2 rounded-md">
                            <Link href={`/projects?dialog=delete&id=${project.id}`}>
                              <Trash2 className="size-3.5 mr-2 text-destructive" />
                              {t("table.delete") || "Delete"}
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-50/50 dark:bg-zinc-900/10 border border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-2xl space-y-4 min-h-[300px] animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-md">
              <Folder className="size-8 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                {t("projects_and_bundles.no_projects") || "No projects yet"}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {t("empty.projects_description") || "Create your first project to get started."}
              </p>
            </div>
            <Button asChild className="h-10 gap-2 text-xs font-semibold bg-zinc-950 hover:bg-zinc-850 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-950 transition-all rounded-lg px-5 shadow-md mt-2">
              <Link href="/projects?dialog=create">
                <Plus className="size-4" />
                {t("projects_and_bundles.new_project") || "New Project"}
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Modal Dialog Form for Create */}
      {search.dialog === "create" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md transition-all duration-300 animate-in fade-in">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md transition-all duration-300 animate-in fade-in">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md transition-all duration-300 animate-in fade-in">
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
        dotClass: "bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
      };
    case "review":
      return {
        label: t("form.status_options.review") || "Review",
        dotClass: "bg-amber-500 dark:bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]",
      };
    case "archived":
      return {
        label: t("form.status_options.archived") || "Archived",
        dotClass: "bg-rose-500 dark:bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]",
      };
    case "draft":
    default:
      return {
        label: t("form.status_options.draft") || "Draft",
        dotClass: "bg-zinc-400 dark:bg-zinc-550",
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

function ProjectForm({
  action,
  project,
  organizations = [],
  activeOrganizationId,
  returnTo,
  title,
  t,
}: {
  action: (formData: FormData) => Promise<void>;
  project?: any;
  organizations?: { id: string; name: string }[];
  activeOrganizationId?: string;
  returnTo: string;
  title: string;
  t: any;
}) {
  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950 overflow-hidden rounded-2xl animate-in fade-in zoom-in-95 duration-200">
      <CardHeader className="border-b border-zinc-100 dark:border-zinc-900 pb-5 bg-zinc-50/50 dark:bg-zinc-950/20">
        <CardTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <Sparkles className="size-5 text-emerald-500" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
          {t("form.description") || "Enter the details of your project below."}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form action={action} className="grid gap-5 md:grid-cols-2">
          {project ? <input type="hidden" name="projectId" value={project.id} /> : null}
          <input type="hidden" name="returnTo" value={returnTo} />

          {/* Project Name */}
          <div className="grid gap-2 md:col-span-2">
            <Label className="text-[11px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
              {t("form.project_name") || "Project Name"} <span className="text-rose-500">*</span>
            </Label>
            <Input
              defaultValue={project?.name ?? ""}
              name="projectName"
              required
              placeholder="e.g. My Algorithmic Trading Platform"
              className="h-10 bg-transparent border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-700 transition-all rounded-lg text-sm shadow-sm"
            />
          </div>

          {/* Organization Select */}
          {!project && organizations.length > 0 ? (
            <div className="grid gap-2 md:col-span-2">
              <Label className="text-[11px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
                {t("form.organization") || "Organization"}
              </Label>
              <Select defaultValue={activeOrganizationId} name="organizationId">
                <SelectTrigger className="h-10 bg-transparent border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700 transition-all rounded-lg text-sm shadow-sm">
                  <SelectValue placeholder={t("form.select_organization") || "Select an organization"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-md">
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id} className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md">
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {/* Bundle Name */}
          <div className="grid gap-2">
            <Label className="text-[11px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
              {t("form.bundle_name") || "Bundle Name"}
            </Label>
            <Input
              defaultValue={project?.bundle?.name ?? ""}
              name="bundleName"
              placeholder="e.g. trading-bot-bundle"
              className="h-10 bg-transparent border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-700 transition-all rounded-lg text-sm shadow-sm"
            />
          </div>

          {/* Project Type / Category */}
          <div className="grid gap-2">
            <Label className="text-[11px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
              {t("form.project_type") || "Project Type"}
            </Label>
            <Select defaultValue={project?.bundle?.category ?? "web"} name="category">
              <SelectTrigger className="h-10 bg-transparent border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700 transition-all rounded-lg text-sm shadow-sm">
                <SelectValue placeholder={t("form.select_project_type") || "Select type"} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-805 rounded-lg">
                <SelectItem value="web" className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md">{t("form.project_type_options.web") || "Web App"}</SelectItem>
                <SelectItem value="mobile" className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md">{t("form.project_type_options.mobile") || "Mobile App"}</SelectItem>
                <SelectItem value="desktop" className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md">{t("form.project_type_options.desktop") || "Desktop App"}</SelectItem>
                <SelectItem value="api" className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md">{t("form.project_type_options.api") || "API / Service"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="grid gap-2 md:col-span-2">
            <Label className="text-[11px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
              {t("form.status") || "Status"}
            </Label>
            <Select defaultValue={project?.bundle?.status ?? "draft"} name="status">
              <SelectTrigger className="h-10 bg-transparent border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700 transition-all rounded-lg text-sm shadow-sm">
                <SelectValue placeholder={t("form.select_status") || "Select status"} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-805 rounded-lg">
                <SelectItem value="draft" className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md">{t("form.status_options.draft") || "Draft"}</SelectItem>
                <SelectItem value="review" className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md">{t("form.status_options.review") || "Review"}</SelectItem>
                <SelectItem value="published" className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md">{t("form.status_options.published") || "Published"}</SelectItem>
                <SelectItem value="archived" className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md">{t("form.status_options.archived") || "Archived"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project Description */}
          <div className="grid gap-2 md:col-span-2">
            <Label className="text-[11px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
              {t("form.project_description") || "Project Description"}
            </Label>
            <textarea
              name="description"
              defaultValue={project?.description ?? ""}
              rows={3}
              placeholder="Explain what this project is about..."
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-450 dark:placeholder:text-zinc-650 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-700 transition-all duration-200 font-sans shadow-sm"
            />
          </div>

          {/* Bundle Short Summary */}
          <div className="grid gap-2 md:col-span-2">
            <Label className="text-[11px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
              {t("form.bundle_summary") || "Bundle Summary"}
            </Label>
            <Input
              defaultValue={project?.bundle?.shortDescription ?? ""}
              name="shortDescription"
              placeholder="Short summary of the compiled bundle"
              className="h-10 bg-transparent border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-700 transition-all rounded-lg text-sm shadow-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 md:col-span-2 pt-5 border-t border-zinc-100 dark:border-zinc-900 mt-2">
            <Button asChild variant="outline" className="h-10 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold px-4">
              <Link href={returnTo}>{t("form.cancel") || "Cancel"}</Link>
            </Button>
            <Button
              type="submit"
              className="h-10 bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-950 font-semibold transition-all duration-200 px-6 rounded-lg shadow-md text-xs"
            >
              {project ? (t("form.save_changes") || "Save Changes") : (t("form.create_project") || "Create Project")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteConfirmationDialog({
  project,
  action,
  returnTo,
  t,
}: {
  project: any;
  action: (formData: FormData) => Promise<void>;
  returnTo: string;
  t: any;
}) {
  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950 overflow-hidden rounded-2xl max-w-md w-full mx-auto animate-in fade-in zoom-in-95 duration-200">
      <CardHeader className="pb-4 bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-zinc-100 dark:border-zinc-900">
        <CardTitle className="text-lg font-bold text-rose-600 flex items-center gap-2">
          <AlertCircle className="size-5 shrink-0" />
          <span className="truncate">{t("delete_dialog.title", { name: project.name }) || `Delete ${project.name}`}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {t("delete_dialog.description") || "Are you sure you want to delete this project? This action cannot be undone."}
        </p>
        <form action={action} className="flex items-center justify-end gap-3 pt-5 border-t border-zinc-100 dark:border-zinc-900">
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          
          <Button asChild variant="outline" className="h-10 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
            <Link href={returnTo}>{t("delete_dialog.cancel") || "Cancel"}</Link>
          </Button>
          <Button
            type="submit"
            variant="destructive"
            className="h-10 text-xs font-semibold px-4 rounded-lg shadow-sm"
          >
            {t("delete_dialog.delete_project") || "Delete Project"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
