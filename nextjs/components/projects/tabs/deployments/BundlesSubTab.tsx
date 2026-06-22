"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Layers,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { formatRelativeTime } from "@/lib/shared/time";

interface BundlesSubTabProps {
  projects: any[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  locale: string;
  isPending: boolean;
  startTransition: (cb: () => void) => void;
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

function getTrackBadgeStyle(releaseTrack: string) {
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
}

export function BundlesSubTab({
  projects,
  selectedProjectId,
  setSelectedProjectId,
  locale,
  isPending,
  startTransition,
}: BundlesSubTabProps) {
  const t = useTranslations("VercelTab");
  const router = useRouter();

  // Lepos Bundle subsystem states
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState<string>("");
  const [track, setTrack] = useState<string>("production");
  const [releaseNotes, setReleaseNotes] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

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

  return (
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
  );
}
