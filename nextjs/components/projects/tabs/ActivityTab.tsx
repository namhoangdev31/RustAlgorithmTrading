import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProjectTabData } from "./types";
import { formatRelativeTime } from "@/lib/shared/time";

export function ActivityTab({ data, locale }: { data: ProjectTabData; locale: string }) {
  const events = data.projects
    .flatMap((project) => {
      const bundle = project.bundle;
      const status = bundle?.status || "draft";
      return [
        {
          key: `${project.id}-updated`,
          title: "Project updated",
          detail: project.description || bundle?.shortDescription || "Metadata updated.",
          time: project.updatedAt,
          tone: "bg-primary/10 text-ink border-primary/30",
        },
        {
          key: `${project.id}-status`,
          title: "Bundle status changed",
          detail: `Status is now ${status}.`,
          time: bundle?.updatedAt || project.updatedAt,
          tone:
            status === "published"
              ? "bg-primary/10 text-ink border-primary/30"
              : status === "review"
                ? "bg-accent-yellow/20 text-ink border-accent-yellow/40"
                : status === "archived"
                  ? "bg-destructive/10 text-ink border-destructive/30"
                  : "bg-canvas-soft text-ink-mute border-hairline",
        },
      ];
    })
    .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());

  return (
    <Card className="overflow-hidden border border-hairline">
      <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60">
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Deployment, updates, and status changes from all projects.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-hairline-cool">
        {events.map((event) => (
          <div key={event.key} className="px-5 py-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink">{event.title}</p>
                <Badge className={`text-[11px] ${event.tone}`}>{formatRelativeTime(event.time, locale)}</Badge>
              </div>
              <p className="text-xs text-ink-mute mt-1 line-clamp-2">{event.detail}</p>
            </div>
            <Button variant="ghost" size="icon" className="size-8 rounded-sm text-ink-mute-2 hover:text-ink hover:bg-canvas-soft border border-transparent hover:border-hairline">
              <MoreHorizontal className="size-4" />
            </Button>
          </div>
        ))}
        </div>
      </CardContent>
    </Card>
  );
}
