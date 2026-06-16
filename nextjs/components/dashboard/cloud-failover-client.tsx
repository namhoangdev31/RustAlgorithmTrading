"use client";

import { useState, useEffect, useRef } from "react";
import { Cloud, CheckCircle2, AlertTriangle, Play, RefreshCw, MapPin, Activity, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { checkCloudTargetsHealthAction, toggleCloudTargetHealthAction } from "@/app/actions/native-platform";

type CloudTarget = {
  id: string;
  projectId: string;
  provider: string;
  region: string;
  bucket: string | null;
  endpoint: string | null;
  priority: number;
  healthStatus: string;
  lastCheckAt: Date | null;
  metadata: any;
};

type CloudFailoverClientProps = {
  projectId: string;
  targets: CloudTarget[];
  returnTo?: string;
};

export function CloudFailoverClient({ projectId, targets, returnTo }: CloudFailoverClientProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mockCountry, setMockCountry] = useState("VN");

  // Active Browser-Side Health Monitoring Loop (Phase 30)
  useEffect(() => {
    const pingStats: Record<string, { sent: number; failed: number }> = {};
    
    const interval = setInterval(async () => {
      for (const target of targets) {
        if (!target.endpoint) continue;
        
        if (!pingStats[target.id]) {
          pingStats[target.id] = { sent: 0, failed: 0 };
        }
        
        pingStats[target.id].sent++;
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const checkUrl = target.endpoint.startsWith("http") ? target.endpoint : `https://${target.endpoint}`;
          
          await fetch(`${checkUrl}?cb=${Date.now()}`, {
            method: "HEAD",
            signal: controller.signal,
            mode: "no-cors"
          });
          clearTimeout(timeoutId);
        } catch (err) {
          pingStats[target.id].failed++;
        }
        
        const stats = pingStats[target.id];
        if (stats.sent >= 5) {
          const packetLoss = (stats.failed / stats.sent) * 100;
          if (packetLoss > 30 && target.healthStatus !== "offline") {
            console.warn(`[Browser Monitoring] High packet loss (${packetLoss.toFixed(1)}% > 30%) on PoP ${target.region}. Toggling offline...`);
            try {
              const fd = new FormData();
              fd.append("projectId", projectId);
              fd.append("targetId", target.id);
              fd.append("enabled", "unhealthy");
              await toggleCloudTargetHealthAction(fd);
            } catch (err) {
              // Ignore failure
            }
            stats.sent = 0;
            stats.failed = 0;
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [targets]);

  // Local helper to determine where the user gets routed
  const getAnycastRouting = (countryCode: string) => {
    // 1. Get closest preferred region
    let preferredRegion = "eu-west-1";
    let clientLocationName = "Europe & Global";
    let baseLatency = 45;

    if (["VN", "SG", "TH", "MY", "ID", "JP", "KR", "TW", "HK"].includes(countryCode)) {
      preferredRegion = "ap-southeast-1";
      clientLocationName = "Southeast Asia & APAC";
      baseLatency = 15;
    } else if (["US", "CA", "MX", "BR"].includes(countryCode)) {
      preferredRegion = "us-east-1";
      clientLocationName = "North & South America";
      baseLatency = 12;
    }

    // 2. Resolve target region health
    const primary = targets.find((t) => t.region === preferredRegion);
    const primaryOptimal = primary && primary.healthStatus === "healthy";

    if (primaryOptimal) {
      return {
        clientLocationName,
        preferredRegion,
        activeTarget: primary,
        failoverActive: false,
        cdnBackupActive: false,
        latency: baseLatency,
        routePath: `${clientLocationName} ➔ ${primary.metadata?.providerName || primary.provider} (${primary.region})`,
      };
    }

    // 3. Failover logic: find the next healthy target by priority
    const healthyFallbacks = targets
      .filter((t) => t.region !== preferredRegion && t.healthStatus === "healthy")
      .sort((a, b) => a.priority - b.priority);

    const primaryStatus = primary ? primary.healthStatus : "offline";
    const outageReason = primaryStatus === "overloaded" ? "Overload" : "Outage";

    if (healthyFallbacks.length > 0) {
      const fallback = healthyFallbacks[0];
      return {
        clientLocationName,
        preferredRegion,
        activeTarget: fallback,
        failoverActive: true,
        cdnBackupActive: false,
        latency: baseLatency + 120, // latency penalty
        routePath: `${clientLocationName} ➔ (${outageReason} in ${preferredRegion}) ➔ Failover to ${fallback.metadata?.providerName || fallback.provider} (${fallback.region})`,
      };
    }

    // No nodes healthy: Failover to Cloudflare CDN Backup
    return {
      clientLocationName,
      preferredRegion,
      activeTarget: null,
      failoverActive: true,
      cdnBackupActive: true,
      latency: baseLatency + 80,
      routePath: `${clientLocationName} ➔ (${outageReason} in ${preferredRegion}) ➔ All primary regions offline/overloaded ➔ Failover to Cloudflare CDN Backup (Global CDN Edge)`,
    };
  };

  const routing = getAnycastRouting(mockCountry);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Submit forms programmatically or let Next.js trigger Server Action
    const form = document.createElement("form");
    form.action = checkCloudTargetsHealthAction as any;
    
    const projectInput = document.createElement("input");
    projectInput.name = "projectId";
    projectInput.value = projectId;
    form.appendChild(projectInput);

    if (returnTo) {
      const returnInput = document.createElement("input");
      returnInput.name = "returnTo";
      returnInput.value = returnTo;
      form.appendChild(returnInput);
    }

    document.body.appendChild(form);
    form.submit();
  };

  const handleStatusChange = (targetId: string, status: "healthy" | "overloaded" | "unhealthy") => {
    const form = document.createElement("form");
    form.action = toggleCloudTargetHealthAction as any;
    
    const projectInput = document.createElement("input");
    projectInput.name = "projectId";
    projectInput.value = projectId;
    form.appendChild(projectInput);

    const targetInput = document.createElement("input");
    targetInput.name = "targetId";
    targetInput.value = targetId;
    form.appendChild(targetInput);

    const enabledInput = document.createElement("input");
    enabledInput.name = "enabled";
    enabledInput.value = status;
    form.appendChild(enabledInput);

    if (returnTo) {
      const returnInput = document.createElement("input");
      returnInput.name = "returnTo";
      returnInput.value = returnTo;
      form.appendChild(returnInput);
    }

    document.body.appendChild(form);
    form.submit();
  };

  const renderSvgWorldMap = () => {
    // Client location coordinates
    const clientCoords: Record<string, { x: number; y: number }> = {
      VN: { x: 310, y: 155 },
      US: { x: 100, y: 100 },
      GB: { x: 215, y: 75 },
    };

    // Target coordinates
    const targetCoords: Record<string, { x: number; y: number }> = {
      "ap-southeast-1": { x: 320, y: 165 },
      "us-east-1": { x: 110, y: 110 },
      "eu-west-1": { x: 225, y: 85 },
    };

    const clientPt = clientCoords[mockCountry] || clientCoords.VN;
    
    // Find where active target is
    let targetPt = { x: 225, y: 85 }; // Default fallback
    if (routing.activeTarget) {
      targetPt = targetCoords[routing.activeTarget.region] || targetPt;
    } else if (routing.cdnBackupActive) {
      // CDN Backup is global, show a cloud point in the center
      targetPt = { x: 200, y: 120 };
    }

    return (
      <div className="w-full h-[220px] bg-slate-950 border border-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center">
        {/* Mock Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40" />

        {/* SVG Drawing Layer */}
        <svg viewBox="0 0 420 220" className="size-full z-10 relative">
          <defs>
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor={routing.cdnBackupActive ? "#3b82f6" : routing.failoverActive ? "#f43f5e" : "#10b981"} />
            </linearGradient>
          </defs>

          {/* Stylized continent graphics */}
          <ellipse cx="90" cy="110" rx="35" ry="55" className="fill-slate-900/30 stroke-slate-900/50 stroke-dasharray-2" />
          <ellipse cx="110" cy="155" rx="20" ry="30" className="fill-slate-900/30 stroke-slate-900/50 stroke-dasharray-2" />
          <ellipse cx="220" cy="95" rx="30" ry="35" className="fill-slate-900/30 stroke-slate-900/50 stroke-dasharray-2" />
          <ellipse cx="230" cy="155" rx="22" ry="40" className="fill-slate-900/30 stroke-slate-900/50 stroke-dasharray-2" />
          <ellipse cx="330" cy="105" rx="45" ry="40" className="fill-slate-900/30 stroke-slate-900/50 stroke-dasharray-2" />
          <ellipse cx="360" cy="170" rx="20" ry="25" className="fill-slate-900/30 stroke-slate-900/50 stroke-dasharray-2" />

          {/* Connection pathway */}
          {!(routing.cdnBackupActive && !routing.activeTarget) && (
            <path
              d={`M ${clientPt.x} ${clientPt.y} Q ${(clientPt.x + targetPt.x) / 2} ${(clientPt.y + targetPt.y) / 2 - 30} ${targetPt.x} ${targetPt.y}`}
              fill="none"
              stroke="url(#routeGrad)"
              strokeWidth="2"
              strokeDasharray="4 3"
              className="animate-[dash_2s_linear_infinite]"
            />
          )}

          {/* Cloud pop servers */}
          {targets.map((t) => {
            const pt = targetCoords[t.region];
            if (!pt) return null;
            const isTargetActive = routing.activeTarget?.id === t.id;
            const health = t.healthStatus;

            return (
              <g key={t.id}>
                {isTargetActive && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    className={`fill-none stroke-2 animate-ping ${
                      health === "healthy" ? "stroke-emerald-500" :
                      health === "overloaded" ? "stroke-amber-500" : "stroke-rose-500"
                    }`}
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="4.5"
                  className={`stroke-slate-950 stroke-1 ${
                    health === "healthy" ? "fill-emerald-500" :
                    health === "overloaded" ? "fill-amber-500" : "fill-rose-500"
                  }`}
                />
                <text
                  x={pt.x}
                  y={pt.y - 8}
                  textAnchor="middle"
                  className="fill-slate-400 font-mono text-[7px] font-bold"
                >
                  {t.provider.toUpperCase()} ({t.region})
                </text>
              </g>
            );
          })}

          {/* Global CDN Backup Node */}
          {routing.cdnBackupActive && (
            <g>
              <circle
                cx="200"
                cy="120"
                r="10"
                className="fill-none stroke-blue-500 stroke-2 animate-ping"
              />
              <circle
                cx="200"
                cy="120"
                r="6"
                className="fill-blue-500 stroke-slate-950 stroke-1"
              />
              <text
                x="200"
                y="105"
                textAnchor="middle"
                className="fill-blue-400 font-mono text-[7px] font-bold"
              >
                CLOUDFLARE CDN BACKUP
              </text>
            </g>
          )}

          {/* Client device dot */}
          <g>
            <circle
              cx={clientPt.x}
              cy={clientPt.y}
              r="7"
              className="fill-none stroke-indigo-500 stroke-2 animate-pulse"
            />
            <circle
              cx={clientPt.x}
              cy={clientPt.y}
              r="3.5"
              className="fill-indigo-500 stroke-slate-950 stroke-1"
            />
            <text
              x={clientPt.x}
              y={clientPt.y + 12}
              textAnchor="middle"
              className="fill-slate-200 font-mono text-[7px] font-bold"
            >
              CLIENT ({mockCountry})
            </text>
          </g>
        </svg>

        {/* Floating Metrics HUD */}
        <div className="absolute bottom-3 right-3 bg-slate-950/80 border border-slate-900 rounded px-2.5 py-1 text-[9px] font-mono text-slate-400 flex flex-col gap-0.5 z-20 shadow-lg">
          <div>
            Latency: <span className={`font-bold ${routing.latency < 50 ? "text-emerald-400" : "text-amber-400"}`}>{routing.latency}ms</span>
          </div>
          <div>
            Target: <span className="font-bold text-slate-200">{routing.activeTarget?.region || "CDN Edge"}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Split layout Route Map Display Card */}
      <Card className="border border-hairline-cool bg-canvas-soft/40 py-0 shadow-sm">
        <CardContent className="p-4 grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary animate-pulse" />
                <span className="text-sm font-bold text-ink">Anycast DNS Routing Engine</span>
                {routing.cdnBackupActive ? (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-2 py-0 text-[10px] animate-pulse">
                    CDN Backup Active
                  </Badge>
                ) : routing.failoverActive ? (
                  <Badge variant="destructive" className="animate-pulse px-2 py-0 text-[10px]">
                    Failover Active
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 px-2 py-0 text-[10px]">
                    Optimal Path
                  </Badge>
                )}
              </div>
              <p className="text-xs text-ink-mute font-mono leading-relaxed">{routing.routePath}</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-ink-mute font-semibold">Simulated Client Location</span>
                <select
                  value={mockCountry}
                  onChange={(e) => setMockCountry(e.target.value)}
                  className="mt-1 rounded border border-hairline bg-canvas px-2.5 py-1.5 text-xs font-semibold text-ink focus:outline-none"
                >
                  <option value="VN">Vietnam (APAC Region)</option>
                  <option value="US">United States (AMER Region)</option>
                  <option value="GB">United Kingdom (EMEA Region)</option>
                </select>
              </div>

              <Button
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-9 rounded-sm bg-canvas border border-hairline text-ink hover:bg-canvas-soft flex items-center justify-center gap-1.5 text-xs font-semibold shadow-none w-full"
              >
                <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                Check Health Status
              </Button>
            </div>
          </div>

          <div className="lg:col-span-3">
            {renderSvgWorldMap()}
          </div>
        </CardContent>
      </Card>

      {/* Cloud Nodes Status grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {targets.map((target) => {
          const providerName = target.metadata?.providerName || target.provider.toUpperCase();
          const regionName = target.metadata?.regionName || target.region;
          const latency = target.metadata?.latency || 0;

          return (
            <Card key={target.id} className="border border-hairline bg-canvas py-0">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex size-2.5 items-center justify-center">
                      {target.healthStatus === "healthy" ? (
                        <>
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
                        </>
                      ) : target.healthStatus === "overloaded" ? (
                        <>
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex size-2.5 rounded-full bg-amber-500"></span>
                        </>
                      ) : (
                        <>
                          <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex size-2.5 rounded-full bg-rose-500"></span>
                        </>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-ink">{providerName}</h4>
                      <p className="text-[10px] text-ink-mute">{regionName}</p>
                    </div>
                  </div>

                  <Badge 
                    variant="outline" 
                    className={`text-[9px] px-1.5 py-0 font-bold uppercase rounded ${
                      target.healthStatus === "healthy" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      target.healthStatus === "overloaded" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    }`}
                  >
                    {target.healthStatus}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-hairline pt-3 text-[11px]">
                  <div>
                    <span className="block text-ink-mute">Region</span>
                    <code className="text-ink font-semibold">{target.region}</code>
                  </div>
                  <div>
                    <span className="block text-ink-mute">Est. Latency</span>
                    <span className="text-ink font-semibold">
                      {target.healthStatus === "healthy" ? `${latency}ms` : target.healthStatus === "overloaded" ? "350ms" : "-"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-hairline pt-3">
                  <div className="flex items-center gap-1 text-[11px] text-ink-mute">
                    <Activity className="size-3" />
                    <span>Outage Simulator</span>
                  </div>
                  <select
                    value={target.healthStatus}
                    onChange={(e) => handleStatusChange(target.id, e.target.value as any)}
                    className="rounded border border-hairline bg-canvas px-2 py-1 text-xs font-semibold text-ink focus:outline-none"
                  >
                    <option value="healthy">Healthy</option>
                    <option value="overloaded">Overloaded</option>
                    <option value="unhealthy">Offline</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Failover Status & Alert Banner */}
      {routing.failoverActive && (
        <div className={`flex gap-3 rounded-md border p-4 ${
          routing.cdnBackupActive 
            ? "border-blue-500/20 bg-blue-500/5 text-blue-400" 
            : "border-rose-500/20 bg-rose-500/5 text-rose-500"
        }`}>
          <AlertTriangle className="size-5 shrink-0" />
          <div className="space-y-1">
            <h5 className="text-xs font-bold uppercase tracking-wider">
              {routing.cdnBackupActive ? "Cloudflare CDN Backup Activated" : "Anycast DNS Redirect Triggered"}
            </h5>
            <p className="text-xs opacity-90">
              {routing.cdnBackupActive ? (
                <span>All primary cloud targets in <code>{routing.preferredRegion}</code> and backup zones are overloaded or offline. LepoS Dynamic Proxy has automatically failed over to <strong>Cloudflare CDN Backup</strong> (<code>cloudflare-cdn-backup://bundle-assets.lepos.dev</code>) to preserve continuous service availability.</span>
              ) : (
                <span>The primary cloud target region (<code>{routing.preferredRegion}</code>) has experienced an outage or overload. LepoS dynamic proxy automatically rerouted client bundle requests to healthy target <code>{routing.activeTarget?.region || "Local Disk"}</code> in <strong>&lt; 1.2 seconds</strong> with zero service downtime.</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
