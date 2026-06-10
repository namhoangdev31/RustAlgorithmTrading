import { promises as fs } from "fs";
import path from "path";
import { AlertTriangle, CheckCircle, RefreshCw, Terminal } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

interface LepoShipTerminalProps {
  projectId: string;
  buildNumber: number;
}

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

async function readBuildLogs(projectId: string, buildNumber: number) {
  const safeProjectId = safeSegment(projectId);
  const logFile = path.join(
    process.cwd(),
    "public",
    "bundles",
    safeProjectId,
    `${buildNumber}.log`
  );

  try {
    return await fs.readFile(logFile, "utf8");
  } catch {
    return "Build log is not available yet. Refresh after the build agent writes its first line.";
  }
}

export async function LepoShipTerminal({
  projectId,
  buildNumber,
}: LepoShipTerminalProps) {
  const logs = await readBuildLogs(projectId, buildNumber);
  const status = logs.includes(`--- LepoShip Build #${buildNumber} Succeeded ---`)
    ? "success"
    : logs.includes(`--- LepoShip Build #${buildNumber} Failed ---`)
      ? "failed"
      : "building";
  const logLines = logs.split("\n").filter((line) => line.trim() !== "");

  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-black/95 shadow-dark select-text">
      <div className="flex items-center justify-between gap-3 border-b border-hairline bg-canvas-soft/10 px-4 py-2.5 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="text-emerald-400" />
          <span className="text-xs font-bold text-ink">
            LepoShip Build Agent Console (Build #{buildNumber})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {status === "building" ? (
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
              <RefreshCw className="animate-spin" />
              Compiling
            </span>
          ) : null}
          {status === "success" ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
              <CheckCircle />
              Succeeded
            </span>
          ) : null}
          {status === "failed" ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-destructive">
              <AlertTriangle />
              Failed
            </span>
          ) : null}
          <Button asChild size="sm" variant="outline">
            <Link href={`/lepoship/${projectId}?buildTriggered=true`}>
              <RefreshCw data-icon="inline-start" />
              Refresh
            </Link>
          </Button>
        </div>
      </div>
      <div className="flex max-h-[300px] flex-col gap-1.5 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed text-emerald-400">
        {logLines.map((line, index) => (
          <div key={`${line}-${index}`} className="flex gap-2">
            <span className="text-emerald-700 select-none">$</span>
            <span className={line.includes("[ERROR]") ? "font-semibold text-red-400" : ""}>
              {line}
            </span>
          </div>
        ))}
        {status === "building" ? (
          <div className="flex gap-2">
            <span className="text-emerald-700 select-none">$</span>
            <span>_</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
