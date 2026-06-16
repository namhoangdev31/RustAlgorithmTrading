"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Gauge, 
  Sparkles, 
  Zap, 
  Layers, 
  MousePointerClick, 
  Smartphone, 
  Monitor, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu,
  History,
  Activity
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SessionReplayTimeline } from "./session-replay-timeline";

interface Project {
  id: string;
  name: string;
}

interface WebVitalsSuggestion {
  metric: string;
  score: number;
  pathname: string;
  diagnosis: string;
  recommendation: string;
}

interface ReplaySession {
  id: string;
  sessionId: string;
  url: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  vitals: {
    name: string;
    value: number;
    rating: "good" | "needs-improvement" | "poor";
  }[];
  hasIssues: boolean;
  events: any;
}

interface PerformanceCluster {
  id: string;
  type: "layout-shift" | "input-lag" | "lcp-slow-paint";
  signature: string;
  occurrences: number;
  affectedSessionsCount: number;
  affectedSessionIds: string[];
  averageImpactValue: number;
  impactScore: number;
  diagnosis: string;
  recommendation: string;
}

interface SpeedInsightsClientProps {
  projects: Project[];
  selectedProjectId: string;
  speedData: {
    success: boolean;
    analysis: {
      totalAnalysed: number;
      healthScore: number;
      suggestions: WebVitalsSuggestion[];
    };
    replays: ReplaySession[];
    clusters: PerformanceCluster[];
    bundleName: string;
    isMock?: boolean;
    error?: string;
  };
}

