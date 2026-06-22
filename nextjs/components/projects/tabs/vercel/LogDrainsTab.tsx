"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  listConfigurableLogDrainsAction,
  deleteConfigurableLogDrainAction,
  createConfigurableLogDrainAction,
} from "@/app/actions/vercel";

interface LogDrainsTabProps {
  project: any;
  returnTo: string;
}

export function LogDrainsTab({ project, returnTo }: LogDrainsTabProps) {
  const [logDrainsList, setLogDrainsList] = useState<any[]>([]);
  const [loadingDrains, setLoadingDrains] = useState(false);
  const [drainsError, setDrainsError] = useState("");

  useEffect(() => {
    const fetchLogDrains = async () => {
      setLoadingDrains(true);
      setDrainsError("");
      try {
        const res = await listConfigurableLogDrainsAction(project.id);
        if (res.success && res.drains) {
          const list = Array.isArray(res.drains)
            ? res.drains
            : (res.drains as any).drains || [];
          setLogDrainsList(list);
        } else {
          setDrainsError(res.error || "Failed to load log drains");
        }
      } catch (err: any) {
        setDrainsError(err?.message || "Failed to load log drains");
      } finally {
        setLoadingDrains(false);
      }
    };
    fetchLogDrains();
  }, [project.id]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="bg-canvas border border-hairline rounded-lg p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base font-bold text-ink">System Log Drains</CardTitle>
          <CardDescription className="text-xs text-ink-mute">
            Configure real-time log forwarding to third-party endpoints such as Datadog, Logflare, or custom Syslog/HTTPS collectors.
          </CardDescription>
        </CardHeader>
        <Separator className="bg-hairline my-4" />
        <CardContent className="px-0">
          {loadingDrains ? (
            <div className="p-6 text-center text-xs text-ink-mute">Loading log drains...</div>
          ) : drainsError ? (
            <div className="p-6 text-center text-xs text-destructive">{drainsError}</div>
          ) : logDrainsList.length === 0 ? (
            <div className="p-6 text-center text-xs text-ink-mute">No log drains configured.</div>
          ) : (
            <div className="rounded-md border border-hairline overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                    <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Name</TableHead>
                    <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Destination URL</TableHead>
                    <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Format</TableHead>
                    <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Sources</TableHead>
                    <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logDrainsList.map((drain) => (
                    <TableRow key={drain.id} className="border-b border-hairline hover:bg-canvas-soft/10">
                      <TableCell className="px-5 py-3 text-xs font-semibold text-ink">{drain.name}</TableCell>
                      <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary truncate max-w-[200px]" title={drain.url}>{drain.url}</TableCell>
                      <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary">{drain.deliveryFormat}</TableCell>
                      <TableCell className="px-5 py-3 text-xs text-ink-mute">{(drain.sources || []).join(", ")}</TableCell>
                      <TableCell className="px-5 py-3 text-right">
                        <form action={deleteConfigurableLogDrainAction}>
                          <input type="hidden" name="projectId" value={project.id} />
                          <input type="hidden" name="logDrainId" value={drain.id} />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <Button type="submit" variant="ghost" className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 px-2 rounded-sm text-xs">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-canvas border border-hairline rounded-lg p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-sm font-bold text-ink">Add Log Drain Endpoint</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <form action={createConfigurableLogDrainAction} className="space-y-4">
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="returnTo" value={returnTo} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="drainName" className="text-xs font-bold text-ink-secondary">Name</Label>
                <Input
                  id="drainName"
                  name="name"
                  placeholder="e.g. Datadog Log Stream"
                  required
                  className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="drainFormat" className="text-xs font-bold text-ink-secondary">Delivery Format</Label>
                <Select name="deliveryFormat" defaultValue="json">
                  <SelectTrigger id="drainFormat" className="bg-canvas-soft border-hairline h-9 text-xs rounded-sm">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent className="bg-canvas border-hairline text-xs">
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="ndjson">NDJSON</SelectItem>
                    <SelectItem value="syslog">Syslog</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="drainUrl" className="text-xs font-bold text-ink-secondary">Endpoint URL</Label>
              <Input
                id="drainUrl"
                name="url"
                placeholder="e.g. https://http-intake.logs.datadoghq.com/... or syslog://..."
                required
                className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
              />
            </div>

            <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
              Create Log Drain
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
