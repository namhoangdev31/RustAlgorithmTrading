"use client";

import { AlertCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function DeleteConfirmationDialog({
  project,
  action,
  returnTo,
  t: _unusedT,
}: {
  project: any;
  action: (formData: FormData) => Promise<void>;
  returnTo: string;
  t?: any;
}) {
  const t = useTranslations("Dashboard");
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      <div className="shrink-0 border-b border-hairline bg-canvas-soft/60 px-6 py-5">
        <h2 className="flex items-center gap-2 pr-10 text-lg font-semibold text-destructive">
          <AlertCircle className="size-5 shrink-0" />
          <span className="truncate">{t("delete_dialog.title", { name: project.name }) || `Delete ${project.name}`}</span>
        </h2>
      </div>
      <div className="space-y-4 px-6 py-5">
        <p className="text-sm text-ink-mute leading-relaxed">
          {t("delete_dialog.description") || "Are you sure you want to delete this project? This action cannot be undone."}
        </p>
        <Separator />
        <form action={action} className="flex items-center justify-end gap-3 pt-1">
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button asChild variant="outline" className="h-10 text-xs font-semibold hover:bg-canvas-soft border-hairline-strong rounded-sm text-ink">
            <Link href={returnTo}>{t("delete_dialog.cancel") || "Cancel"}</Link>
          </Button>
          <Button type="submit" variant="destructive" className="h-10 text-xs font-semibold px-4 rounded-sm shadow-light">
            {t("delete_dialog.delete_project") || "Delete Project"}
          </Button>
        </form>
      </div>
    </div>
  );
}
