"use client";

import { Link } from "@/i18n/navigation";
import { 
  Key, 
  ExternalLink, 
  RefreshCw, 
  XCircle, 
  UploadCloud, 
  FileText, 
  AlertCircle, 
  Layers,
  RotateCcw,
  CheckSquare
} from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { 
  cancelDeploymentAction, 
  getDeploymentEventsAction, 
  rollbackDeploymentAction, 
  createDeploymentAction, 
  listDeploymentCheckRunsAction 
} from "@/app/actions/vercel";
import { formatRelativeTime } from "@/lib/shared/time";

interface VercelDeploymentsTabProps {
  vercelConnected: boolean;
  vercelDeployments: any[];
  vercelConnectionError?: boolean;
  locale: string;
  projects?: any[];
  selectedProjectId: string;
  returnTo?: string;
  searchParams?: any;
  project?: any;
  isPending: boolean;
  startTransition: (cb: () => void) => void;
}

export function VercelDeploymentsTab({
  vercelConnected,
  vercelDeployments,
  vercelConnectionError,
  locale,
  projects = [],
  selectedProjectId,
  returnTo,
  searchParams,
  project,
  isPending,
  startTransition,
}: VercelDeploymentsTabProps) {
  const router = useRouter();
  const t = useTranslations("Deployments");

  // Vercel deployment logs states
  const [isOpenLogs, setIsOpenLogs] = useState(false);
  const [selectedDplId, setSelectedDplId] = useState("");
  const [selectedDplName, setSelectedDplName] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async (dplId: string) => {
    setLoadingLogs(true);
    setLogsError("");
    try {
      const res = await getDeploymentEventsAction(dplId);
      if (res.success && res.events) {
        setLogs(res.events as any[]);
      } else {
        setLogsError(res.error || "Failed to fetch logs");
      }
    } catch (err: any) {
      setLogsError(err?.message || "Failed to fetch logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleOpenLogs = (dplId: string, dplName: string) => {
    setSelectedDplId(dplId);
    setSelectedDplName(dplName);
    setIsOpenLogs(true);
    setLogs([]);
    fetchLogs(dplId);
  };

  // Checks states
  const [isOpenChecks, setIsOpenChecks] = useState(false);
  const [selectedChecksDplId, setSelectedChecksDplId] = useState("");
  const [selectedChecksDplName, setSelectedChecksDplName] = useState("");
  const [checkRuns, setCheckRuns] = useState<any[]>([]);
  const [loadingChecks, setLoadingChecks] = useState(false);
  const [checksError, setChecksError] = useState("");

  const handleOpenChecks = async (dplId: string, dplName: string) => {
    setSelectedChecksDplId(dplId);
    setSelectedChecksDplName(dplName);
    setIsOpenChecks(true);
    setCheckRuns([]);
    setLoadingChecks(true);
    setChecksError("");
    try {
      const res = await listDeploymentCheckRunsAction(project?.id || selectedProjectId, dplId);
      if (res.success && res.checkRuns) {
        setCheckRuns(res.checkRuns);
      } else {
        setChecksError(res.error || "Failed to fetch check runs");
      }
    } catch (err: any) {
      setChecksError(err?.message || "Failed to fetch check runs");
    } finally {
      setLoadingChecks(false);
    }
  };

  // Auto-scroll logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Polling logs
  useEffect(() => {
    if (!isOpenLogs || !selectedDplId || !autoRefresh) return;

    const interval = setInterval(() => {
      getDeploymentEventsAction(selectedDplId).then((res) => {
        if (res.success && res.events) {
          setLogs(res.events as any[]);
        }
      }).catch((err) => console.error(err));
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpenLogs, selectedDplId, autoRefresh]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const vercelProjectId = selectedProject?.vercelProjectId;

  const statusFilter = (searchParams?.dstatus || "ALL").toUpperCase();

  const filteredDeployments = vercelDeployments.filter((dpl) => {
    if (statusFilter === "ALL") return true;
    const state = (dpl.state || dpl.readyState || "").toUpperCase();
    if (statusFilter === "READY") return state === "READY";
    if (statusFilter === "ERROR") return state === "ERROR";
    if (statusFilter === "BUILDING") return state === "BUILDING" || state === "INITIALIZING";
    if (statusFilter === "QUEUED") return state === "QUEUED";
    return true;
  });

  const buildDetailUrl = (newParams: Record<string, string>) => {
    const params = new URLSearchParams();
    params.set("tab", "deployments");
    if (searchParams) {
      if (searchParams.q) params.set("q", searchParams.q);
      if (searchParams.dstatus) params.set("dstatus", searchParams.dstatus);
      if (searchParams.dpage) params.set("dpage", searchParams.dpage);
    }
    Object.entries(newParams).forEach(([key, value]) => {
      params.set(key, value);
    });
    const activeProject = project || projects.find((p) => p.id === selectedProjectId) || projects[0];
    return `/projects/${activeProject?.id}?${params.toString()}`;
  };

  const pageSize = 5;
  const dpage = Number(searchParams?.dpage) || 1;
  const totalDeployments = filteredDeployments.length;
  const totalPages = Math.ceil(totalDeployments / pageSize);
  const paginatedDeployments = filteredDeployments.slice((dpage - 1) * pageSize, dpage * pageSize);

  const getStatusDetails = (state: string) => {
    switch (state) {
      case "READY":
        return {
          label: t("status.ready"),
          dotClass: "bg-primary shadow-[0_0_8px_rgba(62,207,142,0.35)]",
          textClass: "text-primary",
        };
      case "BUILDING":
      case "INITIALIZING":
        return {
          label: t("status.building"),
          dotClass: "bg-accent-yellow animate-pulse shadow-[0_0_8px_rgba(255,219,19,0.35)]",
          textClass: "text-accent-yellow",
        };
      case "ERROR":
        return {
          label: t("status.error"),
          dotClass: "bg-destructive shadow-[0_0_8px_rgba(255,34,1,0.35)]",
          textClass: "text-destructive",
        };
      case "CANCELED":
        return {
          label: t("status.canceled"),
          dotClass: "bg-ink-faint",
          textClass: "text-ink-mute",
        };
      default:
        return {
          label: state || t("status.unknown"),
          dotClass: "bg-ink-mute",
          textClass: "text-ink-secondary",
        };
    }
  };

  return (
    <>
      {!vercelConnected ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-canvas-soft border border-hairline rounded-xl max-w-2xl mx-auto my-8 relative overflow-hidden shadow-dark group animate-in fade-in">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-all duration-500" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-all duration-500" />
          
          <div className="size-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 animate-pulse">
            <Key className="size-6 text-primary" />
          </div>
          
          <h3 className="text-lg font-bold text-ink mb-2">
            {t("vercel.connect")}
          </h3>
          <p className="text-sm text-ink-mute max-w-md mb-8 leading-relaxed">
            {t("vercel.connect_desc_dashboard")}
          </p>

          <Button asChild className="h-10 bg-primary hover:bg-primary-deep text-primary-foreground font-semibold px-6 rounded-sm shadow-light transition-all text-xs">
            <Link href="/dashboard/settings">
              {t("vercel.configure")}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in">
          {/* Trigger Deployment form */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border border-hairline bg-canvas shadow-dark overflow-hidden">
              <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5">
                <CardTitle className="text-sm font-bold text-ink">
                  Trigger Vercel Deployment
                </CardTitle>
                <CardDescription className="text-xs text-ink-mute">
                  Initiate a new build directly on Vercel.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <form action={createDeploymentAction} className="space-y-4">
                  <input type="hidden" name="projectId" value={project?.id || selectedProjectId} />
                  <input type="hidden" name="returnTo" value={returnTo || ""} />
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink-secondary">
                      Deployment Name
                    </label>
                    <Input
                      name="name"
                      defaultValue={project?.name || selectedProject?.name || ""}
                      required
                      className="h-8 text-xs rounded-lg border-hairline focus-visible:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink-secondary">
                      Target Environment
                    </label>
                    <NativeSelect name="target" className="w-full !min-w-full">
                      <NativeSelectOption value="preview">Preview</NativeSelectOption>
                      <NativeSelectOption value="production">Production</NativeSelectOption>
                    </NativeSelect>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink-secondary">
                      Redeploy Existing Deployment (Optional)
                    </label>
                    <Input
                      name="deploymentId"
                      placeholder="e.g. dpl_xyz123"
                      className="h-8 text-xs rounded-lg border-hairline focus-visible:ring-primary/20"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-9 bg-primary hover:bg-primary-deep text-primary-foreground font-semibold rounded-sm shadow-light transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <UploadCloud className="size-3.5" />
                    Trigger Build
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Deployments list table */}
          <div className="lg:col-span-8">
            <Card className="overflow-hidden border border-hairline bg-canvas py-0">
              <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5">
                <div>
                  <CardTitle className="text-base font-bold text-ink">
                    {locale === "vi" ? "Triển Khoai Web (Vercel Pipeline)" : "Deployments (Vercel Pipeline)"}
                  </CardTitle>
                  <CardDescription className="text-xs text-ink-mute mt-1">
                    {locale === "vi"
                      ? "Danh sách các bản dựng web gần đây được kích hoạt tự động trên hệ thống Vercel."
                      : "List of recent builds and deployments triggered for your project."}
                  </CardDescription>
                </div>
                
                {/* Status Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1 bg-canvas border border-hairline rounded-md p-1 select-none w-fit shrink-0">
                  {["ALL", "READY", "BUILDING", "ERROR", "QUEUED"].map((status) => {
                    const isActive = statusFilter === status;
                    const label = status === "ALL" 
                      ? (locale === "vi" ? "Tất cả" : "All")
                      : status === "READY"
                      ? (locale === "vi" ? "Sẵn sàng" : "Ready")
                      : status === "BUILDING"
                      ? (locale === "vi" ? "Đang dựng" : "Building")
                      : status === "ERROR"
                      ? (locale === "vi" ? "Lỗi" : "Error")
                      : (locale === "vi" ? "Chờ xử lý" : "Queued");
                    
                    return (
                      <Link
                        key={status}
                        href={buildDetailUrl({ dstatus: status, dpage: "1" })}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                          isActive 
                            ? "bg-canvas-soft text-ink shadow-sm border border-hairline-strong" 
                            : "text-ink-mute hover:text-ink border border-transparent"
                        }`}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                {totalDeployments === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="size-10 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink-mute mb-3">
                      <Layers className="size-5" />
                    </div>
                    <p className="text-sm font-semibold text-ink">
                      {statusFilter !== "ALL" 
                        ? (locale === "vi" ? `Không tìm thấy bản dịch nào với trạng thái ${statusFilter}` : `No ${statusFilter} Deployments Found`)
                        : (locale === "vi" ? "Không Tìm Thấy Bản Dựng Nào" : "No Deployments Found")}
                    </p>
                    <p className="text-xs text-ink-mute mt-1">
                      {statusFilter !== "ALL"
                        ? (locale === "vi" ? "Hãy thử chọn bộ lọc khác." : "Try selecting a different status filter.")
                        : (locale === "vi" ? "Triển khai dự án của bạn lên Vercel để theo dõi." : "Deploy your project to Vercel to see deployment records here.")}
                    </p>
                  </div>
                ) : (
                  <>
                    <Table className="min-w-[760px]">
                      <TableHeader>
                        <TableRow className="bg-canvas-soft/40 border-b border-hairline">
                          <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">
                            {locale === "vi" ? "Bản Dựng" : "Deployment"}
                          </TableHead>
                          <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">
                            {locale === "vi" ? "Trạng Thái" : "Status"}
                          </TableHead>
                          <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">
                            Target
                          </TableHead>
                          <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">
                            {locale === "vi" ? "Thời gian" : "Age"}
                          </TableHead>
                          <TableHead className="px-5 py-3 text-[11px] uppercase tracking-wider text-ink-mute font-semibold">
                            {locale === "vi" ? "Người tạo" : "Creator"}
                          </TableHead>
                          <TableHead className="px-5 py-3 text-right text-[11px] uppercase tracking-wider text-ink-mute font-semibold">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedDeployments.map((dpl) => {
                          const createdDate = dpl.created ? new Date(dpl.created) : null;
                          const status = getStatusDetails(dpl.state || dpl.readyState);
                          return (
                            <TableRow key={dpl.uid} className="hover:bg-canvas-soft/30 transition-colors border-b border-hairline">
                              <TableCell className="px-5 py-4">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-sm font-semibold text-ink flex items-center gap-1.5">
                                    {dpl.name}
                                    {dpl.url && (
                                      <a
                                        href={`https://${dpl.url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-ink-mute hover:text-primary transition-colors"
                                      >
                                        <ExternalLink className="size-3" />
                                      </a>
                                    )}
                                  </span>
                                  <span className="text-xs font-mono text-ink-mute truncate max-w-[280px]">
                                    {dpl.url || t("vercel.deploying")}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <span className={`size-2 rounded-full ${status.dotClass}`} />
                                  <span className={`text-xs font-semibold ${status.textClass}`}>{status.label}</span>
                                </div>
                              </TableCell>
                              <TableCell className="px-5 py-4">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${dpl.target === "production" ? "bg-primary/5 border-primary/20 text-primary" : "bg-canvas-soft border-hairline text-ink-mute"}`}>
                                  {dpl.target || "preview"}
                                </span>
                              </TableCell>
                              <TableCell className="px-5 py-4 text-xs text-ink-mute">
                                {createdDate ? formatRelativeTime(createdDate, locale) : "N/A"}
                              </TableCell>
                              <TableCell className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <Avatar className="size-5 border border-hairline">
                                    <AvatarFallback className="text-[9px] font-bold text-ink-secondary bg-canvas-soft">
                                      {(dpl.creator?.username || dpl.creator?.githubLogin || "U").slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-medium text-ink-secondary">
                                    {dpl.creator?.username || dpl.creator?.githubLogin || "unknown"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="px-5 py-4">
                                <div className="flex items-center justify-end">
                                  <Button
                                    onClick={() => handleOpenChecks(dpl.uid, dpl.name)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-ink-mute hover:text-ink hover:bg-canvas-soft rounded-sm font-semibold flex items-center gap-1.5 mr-2 cursor-pointer"
                                  >
                                    <CheckSquare className="size-3.5" />
                                    Checks
                                  </Button>

                                  <Button
                                    onClick={() => handleOpenLogs(dpl.uid, dpl.name)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-primary hover:text-primary-deep hover:bg-primary/10 rounded-sm font-semibold flex items-center gap-1.5 mr-2 cursor-pointer"
                                  >
                                    <FileText className="size-3.5" />
                                    Logs
                                  </Button>

                                  {dpl.state === "READY" && dpl.target !== "production" && vercelProjectId && (
                                    <form 
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        const reason = prompt(
                                          locale === "vi" 
                                            ? "Nhập lý do rollback/promote (tùy chọn):" 
                                            : "Enter rollback/promote reason (optional):"
                                        );
                                        if (reason !== null) {
                                          const formData = new FormData();
                                          formData.append("projectId", vercelProjectId);
                                          formData.append("deploymentId", dpl.uid);
                                          if (reason) formData.append("description", reason);
                                          if (returnTo) formData.append("returnTo", returnTo);
                                          startTransition(async () => {
                                            await rollbackDeploymentAction(formData);
                                          });
                                        }
                                      }}
                                    >
                                      <Button
                                        type="submit"
                                        variant="ghost"
                                        size="sm"
                                        disabled={isPending}
                                        className="h-8 text-xs text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 rounded-sm font-semibold flex items-center gap-1 cursor-pointer"
                                      >
                                        <RotateCcw className="size-3.5" />
                                        {locale === "vi" ? "Chuyển đổi" : "Promote"}
                                      </Button>
                                    </form>
                                  )}

                                  {["BUILDING", "INITIALIZING", "QUEUED"].includes(dpl.state || dpl.readyState) && (
                                    <form 
                                      action={cancelDeploymentAction}
                                      onSubmit={(e) => {
                                        if (!confirm(locale === "vi" ? "Bạn có chắc chắn muốn hủy bản dựng này?" : "Are you sure you want to cancel this build?")) {
                                          e.preventDefault();
                                        }
                                      }}
                                    >
                                      <input type="hidden" name="deploymentId" value={dpl.uid} />
                                      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
                                      <Button
                                        type="submit"
                                        variant="ghost"
                                        size="sm"
                                        disabled={isPending}
                                        className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-sm font-semibold flex items-center gap-1 cursor-pointer"
                                      >
                                        <XCircle className="size-3.5" />
                                        {locale === "vi" ? "Hủy" : "Cancel"}
                                      </Button>
                                    </form>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="px-5 py-4 border-t border-hairline bg-canvas-soft/20 flex items-center justify-between gap-4">
                        <span className="text-xs text-ink-mute">
                          {locale === "vi" 
                            ? `Trang ${dpage} / ${totalPages}`
                            : `Page ${dpage} of ${totalPages}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            disabled={dpage <= 1}
                            className={`h-8 text-xs ${dpage <= 1 ? "pointer-events-none opacity-50" : ""}`}
                          >
                            <Link href={buildDetailUrl({ dpage: String(dpage - 1) })}>
                              {locale === "vi" ? "Trang trước" : "Previous"}
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            disabled={dpage >= totalPages}
                            className={`h-8 text-xs ${dpage >= totalPages ? "pointer-events-none opacity-50" : ""}`}
                          >
                            <Link href={buildDetailUrl({ dpage: String(dpage + 1) })}>
                              {locale === "vi" ? "Trang sau" : "Next"}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Real-time Logs Terminal Overlay */}
      {isOpenLogs && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          {/* Backdrop click to close */}
          <div className="absolute inset-0 cursor-default" onClick={() => setIsOpenLogs(false)} />
          
          <div className="w-full max-w-4xl bg-canvas border border-hairline rounded-lg shadow-dark relative z-10 overflow-hidden flex flex-col h-[600px] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-hairline bg-canvas-soft/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink">
                  {locale === "vi" ? `Nhật ký bản dựng — ${selectedDplName}` : `Build Logs — ${selectedDplName}`}
                </h3>
                <p className="text-[10px] text-ink-mute mt-0.5 font-mono select-all">
                  ID: {selectedDplId}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Auto-Refresh Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRefreshLogs"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="size-3.5 rounded border-hairline accent-primary cursor-pointer"
                  />
                  <label htmlFor="autoRefreshLogs" className="text-xs text-ink-secondary cursor-pointer select-none">
                    {locale === "vi" ? "Tự động làm mới (3s)" : "Auto-refresh (3s)"}
                  </label>
                </div>
                
                {/* Manual Refresh */}
                <Button
                  onClick={() => fetchLogs(selectedDplId)}
                  disabled={loadingLogs}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-hairline-strong text-ink hover:bg-canvas-soft cursor-pointer"
                >
                  <RefreshCw className={`size-3.5 mr-1.5 ${loadingLogs ? "animate-spin" : ""}`} />
                  {locale === "vi" ? "Làm mới" : "Refresh"}
                </Button>
                
                {/* Close */}
                <Button
                  onClick={() => setIsOpenLogs(false)}
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-ink-mute hover:text-ink hover:bg-canvas-soft cursor-pointer"
                >
                  {locale === "vi" ? "Đóng" : "Close"}
                </Button>
              </div>
            </div>
            
            {/* Modal Content - Terminal View */}
            <div className="flex-1 bg-black text-zinc-300 font-mono text-xs p-5 overflow-y-auto space-y-1.5 select-text selection:bg-zinc-700">
              {loadingLogs && logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
                  <RefreshCw className="size-6 animate-spin" />
                  <span>Loading logs from Vercel...</span>
                </div>
              ) : logsError ? (
                <div className="h-full flex flex-col items-center justify-center text-red-400 gap-2">
                  <AlertCircle className="size-6 text-red-400" />
                  <span>{logsError}</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-1">
                  <span>No logs available.</span>
                  <span className="text-[10px]">Build events might not have started yet or have been cleared.</span>
                </div>
              ) : (
                <>
                  {logs.map((log, index) => {
                    // Format timestamp
                    const dateStr = log.created ? new Date(log.created).toLocaleTimeString() : "";
                    const logText = log.text || log.payload?.text || JSON.stringify(log);
                    return (
                      <div key={index} className="flex items-start gap-3 hover:bg-zinc-900/50 py-0.5 px-1 rounded">
                        <span className="text-zinc-600 select-none text-[10px] pt-0.5 shrink-0 w-16">{dateStr}</span>
                        <span className="text-zinc-500 select-none text-[10px] pt-0.5 shrink-0 w-12 capitalize text-center border border-zinc-800 rounded bg-zinc-950 px-1 font-bold">{log.type}</span>
                        <span className="whitespace-pre-wrap break-all flex-1 text-zinc-200">{logText}</span>
                      </div>
                    );
                  })}
                  <div ref={terminalEndRef} />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checks Modal Overlay */}
      {isOpenChecks && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          {/* Backdrop click to close */}
          <div className="absolute inset-0 cursor-default" onClick={() => setIsOpenChecks(false)} />
          
          <div className="w-full max-w-2xl bg-canvas border border-hairline rounded-lg shadow-dark relative z-10 overflow-hidden flex flex-col h-[500px] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-hairline bg-canvas-soft/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink">
                  {locale === "vi" ? `Kết quả kiểm thử — ${selectedChecksDplName}` : `Deployment Checks — ${selectedChecksDplName}`}
                </h3>
                <p className="text-[10px] text-ink-mute mt-0.5 font-mono select-all">
                  ID: {selectedChecksDplId}
                </p>
              </div>
              
              <Button
                onClick={() => setIsOpenChecks(false)}
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-ink-mute hover:text-ink hover:bg-canvas-soft cursor-pointer"
              >
                {locale === "vi" ? "Đóng" : "Close"}
              </Button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {loadingChecks ? (
                <div className="h-full flex flex-col items-center justify-center text-ink-mute gap-2">
                  <RefreshCw className="size-6 animate-spin text-primary" />
                  <span>Loading deployment checks from Vercel...</span>
                </div>
              ) : checksError ? (
                <div className="h-full flex flex-col items-center justify-center text-destructive gap-2">
                  <AlertCircle className="size-6 text-destructive" />
                  <span>{checksError}</span>
                </div>
              ) : checkRuns.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-ink-mute gap-2">
                  <CheckSquare className="size-8 text-ink-mute" />
                  <span>No check runs configured for this deployment.</span>
                  <span className="text-[10px] text-center max-w-xs">Integrate tools like Lighthouse or Playwright to display automated tests here.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {checkRuns.map((run) => (
                    <div key={run.id} className="p-4 border border-hairline rounded-md bg-canvas-soft/40 flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-ink">{run.name}</h4>
                        <p className="text-[10px] text-ink-mute font-mono">{run.id}</p>
                        {run.output && run.output.summary && (
                          <p className="text-xs text-ink-secondary mt-2 leading-relaxed">{run.output.summary}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                          run.status === "completed" 
                            ? (run.conclusion === "success" ? "bg-primary/10 border-primary/20 text-primary" : "bg-destructive/10 border-destructive/20 text-destructive") 
                            : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                        }`}>
                          {run.status === "completed" ? (run.conclusion || "completed") : (run.status || "queued")}
                        </span>
                        {run.detailsUrl && (
                          <a 
                            href={run.detailsUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold"
                          >
                            Details <ExternalLink className="size-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
