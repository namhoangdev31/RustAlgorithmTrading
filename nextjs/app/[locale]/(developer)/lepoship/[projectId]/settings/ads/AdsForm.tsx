"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { upsertAdConfigAction } from "@/app/actions/lepoship-ads";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdsFormProps {
  projectId: string;
  initialConfig?: {
    provider: string;
    appId: string;
    bannerId: string | null;
    interstitialId: string | null;
    rewardedId: string | null;
    nativeId: string | null;
    isTestMode: boolean;
    isActive: boolean;
  } | null;
}

export function AdsForm({ projectId, initialConfig }: AdsFormProps) {
  const [provider, setProvider] = React.useState(initialConfig?.provider || "admob");
  const [appId, setAppId] = React.useState(initialConfig?.appId || "");
  const [bannerId, setBannerId] = React.useState(initialConfig?.bannerId || "");
  const [interstitialId, setInterstitialId] = React.useState(initialConfig?.interstitialId || "");
  const [rewardedId, setRewardedId] = React.useState(initialConfig?.rewardedId || "");
  const [nativeId, setNativeId] = React.useState(initialConfig?.nativeId || "");
  const [isTestMode, setIsTestMode] = React.useState(initialConfig?.isTestMode ?? false);
  const [isActive, setIsActive] = React.useState(initialConfig?.isActive ?? true);
  const [pending, setPending] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId.trim()) return;
    setPending(true);
    setSuccess(false);
    try {
      await upsertAdConfigAction(projectId, {
        provider,
        appId,
        bannerId,
        interstitialId,
        rewardedId,
        nativeId,
        isTestMode,
        isActive,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update ad configurations.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl text-xs">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground">Ad Network Provider</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="h-10 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admob" className="text-xs">Google AdMob</SelectItem>
              <SelectItem value="unity" className="text-xs">Unity Ads</SelectItem>
              <SelectItem value="applovin" className="text-xs">AppLovin MAX</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="appId" className="text-xs font-semibold text-muted-foreground">Application ID (App ID)</Label>
          <Input
            id="appId"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            placeholder="e.g. ca-app-pub-3940256099942544~3347511713"
            className="h-10 text-xs bg-canvas"
            required
          />
        </div>
      </div>

      <Separator className="border-hairline" />

      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Placement & Unit IDs</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bannerId" className="text-xs font-semibold text-muted-foreground">Banner Placement ID</Label>
            <Input
              id="bannerId"
              value={bannerId}
              onChange={(e) => setBannerId(e.target.value)}
              placeholder="Banner unit ID..."
              className="h-10 text-xs bg-canvas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interstitialId" className="text-xs font-semibold text-muted-foreground">Interstitial Placement ID</Label>
            <Input
              id="interstitialId"
              value={interstitialId}
              onChange={(e) => setInterstitialId(e.target.value)}
              placeholder="Interstitial unit ID..."
              className="h-10 text-xs bg-canvas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rewardedId" className="text-xs font-semibold text-muted-foreground">Rewarded Placement ID</Label>
            <Input
              id="rewardedId"
              value={rewardedId}
              onChange={(e) => setRewardedId(e.target.value)}
              placeholder="Rewarded unit ID..."
              className="h-10 text-xs bg-canvas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nativeId" className="text-xs font-semibold text-muted-foreground">Native Placement ID</Label>
            <Input
              id="nativeId"
              value={nativeId}
              onChange={(e) => setNativeId(e.target.value)}
              placeholder="Native unit ID..."
              className="h-10 text-xs bg-canvas"
            />
          </div>
        </div>
      </div>

      <Separator className="border-hairline" />

      <div className="flex flex-wrap gap-6 items-center">
        <div className="flex items-center space-x-2.5">
          <Checkbox
            id="isTestMode"
            checked={isTestMode}
            onCheckedChange={(checked) => setIsTestMode(checked === true)}
          />
          <Label htmlFor="isTestMode" className="text-xs font-semibold text-foreground cursor-pointer select-none">
            Enable Test Mode (Sandbox Ad rendering)
          </Label>
        </div>

        <div className="flex items-center space-x-2.5">
          <Checkbox
            id="isActive"
            checked={isActive}
            onCheckedChange={(checked) => setIsActive(checked === true)}
          />
          <Label htmlFor="isActive" className="text-xs font-semibold text-foreground cursor-pointer select-none">
            Active configuration
          </Label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={pending}
          className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-5 h-9 text-xs cursor-pointer shadow-light"
        >
          {pending ? "Saving..." : "Save Ad Configuration"}
        </Button>
        {success && (
          <span className="text-xs font-medium text-emerald-500 animate-fade-in">
            Ad settings saved successfully!
          </span>
        )}
      </div>
    </form>
  );
}
