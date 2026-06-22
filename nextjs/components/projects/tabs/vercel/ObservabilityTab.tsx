"use client";

import { useTranslations } from "next-intl";
import { Activity, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toggleObservabilityAction } from "@/app/actions/vercel";

interface ObservabilityTabProps {
  project: any;
  returnTo: string;
}

export function ObservabilityTab({ project, returnTo }: ObservabilityTabProps) {
  const t = useTranslations("VercelTab");

  return (
    <Card className="bg-canvas border border-hairline rounded-lg p-5">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base font-bold text-ink">{t("observability.title")}</CardTitle>
        <CardDescription className="text-xs text-ink-mute">{t("observability.desc")}</CardDescription>
      </CardHeader>
      <Separator className="bg-hairline my-4" />
      <CardContent className="px-0 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-canvas-soft/40 p-4 rounded-md border border-hairline">
          <div>
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Project Integration Status</h4>
            <p className="text-[11px] text-ink-mute mt-1">Configure whether API observability telemetry data is enabled for this project.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary" />
            <span className="text-xs font-bold text-ink">{t("observability.status_enabled")}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <form action={toggleObservabilityAction} className="flex flex-col">
            <input type="hidden" name="projectId" value={project.vercelProjectId || ""} />
            <input type="hidden" name="disabled" value="false" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <Button type="submit" variant="outline" className="w-full border-hairline-strong text-xs font-semibold hover:bg-canvas-soft h-10 rounded-sm">
              <Activity className="size-3.5 mr-2 text-primary" />
              {t("observability.toggle_enable")}
            </Button>
          </form>

          <form action={toggleObservabilityAction} className="flex flex-col">
            <input type="hidden" name="projectId" value={project.vercelProjectId || ""} />
            <input type="hidden" name="disabled" value="true" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <Button type="submit" variant="outline" className="w-full border-destructive/20 hover:border-destructive/40 text-destructive text-xs font-semibold hover:bg-destructive/5 h-10 rounded-sm">
              <ShieldAlert className="size-3.5 mr-2" />
              {t("observability.toggle_disable")}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
