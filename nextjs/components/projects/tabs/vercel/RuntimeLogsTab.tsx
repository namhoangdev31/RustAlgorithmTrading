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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  listDeploymentsAction,
  getRuntimeLogsAction,
} from "@/app/actions/vercel";

interface RuntimeLogsTabProps {
  project: any;
}

export function RuntimeLogsTab({ project }: RuntimeLogsTabProps) {
  const [deploymentsList, setDeploymentsList] = useState<any[]>([]);
  const [loadingDeployments, setLoadingDeployments] = useState(false);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState("");
  const [runtimeLogs, setRuntimeLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState("");

  // Fetch Deployments when mounted or project changes
  useEffect(() => {
    const fetchDeployments = async () => {
      setLoadingDeployments(true);
      setLogsError("");
      try {
        const res = await listDeploymentsAction(project.id);
        if (res.success && res.deployments) {
          const list = Array.isArray(res.deployments)
            ? res.deployments
            : (res.deployments as any).deployments || [];
          setDeploymentsList(list);
          if (list.length > 0 && !selectedDeploymentId) {
            setSelectedDeploymentId(list[0].uid || list[0].id || "");
          }
        } else {
          setLogsError(res.error || "Failed to load deployments");
        }
      } catch (err: any) {
        setLogsError(err?.message || "Failed to load deployments");
      } finally {
        setLoadingDeployments(false);
      }
    };
    fetchDeployments();
  }, [project.id]);

  // Fetch Logs when selectedDeploymentId changes
  useEffect(() => {
    if (!selectedDeploymentId) return;
    const fetchLogs = async () => {
      setLoadingLogs(true);
      setLogsError("");
      try {
        const res = await getRuntimeLogsAction(project.id, selectedDeploymentId);
        if (res.success && res.logs) {
          setRuntimeLogs(res.logs || []);
        } else {
          setLogsError(res.error || "Failed to load runtime logs");
        }
      } catch (err: any) {
        setLogsError(err?.message || "Failed to load runtime logs");
      } finally {
        setLoadingLogs(false);
      }
    };
    fetchLogs();
  }, [selectedDeploymentId, project.id]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="bg-canvas border border-hairline rounded-lg p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base font-bold text-ink">Real-time Runtime Logs</CardTitle>
          <CardDescription className="text-xs text-ink-mute">
            Inspect the live serverless execution logs, API requests, and standard outputs for project deployments.
          </CardDescription>
        </CardHeader>
        <Separator className="bg-hairline my-4" />
        <CardContent className="px-0 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="deploymentSelect" className="text-xs font-bold text-ink-secondary">Target Deployment</Label>
            {loadingDeployments ? (
              <div className="text-xs text-ink-mute">Loading deployments...</div>
            ) : deploymentsList.length === 0 ? (
              <div className="text-xs text-ink-mute">No deployments found.</div>
            ) : (
              <Select value={selectedDeploymentId} onValueChange={setSelectedDeploymentId}>
                <SelectTrigger id="deploymentSelect" className="bg-canvas-soft border-hairline h-9 text-xs rounded-sm">
                  <SelectValue placeholder="Select deployment" />
                </SelectTrigger>
                <SelectContent className="bg-canvas border-hairline text-xs">
                  {deploymentsList.map((d) => (
                    <SelectItem key={d.uid || d.id} value={d.uid || d.id}>
                      {d.url} ({d.state})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {logsError && (
            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive rounded-lg">
              <AlertCircle className="size-4 shrink-0" />
              <AlertDescription className="text-xs font-semibold">{logsError}</AlertDescription>
            </Alert>
          )}

          <div className="bg-[#0c0c0d] text-emerald-400 font-mono text-xs rounded-lg p-4 h-[350px] overflow-y-auto border border-hairline">
            {loadingLogs ? (
              <div className="text-ink-mute flex items-center justify-center h-full">Streaming runtime logs...</div>
            ) : runtimeLogs.length === 0 ? (
              <div className="text-ink-mute flex items-center justify-center h-full">No runtime logs recorded for this deployment execution.</div>
            ) : (
              <div className="space-y-1.5">
                {runtimeLogs.map((log, index) => (
                  <div key={index} className="flex gap-2 hover:bg-canvas-soft/5 py-0.5 rounded px-1">
                    <span className="text-ink-mute shrink-0">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ""}
                    </span>
                    <span className={log.type === "stderr" ? "text-red-400" : "text-emerald-400"}>
                      [{log.type || "INFO"}]
                    </span>
                    <span className="text-gray-300 break-all">{log.message || log.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
