"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getAuthUserAction } from "@/app/actions/vercel";

interface ConnectedAccountTabProps {
  project: any;
}

export function ConnectedAccountTab({ project }: ConnectedAccountTabProps) {
  const [authProfile, setAuthProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      setProfileError("");
      try {
        const res = await getAuthUserAction(project.id);
        if (res.success && res.user) {
          setAuthProfile(res.user);
        } else {
          setProfileError(res.error || "Failed to load user profile");
        }
      } catch (err: any) {
        setProfileError(err?.message || "Failed to load user profile");
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [project.id]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="bg-canvas border border-hairline rounded-lg p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base font-bold text-ink">Connected Account Profile</CardTitle>
          <CardDescription className="text-xs text-ink-mute">
            Review the currently connected Vercel account profile, tokens, and active plan metadata.
          </CardDescription>
        </CardHeader>
        <Separator className="bg-hairline my-4" />
        <CardContent className="px-0">
          {loadingProfile ? (
            <div className="text-xs text-ink-mute py-4 text-center">Loading account details...</div>
          ) : profileError ? (
            <div className="text-xs text-destructive py-4 text-center">{profileError}</div>
          ) : !authProfile ? (
            <div className="text-xs text-ink-mute py-4 text-center">No profile details available.</div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-canvas-soft/20 border border-hairline rounded-md">
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase overflow-hidden shrink-0 border border-hairline">
                  {authProfile.avatar ? (
                    <img src={`https://vercel.com/api/www/avatar/${authProfile.avatar}?s=128`} alt={authProfile.name || authProfile.username} className="size-full object-cover" />
                  ) : (
                    (authProfile.name || authProfile.username || "U").slice(0, 2)
                  )}
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-sm font-bold text-ink">{authProfile.name || authProfile.username}</div>
                  <div className="text-xs text-ink-secondary">@{authProfile.username}</div>
                  <div className="text-xs text-ink-mute font-mono">{authProfile.email}</div>
                </div>
                <div className="sm:ml-auto">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#0c0c0d] border border-hairline text-primary">
                    Vercel Account
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-canvas-soft/10 border border-hairline rounded-md">
                  <div className="text-[10px] text-ink-mute uppercase font-bold tracking-wider mb-1">User ID</div>
                  <div className="text-xs font-mono text-ink-secondary truncate">{authProfile.id}</div>
                </div>
                <div className="p-4 bg-canvas-soft/10 border border-hairline rounded-md">
                  <div className="text-[10px] text-ink-mute uppercase font-bold tracking-wider mb-1">Account Created</div>
                  <div className="text-xs text-ink-secondary">
                    {authProfile.createdAt ? new Date(authProfile.createdAt).toLocaleDateString() : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
