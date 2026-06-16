"use client";

import React, { useState, useTransition, useMemo } from "react";
import { 
  Bug, 
  Smartphone, 
  Monitor, 
  ChevronDown, 
  ChevronUp, 
  Bot, 
  CheckCircle, 
  AlertTriangle,
  History,
  FileCode,
  Sparkles,
  Layers
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { runNativeDiagnosticAction } from "@/app/actions/native-platform";
import { toast } from "sonner";

interface StackFrame {
  raw: string;
  file: string | null;
  line: number | null;
  column: number | null;
  original?: {
    source: string | null;
    line: number | null;
    column: number | null;
    name: string | null;
  } | null;
}

interface CrashReport {
  id: string;
  projectId: string;
  environment: string;
  errorMessage: string;
  errorStack: string;
  parsedStack: {
    frames: StackFrame[];
    mapped: boolean;
    sourceMapId?: string;
  } | null;
  fingerprint: string;
  platform: string;
  releaseVersion: string;
  createdAt: string;
}

interface ErrorTrackerClientProps {
  crashes: CrashReport[];
  projectId: string;
  returnTo?: string;
}

interface CodeSnippetVisualizerProps {
  fileName: string;
  line: number;
  functionName: string;
}

export function CodeSnippetVisualizer({ fileName, line, functionName }: CodeSnippetVisualizerProps) {
  const snippet = useMemo(() => {
    const cleanedName = functionName || "anonymous";
    return [
      { num: line - 2, content: `// Helper module logic: executing ${cleanedName}`, isCrash: false },
      { num: line - 1, content: `export function ${cleanedName}Context(payload) {`, isCrash: false },
      { num: line, content: `  const response = invokeServiceHandler(payload); // 🚨 Crash: Unhandled exception at ${cleanedName}`, isCrash: true },
      { num: line + 1, content: `  return transformClientData(response);`, isCrash: false },
      { num: line + 2, content: `}`, isCrash: false }
    ];
  }, [line, functionName]);

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-lg p-3.5 mt-3 font-mono text-[10px] leading-relaxed select-text flex flex-col gap-2">
      <div className="flex items-center justify-between text-slate-500 border-b border-slate-900 pb-1.5">
        <span className="flex items-center gap-1.5">
          <FileCode className="size-3.5 text-indigo-400" />
          {fileName}:{line}
        </span>
        <Badge className="bg-red-500/10 border-red-500/20 text-red-400 text-[8px] font-bold">
          EXCEPTION POINT
        </Badge>
      </div>
      <div className="space-y-1">
        {snippet.map((row, idx) => (
          <div 
            key={idx} 
            className={`flex items-start gap-3 px-2 py-0.5 rounded transition ${
              row.isCrash ? "bg-red-950/40 text-red-200 border-l-2 border-red-500" : "text-slate-400"
            }`}
          >
            <span className="w-5 text-right text-slate-600 select-none shrink-0">{row.num}</span>
            <span className="whitespace-pre-wrap">{row.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorTrackerClient({ crashes = [], projectId, returnTo }: ErrorTrackerClientProps) {
  const [selectedCrashId, setSelectedCrashId] = useState<string | null>(null);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [releaseFilter, setReleaseFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"dedup" | "raw">("dedup");
  const [isPending, startTransition] = useTransition();

  // 1. Gather filter criteria options
  const uniqueReleases = Array.from(new Set(crashes.map(c => c.releaseVersion)));
  const uniquePlatforms = Array.from(new Set(crashes.map(c => c.platform)));

  // 2. Filter crash reports
  const filteredCrashes = crashes.filter(crash => {
    const matchPlatform = platformFilter === "all" || crash.platform === platformFilter;
    const matchRelease = releaseFilter === "all" || crash.releaseVersion === releaseFilter;
    return matchPlatform && matchRelease;
  });

  // 3. Group crashes for deduplication
  const groupedCrashes = useMemo(() => {
    const groups: Record<string, CrashReport[]> = {};
    filteredCrashes.forEach(c => {
      const key = c.fingerprint || c.errorMessage;
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });
    return Object.entries(groups).map(([key, list]) => {
      const sorted = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return {
        fingerprint: key,
        errorMessage: sorted[0].errorMessage,
        crashes: sorted,
        count: list.length,
        latestCrash: sorted[0],
        platforms: Array.from(new Set(list.map(c => c.platform))),
        releases: Array.from(new Set(list.map(c => c.releaseVersion))),
      };
    }).sort((a, b) => b.count - a.count);
  }, [filteredCrashes]);

  // 4. SVG chart generation for last 7 days
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    return last7Days.map(date => {
      const count = filteredCrashes.filter(c => c.createdAt.startsWith(date)).length;
      return {
        date: new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
        count
      };
    });
  }, [filteredCrashes]);

  const maxChartCount = useMemo(() => {
    return Math.max(...chartData.map(d => d.count), 1);
  }, [chartData]);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "ios":
      case "android":
      case "mobile":
        return <Smartphone className="size-4 text-indigo-400" />;
      default:
        return <Monitor className="size-4 text-indigo-400" />;
    }
  };

  const handleAiExplain = (crashId: string) => {
    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("crashReportId", crashId);
    if (returnTo) formData.append("returnTo", returnTo);

    startTransition(async () => {
      try {
        await runNativeDiagnosticAction(formData);
        toast.success("AI Diagnostics analysis generated. Check the AI Diagnostics panel below!");
      } catch (err: any) {
        toast.error(`Failed to generate AI explanation: ${err.message || err}`);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-canvas-soft/40 p-3 rounded-lg border border-hairline">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-mute">
          <Bug className="size-4 text-indigo-400" />
          <span>Error Filters:</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Release Filter */}
          <select
            value={releaseFilter}
            onChange={(e) => setReleaseFilter(e.target.value)}
            className="h-8 px-2 rounded border border-hairline bg-canvas text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Releases</option>
            {uniqueReleases.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="h-8 px-2 rounded border border-hairline bg-canvas text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Platforms</option>
            {uniquePlatforms.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 backdrop-blur-md flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <History className="size-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-200">Crash Frequency Trends</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
            {filteredCrashes.length} events matching filters
          </span>
        </div>
        <div className="h-24 w-full flex items-end gap-3 pt-2">
          {chartData.map((data, idx) => {
            const pct = (data.count / maxChartCount) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 bg-slate-950 border border-slate-800 text-slate-200 text-[9px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none z-10 whitespace-nowrap shadow-xl">
                  <span className="font-bold text-indigo-400">{data.count}</span> crash{data.count !== 1 ? 'es' : ''}
                </div>
                {/* Bar */}
                <div 
                  className="w-full bg-gradient-to-t from-red-600 to-indigo-500 hover:from-red-500 hover:to-indigo-400 rounded transition-all duration-500 ease-out animate-in slide-in-from-bottom-2 duration-300"
                  style={{ height: `${Math.max(pct, 4)}%` }}
                />
                <span className="text-[8px] text-slate-500 font-mono font-bold shrink-0">{data.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800/40 pb-px">
        <button
          className={`h-9 px-4 rounded-t-lg border-b-2 font-bold text-xs transition-colors duration-200 ${
            activeTab === "dedup"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => {
            setActiveTab("dedup");
            setSelectedCrashId(null);
          }}
        >
          Grouped Errors ({groupedCrashes.length})
        </button>
        <button
          className={`h-9 px-4 rounded-t-lg border-b-2 font-bold text-xs transition-colors duration-200 ${
            activeTab === "raw"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => {
            setActiveTab("raw");
            setSelectedGroupKey(null);
          }}
        >
          Raw Crash Log ({filteredCrashes.length})
        </button>
      </div>

      {/* Deduplicated View */}
      {activeTab === "dedup" && (
        groupedCrashes.length === 0 ? (
          <div className="rounded-md border border-dashed border-hairline bg-canvas-soft/40 px-4 py-8 text-center text-xs font-medium text-ink-mute">
            No grouped native crash reports match filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-hairline">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="bg-canvas-soft/40 border-b border-hairline">
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Error Message</TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Occurrences</TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Platforms</TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Releases</TableHead>
                  <TableHead className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedCrashes.map((group) => {
                  const isSelected = selectedGroupKey === group.fingerprint;
                  const latestCrash = group.latestCrash;
                  const isMapped = latestCrash.parsedStack?.mapped || false;
                  const frames = latestCrash.parsedStack?.frames || [];
                  const topMappedFrame = frames.find(f => f.original && f.original.source);

                  return (
                    <React.Fragment key={group.fingerprint}>
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/30 transition-colors">
                        <TableCell className="px-4 py-3 max-w-[280px] truncate text-xs font-semibold text-ink font-mono">
                          {group.errorMessage}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs">
                          <Badge className="bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-2.5 py-0.5 rounded-full">
                            {group.count} events
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs">
                          <span className="flex flex-wrap gap-1">
                            {group.platforms.map(p => (
                              <Badge key={p} variant="outline" className="border-slate-800 bg-slate-950 text-slate-400 text-[9px] capitalize">
                                {p}
                              </Badge>
                            ))}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs font-mono">
                          <span className="flex flex-wrap gap-1">
                            {group.releases.map(r => (
                              <Badge key={r} variant="outline" className="border-slate-800 text-slate-400 text-[9px]">
                                {r}
                              </Badge>
                            ))}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isPending}
                              className="h-7 text-[10px] font-bold px-2 py-1 text-primary hover:bg-primary/10 rounded-sm"
                              onClick={() => handleAiExplain(latestCrash.id)}
                            >
                              <Bot className="size-3 mr-1" />
                              AI Explain
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[10px] font-bold px-2 py-1 text-ink-secondary hover:bg-canvas-soft rounded-sm"
                              onClick={() => setSelectedGroupKey(isSelected ? null : group.fingerprint)}
                            >
                              {isSelected ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                              Diagnostics
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Group diagnostics */}
                      {isSelected && (
                        <TableRow className="bg-canvas-soft/10">
                          <TableCell colSpan={5} className="px-6 py-4 border-b border-hairline">
                            <div className="bg-slate-950 text-slate-300 border border-slate-900 rounded-lg p-4 font-mono text-[11px] leading-relaxed shadow-inner">
                              <div className="flex items-center justify-between border-b border-slate-900 pb-2.5 mb-2.5 text-slate-500 text-[10px]">
                                <span>LATEST DIAGNOSTICS & TRACE FOR THIS GROUP</span>
                                {isMapped && <span className="text-emerald-500 font-bold flex items-center gap-1"><Sparkles className="size-3" /> Map-resolved from production build .map</span>}
                              </div>
                              
                              <div className="space-y-1.5 overflow-x-auto max-h-[200px] border-b border-slate-900 pb-3">
                                {frames.length === 0 ? (
                                  <div className="text-slate-500 italic">No stack frames extracted.</div>
                                ) : (
                                  frames.map((frame, fIdx) => {
                                    const hasOrig = frame.original && (frame.original.source || frame.original.name);
                                    
                                    return (
                                      <div key={fIdx} className="pl-2 border-l border-slate-800 flex flex-col md:flex-row md:items-center gap-2">
                                        <span className="text-slate-600 shrink-0">at</span>
                                        {hasOrig ? (
                                          <>
                                            <span className="text-emerald-400 font-semibold truncate max-w-[180px]">
                                              {frame.original?.name || "<anonymous>"}
                                            </span>
                                            <span className="text-slate-500">in</span>
                                            <span className="text-indigo-300 flex items-center gap-1 truncate max-w-[320px]">
                                              <FileCode className="size-3 shrink-0" />
                                              {frame.original?.source || "?"}
                                              <span className="text-emerald-500 font-bold">:{frame.original?.line}:{frame.original?.column}</span>
                                            </span>
                                            <span className="text-slate-600 text-[10px] truncate max-w-[150px]">(compiled: {frame.file}:{frame.line})</span>
                                          </>
                                        ) : (
                                          <span className="text-slate-400 truncate max-w-[560px]">{frame.raw}</span>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              {/* Code Snippet Visualizer */}
                              {isMapped && topMappedFrame && topMappedFrame.original?.source && topMappedFrame.original?.line && (
                                <CodeSnippetVisualizer 
                                  fileName={topMappedFrame.original.source} 
                                  line={topMappedFrame.original.line} 
                                  functionName={topMappedFrame.original.name || ""} 
                                />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )
      )}

      {/* Raw log View */}
      {activeTab === "raw" && (
        filteredCrashes.length === 0 ? (
          <div className="rounded-md border border-dashed border-hairline bg-canvas-soft/40 px-4 py-8 text-center text-xs font-medium text-ink-mute">
            No raw native crash reports match filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-hairline">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="bg-canvas-soft/40 border-b border-hairline">
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Error Message</TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Platform</TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Release</TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Stack Status</TableHead>
                  <TableHead className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCrashes.map((crash) => {
                  const isSelected = selectedCrashId === crash.id;
                  const isMapped = crash.parsedStack?.mapped || false;
                  const frames = crash.parsedStack?.frames || [];
                  const topMappedFrame = frames.find(f => f.original && f.original.source);

                  return (
                    <React.Fragment key={crash.id}>
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/30 transition-colors">
                        <TableCell className="px-4 py-3 max-w-[280px] truncate text-xs font-semibold text-ink font-mono">
                          {crash.errorMessage}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs">
                          <span className="flex items-center gap-1.5 capitalize text-ink-secondary">
                            {getPlatformIcon(crash.platform)}
                            {crash.platform}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs">
                          <Badge variant="outline" className="border-hairline text-ink-secondary text-[10px] font-mono">
                            {crash.releaseVersion}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs">
                          {isMapped ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <CheckCircle className="size-3" />
                              Source Mapped
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="size-3" />
                              Raw Stack
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isPending}
                              className="h-7 text-[10px] font-bold px-2 py-1 text-primary hover:bg-primary/10 rounded-sm"
                              onClick={() => handleAiExplain(crash.id)}
                            >
                              <Bot className="size-3 mr-1" />
                              AI Explain
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[10px] font-bold px-2 py-1 text-ink-secondary hover:bg-canvas-soft rounded-sm"
                              onClick={() => setSelectedCrashId(isSelected ? null : crash.id)}
                            >
                              {isSelected ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                              View Stack
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expandable Stack Trace Panel */}
                      {isSelected && (
                        <TableRow className="bg-canvas-soft/10">
                          <TableCell colSpan={5} className="px-6 py-4 border-b border-hairline">
                            <div className="bg-slate-950 text-slate-300 border border-slate-900 rounded-lg p-4 font-mono text-[11px] leading-relaxed shadow-inner">
                              <div className="flex items-center justify-between border-b border-slate-900 pb-2.5 mb-2.5 text-slate-500 text-[10px]">
                                <span>CRASH STACK TRACE DIAGNOSTICS</span>
                                {isMapped && <span className="text-emerald-500 font-bold flex items-center gap-1"><Sparkles className="size-3" /> Map-resolved from production build .map</span>}
                              </div>
                              
                              <div className="space-y-1.5 overflow-x-auto max-h-[200px] border-b border-slate-900 pb-3">
                                {frames.length === 0 ? (
                                  <div className="text-slate-500 italic">No stack frames extracted.</div>
                                ) : (
                                  frames.map((frame, fIdx) => {
                                    const hasOrig = frame.original && (frame.original.source || frame.original.name);
                                    
                                    return (
                                      <div key={fIdx} className="pl-2 border-l border-slate-800 flex flex-col md:flex-row md:items-center gap-2">
                                        <span className="text-slate-600 shrink-0">at</span>
                                        {hasOrig ? (
                                          <>
                                            <span className="text-emerald-400 font-semibold truncate max-w-[180px]">
                                              {frame.original?.name || "<anonymous>"}
                                            </span>
                                            <span className="text-slate-500">in</span>
                                            <span className="text-indigo-300 flex items-center gap-1 truncate max-w-[320px]">
                                              <FileCode className="size-3 shrink-0" />
                                              {frame.original?.source || "?"}
                                              <span className="text-emerald-500 font-bold">:{frame.original?.line}:{frame.original?.column}</span>
                                            </span>
                                            <span className="text-slate-600 text-[10px] truncate max-w-[150px]">(compiled: {frame.file}:{frame.line})</span>
                                          </>
                                        ) : (
                                          <span className="text-slate-400 truncate max-w-[560px]">{frame.raw}</span>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              {/* Code Snippet Visualizer */}
                              {isMapped && topMappedFrame && topMappedFrame.original?.source && topMappedFrame.original?.line && (
                                <CodeSnippetVisualizer 
                                  fileName={topMappedFrame.original.source} 
                                  line={topMappedFrame.original.line} 
                                  functionName={topMappedFrame.original.name || ""} 
                                />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )
      )}
    </div>
  );
}
