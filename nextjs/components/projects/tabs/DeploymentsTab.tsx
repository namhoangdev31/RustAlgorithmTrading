"use client";

import { Link } from "@/i18n/navigation";
import { 
  Layers, 
  Plus, 
  Trash2, 
  Key, 
  ExternalLink, 
  RefreshCw, 
  XCircle, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Download,
  GitBranch,
  Server,
  RotateCcw
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
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cancelDeploymentAction, getDeploymentEventsAction, rollbackDeploymentAction } from "@/app/actions/vercel";
import { rollbackNativeDeploymentAction } from "@/app/actions/native-platform";
import { formatRelativeTime } from "@/lib/shared/time";

interface DeploymentsTabProps {
  vercelConnected: boolean;
  vercelDeployments: any[];
  vercelConnectionError?: boolean;
  locale: string;
  projects?: any[];
  returnTo?: string;
  searchParams?: any;
  project?: any;
  nativeDeployments?: any[];
}

function formatBytes(bytes: number | bigint | null) {
  if (bytes === null || bytes === undefined) return "N/A";
  const numBytes = typeof bytes === "bigint" ? Number(bytes) : bytes;
  if (numBytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function DeploymentsTab({
  vercelConnected,
  vercelDeployments,
  vercelConnectionError,
  locale,
  projects = [],
  returnTo,
  searchParams,
  project,
  nativeDeployments = [],
}: DeploymentsTabProps) {
  const router = useRouter();
  const t = useTranslations("Deployments");
  const [isPending, startTransition] = useTransition();
  const [activeSubTab, setActiveSubTab] = useState<"bundles" | "native" | "vercel">("bundles");
  
  // Lepos Bundle subsystem states
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects.length > 0 ? projects[0].id : ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState<string>("");
  const [track, setTrack] = useState<string>("production");
  const [releaseNotes, setReleaseNotes] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

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

  // Dropzone config
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleUpload = () => {
    if (!selectedProjectId) {
      toast.error(t("toast.select_project"));
      return;
    }
    if (!file) {
      toast.error(t("toast.select_bundle"));
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("projectId", selectedProjectId);
    formData.append("file", file);
    if (version.trim()) formData.append("version", version.trim());
    formData.append("track", track);
    if (releaseNotes.trim()) formData.append("releaseNotes", releaseNotes.trim());

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/bundles/upload", true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentage);
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        toast.success(t("toast.upload_success"));
        setFile(null);
        setVersion("");
        setReleaseNotes("");
        startTransition(() => {
          router.refresh();
        });
      } else {
        let errorMsg = t("toast.upload_failed");
        try {
          const res = JSON.parse(xhr.responseText);
          errorMsg = res.error || errorMsg;
        } catch (_) {}
        toast.error(errorMsg);
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      toast.error(t("toast.network_error"));
    };

    xhr.send(formData);
  };

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

  const getTrackBadgeStyle = (releaseTrack: string) => {
    switch (releaseTrack.toLowerCase()) {
      case "production":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-500";
      case "staging":
        return "bg-amber-500/10 border-amber-500/20 text-amber-500";
      case "development":
        return "bg-indigo-500/10 border-indigo-500/20 text-indigo-500";
      case "preview":
      default:
        return "bg-zinc-500/10 border-zinc-500/20 text-zinc-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Subsystem Switcher Tabs */}
      <div className="flex border-b border-hairline relative">
        <button
          onClick={() => setActiveSubTab("bundles")}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 -mb-[2px] ${
            activeSubTab === "bundles"
              ? "border-primary text-primary"
              : "border-transparent text-ink-mute hover:text-ink hover:border-hairline"
          }`}
        >
          <Layers className="size-4" />
          {t("registry_title")}
        </button>
        <button
          onClick={() => setActiveSubTab("native")}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 -mb-[2px] ${
            activeSubTab === "native"
              ? "border-primary text-primary"
              : "border-transparent text-ink-mute hover:text-ink hover:border-hairline"
          }`}
        >
          <RotateCcw className="size-4" />
          Native
        </button>
        <button
          onClick={() => setActiveSubTab("vercel")}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 -mb-[2px] ${
            activeSubTab === "vercel"
              ? "border-primary text-primary"
              : "border-transparent text-ink-mute hover:text-ink hover:border-hairline"
          }`}
        >
          <Server className="size-4" />
          {t("vercel_tab")}
        </button>
      </div>

      {activeSubTab === "bundles" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form & Upload column */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border border-hairline bg-canvas shadow-dark overflow-hidden">
              <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5">
                <CardTitle className="text-sm font-bold text-ink">
                  {t("deploy_new_bundle")}
                </CardTitle>
                <CardDescription className="text-xs text-ink-mute">
                  {t("deploy_new_bundle_desc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {projects.length === 0 ? (
                  <div className="text-center py-6 text-xs text-ink-mute">
                    {t("form.no_projects")}
                  </div>
                ) : (
                  <>
                    {/* Project selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-ink-secondary">
                        {t("form.target_project")}
                      </label>
                      <NativeSelect
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full !min-w-full"
                        disabled={uploading}
                      >
                        {projects.map((proj) => (
                          <NativeSelectOption key={proj.id} value={proj.id}>
                            {proj.name}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </div>

                    {/* Drag & Drop uploader */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-ink-secondary">
                        {t("form.bundle_file")}
                      </label>
                      <div
                        {...getRootProps()}
                        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 relative overflow-hidden ${
                          isDragActive 
                            ? "border-primary bg-primary/5 scale-[0.99]" 
                            : "border-hairline hover:border-primary/50 bg-canvas-soft/30 hover:bg-canvas-soft/50"
                        }`}
                      >
                        <input {...getInputProps()} />
                        <UploadCloud className={`size-8 mb-2 transition-transform duration-300 ${isDragActive ? "scale-110 text-primary" : "text-ink-mute"}`} />
                        {file ? (
                          <div className="space-y-1 z-10">
                            <p className="text-xs font-semibold text-primary flex items-center justify-center gap-1.5">
                              <FileText className="size-3.5" />
                              {file.name}
                            </p>
                            <p className="text-[10px] text-ink-mute">
                              {formatBytes(file.size)}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1 z-10">
                            <p className="text-xs font-medium text-ink">
                              {t("form.dropzone_desc")}
                            </p>
                            <p className="text-[10px] text-ink-mute">
                              {t("form.dropzone_support")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Version Overwrite */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-ink-secondary">
                          {t("form.version")}
                        </label>
                        <Input
                          placeholder={
                            selectedProject?.bundle?.version 
                              ? `Auto (Current: ${selectedProject.bundle.version})` 
                              : "1.0.0"
                          }
                          value={version}
                          onChange={(e) => setVersion(e.target.value)}
                          className="h-8 text-xs rounded-lg border-hairline focus-visible:ring-primary/20"
                          disabled={uploading}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-ink-secondary">
                          {t("form.track")}
                        </label>
                        <NativeSelect
                          value={track}
                          onChange={(e) => setTrack(e.target.value)}
                          className="w-full !min-w-full"
                          disabled={uploading}
                        >
                          <NativeSelectOption value="production">Production</NativeSelectOption>
                          <NativeSelectOption value="staging">Staging</NativeSelectOption>
                          <NativeSelectOption value="development">Development</NativeSelectOption>
                          <NativeSelectOption value="preview">Preview</NativeSelectOption>
                        </NativeSelect>
                      </div>
                    </div>

                    {/* Release Notes */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-ink-secondary">
                        {t("form.release_notes")}
                      </label>
                      <Textarea
                        placeholder={t("form.release_notes_placeholder")}
                        value={releaseNotes}
                        onChange={(e) => setReleaseNotes(e.target.value)}
                        className="text-xs rounded-lg border-hairline min-h-[70px] resize-none focus-visible:ring-primary/20"
                        disabled={uploading}
                      />
                    </div>

                    {/* Upload progress & submit button */}
                    {uploading && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[10px] font-bold text-primary">
                          <span>{t("form.uploading")}</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-1 bg-canvas-soft [&>div]:bg-primary" />
                      </div>
                    )}

                    <Button
                      onClick={handleUpload}
                      disabled={uploading || !file || isPending}
                      className="w-full h-9 bg-primary hover:bg-primary-deep text-primary-foreground font-semibold rounded-sm shadow-light transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {uploading ? (
                        <>
                          <RefreshCw className="size-3.5 animate-spin" />
                          {t("form.processing")}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-3.5" />
                          {t("form.publish_release")}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Registry Release History column */}
          <div className="lg:col-span-7">
            <Card className="border border-hairline bg-canvas shadow-dark py-0 overflow-hidden">
              <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-ink">
                    {t("history.title")}
                  </CardTitle>
                  <CardDescription className="text-xs text-ink-mute">
                    {t("history.desc")}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {!selectedProject?.bundle?.releaseTracks || selectedProject.bundle.releaseTracks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <div className="size-10 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink-mute mb-3">
                      <Layers className="size-5" />
                    </div>
                    <p className="text-xs font-semibold text-ink">
                      {t("history.empty")}
                    </p>
                    <p className="text-[11px] text-ink-mute mt-1 max-w-xs">
                      {t("history.empty_desc")}
                    </p>
                  </div>
                ) : (
                  <Table className="min-w-[500px]">
                    <TableHeader>
                      <TableRow className="bg-canvas-soft/40 border-b border-hairline">
                        <TableHead className="px-5 py-2.5 text-[10px] uppercase tracking-wider text-ink-mute font-semibold">
                          {t("history.col_version")}
                        </TableHead>
                        <TableHead className="px-5 py-2.5 text-[10px] uppercase tracking-wider text-ink-mute font-semibold">
                          {t("history.col_track")}
                        </TableHead>
                        <TableHead className="px-5 py-2.5 text-[10px] uppercase tracking-wider text-ink-mute font-semibold">
                          {t("history.col_size")}
                        </TableHead>
                        <TableHead className="px-5 py-2.5 text-[10px] uppercase tracking-wider text-ink-mute font-semibold">
                          {t("history.col_released")}
                        </TableHead>
                        <TableHead className="px-5 py-2.5 text-right text-[10px] uppercase tracking-wider text-ink-mute font-semibold">
                          {t("history.col_bundle")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProject.bundle.releaseTracks.map((trackItem: any) => {
                        const createdDate = trackItem.createdAt ? new Date(trackItem.createdAt) : null;
                        return (
                          <TableRow key={trackItem.id} className="hover:bg-canvas-soft/30 transition-colors border-b border-hairline">
                            <TableCell className="px-5 py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-semibold text-ink">
                                  v{trackItem.version}
                                </span>
                                <span className="text-[10px] font-mono text-ink-mute">
                                  Build {trackItem.buildNumber}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-5 py-3">
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${getTrackBadgeStyle(trackItem.track)}`}>
                                {trackItem.track}
                              </span>
                            </TableCell>
                            <TableCell className="px-5 py-3 text-xs text-ink-mute">
                              {selectedProject.bundle.fileSize ? formatBytes(selectedProject.bundle.fileSize) : "N/A"}
                            </TableCell>
                            <TableCell className="px-5 py-3 text-xs text-ink-mute">
                              {createdDate ? formatRelativeTime(createdDate, locale) : "N/A"}
                            </TableCell>
                            <TableCell className="px-5 py-3 text-right">
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] text-primary hover:text-primary-deep hover:bg-primary/10 rounded-sm font-semibold inline-flex items-center gap-1"
                              >
                                <a href={trackItem.storagePath} download>
                                  <Download className="size-3" />
                                  Download
                                </a>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : activeSubTab === "native" ? (
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
      ) : (
        /* Vercel Integration panel */
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
            <Card className="overflow-hidden border border-hairline bg-canvas py-0 animate-in fade-in">
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
                                      className="h-8 text-xs text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 rounded-sm font-semibold flex items-center gap-1 mr-2 cursor-pointer"
                                    >
                                      <RotateCcw className="size-3.5" />
                                      {dpl.target === "preview" 
                                        ? (locale === "vi" ? "Promote" : "Promote") 
                                        : (locale === "vi" ? "Rollback" : "Rollback")}
                                    </Button>
                                  </form>
                                )}

                                {(dpl.state === "BUILDING" || dpl.state === "INITIALIZING" || dpl.state === "QUEUED") ? (
                                  <form action={cancelDeploymentAction}>
                                    <input type="hidden" name="deploymentId" value={dpl.uid} />
                                    {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
                                    <Button 
                                      type="submit" 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 text-xs text-ink-mute-2 hover:text-destructive hover:bg-destructive/10 rounded-sm font-semibold flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <XCircle className="size-3.5" />
                                      {t("vercel.cancel")}
                                    </Button>
                                  </form>
                                ) : dpl.target === "production" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 border border-primary/20 text-primary">
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-xs text-ink-faint select-none font-medium">
                                    {t("vercel.inactive")}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-hairline px-6 py-4 bg-canvas-soft/20">
                    <p className="text-xs text-ink-mute font-medium">
                      {locale === "vi" 
                        ? `Hiển thị ${(dpage - 1) * pageSize + 1} - ${Math.min(dpage * pageSize, totalDeployments)} trong tổng số ${totalDeployments} bản dựng`
                        : `Showing ${(dpage - 1) * pageSize + 1} to ${Math.min(dpage * pageSize, totalDeployments)} of ${totalDeployments} deployments`}
                    </p>
                    <div className="flex gap-2">
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
              </CardContent>
            </Card>
          )}
        </>
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
    </div>
  );
}
