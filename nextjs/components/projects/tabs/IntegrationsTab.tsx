import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProjectTabData } from "./types";

export function IntegrationsTab({ data }: { data: ProjectTabData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {data.projects.map((project) => {
        const bundle = project.bundle;
        const projectSlug = bundle?.slug || project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const isConnected = bundle?.status === "published";
        return (
          <Card key={`${project.id}-integration`} className="bg-canvas border border-hairline rounded-lg p-5 hover:border-primary/40 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-ink text-base font-semibold">{project.name}</p>
                <p className="text-ink-mute text-xs mt-1">{bundle?.name || "Project Integration Bundle"}</p>
              </div>
              <span className={`text-[11px] px-2 py-1 rounded-full border ${isConnected ? "bg-primary/10 text-ink border-primary/30" : "bg-canvas-soft text-ink-mute border-hairline"}`}>
                {isConnected ? "Connected" : "Not Connected"}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-mute">Domain</span>
                <span className="text-ink font-mono">{`${projectSlug}.rustalgorithm.net`}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-mute">Category</span>
                <span className="text-ink capitalize">{bundle?.category || "web"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-mute">Status</span>
                <span className="text-ink capitalize">{bundle?.status || "draft"}</span>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <Button variant="outline" className="h-9 rounded-sm border-hairline-strong text-xs">Configure</Button>
              <Button className="h-9 rounded-sm text-xs bg-primary hover:bg-primary-deep text-primary-foreground">
                {isConnected ? "Manage" : "Connect"}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
