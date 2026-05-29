import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProjectTabData } from "./types";

export function DomainsTab({ data, locale, formatRelativeTime }: { data: ProjectTabData; locale: string; formatRelativeTime: (v: any, l: string) => string }) {
  return (
    <Card className="overflow-hidden border border-hairline">
      <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Domains</CardTitle>
          <CardDescription>Manage production domains and SSL status for your projects.</CardDescription>
        </div>
        <Button className="h-9 rounded-sm text-xs bg-primary hover:bg-primary-deep text-primary-foreground">Add Domain</Button>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-canvas-soft/40">
              <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Project</TableHead>
              <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Domain</TableHead>
              <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Environment</TableHead>
              <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">SSL</TableHead>
              <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Updated</TableHead>
              <TableHead className="px-5 py-3 text-right text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.projects.map((project) => {
              const bundle = project.bundle;
              const projectSlug = bundle?.slug || project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
              const sslReady = bundle?.status === "published";
              return (
                <TableRow key={`${project.id}-domain`} className="hover:bg-canvas-soft/30 transition-colors">
                  <TableCell className="px-5 py-3">
                    <p className="text-sm font-semibold text-ink">{project.name}</p>
                    <p className="text-xs text-ink-mute mt-0.5">{bundle?.name || "Default bundle"}</p>
                  </TableCell>
                  <TableCell className="px-5 py-3"><p className="text-sm text-ink font-mono">{`${projectSlug}.rustalgorithm.net`}</p></TableCell>
                  <TableCell className="px-5 py-3"><Badge variant="secondary">Production</Badge></TableCell>
                  <TableCell className="px-5 py-3">
                    <Badge className={sslReady ? "bg-primary/10 border-primary/30 text-ink" : "bg-accent-yellow/15 border-accent-yellow/40 text-ink"}>
                      {sslReady ? "Active" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-3 text-xs text-ink-mute">{formatRelativeTime(bundle?.updatedAt || project.updatedAt, locale)}</TableCell>
                  <TableCell className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" className="h-8 rounded-sm text-xs border-hairline-strong">View DNS</Button>
                      <Button variant="ghost" size="icon" className="size-8 rounded-sm text-ink-mute-2 hover:text-ink hover:bg-canvas-soft border border-transparent hover:border-hairline">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
