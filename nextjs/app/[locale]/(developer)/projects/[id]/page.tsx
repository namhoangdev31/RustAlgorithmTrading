import { Link } from "@/i18n/navigation";
import {
  Edit3,
  Globe,
  Layers,
  Trash2,
  ChevronDown,
  AlertCircle,
  Box,
  ArrowUpRight,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  deleteProjectAction,
  updateProjectBundleAction,
  switchOrganizationAction,
  linkProjectRepositoryAction,
  unlinkProjectRepositoryAction,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GithubIcon } from "@/components/ui/icon";
import { getProjectBundleData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getGithubOverviewData } from "@/lib/server/github";
import { headers } from "next/headers";
import { WebhookPayloadModal } from "@/components/projects/dialogs/WebhookPayloadModal";
import { IntegrationsTab } from "@/components/projects/tabs/IntegrationsTab";
import { GithubSsrCard } from "@/components/projects/GithubSsrCard";
import { VercelAnalyticsCard } from "@/components/projects/VercelAnalyticsCard";
import { ActivityTab } from "@/components/projects/tabs/ActivityTab";
import { DomainsTab } from "@/components/projects/tabs/DomainsTab";
import { DeploymentsTab } from "@/components/projects/tabs/DeploymentsTab";
import { VercelTab } from "@/components/projects/tabs/VercelTab";
import { VercelEnvVarsCard } from "@/components/projects/VercelEnvVarsCard";
import { MembersTab } from "@/components/projects/tabs/MembersTab";
import { ProjectForm } from "@/components/projects/dialogs/ProjectForm";
import { DeleteConfirmationDialog } from "@/components/projects/dialogs/DeleteConfirmationDialog";
import { hasVercelApiKey, getVercelClient } from "@/lib/server/vercel";
import { formatRelativeTime } from "@/lib/shared/time";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function buildDetailQueryString(search: any, newParams: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  if (search.q) params.set("q", search.q);
  if (search.dialog) params.set("dialog", search.dialog);

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

type ProjectDetailsPageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
  searchParams: Promise<{
    tab?: string;
    dialog?: string;
    error?: string;
    message?: string;
    name?: string;
    q?: string;
    track?: string;
    page?: string;
    dstatus?: string;
    dpage?: string;
    webhook_idx?: string;
  }>;
};

