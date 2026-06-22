"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { stageRedirectsAction } from "@/app/actions/vercel";

interface RedirectsTabProps {
  project: any;
  returnTo: string;
}

export function RedirectsTab({ project, returnTo }: RedirectsTabProps) {
  const t = useTranslations("VercelTab");

  return (
    <Card className="bg-canvas border border-hairline rounded-lg p-5">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base font-bold text-ink">{t("redirects.title")}</CardTitle>
        <CardDescription className="text-xs text-ink-mute">{t("redirects.desc")}</CardDescription>
      </CardHeader>
      <Separator className="bg-hairline my-4" />
      <CardContent className="px-0">
        <form action={stageRedirectsAction} className="space-y-4">
          <input type="hidden" name="projectId" value={project.vercelProjectId || ""} />
          <input type="hidden" name="returnTo" value={returnTo} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="source" className="text-xs font-bold text-ink-secondary">{t("redirects.source_label")}</Label>
              <Input
                id="source"
                name="source"
                placeholder={t("redirects.source_placeholder")}
                required
                className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destination" className="text-xs font-bold text-ink-secondary">{t("redirects.dest_label")}</Label>
              <Input
                id="destination"
                name="destination"
                placeholder={t("redirects.dest_placeholder")}
                required
                className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
              />
            </div>
          </div>

          <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
            <Plus className="size-3.5 mr-1.5" />
            {t("redirects.stage_btn")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
