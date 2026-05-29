import { Edit3, ExternalLink, Folder, GitBranch, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GithubIcon } from "@/components/ui/icon";

export function OverviewTab({
  data,
  layout,
  locale,
  user,
  t,
  getProjectAvatarStyles,
  mapBundleStatus,
  getCategoryIcon,
  formatRelativeTime,
}: any) {
  if (!data.projects.length) {
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

  if (layout !== "grid") {
    return (
      <div className="flex flex-col gap-4">
        {data.projects.map((project: any) => {
          const bundle = project.bundle;
          const statusInfo = mapBundleStatus(bundle?.status, t);
          const CategoryIcon = getCategoryIcon(bundle?.category);
          const projectSlug = bundle?.slug || project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const avatarStyles = getProjectAvatarStyles(project.name);
          return (
            <div key={project.id} className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 bg-canvas border border-hairline hover:border-hairline-strong hover:shadow-light transition-all duration-300 rounded-lg p-5">
              <div className="flex items-center gap-4.5 min-w-0 flex-1">
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
                <DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="size-8 text-ink-mute-2 hover:text-ink-secondary hover:bg-canvas-soft rounded-sm shrink-0 transition-colors border border-transparent hover:border-hairline"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-[140px] bg-canvas border border-hairline rounded-lg shadow-dark p-1 z-50"><DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold py-2 rounded-md"><Link href={`/projects?dialog=edit&id=${project.id}`}><Edit3 className="size-3.5 mr-2 text-ink-mute" />{t("table.edit") || "Edit"}</Link></DropdownMenuItem><DropdownMenuItem asChild className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 text-xs font-semibold py-2 rounded-md"><Link href={`/projects?dialog=delete&id=${project.id}`}><Trash2 className="size-3.5 mr-2 text-destructive" />{t("table.delete") || "Delete"}</Link></DropdownMenuItem></DropdownMenuContent></DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return <div className="text-ink-mute text-sm">Grid view moved to list-style simplified view. We can restore full grid next.</div>;
}
