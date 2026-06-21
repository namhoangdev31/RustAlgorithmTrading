"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, Filter, ShieldCheck } from "lucide-react";

import { exportAuditLogsAction } from "@/app/actions/audit-export";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AuditEntry = {
  id: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  createdAt: string;
  bundleId: string;
  projectId: string | null;
  projectName: string;
  bundleName: string;
  actorUserId: string | null;
  actorName: string;
  actorType: "user" | "system";
};

type AuditProjectOption = {
  id: string;
  name: string;
};

type AuditTimeRange = "all" | "24h" | "7d" | "30d" | "90d";

function readRangeStart(range: AuditTimeRange) {
  if (range === "all") {
    return null;
  }

  const now = Date.now();
  const lookup: Record<Exclude<AuditTimeRange, "all">, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
  };

  return now - lookup[range];
}

function downloadTextFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AuditLogClient({
  title,
  description,
  entries,
  organizationId,
  projectId,
  projectOptions = [],
  allowProjectFilter = false,
}: {
  title: string;
  description: string;
  entries: AuditEntry[];
  organizationId?: string;
  projectId?: string;
  projectOptions?: AuditProjectOption[];
  allowProjectFilter?: boolean;
}) {
  const [actionFilter, setActionFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [timeRange, setTimeRange] = useState<AuditTimeRange>("all");
  const [projectFilter, setProjectFilter] = useState(projectId || "all");
  const [isPending, startTransition] = useTransition();

  const actionOptions = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.action))).sort(),
    [entries]
  );
  const actorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of entries) {
      map.set(entry.actorUserId || "system", entry.actorName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const cutoff = readRangeStart(timeRange);

    return entries.filter((entry) => {
      if (actionFilter !== "all" && entry.action !== actionFilter) {
        return false;
      }

      if (actorFilter !== "all" && (entry.actorUserId || "system") !== actorFilter) {
        return false;
      }

      if (allowProjectFilter && projectFilter !== "all" && entry.projectId !== projectFilter) {
        return false;
      }

      if (cutoff && new Date(entry.createdAt).getTime() < cutoff) {
        return false;
      }

      return true;
    });
  }, [actionFilter, actorFilter, allowProjectFilter, entries, projectFilter, timeRange]);

  const handleExport = (format: "csv" | "json") => {
    startTransition(async () => {
      const result = await exportAuditLogsAction({
        format,
        organizationId: allowProjectFilter && projectFilter === "all" ? organizationId : undefined,
        projectId:
          projectId ||
          (allowProjectFilter && projectFilter !== "all" ? projectFilter : undefined),
        action: actionFilter,
        actorUserId: actorFilter,
        timeRange,
      });

      downloadTextFile(
        result.fileContent,
        result.fileName,
        format === "json" ? "application/json" : "text/csv;charset=utf-8"
      );
    });
  };

  return (
    <Card className="overflow-hidden border border-hairline">
      <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleExport("csv")}>
              <Download className="mr-1 size-3.5" />
              Export CSV
            </Button>
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleExport("json")}>
              <Download className="mr-1 size-3.5" />
              Export JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-hairline bg-canvas-soft/40 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-mute">
            <Filter className="size-3.5 text-indigo-400" />
            Audit filters
          </div>
          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            className="h-8 rounded border border-hairline bg-canvas px-2 text-xs text-ink"
          >
            <option value="all">All actions</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
          <select
            value={actorFilter}
            onChange={(event) => setActorFilter(event.target.value)}
            className="h-8 rounded border border-hairline bg-canvas px-2 text-xs text-ink"
          >
            <option value="all">All actors</option>
            {actorOptions.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.name}
              </option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(event) => setTimeRange(event.target.value as AuditTimeRange)}
            className="h-8 rounded border border-hairline bg-canvas px-2 text-xs text-ink"
          >
            <option value="all">All time</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          {allowProjectFilter ? (
            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="h-8 rounded border border-hairline bg-canvas px-2 text-xs text-ink"
            >
              <option value="all">All projects</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          ) : null}
          <Badge variant="secondary">{filteredEntries.length} entries</Badge>
        </div>

        {filteredEntries.length ? (
          <div className="overflow-x-auto rounded-md border border-hairline">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow className="bg-canvas-soft/40">
                  <TableHead className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Action</TableHead>
                  <TableHead className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Actor</TableHead>
                  <TableHead className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Project</TableHead>
                  <TableHead className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Field</TableHead>
                  <TableHead className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Payload</TableHead>
                  <TableHead className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Recorded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id} className="border-b border-hairline">
                    <TableCell className="px-4 py-3 text-xs">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-ink-secondary">
                      <div className="flex flex-col">
                        <span>{entry.actorName}</span>
                        <span className="text-[10px] text-ink-mute">{entry.actorType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-ink-secondary">{entry.projectName}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-ink-secondary">{entry.fieldName || "—"}</TableCell>
                    <TableCell className="max-w-[260px] truncate px-4 py-3 text-xs text-ink-mute">{entry.oldValue || "—"}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-ink-secondary">
                      <div className="flex flex-col">
                        <span>{new Date(entry.createdAt).toLocaleString()}</span>
                        <span className="text-[10px] text-ink-mute">{entry.id}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-hairline bg-canvas-soft/40 px-4 py-8 text-center text-xs font-medium text-ink-mute">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="size-4 text-indigo-400" />
              No persisted audit logs match the current filters.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
