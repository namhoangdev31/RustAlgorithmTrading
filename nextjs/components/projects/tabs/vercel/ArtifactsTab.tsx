"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getArtifactStatusAction, artifactExistsAction } from "@/app/actions/vercel";

interface ArtifactsTabProps {
  project: any;
}

export function ArtifactsTab({ project }: ArtifactsTabProps) {
  const [cachingStatus, setCachingStatus] = useState<any>(null);
  const [loadingCaching, setLoadingCaching] = useState(false);
  const [cachingError, setCachingError] = useState("");
  const [artifactHashToCheck, setArtifactHashToCheck] = useState("");
  const [artifactExistsResult, setArtifactExistsResult] = useState<boolean | null>(null);
  const [checkingArtifact, setCheckingArtifact] = useState(false);

  useEffect(() => {
    const fetchCachingStatus = async () => {
      setLoadingCaching(true);
      setCachingError("");
      try {
        const res = await getArtifactStatusAction(project.id);
        if (res.success && res.status) {
          setCachingStatus(res.status);
        } else {
          setCachingError(res.error || "Failed to load caching status");
        }
      } catch (err: any) {
        setCachingError(err?.message || "Failed to load caching status");
      } finally {
        setLoadingCaching(false);
      }
    };
    fetchCachingStatus();
  }, [project.id]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="bg-canvas border border-hairline rounded-lg p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base font-bold text-ink">Remote Caching & Build Artifacts</CardTitle>
          <CardDescription className="text-xs text-ink-mute">Manage and audit build caching artifacts to accelerate build pipelines.</CardDescription>
        </CardHeader>
        <Separator className="bg-hairline my-4" />
        <CardContent className="px-0 space-y-6">
          {loadingCaching ? (
            <div className="text-xs text-ink-mute">Loading remote caching status...</div>
          ) : cachingError ? (
            <div className="text-xs text-destructive">{cachingError}</div>
          ) : cachingStatus ? (
            <div className="bg-canvas-soft/40 p-4 rounded-md border border-hairline flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Caching State</h4>
                <p className="text-[11px] text-ink-mute mt-1">Remote cache storage status for your team/organization.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${cachingStatus.status === "disabled" ? "bg-destructive" : "bg-primary"}`} />
                <span className="text-xs font-bold text-ink uppercase">{cachingStatus.status || "Active"}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-ink-mute">Remote caching status details are not available.</div>
          )}

          {/* Artifact existence check form */}
          <div className="space-y-4 border border-hairline p-4 rounded-md bg-canvas-soft/20">
            <h4 className="text-xs font-bold text-ink">Query Build Artifact Existence</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Enter artifact sha256 hash"
                value={artifactHashToCheck}
                onChange={(e) => {
                  setArtifactHashToCheck(e.target.value);
                  setArtifactExistsResult(null);
                }}
                className="bg-canvas border-hairline focus:border-primary focus:ring-0 text-xs font-mono h-9 rounded-sm flex-1"
              />
              <Button
                onClick={async () => {
                  if (!artifactHashToCheck) return;
                  setCheckingArtifact(true);
                  try {
                    const res = await artifactExistsAction(project.id, artifactHashToCheck);
                    setArtifactExistsResult(res.success);
                  } catch (err) {
                    console.error(err);
                    setArtifactExistsResult(false);
                  } finally {
                    setCheckingArtifact(false);
                  }
                }}
                disabled={checkingArtifact || !artifactHashToCheck}
                className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4"
              >
                {checkingArtifact ? "Checking..." : "Verify Hash"}
              </Button>
            </div>

            {artifactExistsResult !== null && (
              <Alert className={`mt-2 ${artifactExistsResult ? "bg-primary/5 border-primary/20 text-primary" : "bg-destructive/5 border-destructive/20 text-destructive"}`}>
                <AlertCircle className="size-4 shrink-0" />
                <AlertDescription className="text-xs font-medium">
                  {artifactExistsResult 
                    ? "Artifact exists and is available in the remote cache." 
                    : "Artifact does not exist in the remote cache."}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
