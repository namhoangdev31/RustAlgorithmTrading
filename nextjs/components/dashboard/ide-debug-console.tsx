"use client";

import { useState, useEffect, useRef } from "react";

interface LogEntry {
  id: string;
  level: "log" | "info" | "warn" | "error" | "debug";
  message: string;
  timestamp: number;
  source: string;
  metadata?: Record<string, any>;
}

type ConnectedDeviceFeed = {
  deviceId: string;
  platform: string;
  deviceModel?: string | null;
  status: string;
  pingMs?: number | null;
};

export default function IdeDebugConsole({
  projectId,
  connectedDevices = [],
}: {
  projectId: string;
  connectedDevices?: ConnectedDeviceFeed[];
}) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState<string>("");
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [sessionId, setSessionId] = useState<string>("");

  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  // Prefer real connected device feed when available; otherwise fall back to preview logs.
  useEffect(() => {
    const mockSessionId = `sess_${Math.random().toString(36).substring(2, 11)}`;
    setSessionId(mockSessionId);

    const initialLogs: LogEntry[] = connectedDevices.length
      ? connectedDevices.map((device, index) => ({
          id: `device-${device.deviceId}-${index}`,
          level: device.status === "online" ? "info" : device.status === "stale" ? "warn" : "error",
          message: `${device.deviceModel || device.deviceId} reported ${device.status} heartbeat on ${device.platform}${device.pingMs ? ` (${device.pingMs}ms)` : ""}.`,
          timestamp: Date.now() - (connectedDevices.length - index) * 1000,
          source: "device-feed",
          metadata: {
            deviceId: device.deviceId,
            status: device.status,
          },
        }))
      : [
          {
            id: "1",
            level: "info",
            message: `Debug session initiated. Session ID: ${mockSessionId}`,
            timestamp: Date.now() - 5000,
            source: "system",
          },
          {
            id: "2",
            level: "log",
            message: "Initializing LepoS native environment bridge...",
            timestamp: Date.now() - 4000,
            source: "bridge",
          },
          {
            id: "3",
            level: "debug",
            message: "Configured API gateway route: /api/v1/auth",
            timestamp: Date.now() - 3500,
            source: "gateway",
          },
          {
            id: "4",
            level: "warn",
            message: "Stale cache detected for path: /dashboard/settings",
            timestamp: Date.now() - 2000,
            source: "cache",
          },
          {
            id: "5",
            level: "error",
            message: "Database connection failed. Retrying in 2s...",
            timestamp: Date.now() - 500,
            source: "database",
          },
        ];
    setLogs(initialLogs);

    if (connectedDevices.length) {
      return;
    }

    // Retain preview streaming only when no external device feed is supplied.
    const interval = setInterval(() => {
      const sources = ["webview", "auth", "payment", "cli", "worker"];
      const levels: LogEntry["level"][] = ["log", "info", "warn", "error", "debug"];
      const messages = [
        "User authenticated via OAuth provider Google",
        "Successfully synced SCIM user database mapping",
        "WAF rule triggered: IP rate limits exceeded for 192.168.1.1",
        "Executed background sync task in 143ms",
        "Garbage collection executed, reclaimed 32MB",
        "Stripe payment intent metadata updated",
        "Local dev emulator hot patch applied successfully",
      ];

      const randomSource = sources[Math.floor(Math.random() * sources.length)];
      const randomLevel = levels[Math.floor(Math.random() * levels.length)];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      const newLog: LogEntry = {
        id: Math.random().toString(),
        level: randomLevel,
        message: randomMessage,
        timestamp: Date.now(),
        source: randomSource,
      };

      setLogs((prev) => [...prev, newLog].slice(-500)); // Keep last 500 logs in state
    }, 4000);

    return () => clearInterval(interval);
  }, [connectedDevices, projectId]);

  // Auto scroll logic
  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const clearLogs = () => {
    setLogs([]);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === "all" || log.level === filter;
    const matchesSearch =
      log.message.toLowerCase().includes(searchText.toLowerCase()) ||
      log.source.toLowerCase().includes(searchText.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getLevelBadgeColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "log":
        return "bg-slate-700 text-slate-300 border-slate-600";
      case "info":
        return "bg-blue-900/60 text-blue-300 border-blue-800";
      case "warn":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "error":
        return "bg-red-950/80 text-red-300 border-red-800";
      case "debug":
        return "bg-purple-950/80 text-purple-300 border-purple-800";
      default:
        return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-100">LepoS Debug Console</span>
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span className="text-[10px] text-slate-400">
              {isConnected ? "CONNECTED" : "DISCONNECTED"}
            </span>
          </div>
          {sessionId && (
            <span className="text-[10px] text-slate-500">
              Session: {sessionId}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded border transition-colors ${
              autoScroll
                ? "bg-blue-900/40 text-blue-400 border-blue-800"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
            }`}
          >
            Auto-scroll: {autoScroll ? "ON" : "OFF"}
          </button>
          <button
            onClick={clearLogs}
            className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/20 border-b border-slate-800/60">
        <div className="flex items-center gap-1.5">
          <label htmlFor="severity-filter" className="text-slate-500">Level:</label>
          <select
            id="severity-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-700"
          >
            <option value="all">ALL LEVELS</option>
            <option value="log">LOG</option>
            <option value="info">INFO</option>
            <option value="warn">WARN</option>
            <option value="error">ERROR</option>
            <option value="debug">DEBUG</option>
          </select>
        </div>
        <div className="flex-1 flex items-center gap-1.5">
          <label htmlFor="log-search" className="text-slate-500">Search:</label>
          <input
            id="log-search"
            type="text"
            placeholder="Filter logs by message or source..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-700 placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Log Output Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 selection:bg-blue-500/20">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-600 italic">
            No logs matching criteria
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 hover:bg-slate-900/40 p-0.5 rounded transition-colors group"
            >
              {/* Timestamp */}
              <span className="text-slate-600 select-none">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>

              {/* Badge */}
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getLevelBadgeColor(
                  log.level
                )}`}
              >
                {log.level.toUpperCase()}
              </span>

              {/* Source */}
              <span className="text-slate-500 select-none">
                [{log.source}]
              </span>

              {/* Message */}
              <span
                className={`flex-1 break-all whitespace-pre-wrap ${
                  log.level === "error"
                    ? "text-red-400"
                    : log.level === "warn"
                    ? "text-amber-400"
                    : log.level === "info"
                    ? "text-blue-400"
                    : log.level === "debug"
                    ? "text-purple-400"
                    : "text-slate-300"
                }`}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={consoleEndRef} />
      </div>
    </div>
  );
}