export function SpeedInsightsClient({ projects, selectedProjectId, speedData }: SpeedInsightsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeProjectId, setActiveProjectId] = useState(selectedProjectId);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<ReplaySession | null>(
    speedData.replays.find(r => r.hasIssues) || speedData.replays[0] || null
  );
  const [filterLaggyOnly, setFilterLaggyOnly] = useState(true);
  const [filterDevice, setFilterDevice] = useState("all");
  const [filterBrowser, setFilterBrowser] = useState("all");
  const [filterOS, setFilterOS] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterEventType, setFilterEventType] = useState("all");

  // Sync state if selected project changes
  useEffect(() => {
    setActiveProjectId(selectedProjectId);
    setSelectedSession(speedData.replays.find(r => r.hasIssues) || speedData.replays[0] || null);
    setSelectedClusterId(null);
    setFilterDevice("all");
    setFilterBrowser("all");
    setFilterOS("all");
    setFilterCountry("all");
    setFilterEventType("all");
  }, [selectedProjectId, speedData]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value;
    setActiveProjectId(nextId);
    
    // Build query params
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("projectId", nextId);
    router.push(`/dashboard/speed-insights?${current.toString()}`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 stroke-emerald-500";
    if (score >= 50) return "text-amber-400 stroke-amber-500";
    return "text-red-400 stroke-red-500";
  };

  const getScoreRating = (score: number) => {
    if (score >= 90) return { label: "Good", desc: "Your application performance is healthy. Core Web Vitals are within normal ranges." };
    if (score >= 50) return { label: "Needs Improvement", desc: "Some interaction pathways show latencies. Apply the recommendations below." };
    return { label: "Poor", desc: "Significant slowdowns detected. Input delay and layout stability require urgent optimizations." };
  };

  const isMobile = (ua: string | null) => {
    if (!ua) return false;
    return /Mobi|Android|iPhone/i.test(ua);
  };

  const activeCluster = speedData.clusters?.find(c => c.id === selectedClusterId);

  const getSessionDevice = (ua: string | null) => {
    if (!ua) return "desktop";
    return /Mobi|Android|iPhone/i.test(ua) ? "mobile" : "desktop";
  };

  const getSessionBrowser = (ua: string | null) => {
    if (!ua) return "unknown";
    const lowercase = ua.toLowerCase();
    if (lowercase.includes("edg")) return "edge";
    if (lowercase.includes("chrome")) return "chrome";
    if (lowercase.includes("safari")) return "safari";
    if (lowercase.includes("firefox")) return "firefox";
    return "other";
  };

  const getSessionOS = (ua: string | null) => {
    if (!ua) return "unknown";
    const lowercase = ua.toLowerCase();
    if (lowercase.includes("iphone") || lowercase.includes("ipad") || lowercase.includes("ipod")) return "ios";
    if (lowercase.includes("android")) return "android";
    if (lowercase.includes("macintosh") || lowercase.includes("mac os x")) return "macos";
    if (lowercase.includes("windows")) return "windows";
    if (lowercase.includes("linux")) return "linux";
    return "other";
  };

  const getSessionCountry = (sessionId: string) => {
    const countries = ["US", "VN", "SG", "DE", "JP"];
    let hash = 0;
    for (let i = 0; i < sessionId.length; i++) {
      hash = sessionId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return countries[Math.abs(hash) % countries.length];
  };

  const getSessionEvents = (events: any): any[] => {
    if (typeof events === "string") {
      try {
        return JSON.parse(events);
      } catch {
        return [];
      }
    }
    return Array.isArray(events) ? events : [];
  };

  const filteredReplays = speedData.replays.filter(r => {
    if (activeCluster && !activeCluster.affectedSessionIds.includes(r.sessionId)) {
      return false;
    }
    if (filterLaggyOnly && !r.hasIssues) {
      return false;
    }
    if (filterDevice !== "all" && getSessionDevice(r.userAgent) !== filterDevice) {
      return false;
    }
    if (filterBrowser !== "all" && getSessionBrowser(r.userAgent) !== filterBrowser) {
      return false;
    }
    if (filterOS !== "all" && getSessionOS(r.userAgent) !== filterOS) {
      return false;
    }
    if (filterCountry !== "all" && getSessionCountry(r.sessionId) !== filterCountry) {
      return false;
    }
    if (filterEventType !== "all") {
      const evs = getSessionEvents(r.events);
      if (!evs.some((e: any) => e.type === filterEventType)) {
        return false;
      }
    }
    return true;
  });

  const healthScore = speedData.analysis?.healthScore || 0;
  const ratingInfo = getScoreRating(healthScore);

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Top Controller */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-hairline/10 backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Gauge className="size-5 text-indigo-400" />
            Core Web Observability
          </h2>
          <p className="text-xs text-slate-400">
            Real-time telemetry ingestion and AI diagnostics paired with visual user action replays.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="project-select" className="text-xs font-semibold text-slate-400">
            Project:
          </label>
          <select
            id="project-select"
            value={activeProjectId}
            onChange={handleProjectChange}
            className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {speedData.isMock && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl px-4 py-2.5 text-xs flex items-center gap-2">
          <Sparkles className="size-4 animate-pulse text-indigo-400 flex-shrink-0" />
          <span>Showing simulated production telemetry diagnostics for <strong>{speedData.bundleName}</strong> because no active telemetry was recorded yet.</span>
        </div>
      )}

      {/* Overview Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Speed Score Gauge */}
        <Card className="lg:col-span-1 border border-hairline bg-canvas-night/40 backdrop-blur-md shadow-lg flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-200">Overall Performance Health</CardTitle>
            <CardDescription className="text-xs text-slate-400">Aggregated Speed Score</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="relative size-32">
              {/* Circular progress bar SVG */}
              <svg className="size-full" viewBox="0 0 36 36">
                <path
                  className="stroke-slate-800"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`transition-all duration-1000 ${getScoreColor(healthScore)}`}
                  strokeDasharray={`${healthScore}, 100`}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-slate-100 tracking-tight">{healthScore}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Health Score</span>
              </div>
            </div>
            
            <div className="text-center flex flex-col gap-1 mt-2">
              <Badge className={`mx-auto font-bold text-xs ${
                healthScore >= 90 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                healthScore >= 50 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                "bg-red-500/10 text-red-400 border-red-500/20"
              }`} variant="outline">
                {ratingInfo.label}
              </Badge>
              <p className="text-xs text-slate-300 leading-relaxed max-w-[240px] mt-1">
                {ratingInfo.desc}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="lg:col-span-2 border border-hairline bg-canvas-night/40 backdrop-blur-md shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="size-4 text-indigo-400 animate-pulse" />
                AI Diagnosis & Recommendations
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Automated code-level suggestions based on Web Vitals telemetry anomalies.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {speedData.analysis?.suggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs gap-2">
                <TrendingUp className="size-8 text-emerald-400" />
                <p>All Core Web Vitals are within normal thresholds. No anomalies detected!</p>
              </div>
            ) : (
              speedData.analysis?.suggestions.map((sug, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-2.5 transition hover:border-slate-700/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      {sug.metric.startsWith("LCP") && <Layers className="size-3.5 text-blue-400" />}
                      {sug.metric.startsWith("INP") && <MousePointerClick className="size-3.5 text-indigo-400" />}
                      {sug.metric.startsWith("CLS") && <AlertTriangle className="size-3.5 text-amber-400" />}
                      {sug.metric}
                    </span>
                    <Badge variant="outline" className="border-red-500/10 bg-red-500/5 text-red-400 text-[10px] font-mono px-2 py-0.5">
                      Average: {sug.metric.startsWith("CLS") ? sug.score.toFixed(3) : `${(sug.score / 1000).toFixed(2)}s`}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-semibold text-slate-400">Diagnosis: </span>{sug.diagnosis}
                  </div>
                  <div className="text-xs text-indigo-200 leading-relaxed bg-indigo-505/5 p-2.5 rounded-lg border border-indigo-500/10 flex gap-2">
                    <Zap className="size-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200">AI Fix suggestion: </span>
                      {sug.recommendation}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Issue Clusters Card */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border border-hairline bg-canvas-night/40 backdrop-blur-md shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Activity className="size-4 text-indigo-400" />
                Performance Anomaly Clusters (Latency & Error Clustering)
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Automatically grouped sessions experiencing slowdowns from a common root cause (element shift, slow click, LCP render paint).
              </CardDescription>
            </div>
            {selectedClusterId && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 px-2 text-[10px] font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/20"
                onClick={() => setSelectedClusterId(null)}
              >
                Clear Filter
              </Button>
            )}
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {!speedData.clusters || speedData.clusters.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-500 text-xs">
                No performance issue clusters detected for this project.
              </div>
            ) : (
              speedData.clusters.map((cluster) => {
                const isSelected = selectedClusterId === cluster.id;
                
                // Color schemes based on cluster type
                let typeBadgeColor = "";
                let typeLabel = "";
                let impactLabel = "";
                let impactValueStr = "";

                if (cluster.type === "layout-shift") {
                  typeBadgeColor = "bg-amber-500/15 text-amber-400 border-amber-500/20";
                  typeLabel = "Layout Shift";
                  impactLabel = "Avg Shift";
                  impactValueStr = cluster.averageImpactValue.toFixed(3);
                } else if (cluster.type === "input-lag") {
                  typeBadgeColor = "bg-red-500/15 text-red-400 border-red-500/20";
                  typeLabel = "Input Lag";
                  impactLabel = "Avg Latency";
                  impactValueStr = `${cluster.averageImpactValue.toFixed(0)}ms`;
                } else if (cluster.type === "lcp-slow-paint") {
                  typeBadgeColor = "bg-blue-500/15 text-blue-400 border-blue-500/20";
                  typeLabel = "LCP Slow Paint";
                  impactLabel = "Avg Render";
                  impactValueStr = `${(cluster.averageImpactValue / 1000).toFixed(2)}s`;
                }

                const totalSessions = speedData.replays.length;
                const affectedRatio = totalSessions > 0 ? Math.round((cluster.affectedSessionsCount / totalSessions) * 100) : 0;

                return (
                  <button
                    key={cluster.id}
                    onClick={() => {
                      setSelectedClusterId(isSelected ? null : cluster.id);
                      // Auto-select the first replay session affected by this cluster if possible
                      if (!isSelected && cluster.affectedSessionIds.length > 0) {
                        const affectedSession = speedData.replays.find(
                          r => r.sessionId === cluster.affectedSessionIds[0]
                        );
                        if (affectedSession) setSelectedSession(affectedSession);
                      }
                    }}
                    className={`text-left p-4 rounded-xl border flex flex-col gap-3 transition-all duration-200 ${
                      isSelected 
                        ? "bg-indigo-500/10 border-indigo-500/40 shadow-inner" 
                        : "bg-slate-900/30 border-slate-900 hover:border-slate-800 hover:bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <Badge variant="outline" className={`font-bold text-[9px] px-1.5 py-0.5 rounded ${typeBadgeColor}`}>
                        {typeLabel}
                      </Badge>
                      <Badge variant="outline" className="border-slate-800 bg-slate-950/40 text-[9px] font-mono text-slate-300">
                        {impactLabel}: {impactValueStr}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Selector / Target</span>
                      <code className="text-xs font-bold font-mono text-slate-100 truncate bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
                        {cluster.signature}
                      </code>
                    </div>

                    <div className="text-[11px] text-slate-300 leading-relaxed font-medium">
                      {cluster.diagnosis}
                    </div>

                    <div className="border-t border-slate-800/60 pt-2.5 mt-auto flex items-center justify-between text-[10px]">
                      <div className="text-slate-400">
                        Occurrences: <span className="text-slate-200 font-bold">{cluster.occurrences}</span>
                      </div>
                      <div className="text-slate-400">
                        Sessions: <span className="text-slate-200 font-bold">{cluster.affectedSessionsCount} ({affectedRatio}%)</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visual Session Replays List */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        
        {/* Sessions Selection List */}
        <Card className="xl:col-span-2 border border-hairline bg-canvas-night/40 backdrop-blur-md shadow-lg flex flex-col max-h-[580px]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-200">Visual Session Replays</CardTitle>
              <CardDescription className="text-xs text-slate-400">Select a session to analyze timeline</CardDescription>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className={`h-7 px-2 text-[10px] font-bold ${
                filterLaggyOnly 
                  ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20" 
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
              onClick={() => setFilterLaggyOnly(!filterLaggyOnly)}
            >
              {filterLaggyOnly ? "Showing Issues Only" : "Showing All Sessions"}
            </Button>
          </CardHeader>
          
          {/* Cohort Filters */}
          <div className="grid grid-cols-5 gap-2 px-6 pb-4 border-b border-slate-800/40">
            <div>
              <label htmlFor="filter-device" className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Device</label>
              <select 
                id="filter-device"
                value={filterDevice} 
                onChange={(e) => setFilterDevice(e.target.value)}
                className="w-full text-[10px] bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-300 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-browser" className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Browser</label>
              <select 
                id="filter-browser"
                value={filterBrowser} 
                onChange={(e) => setFilterBrowser(e.target.value)}
                className="w-full text-[10px] bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-300 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="chrome">Chrome</option>
                <option value="safari">Safari</option>
                <option value="firefox">Firefox</option>
                <option value="edge">Edge</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-os" className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1">OS</label>
              <select 
                id="filter-os"
                value={filterOS} 
                onChange={(e) => setFilterOS(e.target.value)}
                className="w-full text-[10px] bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-300 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="macos">macOS</option>
                <option value="windows">Windows</option>
                <option value="ios">iOS</option>
                <option value="android">Android</option>
                <option value="linux">Linux</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-country" className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Country</label>
              <select 
                id="filter-country"
                value={filterCountry} 
                onChange={(e) => setFilterCountry(e.target.value)}
                className="w-full text-[10px] bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-300 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="US">US</option>
                <option value="VN">VN</option>
                <option value="SG">SG</option>
                <option value="DE">DE</option>
                <option value="JP">JP</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-event" className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Event</label>
              <select 
                id="filter-event"
                value={filterEventType} 
                onChange={(e) => setFilterEventType(e.target.value)}
                className="w-full text-[10px] bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-300 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="click">Click</option>
                <option value="navigation">Navigation</option>
                <option value="paint">Paint</option>
                <option value="layout-shift">Layout Shift</option>
              </select>
            </div>
          </div>

          <CardContent className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2 pb-4 pt-4">
            {filteredReplays.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No session replays found matching filters.
              </div>
            ) : (
              filteredReplays.map((rep) => {
                const isSelected = selectedSession?.id === rep.id;
                const devIcon = isMobile(rep.userAgent) ? (
                  <Smartphone className="size-4.5 text-slate-400" />
                ) : (
                  <Monitor className="size-4.5 text-slate-400" />
                );

                return (
                  <button
                    key={rep.id}
                    className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all duration-200 ${
                      isSelected 
                        ? "bg-indigo-500/10 border-indigo-500/40 shadow-inner" 
                        : "bg-slate-900/30 border-slate-900 hover:border-slate-800 hover:bg-slate-900/50"
                    }`}
                    onClick={() => setSelectedSession(rep)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-900 flex items-center justify-center">
                        {devIcon}
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-xs font-bold text-slate-100 truncate font-mono">
                          {rep.sessionId.slice(0, 16)}...
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-500">{new Date(rep.createdAt).toLocaleTimeString()}</span>
                          <span>•</span>
                          <span className="truncate max-w-[120px]">{rep.url || "/"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {rep.hasIssues ? (
                        <Badge variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 font-bold text-[9px] px-1.5 py-0.5 rounded">
                          Laggy
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-slate-800 text-slate-500 font-bold text-[9px] px-1.5 py-0.5 rounded">
                          Healthy
                        </Badge>
                      )}
                      
                      <div className="flex gap-1.5">
                        {rep.vitals.map((v, i) => (
                          <span 
                            key={i} 
                            className={`text-[9px] font-bold px-1 rounded-sm ${
                              v.rating === "poor" ? "bg-red-500/15 text-red-400" :
                              v.rating === "needs-improvement" ? "bg-amber-500/15 text-amber-400" :
                              "bg-emerald-500/15 text-emerald-400"
                            }`}
                          >
                            {v.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Selected Session Interactive Replay Player */}
        <div className="xl:col-span-3">
          {selectedSession ? (
            <SessionReplayTimeline 
              events={selectedSession.events} 
              sessionId={selectedSession.sessionId} 
              userAgent={selectedSession.userAgent}
            />
          ) : (
            <div className="h-full rounded-2xl border border-dashed border-slate-800 bg-slate-950/20 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
              <Activity className="size-10 text-slate-700 animate-pulse mb-3" />
              <p>Select a session replay from the left to view user interaction timelines.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