export default async function ProjectDetailsPage({ params, searchParams }: ProjectDetailsPageProps) {
  const { locale, id: projectId } = await params;
  const search = await searchParams;
  const user = await requireCurrentUser();

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  // Use getProjectBundleData to fetch all projects with organizational validation
  const data = await getProjectBundleData(user.id, {});
  const project = data.projects.find((p) => p.id === projectId);

  if (!project) {
    redirect("/projects");
  }

  const github = await getGithubOverviewData();
  const vercelConnected = await hasVercelApiKey(user.id);

  let vercelAliases: any[] = [];
  let vercelDeployments: any[] = [];
  let vercelAccessGroups: any[] = [];
  let vercelTokens: any[] = [];
  let vercelProjectEnvVars: any[] = [];
  let vercelProjectDomains: any[] = [];
  let vercelConnectionError = false;

  if (vercelConnected && project.vercelProjectId) {
    try {
      const vercel = await getVercelClient(user.id);
      const [
        aliasesRes,
        deploymentsRes,
        accessGroupsRes,
        tokensRes,
        envVarsRes,
        domainsRes,
      ] = await Promise.allSettled([
        vercel.aliases.listAliases({ projectId: project.vercelProjectId, limit: 50 }),
        vercel.deployments.getDeployments({ projectId: project.vercelProjectId, limit: 50 }),
        vercel.accessGroups.listAccessGroups({ limit: 50 }),
        vercel.authentication.listAuthTokens(),
        vercel.projects.filterProjectEnvs({ idOrName: project.vercelProjectId }),
        vercel.projects.getProjectDomains({ idOrName: project.vercelProjectId }),
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

      if (accessGroupsRes.status === "fulfilled") {
        vercelAccessGroups = (accessGroupsRes.value as any).accessGroups || [];
      } else {
        console.error("Error fetching Vercel access groups:", accessGroupsRes.reason);
      }

      if (tokensRes.status === "fulfilled") {
        vercelTokens = (tokensRes.value as any).tokens || [];
      } else {
        console.error("Error fetching Vercel tokens:", tokensRes.reason);
      }

      if (envVarsRes.status === "fulfilled") {
        vercelProjectEnvVars = (envVarsRes.value as any).envs || [];
      } else {
        console.error("Error fetching Vercel project environment variables:", envVarsRes.reason);
      }

      if (domainsRes.status === "fulfilled") {
        vercelProjectDomains = (domainsRes.value as any).domains || [];
      } else {
        console.error("Error fetching Vercel project domains:", domainsRes.reason);
      }
    } catch (err) {
      console.error("Error fetching Vercel data:", err);
      vercelConnectionError = true;
    }
  }

  const t = await getTranslations("Dashboard");
  const tProjects = await getTranslations("Projects");
  const activeTab = search.tab || "overview";
  const returnTo = `/projects/${project.id}?tab=${activeTab}`;

  const bundle = project.bundle;

  // Filter & Paginate release tracks on server side
  const trackFilter = (search.track || "all").toLowerCase();
  const rawTracks = bundle?.releaseTracks || [];
  const filteredTracks = trackFilter === "all" 
    ? rawTracks 
    : rawTracks.filter((t: any) => (t.track || "").toLowerCase() === trackFilter);

  const tracksPageSize = 5;
  const tracksCurrentPage = Number(search.page) || 1;
  const totalTracks = filteredTracks.length;
  const totalTracksPages = Math.ceil(totalTracks / tracksPageSize);
  const paginatedTracks = filteredTracks.slice((tracksCurrentPage - 1) * tracksPageSize, tracksCurrentPage * tracksPageSize);

  // Find the production or latest deployment
  const productionDeployment = vercelDeployments.find((d) => d.target === "production") || vercelDeployments[0];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 w-full">
      {search.error && (
        <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive rounded-lg animate-in slide-in-from-top-2 duration-300">
          <AlertCircle className="size-4" />
          <AlertTitle className="font-bold text-xs uppercase tracking-wider">Error Occurred</AlertTitle>
          <AlertDescription className="text-xs font-semibold mt-1">
            {search.error === "vercel_api_error" && `Vercel API Error: ${search.message || "An unknown error occurred."}`}
            {search.error === "invalid_vercel_name" && "The Vercel project name is invalid."}
          </AlertDescription>
        </Alert>
      )}

      {/* Vercel-like Breadcrumbs Header Section */}
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
                    <input type="hidden" name="returnTo" value={`/projects/${project.id}`} />
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
          <Link href="/projects" className="hover:text-ink text-ink-mute transition-colors text-sm">Projects</Link>
          <span className="text-hairline-strong font-normal">/</span>

          {/* Project Switcher Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 -ml-2 rounded-md hover:bg-canvas-soft text-ink transition-all cursor-pointer select-none border border-transparent hover:border-hairline">
                <span className="font-semibold text-ink text-sm">{project.name}</span>
                <ChevronDown className="size-3.5 text-ink-mute" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px] bg-canvas border border-hairline rounded-lg shadow-dark p-1.5 z-50">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-ink-mute uppercase tracking-wider">
                Projects
              </div>
              {data.projects.map((p) => (
                <DropdownMenuItem key={p.id} asChild className="cursor-pointer text-xs font-medium py-2 rounded-md focus:bg-canvas-soft">
                  <Link href={`/projects/${p.id}`} className="w-full text-left flex items-center justify-between">
                    <span className="text-ink-secondary font-medium">{p.name}</span>
                    {p.id === project.id && (
                      <span className="size-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-6 border-b border-hairline pb-px overflow-x-auto select-none no-scrollbar">
        <Link href={`/projects/${project.id}${buildDetailQueryString(search, { tab: "overview" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "overview" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
          Overview
        </Link>
        <Link href={`/projects/${project.id}${buildDetailQueryString(search, { tab: "deployments" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "deployments" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
          Deployments
        </Link>
        <Link href={`/projects/${project.id}${buildDetailQueryString(search, { tab: "domains" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "domains" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
          Domains
        </Link>
        <Link href={`/projects/${project.id}${buildDetailQueryString(search, { tab: "integrations" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "integrations" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
          Integrations
        </Link>
        <Link href={`/projects/${project.id}${buildDetailQueryString(search, { tab: "members" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "members" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
          Members
        </Link>
        <Link href={`/projects/${project.id}${buildDetailQueryString(search, { tab: "activity" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "activity" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
          Activity
        </Link>
        <Link href={`/projects/${project.id}${buildDetailQueryString(search, { tab: "settings" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "settings" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
          Settings
        </Link>
        {vercelConnected && (
          <Link href={`/projects/${project.id}${buildDetailQueryString(search, { tab: "vercel" })}`} className={`pb-3 text-sm font-medium transition-all shrink-0 border-b ${activeTab === "vercel" ? "border-ink text-ink" : "border-transparent text-ink-mute hover:text-ink-secondary hover:border-hairline"}`}>
            Vercel
          </Link>
        )}
      </div>

      {/* Main Tab Render Section */}
      <div className="w-full">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Vercel production deployment */}
            {vercelConnected && project.vercelProjectId ? (
              <Card className="overflow-hidden border border-hairline bg-canvas py-0">
                <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 flex flex-row items-center justify-between gap-3 p-5">
                  <div>
                    <CardTitle className="text-base font-bold text-ink">Production Deployment</CardTitle>
                    <CardDescription className="text-xs text-ink-mute mt-1">
                      The active deployment serving web requests for this project.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {productionDeployment ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: Metadata */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Deployment Name</p>
                          <p className="text-sm font-semibold text-ink mt-0.5">{productionDeployment.name}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">URL</p>
                          <a
                            href={`https://${productionDeployment.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 mt-0.5"
                          >
                            {productionDeployment.url}
                            <ArrowUpRight className="size-3.5" />
                          </a>
                        </div>
                        <div className="flex gap-12">
                          <div>
                            <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Status</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`size-2 rounded-full ${productionDeployment.state === "READY"
                                  ? "bg-primary shadow-[0_0_8px_rgba(62,207,142,0.35)]"
                                  : productionDeployment.state === "ERROR"
                                    ? "bg-destructive"
                                    : "bg-accent-yellow animate-pulse"
                                }`} />
                              <span className="text-xs font-semibold uppercase text-ink-secondary">
                                {productionDeployment.state}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Age</p>
                            <p className="text-xs text-ink-secondary mt-1">
                              {productionDeployment.created ? formatRelativeTime(new Date(productionDeployment.created), locale) : "N/A"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Deployed By</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="size-5 border border-hairline">
                              <AvatarFallback className="text-[9px] font-bold text-ink-secondary bg-canvas-soft">
                                {(productionDeployment.creator?.username || productionDeployment.creator?.githubLogin || "U").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-ink-secondary">
                              {productionDeployment.creator?.username || productionDeployment.creator?.githubLogin || "unknown"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Mock Browser Preview Container */}
                      <div className="w-full h-44 rounded-lg border border-hairline bg-canvas-soft/40 relative overflow-hidden flex flex-col shadow-inner">
                        {/* Browser chrome */}
                        <div className="h-7 border-b border-hairline bg-canvas-soft flex items-center px-3 gap-1.5 shrink-0 select-none">
                          <span className="size-2 rounded-full bg-destructive/40" />
                          <span className="size-2 rounded-full bg-accent-yellow/40" />
                          <span className="size-2 rounded-full bg-primary/40" />
                          <div className="flex-1 max-w-xs h-4.5 bg-canvas border border-hairline rounded-sm mx-auto flex items-center justify-center text-[9px] text-ink-mute truncate px-2 font-mono">
                            {productionDeployment.url}
                          </div>
                        </div>
                        {/* Preview body */}
                        <div className="flex-1 flex flex-col items-center justify-center bg-canvas p-4 text-center">
                          <Globe className="size-7 text-ink-mute-2 mb-2 animate-bounce" />
                          <p className="text-xs font-semibold text-ink-secondary">Production deployment active</p>
                          <a
                            href={`https://${productionDeployment.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-primary hover:underline mt-1"
                          >
                            Open Live Site
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Layers className="size-6 text-ink-mute mb-2" />
                      <p className="text-xs font-semibold text-ink-secondary">No deployments yet</p>
                      <p className="text-[10px] text-ink-mute mt-0.5">Go to the Deployments tab to configure builds.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : vercelConnected ? (
              /* Vercel connected but no project linked */
              <Card className="overflow-hidden border border-hairline bg-canvas py-0">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-10 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink-mute mb-3">
                    <Layers className="size-5" />
                  </div>
                  <p className="text-sm font-semibold text-ink">
                    No linked Vercel Pipeline
                  </p>
                  <p className="text-xs text-ink-mute mt-1 max-w-md">
                    This project is not linked to a Vercel deployment pipeline. Connect a Vercel project ID in project settings.
                  </p>
                  <Button asChild variant="outline" className="mt-4 h-9 text-xs font-semibold px-4 rounded-sm border-hairline-strong hover:bg-canvas-soft transition-colors text-ink">
                    <Link href={`/projects/${project.id}?tab=settings`}>
                      Configure Settings
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {vercelConnected && project.vercelProjectId && (
              <VercelAnalyticsCard project={project} locale={locale} />
            )}

            {/* Lepos Bundle metadata summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border border-hairline bg-canvas">
                <CardContent className="p-5 flex flex-col justify-between h-28">
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Bundle Status</p>
                    {bundle?.status && (
                      <div className="flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${mapBundleStatus(bundle.status, t).dotClass
                          }`} />
                        <span className="text-[10px] font-bold uppercase text-ink-secondary">
                          {mapBundleStatus(bundle.status, t).label}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-ink mt-2">
                      {bundle?.name || "No Bundle"}
                    </h4>
                    <p className="text-xs text-ink-mute mt-0.5 truncate">
                      {bundle?.shortDescription || "No bundle details configured."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-hairline bg-canvas">
                <CardContent className="p-5 flex flex-col justify-between h-28">
                  <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Version & Category</p>
                  <div>
                    <h4 className="text-2xl font-bold text-ink mt-2 capitalize">
                      {bundle?.category || "N/A"}
                    </h4>
                    <p className="text-xs text-ink-mute mt-0.5">
                      Current Version: <span className="font-mono font-semibold text-ink-secondary">{bundle?.version || "0.0.0"}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-hairline bg-canvas">
                <CardContent className="p-5 flex flex-col justify-between h-28">
                  <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Install Metrics</p>
                  <div>
                    <h4 className="text-2xl font-bold text-ink mt-2">
                      {bundle?.stats?.activeInstalls?.toLocaleString() || "0"}
                    </h4>
                    <p className="text-xs text-ink-mute mt-0.5">
                      Downloads: <span className="font-semibold text-ink-secondary">{bundle?.stats?.downloadCount?.toLocaleString() || "0"}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Release Track History Table */}
            <Card className="border border-hairline bg-canvas py-0">
              <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-ink">Release Track History</CardTitle>
                  <CardDescription className="text-xs text-ink-mute mt-1">
                    Chronological record of release bundles generated for production, beta, or staging environments.
                  </CardDescription>
                </div>
                
                {/* Track Filter */}
                <div className="flex flex-wrap items-center gap-1 bg-canvas border border-hairline rounded-md p-1 select-none w-fit shrink-0">
                  {["ALL", "PRODUCTION", "STAGING", "BETA"].map((track) => {
                    const isActive = (search.track || "ALL").toUpperCase() === track;
                    const label = track === "ALL" 
                      ? (locale === "vi" ? "Tất cả" : "All")
                      : track;
                    const targetTrack = track === "ALL" ? undefined : track.toLowerCase();
                    return (
                      <Link
                        key={track}
                        href={`/projects/${project.id}${buildDetailQueryString(search, { track: targetTrack, page: "1" })}`}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                          isActive 
                            ? "bg-canvas-soft text-ink shadow-sm border border-hairline-strong" 
                            : "text-ink-mute hover:text-ink border border-transparent"
                        }`}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {totalTracks === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Box className="size-6 text-ink-mute mb-2" />
                    <p className="text-xs font-semibold text-ink-secondary">No releases found</p>
                    <p className="text-[10px] text-ink-mute mt-0.5">Upload a project bundle to view releases here.</p>
                  </div>
                ) : (
                  <Table className="min-w-[760px]">
                    <TableHeader>
                      <TableRow className="bg-canvas-soft/40 border-b border-hairline">
                        <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Track</TableHead>
                        <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Version</TableHead>
                        <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Build</TableHead>
                        <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Status</TableHead>
                        <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Release Notes</TableHead>
                        <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTracks.map((track) => (
                        <TableRow key={track.id} className="hover:bg-canvas-soft/30 transition-colors border-b border-hairline">
                          <TableCell className="px-5 py-4 font-semibold text-xs text-ink-secondary capitalize">
                            {track.track}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-xs font-mono font-medium text-ink">
                            {track.version}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-xs font-mono text-ink-mute">
                            #{track.buildNumber}
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${track.status === "completed"
                                ? "bg-primary/5 border-primary/20 text-primary"
                                : "bg-canvas-soft border-hairline text-ink-mute"
                              }`}>
                              {track.status}
                            </span>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-xs text-ink-secondary max-w-xs truncate">
                            {track.releaseNotes || "No notes."}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-xs text-ink-mute">
                            {formatRelativeTime(new Date(track.createdAt), locale)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {/* Release Tracks Pagination */}
                {totalTracksPages > 1 && (
                  <div className="flex items-center justify-between border-t border-hairline px-6 py-4 bg-canvas-soft/20">
                    <p className="text-xs text-ink-mute font-medium">
                      {locale === "vi"
                        ? `Hiển thị ${(tracksCurrentPage - 1) * tracksPageSize + 1} - ${Math.min(tracksCurrentPage * tracksPageSize, totalTracks)} trong tổng số ${totalTracks} bản phát hành`
                        : `Showing ${(tracksCurrentPage - 1) * tracksPageSize + 1} to ${Math.min(tracksCurrentPage * tracksPageSize, totalTracks)} of ${totalTracks} releases`}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        disabled={tracksCurrentPage <= 1}
                        className={`h-8 text-xs ${tracksCurrentPage <= 1 ? "pointer-events-none opacity-50" : ""}`}
                      >
                        <Link href={`/projects/${project.id}${buildDetailQueryString(search, { page: String(tracksCurrentPage - 1) })}`}>
                          {locale === "vi" ? "Trang trước" : "Previous"}
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        disabled={tracksCurrentPage >= totalTracksPages}
                        className={`h-8 text-xs ${tracksCurrentPage >= totalTracksPages ? "pointer-events-none opacity-50" : ""}`}
                      >
                        <Link href={`/projects/${project.id}${buildDetailQueryString(search, { page: String(tracksCurrentPage + 1) })}`}>
                          {locale === "vi" ? "Trang sau" : "Next"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "deployments" && (
          <DeploymentsTab
            vercelConnected={vercelConnected}
            vercelDeployments={vercelDeployments}
            vercelConnectionError={vercelConnectionError}
            locale={locale}
            projects={[project]}
            returnTo={returnTo}
            searchParams={search}
            project={project}
          />
        )}

        {activeTab === "domains" && (
          <DomainsTab
            vercelConnected={vercelConnected}
            vercelAliases={vercelAliases}
            vercelProjectDomains={vercelProjectDomains}
            vercelProjectId={project.vercelProjectId || ""}
            vercelConnectionError={vercelConnectionError}
            locale={locale}
            returnTo={returnTo}
          />
        )}

        {activeTab === "integrations" && (
          <div className="space-y-6">
            <GithubSsrCard project={project} locale={locale} />
            <div className="border-t border-hairline pt-6">
              <h3 className="text-sm font-bold text-ink mb-4">Other Integrations</h3>
              <IntegrationsTab data={{ projects: [project], workspace: data.workspace }} />
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <MembersTab project={project} locale={locale} />
        )}

        {activeTab === "activity" && (
          <ActivityTab data={{ projects: [project], workspace: data.workspace }} locale={locale} />
        )}

        {activeTab === "settings" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in duration-200">
            <div className="xl:col-span-2 space-y-6">
              {/* Rename Project */}
              <Card className="bg-canvas border border-hairline rounded-lg p-5">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-base font-bold text-ink">Rename Project</CardTitle>
                  <CardDescription className="text-xs text-ink-mute">Change the display name of this project.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/projects/${project.id}?tab=settings&dialog=edit`}
                      className="h-9 inline-flex items-center justify-center text-xs font-semibold bg-canvas hover:bg-canvas-soft border border-hairline-strong text-ink rounded-sm px-4 shadow-light transition-colors"
                    >
                      <Edit3 className="size-3.5 mr-1.5" />
                      Edit Project Metadata
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Vercel project link details */}
              <Card className="bg-canvas border border-hairline rounded-lg p-5">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-base font-bold text-ink">Vercel Deployment Integration</CardTitle>
                  <CardDescription className="text-xs text-ink-mute">Connection status with Vercel project pipelines.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-3">
                  <div className="flex justify-between items-center text-xs border-b border-hairline pb-2.5">
                    <span className="text-ink-mute">Vercel Connection</span>
                    <span className={`font-semibold ${project.vercelProjectId ? "text-primary" : "text-ink-mute"}`}>
                      {project.vercelProjectId ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                  {project.vercelProjectId && (
                    <>
                      <div className="flex justify-between items-center text-xs border-b border-hairline pb-2.5">
                        <span className="text-ink-mute">Vercel Project ID</span>
                        <span className="font-mono text-ink-secondary">{project.vercelProjectId}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-ink-mute">Vercel Project Name</span>
                        <span className="font-mono text-ink-secondary">{project.vercelProjectName || "N/A"}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* GitHub Integration Card */}
              {(() => {
                const githubIntegration = project.bundle?.externalIntegrations?.find(
                  (i: any) => i.integrationType === "github"
                );
                
                let webhookLogs: any[] = [];
                let webhookUrl = "";
                if (githubIntegration?.config) {
                  try {
                    const configData = JSON.parse(githubIntegration.config);
                    webhookLogs = configData.logs || [];
                    webhookUrl = origin ? `${origin}/api/webhooks/github` : "";
                  } catch {}
                }
                
                return (
                  <Card className="bg-canvas border border-hairline rounded-lg p-5">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="text-base font-bold text-ink flex items-center gap-2">
                        <GithubIcon className="size-4 text-ink-secondary" />
                        GitHub Repository Integration
                      </CardTitle>
                      <CardDescription className="text-xs text-ink-mute">
                        Link a GitHub repository to build, release, and track codebase details.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 pb-0 space-y-4">
                      {githubIntegration ? (
                        <div className="space-y-4">
                          <div className="p-3 bg-canvas-soft border border-hairline rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                            <div>
                              <div className="font-semibold text-ink">Linked Repository</div>
                              <div className="font-mono text-ink-secondary mt-0.5">{githubIntegration.displayName}</div>
                            </div>
                            <form action={unlinkProjectRepositoryAction}>
                              <input type="hidden" name="projectId" value={project.id} />
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <Button type="submit" variant="destructive" size="sm" className="h-8 text-[11px] font-semibold cursor-pointer">
                                Disconnect
                              </Button>
                            </form>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-hairline">
                            <div className="p-3 bg-canvas-soft/40 border border-hairline rounded-lg space-y-1">
                              <div className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Webhook URL</div>
                              <div className="text-xs font-mono text-ink-secondary truncate bg-canvas border border-hairline rounded p-2">
                                {webhookUrl}
                              </div>
                            </div>
                            <div className="p-3 bg-canvas-soft/40 border border-hairline rounded-lg space-y-1">
                              <div className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Webhook Secret</div>
                              <div className="text-xs font-mono text-ink-secondary truncate bg-canvas border border-hairline rounded p-2">
                                whsec_••••••••••••••••
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">
                              Webhook Delivery Logs
                            </div>
                            <div className="border border-hairline bg-canvas rounded-lg overflow-hidden divide-y divide-hairline max-h-[220px] overflow-y-auto">
                              {webhookLogs.length > 0 ? (
                                webhookLogs.map((log: any, idx: number) => (
                                  <Link 
                                    key={idx} 
                                    href={`/projects/${project.id}${buildDetailQueryString(search, { webhook_idx: String(idx) })}`}
                                    className="p-3 flex items-center justify-between gap-2 hover:bg-canvas-soft/50 transition-colors cursor-pointer text-left w-full border-0 select-none block"
                                  >
                                    <div className="space-y-0.5 min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                          log.statusCode === 200 || log.status === "success"
                                            ? "bg-primary/10 text-primary border border-primary/20"
                                            : "bg-destructive/10 text-destructive border border-destructive/20"
                                        }`}>
                                          {log.statusCode || (log.status === "success" ? 200 : 500)}
                                        </span>
                                        <span className="font-bold text-ink-secondary font-mono text-[11px]">{log.event || "push"}</span>
                                      </div>
                                      <p className="text-ink-mute text-[10px] truncate mt-0.5">{log.message}</p>
                                    </div>
                                    <div className="text-[9px] text-ink-mute font-mono shrink-0">
                                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ""}
                                    </div>
                                  </Link>
                                ))
                              ) : (
                                <div className="p-6 text-center text-xs text-ink-mute">
                                  No webhook events received yet.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {github.connected ? (
                            <form action={linkProjectRepositoryAction} className="flex gap-2">
                              <input type="hidden" name="projectId" value={project.id} />
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <Select name="repoFullName" required>
                                <SelectTrigger className="h-9 bg-canvas border-hairline flex-1 text-left text-xs text-ink">
                                  <SelectValue placeholder="Select a repository" />
                                </SelectTrigger>
                                <SelectContent className="bg-canvas border border-hairline rounded-lg max-h-[200px] overflow-y-auto">
                                  {github.repos.map((repo) => (
                                    <SelectItem key={repo.id} value={repo.fullName} className="cursor-pointer hover:bg-canvas-soft rounded-md text-xs">
                                      {repo.fullName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button type="submit" size="sm" className="h-9 bg-primary hover:bg-primary-deep text-primary-foreground font-semibold px-4 rounded-sm text-xs shadow-light cursor-pointer">
                                Link Repository
                              </Button>
                            </form>
                          ) : (
                            <div className="flex flex-col items-center gap-2 py-2 text-center">
                              <p className="text-xs text-ink-mute">Connect your GitHub account in workspace settings to enable repository linking.</p>
                              <Button asChild variant="outline" className="h-8 text-[11px] font-semibold border-hairline-strong rounded-sm bg-canvas">
                                <Link href="/projects?tab=settings">Go to Workspace Settings</Link>
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

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
              <Card className="bg-canvas border border-destructive/20 rounded-lg p-5">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-base font-bold text-destructive">Danger Zone</CardTitle>
                  <CardDescription className="text-xs text-ink-mute">Irreversible actions for this project.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <p className="text-xs text-ink-secondary mb-4 leading-relaxed">
                    Deleting this project will permanently remove its build configurations, linked release tracks, and historical integrations. This action cannot be undone.
                  </p>
                  <Link
                    href={`/projects/${project.id}?tab=settings&dialog=delete`}
                    className="h-9 inline-flex items-center justify-center text-xs font-semibold bg-destructive hover:bg-destructive-deep text-white rounded-sm px-4 shadow-light transition-colors"
                  >
                    <Trash2 className="size-3.5 mr-1.5" />
                    Delete Project
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "vercel" && vercelConnected && (
          <VercelTab
            project={project}
            vercelConnected={vercelConnected}
            vercelAccessGroups={vercelAccessGroups}
            vercelTokens={vercelTokens}
            vercelConnectionError={vercelConnectionError}
            locale={locale}
            returnTo={returnTo}
          />
        )}
      </div>

      {/* Modal Dialog Form for Edit */}
      {search.dialog === "edit" ? (
        <div className="fixed inset-x-0 -top-20 h-[calc(100vh+5rem)] z-[120] flex items-center justify-center p-4 bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <Link href={`/projects/${project.id}?tab=${activeTab}`} className="absolute inset-0 cursor-default" aria-hidden="true" />
          <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 relative z-10">
            <ProjectForm
              action={updateProjectBundleAction}
              project={project}
              returnTo={`/projects/${project.id}?tab=${activeTab}`}
              title={t("form.edit_title") || "Edit Project"}
              vercelConnected={vercelConnected}
            />
          </div>
        </div>
      ) : null}

      {/* Modal Dialog for Delete Confirmation */}
      {search.dialog === "delete" ? (
        <div className="fixed inset-x-0 -top-20 h-[calc(100vh+5rem)] z-[120] flex items-center justify-center p-4 bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <Link href={`/projects/${project.id}?tab=${activeTab}`} className="absolute inset-0 cursor-default" aria-hidden="true" />
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200 relative z-10">
            <DeleteConfirmationDialog
              project={project}
              action={deleteProjectAction}
              returnTo="/projects"
            />
          </div>
        </div>
      ) : null}

      {search.webhook_idx !== undefined && (() => {
        const githubIntegration = project.bundle?.externalIntegrations?.find(
          (i: any) => i.integrationType === "github"
        );
        if (githubIntegration?.config) {
          try {
            const configData = JSON.parse(githubIntegration.config);
            const logs = configData.logs || [];
            const selectedLog = logs[Number(search.webhook_idx)];
            if (selectedLog) {
              return (
                <WebhookPayloadModal
                  log={selectedLog}
                  returnTo={`/projects/${project.id}?tab=${activeTab}`}
                  locale={locale}
                />
              );
            }
          } catch {}
        }
        return null;
      })()}
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
