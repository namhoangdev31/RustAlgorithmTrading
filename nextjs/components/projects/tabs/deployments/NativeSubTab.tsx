"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { RotateCcw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { rollbackNativeDeploymentAction } from "@/app/actions/native-platform";

interface NativeSubTabProps {
  nativeDeployments: any[];
  project: any;
  selectedProjectId: string;
  locale: string;
  isPending: boolean;
  startTransition: (cb: () => void) => void;
}

export function NativeSubTab({
  nativeDeployments,
  project,
  selectedProjectId,
  locale,
  isPending,
  startTransition,
}: NativeSubTabProps) {
  return (
    <Card className="overflow-hidden border border-hairline bg-canvas py-0 animate-in fade-in">
      <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5">
        <div>
          <CardTitle className="text-base font-bold text-ink">Native Instant Rollback</CardTitle>
          <CardDescription className="text-xs text-ink-mute mt-1">
            Switch the active native deployment pointer without starting a rebuild.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        {nativeDeployments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center px-4">
            <div className="size-10 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink-mute mb-3">
              <RotateCcw className="size-5" />
            </div>
            <p className="text-sm font-semibold text-ink">No native deployments yet</p>
            <p className="text-xs text-ink-mute mt-1 max-w-sm">
              Trigger a deployment through the CLI or native API to make rollback targets available.
            </p>
          </div>
        ) : (
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="bg-canvas-soft/40 border-b border-hairline">
                <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Version</TableHead>
                <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Target</TableHead>
                <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Status</TableHead>
                <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Storage</TableHead>
                <TableHead className="px-5 py-3 text-right text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nativeDeployments.map((deployment) => (
                <TableRow key={deployment.id} className="hover:bg-canvas-soft/30 transition-colors border-b border-hairline">
                  <TableCell className="px-5 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-ink">{deployment.version}</span>
                      <span className="text-[10px] font-mono text-ink-mute">Build {deployment.buildNumber || "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-xs text-ink-secondary">{deployment.target}</TableCell>
                  <TableCell className="px-5 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      deployment.status === "active"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                        : "bg-canvas-soft border-hairline text-ink-mute"
                    }`}>
                      {deployment.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <code className="text-[11px] text-ink-mute">{deployment.storagePath}</code>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          const startTime = performance.now();
                          const formData = new FormData();
                          formData.append("projectId", project?.id || deployment.projectId);
                          formData.append("deploymentId", deployment.id);
                          
                          startTransition(async () => {
                            try {
                              await rollbackNativeDeploymentAction(formData);
                              const duration = Math.round(performance.now() - startTime);
                              toast.success(
                                locale === "vi"
                                  ? `Kích hoạt rollback tức thì thành công trong ${duration}ms! Cấu hình proxy đã được đồng bộ.`
                                  : `Instant rollback activated successfully in ${duration}ms! Proxy routing synchronized.`
                              );
                            } catch (err: any) {
                              toast.error(err.message || "Rollback failed");
                            }
                          });
                        }}
                        variant="ghost"
                        size="sm"
                        disabled={deployment.status === "active" || isPending}
                        className="h-8 text-xs text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 rounded-sm font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {isPending ? (
                          <RefreshCw className="size-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="size-3.5" />
                        )}
                        Activate
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
