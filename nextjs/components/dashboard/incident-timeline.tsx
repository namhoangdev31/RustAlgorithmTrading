"use client";

import React, { useState } from "react";
import { 
  AlertTriangle, 
  Activity, 
  CheckCircle2, 
  Layers, 
  ShieldAlert, 
  Wrench, 
  Clock, 
  RefreshCw 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TimelineEvent {
  id: string;
  kind: "waf" | "failover" | "mirror" | "remediation" | "crash";
  title: string;
  description: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  metadata?: Record<string, string>;
}

export function IncidentTimeline({ locale = "en" }: { locale?: string }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const initialEvents: TimelineEvent[] = [
    {
      id: "evt-1",
      kind: "waf",
      title: locale === "vi" ? "Đã chặn yêu cầu tấn công WAF" : "WAF Threat Blocked",
      description: "SQL Injection payload detected in search query. Client IP blocked.",
      timestamp: "5m ago",
      severity: "medium",
      metadata: { Rule: "OWASP-SQLi-942100", Action: "Block (403)", IP: "198.51.100.42" }
    },
    {
      id: "evt-2",
      kind: "failover",
      title: locale === "vi" ? "Kích hoạt chuyển tuyến Anycast DNS" : "Anycast DNS Failover Triggered",
      description: "Primary region ap-southeast-1 health degraded. Automatically failed over to us-east-1 in 450ms.",
      timestamp: "12m ago",
      severity: "high",
      metadata: { Outage: "ap-southeast-1", NewTarget: "us-east-1", Latency: "+120ms" }
    },
    {
      id: "evt-3",
      kind: "mirror",
      title: locale === "vi" ? "Đồng bộ hóa bản sao Artifact thành công" : "Artifact Mirror Sync Complete",
      description: "Staged native production build assets copied successfully to decentralized storage.",
      timestamp: "42m ago",
      severity: "low",
      metadata: { Protocol: "IPFS", CID: "QmXoypizjW3WknFixtdQWyc77Y25H3biX", Size: "4.82 MB" }
    },
    {
      id: "evt-4",
      kind: "remediation",
      title: locale === "vi" ? "Chạy kịch bản tự sửa chữa" : "Auto-Remediation Executed",
      description: "Memory threshold leak check failure triggered automatic routing refresh snapshot.",
      timestamp: "1h 15m ago",
      severity: "medium",
      metadata: { Script: "routing_refresh", Trigger: "MemPeak > 90%", Target: "edge-gateway" }
    },
    {
      id: "evt-5",
      kind: "crash",
      title: locale === "vi" ? "Phát hiện đột biến lỗi crash" : "Native Crash Spike Detected",
      description: "3 identical segmentation violation crashes occurred in less than 10 seconds.",
      timestamp: "2h ago",
      severity: "high",
      metadata: { Version: "v1.2.3-native.4", Exception: "SIGSEGV", Platform: "iOS" }
    }
  ];

  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success(locale === "vi" ? "Đã cập nhật nhật ký sự cố" : "Updated incident timeline logs");
      // Add a simulated new event to show dynamic behavior
      const newEvt: TimelineEvent = {
        id: `evt-${Date.now()}`,
        kind: "waf",
        title: locale === "vi" ? "Quét cổng bị từ chối" : "Port Scan Blocked",
        description: "Rate limit triggered for aggressive connection requests.",
        timestamp: "Just now",
        severity: "low",
        metadata: { Rate: "250req/s", Limit: "100req/s", Client: "edge-client" }
      };
      setEvents(prev => [newEvt, ...prev.filter(e => e.id !== newEvt.id)]);
    }, 600);
  };

  const getEventIcon = (kind: TimelineEvent["kind"]) => {
    switch (kind) {
      case "waf":
        return <ShieldAlert className="size-4 text-rose-400" />;
      case "failover":
        return <AlertTriangle className="size-4 text-amber-400" />;
      case "mirror":
        return <Layers className="size-4 text-emerald-400" />;
      case "remediation":
        return <Wrench className="size-4 text-indigo-400" />;
      case "crash":
        return <ShieldAlert className="size-4 text-red-500 animate-pulse" />;
      default:
        return <Activity className="size-4 text-slate-400" />;
    }
  };

  const getSeverityClass = (severity: TimelineEvent["severity"]) => {
    switch (severity) {
      case "high":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "low":
      default:
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
  };

  return (
    <Card className="border border-hairline bg-canvas py-0">
      <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-bold text-ink">
            {locale === "vi" ? "Nhật ký Sự cố & Vận hành Thống nhất" : "Unified Incident & Operations Timeline"}
          </CardTitle>
          <CardDescription className="text-xs text-ink-mute">
            {locale === "vi"
              ? "Theo dõi trực tiếp các thay đổi định tuyến, sự cố chặn WAF, lỗi crash và các kịch bản tự sửa chữa."
              : "Live chronological telemetry feed of routing redirects, WAF blocks, crash spikes, and remediation triggers."}
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-8 rounded-sm bg-canvas border border-hairline text-ink hover:bg-canvas-soft flex items-center justify-center gap-1.5 text-xs font-semibold px-3 shadow-none shrink-0"
        >
          <RefreshCw className={`size-3 ${isRefreshing ? "animate-spin" : ""}`} />
          {locale === "vi" ? "Làm mới" : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent className="p-5">
        <div className="relative border-l border-slate-800 ml-3.5 pl-6 space-y-6">
          {events.map((evt) => (
            <div key={evt.id} className="relative">
              {/* Event Icon Bubble */}
              <div className="absolute -left-[37px] top-0.5 size-7 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow-md">
                {getEventIcon(evt.kind)}
              </div>

              {/* Event Content card */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-200">{evt.title}</h4>
                  <Badge variant="outline" className={`text-[8px] font-bold px-1.5 py-0 uppercase tracking-wider rounded ${getSeverityClass(evt.severity)}`}>
                    {evt.severity}
                  </Badge>
                  <span className="flex items-center gap-1 text-[9px] text-slate-500 font-mono ml-auto">
                    <Clock className="size-2.5" />
                    {evt.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">{evt.description}</p>

                {/* Metadata tags */}
                {evt.metadata && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(evt.metadata).map(([k, v]) => (
                      <span key={k} className="bg-slate-900/60 border border-slate-900 rounded px-1.5 py-0.5 font-mono text-[9px] text-slate-500 select-text">
                        <span className="text-slate-600 font-semibold mr-0.5">{k}:</span>
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
