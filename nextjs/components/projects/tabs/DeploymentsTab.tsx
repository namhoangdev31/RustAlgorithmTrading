"use client";

import { Link } from "@/i18n/navigation";
import { Layers, Plus, Trash2, Key, ExternalLink, RefreshCw, XCircle } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { cancelDeploymentAction } from "@/app/actions/vercel";
import { formatRelativeTime } from "@/lib/shared/time";

interface DeploymentsTabProps {
  vercelConnected: boolean;
  vercelDeployments: any[];
  vercelConnectionError?: boolean;
  locale: string;
}

export function DeploymentsTab({
  vercelConnected,
  vercelDeployments,
  vercelConnectionError,
  locale,
}: DeploymentsTabProps) {
  if (!vercelConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-canvas-soft border border-hairline rounded-xl max-w-2xl mx-auto my-8 relative overflow-hidden shadow-dark group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-all duration-500" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-all duration-500" />
        
        <div className="size-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 animate-pulse">
          <Key className="size-6 text-primary" />
        </div>
        
        <h3 className="text-lg font-bold text-ink mb-2">Connect Vercel Integration</h3>
        <p className="text-sm text-ink-mute max-w-md mb-8 leading-relaxed">
          Unlock deployment history and pipeline configuration. Connect your Vercel API key to view, inspect, and cancel deployments directly from your dashboard.
        </p>

        <Button asChild className="h-10 bg-primary hover:bg-primary-deep text-primary-foreground font-semibold px-6 rounded-sm shadow-light transition-all text-xs">
          <Link href="/dashboard/settings">
            Configure Vercel API Key
          </Link>
        </Button>
      </div>
    );
  }

  const getStatusDetails = (state: string) => {
    switch (state) {
      case "READY":
        return {
          label: "Ready",
          dotClass: "bg-primary shadow-[0_0_8px_rgba(62,207,142,0.35)]",
          textClass: "text-primary",
        };
      case "BUILDING":
      case "INITIALIZING":
        return {
          label: "Building",
          dotClass: "bg-accent-yellow animate-pulse shadow-[0_0_8px_rgba(255,219,19,0.35)]",
          textClass: "text-accent-yellow",
        };
      case "ERROR":
        return {
          label: "Error",
          dotClass: "bg-destructive shadow-[0_0_8px_rgba(255,34,1,0.35)]",
          textClass: "text-destructive",
        };
      case "CANCELED":
        return {
          label: "Canceled",
          dotClass: "bg-ink-faint",
          textClass: "text-ink-mute",
        };
      default:
        return {
          label: state || "Unknown",
          dotClass: "bg-ink-mute",
          textClass: "text-ink-secondary",
        };
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-hairline bg-canvas py-0">
        <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 flex flex-row items-center justify-between gap-3 p-5">
          <div>
            <CardTitle className="text-base font-bold text-ink">Deployments</CardTitle>
            <CardDescription className="text-xs text-ink-mute mt-1">
              List of recent builds and deployments triggered for your project.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {vercelDeployments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-10 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink-mute mb-3">
                <Layers className="size-5" />
              </div>
              <p className="text-sm font-semibold text-ink">No Deployments Found</p>
              <p className="text-xs text-ink-mute mt-1">Deploy your project to Vercel to see deployment records here.</p>
            </div>
          ) : (
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="bg-canvas-soft/40 border-b border-hairline">
                  <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Deployment</TableHead>
                  <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Status</TableHead>
                  <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Target</TableHead>
                  <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Age</TableHead>
                  <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Creator</TableHead>
                  <TableHead className="px-5 py-3 text-right text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vercelDeployments.map((dpl) => {
                  const createdDate = dpl.created ? new Date(dpl.created) : null;
                  const status = getStatusDetails(dpl.state || dpl.readyState);
                  return (
                    <TableRow key={dpl.uid} className="hover:bg-canvas-soft/30 transition-colors border-b border-hairline">
                      <TableCell className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-ink flex items-center gap-1.5">
                            {dpl.name}
                            {dpl.url && (
                              <a
                                href={`https://${dpl.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-ink-mute hover:text-primary transition-colors"
                              >
                                <ExternalLink className="size-3" />
                              </a>
                            )}
                          </span>
                          <span className="text-xs font-mono text-ink-mute truncate max-w-[280px]">
                            {dpl.url || "Deploying..."}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${status.dotClass}`} />
                          <span className={`text-xs font-semibold ${status.textClass}`}>{status.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${dpl.target === "production" ? "bg-primary/5 border-primary/20 text-primary" : "bg-canvas-soft border-hairline text-ink-mute"}`}>
                          {dpl.target || "preview"}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-xs text-ink-mute">
                        {createdDate ? formatRelativeTime(createdDate, locale) : "N/A"}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-5 border border-hairline">
                            <AvatarFallback className="text-[9px] font-bold text-ink-secondary bg-canvas-soft">
                              {(dpl.creator?.username || dpl.creator?.githubLogin || "U").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-ink-secondary">
                            {dpl.creator?.username || dpl.creator?.githubLogin || "unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center justify-end">
                          {(dpl.state === "BUILDING" || dpl.state === "INITIALIZING" || dpl.state === "QUEUED") ? (
                            <form action={cancelDeploymentAction}>
                              <input type="hidden" name="deploymentId" value={dpl.uid} />
                              <Button 
                                type="submit" 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-xs text-ink-mute-2 hover:text-destructive hover:bg-destructive/10 rounded-sm font-semibold flex items-center gap-1.5"
                              >
                                <XCircle className="size-3.5" />
                                Cancel
                              </Button>
                            </form>
                          ) : (
                            <span className="text-xs text-ink-faint select-none font-medium">Inactive</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
