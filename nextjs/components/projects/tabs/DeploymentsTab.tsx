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
  Server
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
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cancelDeploymentAction } from "@/app/actions/vercel";
import { formatRelativeTime } from "@/lib/shared/time";

interface DeploymentsTabProps {
  vercelConnected: boolean;
  vercelDeployments: any[];
  vercelConnectionError?: boolean;
  locale: string;
  projects?: any[];
  returnTo?: string;
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
}: DeploymentsTabProps) {
  const router = useRouter();
  const t = useTranslations("Deployments");
  const [isPending, startTransition] = useTransition();
  const [activeSubTab, setActiveSubTab] = useState<"bundles" | "vercel">("bundles");
  
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

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

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
              <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 flex flex-row items-center justify-between gap-3 p-5">
                <div>
                  <CardTitle className="text-base font-bold text-ink">
                    {locale === "vi" ? "Triển Khai Web (Vercel Pipeline)" : "Deployments (Vercel Pipeline)"}
                  </CardTitle>
                  <CardDescription className="text-xs text-ink-mute mt-1">
                    {locale === "vi"
                      ? "Danh sách các bản dựng web gần đây được kích hoạt tự động trên hệ thống Vercel."
                      : "List of recent builds and deployments triggered for your project."}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                {vercelDeployments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="size-10 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink-mute mb-3">
                      <Layers className="size-5" />
                    </div>
                    <p className="text-sm font-semibold text-ink">
                      {locale === "vi" ? "Không Tìm Thấy Bản Dựng Nào" : "No Deployments Found"}
                    </p>
                    <p className="text-xs text-ink-mute mt-1">
                      {locale === "vi"
                        ? "Triển khai dự án của bạn lên Vercel để theo dõi tiến trình hiển thị tại đây."
                        : "Deploy your project to Vercel to see deployment records here."}
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
                      {vercelDeployments.map((dpl) => {
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
                                {(dpl.state === "BUILDING" || dpl.state === "INITIALIZING" || dpl.state === "QUEUED") ? (
                                  <form action={cancelDeploymentAction}>
                                    <input type="hidden" name="deploymentId" value={dpl.uid} />
                                    {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
                                    <Button 
                                      type="submit" 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 text-xs text-ink-mute-2 hover:text-destructive hover:bg-destructive/10 rounded-sm font-semibold flex items-center gap-1.5"
                                    >
                                      <XCircle className="size-3.5" />
                                      {t("vercel.cancel")}
                                    </Button>
                                  </form>
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
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
