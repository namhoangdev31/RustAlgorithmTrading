import { Edit3, ExternalLink, Folder, GitBranch, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GithubIcon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import {
  connectGithubAction,
  createProjectFromGithubRepoAction,
  disconnectGithubAction,
} from "@/app/actions/admin";

type OverviewTabProps = {
  data: any;
  github: {
    connected: boolean;
    login?: string;
    avatarUrl?: string;
    profileUrl?: string;
    repos: {
      id: number;
      name: string;
      fullName: string;
      description: string | null;
      htmlUrl: string;
      defaultBranch: string;
      private: boolean;
      updatedAt: string;
    }[];
    error?: string;
  };
  layout: string;
  locale: string;
  user: any;
  t: any;
  getProjectAvatarStyles: (name: string) => string;
  mapBundleStatus: (status: string | null | undefined, t: any) => { label: string; dotClass: string };
  getCategoryIcon: (category: string | null | undefined) => any;
  formatRelativeTime: (dateInput: Date | string | null | undefined, locale: string) => string;
};

function GithubAside({
  github,
  projectKeys,
}: {
  github: OverviewTabProps["github"];
  projectKeys: Set<string>;
}) {
  return (
    <Card className="h-fit sticky top-4 border border-hairline">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-sm">GitHub Repositories</CardTitle>
          <CardDescription className="text-[11px]">
            {github.connected ? `Connected as ${github.login || "GitHub user"}` : "Connect GitHub to import repositories."}
          </CardDescription>
        </div>
        <GithubIcon className="size-4 text-ink-mute" />
      </CardHeader>
      <CardContent className="pt-0">

      {!github.connected ? (
        <form action={connectGithubAction} className="mt-3">
          <input type="hidden" name="returnTo" value="/projects?tab=overview" />
          <Button className="h-9 w-full rounded-sm text-xs bg-primary hover:bg-primary-deep text-primary-foreground">Connect GitHub</Button>
        </form>
      ) : (
        <>
          <a
            href={github.profileUrl || `https://github.com/${github.login}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 rounded-md border border-hairline bg-canvas-soft/40 px-2.5 py-2 hover:bg-canvas-soft transition-colors"
          >
            <Avatar className="size-6">
              <AvatarImage src={github.avatarUrl} alt={github.login || "GitHub"} />
              <AvatarFallback>{(github.login || "GH").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-ink">@{github.login || "github-user"}</span>
          </a>
          <form action={disconnectGithubAction} className="mt-2">
            <input type="hidden" name="returnTo" value="/projects?tab=overview" />
            <Button variant="outline" className="h-8 w-full rounded-sm text-xs border-hairline-strong">Disconnect</Button>
          </form>

          {github.error ? <p className="text-xs text-destructive mt-3">{github.error}</p> : null}

          <div className="mt-3 space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {github.repos.length ? (
              github.repos.map((repo) => {
                const repoKey = repo.name.trim().toLowerCase();
                const isCreated = projectKeys.has(repoKey);
                return (
                <div key={repo.id} className="rounded-md border border-hairline bg-canvas-soft/40 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-ink hover:text-ink-secondary truncate block"
                        title={repo.fullName}
                      >
                        {repo.fullName}
                      </a>
                      <p className="text-[11px] text-ink-mute mt-0.5 line-clamp-2">
                        {repo.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-2" />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px] font-mono">{repo.defaultBranch}</Badge>
                    {isCreated ? (
                      <Button asChild variant="outline" className="h-7 px-2.5 rounded-sm text-[10px] border-hairline-strong">
                        <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer">Go to GitHub</a>
                      </Button>
                    ) : (
                      <form action={createProjectFromGithubRepoAction}>
                        <input type="hidden" name="repoName" value={repo.name} />
                        <input type="hidden" name="repoDescription" value={repo.description || ""} />
                        <input type="hidden" name="returnTo" value="/projects?tab=overview" />
                        <Button type="submit" className="h-7 px-2.5 rounded-sm text-[10px] bg-primary hover:bg-primary-deep text-primary-foreground">
                          Create Project
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              )})
            ) : (
              <p className="text-xs text-ink-mute">No repositories found.</p>
            )}
          </div>
        </>
      )}
      </CardContent>
    </Card>
  );
}

function EmptyOverview({ t }: { t: any }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-canvas-soft/50 border border-dashed border-hairline rounded-xl space-y-4 min-h-[300px] animate-in fade-in duration-300">
      <div className="bg-canvas p-4 rounded-lg border border-hairline shadow-light"><Folder className="size-8 text-ink-mute-2" /></div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="font-bold text-lg text-ink">{t("projects_and_bundles.no_projects") || "No projects yet"}</h3>
        <p className="text-sm text-ink-mute leading-relaxed">{t("empty.projects_description") || "Create your first project to get started."}</p>
      </div>
      <Button asChild className="h-10 gap-2 text-xs font-semibold bg-primary hover:bg-primary-deep text-primary-foreground transition-all rounded-sm px-5 shadow-light mt-2">
        <Link href="/projects?dialog=create"><Plus className="size-4" />{t("projects_and_bundles.new_project") || "New Project"}</Link>
      </Button>
    </div>
  );
}

export function OverviewTab({
  data,
  github,
  layout,
  locale,
  user,
  t,
  getProjectAvatarStyles,
  mapBundleStatus,
  getCategoryIcon,
  formatRelativeTime,
}: OverviewTabProps) {
  const projectKeys = new Set<string>(
    data.projects.map((project: any) => String(project.name ?? "").trim().toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
      <div>
        {!data.projects.length ? (
          <EmptyOverview t={t} />
        ) : layout === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.projects.map((project: any) => {
              const bundle = project.bundle;
              const statusInfo = mapBundleStatus(bundle?.status, t);
              const CategoryIcon = getCategoryIcon(bundle?.category);
              const projectSlug = bundle?.slug || project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
              const avatarStyles = getProjectAvatarStyles(project.name);

              return (
                <Card key={project.id} className="group flex flex-col justify-between bg-canvas border border-hairline hover:border-hairline-strong hover:shadow-dark transition-all duration-300 rounded-lg p-5 min-h-[220px] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`size-10 rounded-lg bg-gradient-to-br ${avatarStyles} border flex items-center justify-center text-sm font-bold shrink-0 shadow-inner select-none`}>
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/projects?dialog=edit&id=${project.id}`} className="font-bold text-base text-ink hover:text-ink-secondary transition-colors tracking-tight block truncate">
                            {project.name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5 text-ink-mute">
                            <GithubIcon className="size-3.5 shrink-0" />
                            <span className="text-xs font-mono truncate max-w-[140px]" title={`namhoangdev31/${projectSlug}`}>{`namhoangdev31/${projectSlug}`}</span>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="size-8 text-ink-mute-2 hover:text-ink-secondary hover:bg-canvas-soft rounded-sm shrink-0 transition-colors border border-transparent hover:border-hairline">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[150px] bg-canvas border border-hairline rounded-lg shadow-dark p-1 z-50">
                          <DropdownMenuItem asChild className="cursor-pointer rounded-md p-0">
                            <a href={`/${locale}/projects?dialog=edit&id=${project.id}`} className="flex w-full items-center px-2.5 py-2 text-xs font-semibold text-ink">
                              <Edit3 className="size-3.5 mr-2 text-ink-mute" />
                              <span>{t("table.edit") || "Edit"}</span>
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="cursor-pointer rounded-md p-0 focus:bg-destructive/10">
                            <a href={`/${locale}/projects?dialog=delete&id=${project.id}`} className="flex w-full items-center px-2.5 py-2 text-xs font-semibold text-destructive">
                              <Trash2 className="size-3.5 mr-2 text-destructive" />
                              <span>{t("table.delete") || "Delete"}</span>
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="mt-3.5 text-xs text-ink-mute line-clamp-2 leading-relaxed">{project.description || bundle?.shortDescription || "No description provided."}</p>

                    <div className="flex items-center gap-2 bg-canvas-soft/80 border border-hairline-cool px-2.5 py-1.5 rounded-md mt-4 group-hover:border-hairline-strong transition-colors">
                      <span className={`size-2 rounded-full shrink-0 ${statusInfo.dotClass}`} />
                      <a href={`https://${projectSlug}.rustalgorithm.net`} target="_blank" rel="noopener noreferrer" className="text-[11px] font-mono font-medium text-ink-mute hover:text-ink transition-colors truncate flex-1">{`${projectSlug}.rustalgorithm.net`}</a>
                      <ExternalLink className="size-3 text-ink-mute-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-hairline-cool flex items-center justify-between text-xs text-ink-mute">
                    <div className="flex items-center gap-1.5 bg-canvas-soft border border-hairline px-2 py-1 rounded-full text-[10px] font-semibold text-ink-mute uppercase tracking-wide">
                      <CategoryIcon className="size-3" />
                      <span>{bundle?.category || "web"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-ink-mute-2">{formatRelativeTime(project.updatedAt, locale)}</span>
                      <div className="size-5 rounded-full bg-canvas-soft flex items-center justify-center text-[10px] font-bold text-ink-secondary border border-hairline shadow-light" title={(user.fullName || user.email) ?? undefined}>
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
            {data.projects.map((project: any) => {
              const bundle = project.bundle;
              const statusInfo = mapBundleStatus(bundle?.status, t);
              const CategoryIcon = getCategoryIcon(bundle?.category);
              const projectSlug = bundle?.slug || project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
              const avatarStyles = getProjectAvatarStyles(project.name);

              return (
                <div key={project.id} className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 bg-canvas border border-hairline hover:border-hairline-strong hover:shadow-light transition-all duration-300 rounded-lg p-5">
                  <div className="flex items-center gap-4.5 min-w-0 flex-1 gap-2">
                    <div className={`size-10 rounded-lg bg-gradient-to-br ${avatarStyles} border flex items-center justify-center text-sm font-bold shrink-0 shadow-inner select-none`}>{project.name.charAt(0).toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Link href={`/projects?dialog=edit&id=${project.id}`} className="font-bold text-base tracking-tight text-ink hover:text-ink-secondary transition-colors truncate">{project.name}</Link>
                        <a href={`https://${projectSlug}.rustalgorithm.net`} target="_blank" rel="noopener noreferrer" className="text-xs font-mono font-medium text-ink-mute hover:text-ink-secondary transition-colors flex items-center gap-1 bg-canvas-soft border border-hairline px-2 py-0.5 rounded-md"><span>{`${projectSlug}.rustalgorithm.net`}</span><ExternalLink className="size-3 shrink-0 opacity-60" /></a>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 text-xs text-ink-mute">
                        <div className="flex items-center gap-1 bg-canvas-soft px-1.5 py-0.5 rounded border border-hairline-cool"><GithubIcon className="size-3 text-ink-secondary shrink-0" /><span className="font-mono truncate max-w-[150px]">{`namhoangdev31/${projectSlug}`}</span><span className="text-hairline-strong">•</span><span className="font-mono text-[10px] text-ink-mute flex items-center gap-0.5"><GitBranch className="size-2.5" />main</span></div>
                        <span className="text-hairline-strong">•</span>
                        <span className="truncate max-w-[320px] text-ink-mute-2">{project.description || bundle?.shortDescription || "No description provided."}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-5 border-t border-hairline-cool md:border-t-0 pt-3 md:pt-0 shrink-0">
                    <div className="flex flex-row items-center gap-4 text-xs text-ink-mute">
                      <div className="flex items-center gap-1.5 bg-canvas-soft px-2 py-1 rounded-full border border-hairline"><span className={`size-1.5 rounded-full ${statusInfo.dotClass}`} /><span className="font-semibold text-ink-secondary">{statusInfo.label}</span></div>
                      <div className="flex items-center gap-1 text-[11px] text-ink-mute-2 capitalize"><CategoryIcon className="size-3" /><span>{bundle?.category || "web"}</span></div>
                      <span className="font-sans text-[11px] text-ink-mute-2">{formatRelativeTime(project.updatedAt, locale)}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="size-8 text-ink-mute-2 hover:text-ink-secondary hover:bg-canvas-soft rounded-sm shrink-0 transition-colors border border-transparent hover:border-hairline">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[150px] bg-canvas border border-hairline rounded-lg shadow-dark p-1 z-50">
                        <DropdownMenuItem asChild className="cursor-pointer rounded-md p-0">
                          <a href={`/${locale}/projects?dialog=edit&id=${project.id}`} className="flex w-full items-center px-2.5 py-2 text-xs font-semibold text-ink">
                            <Edit3 className="size-3.5 mr-2 text-ink-mute" />
                            <span>{t("table.edit") || "Edit"}</span>
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer rounded-md p-0 focus:bg-destructive/10">
                          <a href={`/${locale}/projects?dialog=delete&id=${project.id}`} className="flex w-full items-center px-2.5 py-2 text-xs font-semibold text-destructive">
                            <Trash2 className="size-3.5 mr-2 text-destructive" />
                            <span>{t("table.delete") || "Delete"}</span>
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <GithubAside github={github} projectKeys={projectKeys} />
    </div>
  );
}
