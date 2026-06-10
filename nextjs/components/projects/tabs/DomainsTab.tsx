"use client";

import { Link } from "@/i18n/navigation";
import { 
  Globe, 
  Plus, 
  Trash2, 
  Key, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Copy,
  Check,
  RefreshCw
} from "lucide-react";
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
import { useState, useTransition } from "react";
import { 
  assignAliasAction, 
  deleteAliasAction,
  addProjectDomainAction,
  removeProjectDomainAction,
  verifyProjectDomainAction
} from "@/app/actions/vercel";
import { formatRelativeTime } from "@/lib/shared/time";

interface DomainsTabProps {
  vercelConnected: boolean;
  vercelAliases: any[];
  vercelProjectDomains?: any[];
  vercelProjectId?: string;
  vercelConnectionError?: boolean;
  locale: string;
  returnTo?: string;
}

export function DomainsTab({
  vercelConnected,
  vercelAliases,
  vercelProjectDomains,
  vercelProjectId,
  vercelConnectionError,
  locale,
  returnTo,
}: DomainsTabProps) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [expandedVerification, setExpandedVerification] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedText(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

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
      {/* Project Domains Card */}
      {vercelProjectDomains && vercelProjectId && (
        <Card className="overflow-hidden border border-hairline bg-canvas py-0">
        <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5">
          <div>
            <CardTitle className="text-base font-bold text-ink">Project Domains</CardTitle>
            <CardDescription className="text-xs text-ink-mute mt-1">
              Configure production and preview domains associated with this Vercel project.
            </CardDescription>
          </div>
          <Button 
            onClick={() => setIsAddDomainOpen(true)}
            className="h-9 rounded-sm text-xs bg-primary hover:bg-primary-deep text-primary-foreground font-semibold flex items-center gap-1.5 px-4 shadow-light"
          >
            <Plus className="size-4" />
            Add Domain
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {vercelProjectDomains.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-10 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink-mute mb-3">
                <Globe className="size-5" />
              </div>
              <p className="text-sm font-semibold text-ink">No Project Domains Configured</p>
              <p className="text-xs text-ink-mute mt-1">Add your production domain to route web traffic to this project.</p>
            </div>
          ) : (
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="bg-canvas-soft/40 border-b border-hairline">
                  <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Domain</TableHead>
                  <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Git Branch</TableHead>
                  <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Redirect Target</TableHead>
                  <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Status</TableHead>
                  <TableHead className="px-5 py-3 text-right text-[11px] uppercase tracking-wider text-ink-mute font-semibold w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vercelProjectDomains.map((dom) => {
                  const isVerified = dom.verified;
                  const challenges = dom.verification || [];
                  const isExpanded = expandedVerification[dom.name];

                  return (
                    <>
                      <TableRow key={dom.name} className="hover:bg-canvas-soft/30 transition-colors border-b border-hairline">
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-ink">{dom.name}</span>
                            <a 
                              href={`https://${dom.name}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-ink-mute hover:text-primary transition-colors"
                            >
                              <ArrowUpRight className="size-3.5" />
                            </a>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          {dom.gitBranch ? (
                            <code className="text-xs px-2 py-1 rounded bg-canvas-soft border border-hairline text-ink-secondary font-mono">
                              {dom.gitBranch}
                            </code>
                          ) : (
                            <span className="text-xs text-ink-faint">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary">
                          {dom.redirect ? (
                            <span className="flex items-center gap-1">
                              Redirects to <strong className="font-mono text-ink font-semibold">{dom.redirect}</strong>
                              {dom.redirectStatusCode && (
                                <span className="text-[10px] text-ink-mute bg-canvas-soft px-1 rounded border border-hairline">
                                  {dom.redirectStatusCode}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs text-ink-faint">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                                <CheckCircle2 className="size-3" />
                                Verified
                              </span>
                            ) : (
                              <button
                                onClick={() => setExpandedVerification(prev => ({ ...prev, [dom.name]: !prev[dom.name] }))}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all cursor-pointer"
                              >
                                <AlertTriangle className="size-3" />
                                Needs DNS Config
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!isVerified && (
                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const formData = new FormData();
                                  formData.append("projectId", vercelProjectId || "");
                                  formData.append("domain", dom.name);
                                  if (returnTo) formData.append("returnTo", returnTo);
                                  startTransition(async () => {
                                    await verifyProjectDomainAction(formData);
                                  });
                                }}
                              >
                                <Button 
                                  type="submit" 
                                  variant="ghost" 
                                  size="sm"
                                  disabled={isPending}
                                  className="h-7 text-xs font-semibold px-2 py-1 text-primary hover:bg-primary/10 rounded-sm"
                                >
                                  <RefreshCw className={`size-3 mr-1 ${isPending ? "animate-spin" : ""}`} />
                                  Verify
                                </Button>
                              </form>
                            )}
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (confirm(`Are you sure you want to remove the domain ${dom.name} from this Vercel project?`)) {
                                  const formData = new FormData();
                                  formData.append("projectId", vercelProjectId || "");
                                  formData.append("domain", dom.name);
                                  if (returnTo) formData.append("returnTo", returnTo);
                                  startTransition(async () => {
                                    await removeProjectDomainAction(formData);
                                  });
                                }
                              }}
                            >
                              <Button 
                                type="submit" 
                                variant="ghost" 
                                size="icon" 
                                disabled={isPending}
                                className="size-8 text-ink-mute-2 hover:text-destructive hover:bg-destructive/10 rounded-sm cursor-pointer"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* DNS configuration challenges details row */}
                      {isExpanded && !isVerified && challenges.length > 0 && (
                        <TableRow className="bg-canvas-soft/10">
                          <TableCell colSpan={5} className="px-8 py-4 border-b border-hairline">
                            <div className="space-y-3 max-w-2xl bg-canvas border border-hairline p-4 rounded-md shadow-light">
                              <div className="flex items-start gap-2.5">
                                <Info className="size-4 text-amber-500 mt-0.5 shrink-0" />
                                <div>
                                  <h4 className="text-xs font-bold text-ink">Complete DNS Configuration</h4>
                                  <p className="text-[11px] text-ink-mute leading-relaxed mt-0.5">
                                    Vercel needs to verify your domain ownership. Please add the following DNS record at your domain registrar, then click "Verify".
                                  </p>
                                </div>
                              </div>
                              <div className="border-t border-hairline pt-3 space-y-2.5">
                                {challenges.map((challenge: any, idx: number) => {
                                  const chalId = `${dom.name}-${idx}`;
                                  return (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                                      <div className="space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-ink-mute">Type</span>
                                        <div className="font-mono bg-canvas-soft px-2 py-1 border border-hairline rounded text-ink font-semibold w-fit text-[11px]">{challenge.type || "TXT"}</div>
                                      </div>
                                      <div className="space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-ink-mute">Name/Host</span>
                                        <div className="flex items-center gap-1.5 font-mono bg-canvas-soft px-2 py-1 border border-hairline rounded text-ink text-[11px] overflow-x-auto">
                                          <span>{challenge.domain}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleCopy(challenge.domain, `${chalId}-host`)}
                                            className="text-ink-mute hover:text-ink cursor-pointer ml-auto shrink-0"
                                          >
                                            {copiedText[`${chalId}-host`] ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                                          </button>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-ink-mute">Value</span>
                                        <div className="flex items-center gap-1.5 font-mono bg-canvas-soft px-2 py-1 border border-hairline rounded text-ink text-[11px] overflow-x-auto">
                                          <span>{challenge.value}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleCopy(challenge.value, `${chalId}-val`)}
                                            className="text-ink-mute hover:text-ink cursor-pointer ml-auto shrink-0"
                                          >
                                            {copiedText[`${chalId}-val`] ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
        </Card>
      )}

      {/* Vercel Aliases Card */}
      <Card className="overflow-hidden border border-hairline bg-canvas py-0">
        <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 flex flex-row items-center justify-between gap-3 p-5">
          <div>
            <CardTitle className="text-base font-bold text-ink">Vercel Deployment Aliases</CardTitle>
            <CardDescription className="text-xs text-ink-mute mt-1">
              Configure route paths mapping a subdomain or domain alias directly to specific deployment versions.
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
                            {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
                            <Button 
                              type="submit" 
                              variant="ghost" 
                              size="icon" 
                              className="size-8 text-ink-mute-2 hover:text-destructive hover:bg-destructive/10 rounded-sm cursor-pointer"
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

      {/* Modal Dialog for Add Project Domain */}
      {isAddDomainOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-canvas-night/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0 cursor-default" onClick={() => setIsAddDomainOpen(false)} />
          <Card className="w-full max-w-md border border-hairline shadow-dark bg-canvas overflow-hidden rounded-xl animate-in zoom-in-95 duration-200 relative z-10 py-0">
            <CardHeader className="border-b border-hairline-cool pb-5 bg-canvas-soft/60">
              <CardTitle className="text-base font-bold text-ink">Add Project Domain</CardTitle>
              <CardDescription className="text-xs text-ink-mute mt-1">
                Register a new domain name to this Vercel project configuration.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  formData.append("projectId", vercelProjectId || "");
                  if (returnTo) formData.append("returnTo", returnTo);
                  startTransition(async () => {
                    await addProjectDomainAction(formData);
                    setIsAddDomainOpen(false);
                  });
                }} 
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="domain_name" className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">Domain Name</Label>
                  <Input 
                    id="domain_name"
                    name="domain" 
                    required 
                    placeholder="e.g. example.com" 
                    disabled={isPending}
                    className="h-10 bg-canvas border-hairline focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-sm text-sm shadow-light"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain_branch" className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">Git Branch (Optional)</Label>
                  <Input 
                    id="domain_branch"
                    name="gitBranch" 
                    placeholder="e.g. production" 
                    disabled={isPending}
                    className="h-10 bg-canvas border-hairline focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-sm text-sm shadow-light"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDomainOpen(false)}
                    disabled={isPending}
                    className="h-10 hover:bg-canvas-soft transition-colors border-hairline-strong rounded-sm text-xs font-semibold px-4 text-ink"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isPending}
                    className="h-10 bg-primary hover:bg-primary-deep text-primary-foreground font-semibold px-6 rounded-sm shadow-light text-xs"
                  >
                    {isPending ? "Adding..." : "Add"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

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
                {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
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
