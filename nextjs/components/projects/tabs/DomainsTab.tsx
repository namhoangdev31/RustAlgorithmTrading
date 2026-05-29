"use client";

import { Link } from "@/i18n/navigation";
import { Globe, Plus, Trash2, Key, ArrowUpRight } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { assignAliasAction, deleteAliasAction } from "@/app/actions/vercel";
import { formatRelativeTime } from "@/lib/shared/time";

interface DomainsTabProps {
  vercelConnected: boolean;
  vercelAliases: any[];
  vercelConnectionError?: boolean;
  locale: string;
}

export function DomainsTab({
  vercelConnected,
  vercelAliases,
  vercelConnectionError,
  locale,
}: DomainsTabProps) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);

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
          Unlock domain configuration and alias deployment. Connect your Vercel API key to manage groups, projects, and permissions directly from your dashboard.
        </p>

        <Button asChild className="h-10 bg-primary hover:bg-primary-deep text-primary-foreground font-semibold px-6 rounded-sm shadow-light transition-all text-xs">
          <Link href="/dashboard/settings">
            Configure Vercel API Key
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-hairline bg-canvas py-0">
        <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 flex flex-row items-center justify-between gap-3 p-5">
          <div>
            <CardTitle className="text-base font-bold text-ink">Vercel Aliases</CardTitle>
            <CardDescription className="text-xs text-ink-mute mt-1">
              Active domain mappings, staging subdomains, and alias routing definitions.
            </CardDescription>
          </div>
          <Button 
            onClick={() => setIsAssignOpen(true)}
            className="h-9 rounded-sm text-xs bg-primary hover:bg-primary-deep text-primary-foreground font-semibold flex items-center gap-1.5 px-4 shadow-light"
          >
            <Plus className="size-4" />
            Assign Alias
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {vercelAliases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-10 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink-mute mb-3">
                <Globe className="size-5" />
              </div>
              <p className="text-sm font-semibold text-ink">No Aliases Found</p>
              <p className="text-xs text-ink-mute mt-1">Create your first deployment alias to route public traffic.</p>
            </div>
          ) : (
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="bg-canvas-soft/40 border-b border-hairline">
                  <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Alias</TableHead>
                  <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Target Deployment ID</TableHead>
                  <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Created Time</TableHead>
                  <TableHead className="px-5 py-3 text-right text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vercelAliases.map((alias) => {
                  const createdDate = alias.created ? new Date(alias.created) : (alias.createdAt ? new Date(alias.createdAt) : null);
                  return (
                    <TableRow key={alias.uid} className="hover:bg-canvas-soft/30 transition-colors border-b border-hairline">
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ink">{alias.alias}</span>
                          <a 
                            href={`https://${alias.alias}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-ink-mute hover:text-primary transition-colors"
                          >
                            <ArrowUpRight className="size-3.5" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <code className="text-xs px-2 py-1 rounded bg-canvas-soft border border-hairline text-ink-secondary font-mono">
                          {alias.deploymentId || "N/A"}
                        </code>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-xs text-ink-mute">
                        {createdDate ? formatRelativeTime(createdDate, locale) : "N/A"}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center justify-end">
                          <form action={deleteAliasAction}>
                            <input type="hidden" name="aliasId" value={alias.uid} />
                            <Button 
                              type="submit" 
                              variant="ghost" 
                              size="icon" 
                              className="size-8 text-ink-mute-2 hover:text-destructive hover:bg-destructive/10 rounded-sm"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </form>
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

      {/* Modal Dialog for Assign Alias */}
      {isAssignOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-canvas-night/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0 cursor-default" onClick={() => setIsAssignOpen(false)} />
          <Card className="w-full max-w-md border border-hairline shadow-dark bg-canvas overflow-hidden rounded-xl animate-in zoom-in-95 duration-200 relative z-10 py-0">
            <CardHeader className="border-b border-hairline-cool pb-5 bg-canvas-soft/60">
              <CardTitle className="text-base font-bold text-ink">Assign Alias</CardTitle>
              <CardDescription className="text-xs text-ink-mute mt-1">
                Route a domain name or vercel.app subdomain to an active deployment.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form action={assignAliasAction} onSubmit={() => setIsAssignOpen(false)} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">Deployment ID</Label>
                  <Input 
                    name="deploymentId" 
                    required 
                    placeholder="e.g. dpl_1234..." 
                    className="h-10 bg-canvas border-hairline focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-sm text-sm shadow-light"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">Alias Domain</Label>
                  <Input 
                    name="alias" 
                    required 
                    placeholder="e.g. staging.my-app.com" 
                    className="h-10 bg-canvas border-hairline focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-sm text-sm shadow-light"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAssignOpen(false)}
                    className="h-10 hover:bg-canvas-soft transition-colors border-hairline-strong rounded-sm text-xs font-semibold px-4 text-ink"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="h-10 bg-primary hover:bg-primary-deep text-primary-foreground font-semibold px-6 rounded-sm shadow-light text-xs"
                  >
                    Assign
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
