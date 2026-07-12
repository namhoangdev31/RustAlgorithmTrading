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
              <Label htmlFor="metric" className="text-xs">Metric</Label>
              <Input id="metric" name="metric" placeholder="e.g., retention" defaultValue="retention" className="h-8 text-xs" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hypothesis" className="text-xs">Hypothesis (optional)</Label>
            <Input id="hypothesis" name="hypothesis" placeholder="What do you expect to happen?" className="h-8 text-xs" />
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
