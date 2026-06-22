"use client";

import {
  Activity,
  Bot,
  Bug,
  Cloud,
  Database,
  Gauge,
  Globe2,
  Plug,
  Shield,
  Terminal,
  Zap,
} from "lucide-react";
import React, { useState, type ReactNode } from "react";

import { purgeNativeCacheAction } from "@/app/actions/native-platform";
import { ConnectedDevicesPanel } from "@/components/dashboard/connected-devices-panel";
import { ArtifactMirrorManager } from "@/components/dashboard/artifact-mirror-manager";
import { FederatedRoutingPanel } from "@/components/dashboard/federated-routing-panel";
import { FinopsSchedulerPanel } from "@/components/dashboard/finops-scheduler-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/shared/time";
import { ErrorTrackerClient } from "@/components/dashboard/error-tracker-client";
import { PluginHubClient } from "@/components/dashboard/plugin-hub-client";
import { CloudFailoverClient } from "@/components/dashboard/cloud-failover-client";
import { RemediationControlPanel } from "@/components/dashboard/remediation-control-panel";
import { SourceMapsManager } from "@/components/dashboard/source-maps-manager";
import { WafThreatMap } from "@/components/dashboard/waf-threat-map";
import { ZeroTrustTelemetryPanel } from "@/components/dashboard/zero-trust-telemetry-panel";
import { IncidentTimeline } from "@/components/dashboard/incident-timeline";

type NativePlatformTabProps = {
  project: any;
  data: any;
  locale: string;
  returnTo?: string;
};

const metricIcons = [Zap, Globe2, Database, Activity, Bug, Plug, Shield, Cloud, Terminal, Bot];

