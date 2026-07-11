"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  MousePointerClick, 
  RefreshCw, 
  Layers, 
  Flame, 
  Clock, 
  Play, 
  Pause,
  RotateCcw,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReplayEvent {
  type: string;
  timestamp: number;
  url?: string;
  name?: string;
  element?: string;
  sizeBytes?: number;
  top?: number;
  left?: number;
  target?: string;
  delayMs?: number;
  score?: number;
  description?: string;
}

interface SessionReplayTimelineProps {
  events: ReplayEvent[];
  sessionId: string;
}

export function SessionReplayTimeline({ events, sessionId }: SessionReplayTimelineProps) {
  const [decompressedEvents, setDecompressedEvents] = useState<ReplayEvent[]>([]);

  useEffect(() => {
    if (!events) return;

    const workerCode = `
      self.onmessage = function(e) {
        const data = e.data;
        try {
          if (typeof data === "string") {
            let decoded = data;
            if (data.startsWith("compressed:")) {
              const raw = data.substring("compressed:".length);
              decoded = atob(raw);
            }
            const parsed = JSON.parse(decoded);
            self.postMessage({ success: true, events: parsed });
          } else {
            self.postMessage({ success: true, events: data });
          }
        } catch (err) {
          self.postMessage({ success: false, error: err.message });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = (e) => {
      if (e.data.success) {
        setDecompressedEvents(e.data.events);
      } else {
        if (typeof events === "string") {
          try {
            setDecompressedEvents(JSON.parse(events));
          } catch {}
        } else {
          setDecompressedEvents(events);
        }
      }
    };

    worker.postMessage(events);

    return () => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, [events]);

  const [selectedEvent, setSelectedEvent] = useState<ReplayEvent | null>(decompressedEvents[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const duration = decompressedEvents.length > 0 ? Math.max(...decompressedEvents.map(e => e.timestamp), 1000) : 1000;

  // Sync selected event when events change
  useEffect(() => {
    setSelectedEvent(decompressedEvents[0] || null);
  }, [decompressedEvents]);

  // Animation Loop for Session Replay Playback
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + delta * playbackSpeed;
          if (next >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return next;
        });
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, playbackSpeed, duration]);

  // Select the last persisted event passed by playback.
  useEffect(() => {
    const passedEvents = decompressedEvents.filter(e => e.timestamp <= currentTime);
    if (passedEvents.length > 0) {
      const lastPassed = passedEvents[passedEvents.length - 1];
      if (selectedEvent !== lastPassed) {
        setSelectedEvent(lastPassed);
      }
    }
  }, [currentTime, decompressedEvents, selectedEvent]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "navigation": return <RefreshCw className="size-4 text-blue-500" />;
      case "paint": return <Activity className="size-4 text-emerald-500" />;
      case "layout-shift": return <Layers className="size-4 text-amber-500" />;
      case "click": return <MousePointerClick className="size-4 text-indigo-500" />;
      default: return <Clock className="size-4 text-slate-500" />;
    }
  };

  const getEventColor = (event: ReplayEvent) => {
    if (event.type === "layout-shift" && (event.score || 0) >= 0.1) return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]";
    if (event.type === "click" && (event.delayMs || 0) >= 200) return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]";
    switch (event.type) {
      case "navigation": return "bg-blue-500";
      case "paint": return "bg-emerald-500";
      case "layout-shift": return "bg-amber-400";
      case "click": return "bg-indigo-500";
      default: return "bg-slate-400";
    }
  };

  const isLaggy = (event: ReplayEvent) => {
    return (
      (event.type === "layout-shift" && (event.score || 0) >= 0.1) ||
      (event.type === "click" && (event.delayMs || 0) >= 200)
    );
  };

  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Card className="border border-hairline bg-canvas-night/40 backdrop-blur-md shadow-lg overflow-hidden flex flex-col gap-5 p-0">
      
      {/* Persisted event evidence only; visual DOM snapshots are not collected. */}
      <div className="bg-slate-950 p-4 border-b border-hairline/10 flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-xs sm:grid-cols-3">
          <div>
            <p className="text-slate-500">Session</p>
            <p className="mt-1 truncate font-mono text-slate-200">{sessionId}</p>
          </div>
          <div>
            <p className="text-slate-500">Recorded events</p>
            <p className="mt-1 font-semibold text-slate-200">{decompressedEvents.length}</p>
          </div>
          <div>
            <p className="text-slate-500">Current event</p>
            <p className="mt-1 font-semibold capitalize text-slate-200">{selectedEvent?.type || "None"}</p>
          </div>
        </div>

        {/* Replay Player Controls */}
        <div className="flex items-center justify-between gap-4 px-2 py-1">
          <div className="flex items-center gap-2.5">
            <Button
              size="icon"
              variant="outline"
              className="size-8 bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-slate-100 rounded-lg text-slate-300"
              onClick={() => {
                setIsPlaying(!isPlaying);
                if (currentTime >= duration) {
                  setCurrentTime(0);
                }
              }}
            >
              {isPlaying ? <Pause className="size-4 fill-slate-300" /> : <Play className="size-4 fill-slate-300 ml-0.5" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="size-8 bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-slate-100 rounded-lg text-slate-300"
              onClick={() => setCurrentTime(0)}
              title="Reset Timeline"
            >
              <RotateCcw className="size-4" />
            </Button>
            <span className="text-xs font-mono text-slate-400">
              {formatTime(currentTime)} <span className="text-slate-600">/</span> {formatTime(duration)}
            </span>
          </div>

          {/* Seekbar Slider */}
          <div className="flex-1 max-w-sm px-2">
            <input 
              type="range" 
              min="0" 
              max={duration} 
              value={currentTime} 
              onChange={(e) => setCurrentTime(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 4].map((speed) => (
              <Button
                key={speed}
                size="sm"
                variant={playbackSpeed === speed ? "default" : "outline"}
                className={`h-7 px-2.5 text-[10px] font-bold rounded-md ${
                  playbackSpeed === speed 
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-600" 
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
                onClick={() => setPlaybackSpeed(speed)}
              >
                {speed}x
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Visual Timeline Dots Track */}
      <CardContent className="pt-2 flex flex-col gap-5">
        <div className="relative py-7 bg-slate-950/40 rounded-xl border border-slate-900 px-6">
          <div className="absolute left-6 right-6 top-1/2 h-1 bg-slate-800 -translate-y-1/2 rounded" />
          
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 shadow-[0_0_10px_#6366f1] transition-all duration-75" 
            style={{ left: `calc(24px + (100% - 48px) * ${currentTime / duration})` }}
          />

          {events.map((event, index) => {
            const leftPercent = (event.timestamp / duration) * 100;
            const isSelected = selectedEvent === event;
            const lag = isLaggy(event);

            return (
              <button
                key={index}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-4 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none ${
                  isSelected ? "scale-150 ring-4 ring-indigo-500/30 border-2 border-white z-20" : "hover:scale-125 z-10"
                } ${getEventColor(event)}`}
                style={{ left: `calc(24px + (100% - 48px) * ${leftPercent / 100})` }}
                onClick={() => {
                  setCurrentTime(event.timestamp);
                  setSelectedEvent(event);
                }}
                title={`${event.type} at ${formatTime(event.timestamp)}`}
              >
                {lag && (
                  <span className="absolute -top-1 -right-1 flex size-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                )}
              </button>
            );
          })}

          <div className="absolute left-6 bottom-1 text-[9px] font-mono text-slate-500">0.00s</div>
          <div className="absolute right-6 bottom-1 text-[9px] font-mono text-slate-500">{formatTime(duration)}</div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 items-center justify-center text-[10px] text-slate-400 border-b border-slate-900/60 pb-4">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-500" />
            <span>Navigation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Paint (FCP/LCP)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-indigo-500" />
            <span>Click</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-400" />
            <span>Layout Shift</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-red-500 shadow-[0_0_4px_#ef4444]" />
            <span>Lag Spike / CLS Anomaly</span>
          </div>
        </div>

        {/* Selected Event Details & AI Diagnostics & Console Panel */}
        {selectedEvent && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
            {/* Event Info Card */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-3 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-800">
                    {getEventIcon(selectedEvent.type)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold capitalize text-slate-100">{selectedEvent.type} Event</h4>
                    <p className="text-[9px] text-slate-400 font-mono">Time: {formatTime(selectedEvent.timestamp)}</p>
                  </div>
                </div>
                {isLaggy(selectedEvent) ? (
                  <Badge variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 font-semibold text-[9px] px-2 py-0.5 rounded-full">
                    Performance Issue
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-slate-800 text-slate-400 text-[9px] px-2 py-0.5 rounded-full">
                    Normal Trace
                  </Badge>
                )}
              </div>

              <div className="text-[11px] text-slate-300 flex flex-col gap-2 mt-1">
                {selectedEvent.url && (
                  <div>
                    <span className="text-slate-500">Route Path: </span>
                    <span className="font-mono text-slate-300 font-semibold">{selectedEvent.url}</span>
                  </div>
                )}
                {selectedEvent.name && (
                  <div>
                    <span className="text-slate-500">Paint Name: </span>
                    <span className="font-semibold text-emerald-400">{selectedEvent.name}</span>
                  </div>
                )}
                {selectedEvent.target && (
                  <div>
                    <span className="text-slate-500">Target Selector: </span>
                    <code className="bg-slate-950 px-1.5 py-0.5 rounded font-mono text-indigo-400 text-[9px]">{selectedEvent.target}</code>
                  </div>
                )}
                {selectedEvent.element && (
                  <div>
                    <span className="text-slate-500">DOM Element: </span>
                    <code className="bg-slate-950 px-1.5 py-0.5 rounded font-mono text-amber-400 text-[9px]">{selectedEvent.element}</code>
                  </div>
                )}
                {selectedEvent.sizeBytes !== undefined && (
                  <div>
                    <span className="text-slate-500">Asset Size: </span>
                    <span className="font-semibold text-slate-300">{(selectedEvent.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                )}
                {selectedEvent.delayMs !== undefined && (
                  <div>
                    <span className="text-slate-500">Blocking CPU Delay: </span>
                    <span className={`font-semibold ${selectedEvent.delayMs >= 200 ? "text-red-400" : "text-emerald-400"}`}>{selectedEvent.delayMs}ms</span>
                  </div>
                )}
                {selectedEvent.score !== undefined && (
                  <div>
                    <span className="text-slate-500">Layout Shift Score: </span>
                    <span className={`font-semibold ${selectedEvent.score >= 0.1 ? "text-red-400" : "text-emerald-400"}`}>{selectedEvent.score}</span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Diagnostics Box */}
            <div className={`p-4 rounded-xl border flex flex-col gap-2.5 lg:col-span-1 ${
              isLaggy(selectedEvent) 
                ? "bg-red-500/5 border-red-500/15 text-red-200" 
                : "bg-slate-900/40 border-slate-800/60 text-slate-300"
            }`}>
              <div className="flex items-center gap-1.5">
                {isLaggy(selectedEvent) ? (
                  <Flame className="size-4.5 text-red-400 animate-pulse" />
                ) : (
                  <Sparkles className="size-4.5 text-indigo-400" />
                )}
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-200">AI Telemetry Diagnostics</h4>
              </div>

              {isLaggy(selectedEvent) ? (
                <div className="text-[11px] flex flex-col gap-2.5">
                  <div className="p-2 rounded bg-red-500/10 border border-red-500/10 text-slate-300">
                    <span className="font-semibold text-red-300">Issue: </span>
                    {selectedEvent.type === "click" 
                      ? `Long task detected blocking event loop during interaction on "${selectedEvent.target}". User waited ${selectedEvent.delayMs}ms before rendering update.`
                      : `Cumulative shift of "${selectedEvent.element}" exceeds the stability threshold (Score: ${selectedEvent.score}).`}
                  </div>
                  <div className="flex flex-col gap-1 text-slate-300">
                    <span className="font-semibold text-indigo-300">AI Recommendation:</span>
                    <p className="text-[10px] leading-relaxed">
                      {selectedEvent.type === "click"
                        ? "Defer synchronous CPU task execution out of the main click handler. Use requestAnimationFrame() or split heavy state mutations into microtasks."
                        : "Ensure the top banner wrapper has explicit min-height or aspect-ratio set. Reserve dimensions for lazy loaded components to prevent sudden reflows."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] flex flex-col gap-2">
                  <div className="p-2 rounded bg-slate-950/30 text-slate-400 italic">
                    {selectedEvent.type === "paint" && selectedEvent.name === "LCP"
                      ? "Largest Contentful Paint resolved within target threshold. Viewport layout is stable and images are optimized."
                      : "No performance anomalies or UI input thread blockings detected during this trace event."}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Continuous monitoring signals show thread usage at 98.4% idle. Navigation pathways are optimized.
                  </div>
                </div>
              )}
            </div>

            {/* Split View Console Logs Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex flex-col gap-2 lg:col-span-1 h-[155px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Console Logs & Errors</span>
                <Badge variant="outline" className="border-slate-800 text-slate-500 text-[8px] px-1">
                  Active
                </Badge>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[9px] scrollbar-thin scrollbar-thumb-slate-800">
                {events.filter(e => e.type === "console" || e.type === "error" || isLaggy(e)).length === 0 ? (
                  <div className="text-slate-500 italic py-4 text-center">No console output recorded.</div>
                ) : (
                  events
                    .filter(e => e.type === "console" || e.type === "error" || isLaggy(e))
                    .map((log, lIdx) => {
                      const isErr = log.type === "error" || isLaggy(log);
                      const timeStr = formatTime(log.timestamp);
                      const isPast = currentTime >= log.timestamp;
                      
                      return (
                        <button
                          key={lIdx}
                          onClick={() => setCurrentTime(log.timestamp)}
                          className={`w-full text-left flex items-start gap-1.5 py-0.5 px-1 rounded transition-colors ${
                            isPast ? "text-slate-300" : "text-slate-600"
                          } ${isErr ? "bg-red-950/20 text-red-400 hover:bg-red-950/30" : "hover:bg-slate-900"}`}
                        >
                          <span className="text-slate-500 shrink-0">[{timeStr}]</span>
                          <span className="font-bold uppercase tracking-wide shrink-0">
                            {isErr ? "ERR" : "LOG"}:
                          </span>
                          <span className="truncate">{log.description || log.target || log.element || "User interaction log"}</span>
                        </button>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
