"use client";

import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getFirewallConfigAction,
  updateFirewallConfigAction,
  addBypassIpAction,
} from "@/app/actions/vercel";

interface WafTabProps {
  project: any;
  returnTo: string;
}

export function WafTab({ project, returnTo }: WafTabProps) {
  const [firewallConfig, setFirewallConfig] = useState<any>(null);
  const [loadingFirewall, setLoadingFirewall] = useState(false);
  const [firewallError, setFirewallError] = useState("");

  useEffect(() => {
    const fetchFirewall = async () => {
      setLoadingFirewall(true);
      setFirewallError("");
      try {
        const res = await getFirewallConfigAction(project.id);
        if (res.success && res.config) {
          setFirewallConfig(res.config);
        } else {
          setFirewallError(res.error || "Failed to load firewall config");
        }
      } catch (err: any) {
        setFirewallError(err?.message || "Failed to load firewall config");
      } finally {
        setLoadingFirewall(false);
      }
    };
    fetchFirewall();
  }, [project.id]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="bg-canvas border border-hairline rounded-lg p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base font-bold text-ink">Web Application Firewall (WAF) & Security</CardTitle>
          <CardDescription className="text-xs text-ink-mute">
            Protect your applications with an integrated firewall layer. Configure bypass settings for development and external testing tools.
          </CardDescription>
        </CardHeader>
        <Separator className="bg-hairline my-4" />
        <CardContent className="px-0 space-y-6">

          {/* Firewall Status */}
          {loadingFirewall ? (
            <div className="text-xs text-ink-mute py-4 text-center">Loading firewall configuration...</div>
          ) : firewallError ? (
            <div className="text-xs text-destructive py-4 text-center">{firewallError}</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-canvas-soft/20 border border-hairline rounded-md">
              <div className="space-y-1">
                <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <span className={`size-2.5 rounded-full ${firewallConfig?.firewallEnabled ? "bg-emerald-500 animate-pulse" : "bg-ink-mute"}`} />
                  WAF Status: {firewallConfig?.firewallEnabled ? "Enabled (Active)" : "Disabled (Inactive)"}
                </div>
                <div className="text-[10px] text-ink-mute">
                  Configuration version: {firewallConfig?.version || "N/A"} | Last updated: {firewallConfig?.updatedAt ? new Date(parseInt(firewallConfig.updatedAt)).toLocaleString() : "Unknown"}
                </div>
              </div>
              <form action={updateFirewallConfigAction}>
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <input type="hidden" name="firewallEnabled" value={firewallConfig?.firewallEnabled ? "false" : "true"} />
                <Button
                  type="submit"
                  className={`text-xs font-semibold h-9 rounded-sm px-4 ${
                    firewallConfig?.firewallEnabled
                      ? "bg-canvas-soft border border-hairline text-ink hover:bg-canvas-soft/80"
                      : "bg-primary hover:bg-primary-deep text-primary-foreground"
                  }`}
                >
                  {firewallConfig?.firewallEnabled ? "Disable WAF Firewall" : "Enable WAF Firewall"}
                </Button>
              </form>
            </div>
          )}

          <Separator className="bg-hairline" />

          {/* Bypass IP Rules */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-ink-secondary">Bypass IP Rules</div>
            {loadingFirewall ? (
              <div className="text-xs text-ink-mute py-4 text-center">Loading bypass rules...</div>
            ) : firewallConfig?.ips?.length === 0 ? (
              <div className="text-xs text-ink-mute py-4 text-center bg-canvas-soft/10 border border-dashed border-hairline rounded-md">No bypass IP rules active.</div>
            ) : (
              <div className="border border-hairline rounded-md overflow-hidden bg-[#0c0c0d]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                      <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute">IP / Range</TableHead>
                      <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute">Hostname</TableHead>
                      <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute">Action</TableHead>
                      <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {firewallConfig?.ips?.map((ipRule: any) => (
                      <TableRow key={ipRule.id} className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-4 py-3 text-xs font-mono text-ink-secondary">{ipRule.ip}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-ink-secondary">{ipRule.hostname || "All hosts"}</TableCell>
                        <TableCell className="px-4 py-3 text-xs">
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                            {ipRule.action}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <span className="text-[10px] text-ink-mute font-medium">Bypass Rule</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <Separator className="bg-hairline" />

          {/* Add Bypass IP Form */}
          <form action={addBypassIpAction} className="space-y-4">
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="returnTo" value={returnTo} />

            <div className="text-xs font-bold text-ink-secondary">Add Bypass IP / Range</div>

            <div className="space-y-1.5">
              <Label htmlFor="bypassIpInput" className="text-xs font-semibold text-ink-secondary">IP Address or CIDR Range</Label>
              <Input
                id="bypassIpInput"
                name="ip"
                placeholder="e.g. 192.168.1.1 or 200.100.50.0/24"
                required
                className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
              />
            </div>

            <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
              Add Bypass IP Rule
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  );
}
