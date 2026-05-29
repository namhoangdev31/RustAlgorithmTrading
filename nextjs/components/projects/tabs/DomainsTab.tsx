import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectTabData } from "./types";

export function DomainsTab({ data, locale, formatRelativeTime }: { data: ProjectTabData; locale: string; formatRelativeTime: (v: any, l: string) => string }) {
  return (
    <div className="rounded-lg border border-hairline bg-canvas overflow-hidden">
      <div className="px-5 py-4 border-b border-hairline-cool bg-canvas-soft/60 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-ink text-base font-semibold">Domains</h3>
          <p className="text-ink-mute text-xs mt-1">Manage production domains and SSL status for your projects.</p>
        </div>
        <Button className="h-9 rounded-sm text-xs bg-primary hover:bg-primary-deep text-primary-foreground">Add Domain</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-hairline-cool bg-canvas-soft/40">
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Project</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Domain</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Environment</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">SSL</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Updated</th>
              <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.projects.map((project) => {
              const bundle = project.bundle;
              const projectSlug = bundle?.slug || project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
              const sslReady = bundle?.status === "published";
              return (
                <tr key={`${project.id}-domain`} className="border-b border-hairline-cool/80 hover:bg-canvas-soft/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-ink">{project.name}</p>
                    <p className="text-xs text-ink-mute mt-0.5">{bundle?.name || "Default bundle"}</p>
                  </td>
                  <td className="px-5 py-3"><p className="text-sm text-ink font-mono">{`${projectSlug}.rustalgorithm.net`}</p></td>
                  <td className="px-5 py-3"><span className="text-[11px] px-2 py-1 rounded-full border bg-canvas-soft border-hairline text-ink-mute">Production</span></td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] px-2 py-1 rounded-full border ${sslReady ? "bg-primary/10 border-primary/30 text-ink" : "bg-accent-yellow/15 border-accent-yellow/40 text-ink"}`}>
                      {sslReady ? "Active" : "Pending"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-ink-mute">{formatRelativeTime(bundle?.updatedAt || project.updatedAt, locale)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" className="h-8 rounded-sm text-xs border-hairline-strong">View DNS</Button>
                      <Button variant="ghost" size="icon" className="size-8 rounded-sm text-ink-mute-2 hover:text-ink hover:bg-canvas-soft border border-transparent hover:border-hairline">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