export function NativePlatformTab({ project, data, locale, returnTo }: NativePlatformTabProps) {
  const metricEntries = Object.entries(data.metrics || {});
  const [activeSection, setActiveSection] = useState<"overview" | "routing" | "mirrors" | "observability" | "security" | "operations">("overview");

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {metricEntries.map(([key, value], index) => {
          const Icon = metricIcons[index % metricIcons.length];
          return (
            <Card key={key} className="border border-hairline bg-canvas py-0">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-9 items-center justify-center rounded-md border border-hairline bg-canvas-soft text-ink">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{key}</p>
                  <p className="text-lg font-bold text-ink">{String(value)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-300 w-full">
        {/* Inner Sub-Sidebar Navigation */}
        <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 select-none border-b border-hairline lg:border-b-0 lg:border-r lg:border-hairline pr-0 lg:pr-4 no-scrollbar">
          <button
            onClick={() => setActiveSection("overview")}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
              activeSection === "overview"
                ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
                : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
            }`}
          >
            <Gauge className="size-4 shrink-0" />
            {locale === "vi" ? "Tổng Quan & Bộ Đệm" : "Overview & Cache"}
          </button>
          
          <button
            onClick={() => setActiveSection("routing")}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
              activeSection === "routing"
                ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
                : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
            }`}
          >
            <Globe2 className="size-4 shrink-0" />
            {locale === "vi" ? "Định Tuyến Anycast" : "Anycast Routing"}
          </button>

          <button
            onClick={() => setActiveSection("mirrors")}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
              activeSection === "mirrors"
                ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
                : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
            }`}
          >
            <Plug className="size-4 shrink-0" />
            {locale === "vi" ? "Artifact Sao Bản" : "Artifact Mirrors"}
          </button>

          <button
            onClick={() => setActiveSection("observability")}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
              activeSection === "observability"
                ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
                : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
            }`}
          >
            <Activity className="size-4 shrink-0" />
            {locale === "vi" ? "Giám Sát & Lỗi" : "Observability & Errors"}
          </button>

          <button
            onClick={() => setActiveSection("security")}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
              activeSection === "security"
                ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
                : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
            }`}
          >
            <Shield className="size-4 shrink-0" />
            {locale === "vi" ? "Bảo Mật & Zero-Trust" : "Security & Zero-Trust"}
          </button>

          <button
            onClick={() => setActiveSection("operations")}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
              activeSection === "operations"
                ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
                : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
            }`}
          >
            <Bot className="size-4 shrink-0" />
            {locale === "vi" ? "Tự Sửa & Vận Hành" : "Remediation & FinOps"}
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {activeSection === "overview" && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card className="border border-hairline bg-canvas py-0">
                <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5">
                  <CardTitle className="text-base font-bold text-ink">Edge Routing & Cache</CardTitle>
                  <CardDescription className="text-xs text-ink-mute">
                    Active native deployments, ISR cache state, and manual purge controls.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 p-5">
                  <form action={purgeNativeCacheAction} className="flex flex-col gap-3 sm:flex-row">
                    <input type="hidden" name="projectId" value={project.id} />
                    {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
                    <Input name="path" placeholder="/about" className="h-9 rounded-sm border-hairline bg-canvas text-sm" />
                    <Button type="submit" className="h-9 rounded-sm bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary-deep">
                      Purge Path
                    </Button>
                  </form>

                  <MiniTable
                    empty="No native deployments yet."
                    rows={data.deployments}
                    columns={["Version", "Target", "Status", "Storage"]}
                    render={(deployment) => [
                      deployment.version,
                      deployment.target,
                      <Badge key="status" variant={deployment.status === "active" ? "default" : "secondary"}>{deployment.status}</Badge>,
                      <code key="storage" className="text-[11px] text-ink-mute">{deployment.storagePath}</code>,
                    ]}
                  />
                </CardContent>
              </Card>

              <Card className="border border-hairline bg-canvas py-0">
                <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5">
                  <CardTitle className="text-base font-bold text-ink">Domains & Edge Functions</CardTitle>
                  <CardDescription className="text-xs text-ink-mute">
                    Native SSL state, proxy routing, and isolate function inventory.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 p-5">
                  <MiniTable
                    empty="No native domains configured."
                    rows={data.domains}
                    columns={["Domain", "DNS", "SSL", "TXT token"]}
                    render={(domain) => [
                      domain.domain,
                      domain.dnsVerified ? "verified" : "pending",
                      domain.sslStatus,
                      <code key="txt" className="text-[11px] text-ink-mute">{domain.txtRecordToken}</code>,
                    ]}
                  />
                  <MiniTable
                    empty="No edge functions deployed."
                    rows={data.edgeFunctions}
                    columns={["Route", "Status", "Limit"]}
                    render={(fn) => [fn.routePath, fn.status, `${fn.timeoutMs}ms / ${fn.memoryLimit}MB`]}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "routing" && (
            <div className="space-y-6">
              <FederatedRoutingPanel
                projectId={project.id}
                policy={data.routingPolicy}
                replicas={data.regionReplicas || []}
                deployments={data.deployments || []}
                locale={locale}
                returnTo={returnTo}
              />
              <CloudFailoverClient
                projectId={project.id}
                targets={data.cloudTargets}
                locale={locale}
                returnTo={returnTo}
              />
            </div>
          )}

          {activeSection === "mirrors" && (
            <div className="space-y-6">
              <ArtifactMirrorManager
                projectId={project.id}
                deployments={data.deployments || []}
                mirrors={data.artifactMirrors || []}
                returnTo={returnTo}
              />
              <Card className="border border-hairline bg-canvas py-0">
                <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5">
                  <CardTitle className="text-base font-bold text-ink">Native Pipeline Deployments</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <MiniTable
                    empty="No native deployments yet."
                    rows={data.deployments}
                    columns={["Version", "Target", "Status", "Storage"]}
                    render={(deployment) => [
                      deployment.version,
                      deployment.target,
                      <Badge key="status" variant={deployment.status === "active" ? "default" : "secondary"}>{deployment.status}</Badge>,
                      <code key="storage" className="text-[11px] text-ink-mute">{deployment.storagePath}</code>,
                    ]}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "observability" && (
            <div className="grid grid-cols-1 gap-6">
              <Card className="border border-hairline bg-canvas py-0">
                <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5">
                  <CardTitle className="text-base font-bold text-ink">Analytics, Replay & Errors</CardTitle>
                  <CardDescription className="text-xs text-ink-mute">
                    Recent replay sessions, crash reports, and source-map assisted diagnostics.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 p-5">
                  <MiniTable
                    empty="No replay sessions received."
                    rows={data.replays}
                    columns={["Session", "URL", "Received"]}
                    render={(replay) => [
                      replay.sessionId,
                      replay.url || "-",
                      formatRelativeTime(new Date(replay.createdAt), locale),
                    ]}
                  />
                  <ErrorTrackerClient
                    crashes={data.crashes}
                    projectId={project.id}
                    returnTo={returnTo}
                  />
                  <SourceMapsManager
                    projectId={project.id}
                    sourceMaps={data.sourceMaps || []}
                    returnTo={returnTo}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "security" && (
            <div className="space-y-6">
              <WafThreatMap
                projectId={project.id}
                events={data.wafEvents || []}
                rules={data.wafRules || []}
                returnTo={returnTo}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border border-hairline bg-canvas py-0">
                  <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5">
                    <CardTitle className="text-base font-bold text-ink">WAF Rule Violations</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <MiniTable
                      empty="No WAF events."
                      rows={data.wafEvents}
                      columns={["Fingerprint", "Action", "Reason"]}
                      render={(event) => [event.fingerprint, event.action, event.reason || "-"]}
                    />
                  </CardContent>
                </Card>
                <ConnectedDevicesPanel
                  devices={data.connectedDevices || []}
                  locale={locale}
                />
              </div>
              <ZeroTrustTelemetryPanel
                projectId={project.id}
                identities={data.serviceIdentities || []}
                trustPolicies={data.serviceTrustPolicies || []}
                telemetryEnvelopes={data.telemetryEnvelopes || []}
                telemetrySummary={data.telemetrySummary || { total: 0, byKind: [] }}
                locale={locale}
                returnTo={returnTo}
              />
            </div>
          )}

          {activeSection === "operations" && (
            <div className="space-y-6">
              <IncidentTimeline locale={locale} />
              
              <PluginHubClient
                projectId={project.id}
                installedPlugins={data.plugins}
                allPlugins={data.allPlugins || []}
                returnTo={returnTo}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border border-hairline bg-canvas py-0">
                  <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5">
                    <CardTitle className="text-base font-bold text-ink">AI Copilot Diagnostics</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <MiniTable
                      empty="No AI diagnostics."
                      rows={data.diagnostics}
                      columns={["Status", "Model", "Summary"]}
                      render={(diagnostic) => [diagnostic.status, diagnostic.model || "-", diagnostic.summary]}
                    />
                  </CardContent>
                </Card>
                
                <RemediationControlPanel
                  projectId={project.id}
                  locale={locale}
                  runs={data.remediationRuns || []}
                  deployments={data.deployments || []}
                  returnTo={returnTo}
                />
              </div>

              <FinopsSchedulerPanel
                projectId={project.id}
                locale={locale}
                policy={data.schedulingPolicy}
                signals={data.schedulingSignals || []}
                returnTo={returnTo}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniTable({
  rows,
  columns,
  empty,
  render,
}: {
  rows: any[];
  columns: string[];
  empty: string;
  render: (row: any) => ReactNode[];
}) {
  if (!rows?.length) {
    return (
      <div className="rounded-md border border-dashed border-hairline bg-canvas-soft/40 px-4 py-6 text-center text-xs font-medium text-ink-mute">
        {empty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-hairline">
      <Table className="min-w-[560px]">
        <TableHeader>
          <TableRow className="bg-canvas-soft/40">
            {columns.map((column) => (
              <TableHead key={column} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="border-b border-hairline">
              {render(row).map((cell, index) => (
                <TableCell key={index} className="max-w-[260px] truncate px-4 py-3 text-xs text-ink-secondary">
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
