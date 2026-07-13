"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAbTestAction } from "@/app/actions/lepoship-ab";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

interface Track {
  id: string;
  track: string;
  version: string;
  buildNumber: number;
}

interface Props {
  projectId: string;
  tracks: Track[];
  tests: { id: string; status: string }[];
}

export function AbTestActions({ projectId, tracks, tests }: Props) {
  const t = useTranslations("LepoShip.ab_testing");
  const [showForm, setShowForm] = React.useState(false);
  const hasRunning = tests.some((t) => t.status === "running");

  if (!showForm) {
    return (
      <Button
        type="button"
        size="sm"
        onClick={() => setShowForm(true)}
        className="h-8 text-xs gap-1.5 cursor-pointer"
      >
        <Plus className="size-3.5" />
        {t("create")}
      </Button>
    );
  }

  return (
    <Card className="border-hairline">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{t("create")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createAbTestAction} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="testName" className="text-xs">Test Name</Label>
              <Input id="testName" name="testName" placeholder="e.g., New onboarding flow" required className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="metricType" className="text-xs">Primary metric</Label>
              <select id="metricType" name="metricType" defaultValue="install_event" className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-xs">
                <option value="install_event">Install completion</option>
                <option value="analytics_event">Analytics event</option>
                <option value="retention_d1">D1 retention</option>
                <option value="retention_d7">D7 retention</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="metricEventName" className="text-xs">Analytics event name</Label>
              <Input id="metricEventName" name="metricEventName" placeholder="Required for analytics event" className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conversionWindowHours" className="text-xs">Conversion window (hours)</Label>
              <Input id="conversionWindowHours" name="conversionWindowHours" type="number" min={1} max={720} defaultValue={24} className="h-8 text-xs" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hypothesis" className="text-xs">Hypothesis (optional)</Label>
            <Input id="hypothesis" name="hypothesis" placeholder="What do you expect to happen?" className="h-8 text-xs" />
          </div>

          <div className="space-y-3 rounded-md border border-border p-3">
            <p className="text-xs font-medium">Eligibility targeting <span className="text-muted-foreground">(optional, comma-separated)</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input name="targetCountries" placeholder="Countries: US, VN" className="h-8 text-xs" />
              <Input name="targetLocales" placeholder="Locales: en, vi-VN" className="h-8 text-xs" />
              <Input name="targetPlatforms" placeholder="Platforms: ios, android" className="h-8 text-xs" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input name="minIosVersion" placeholder="iOS min" className="h-8 text-xs" />
              <Input name="maxIosVersion" placeholder="iOS max" className="h-8 text-xs" />
              <Input name="minAndroidVersion" placeholder="Android min" className="h-8 text-xs" />
              <Input name="maxAndroidVersion" placeholder="Android max" className="h-8 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="trafficSplit" className="text-xs">Traffic Split (% to Variant B)</Label>
              <Input id="trafficSplit" name="trafficSplit" type="number" min={0} max={100} defaultValue={50} className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="targetBuildNumber" className="text-xs">Target Build Number</Label>
              <select
                id="targetBuildNumber"
                name="targetBuildNumber"
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select a release track…</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.buildNumber}>
                    {t.track} — v{t.version} (#{t.buildNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasRunning && (
            <p className="text-xs text-amber-500">
              ⚠ A test is already running. New tests will be created as drafts.
            </p>
          )}

          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" className="h-8 text-xs cursor-pointer">
              {t("create")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowForm(false)}
              className="h-8 text-xs cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
