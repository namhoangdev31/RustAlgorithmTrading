import { AlertCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function DeleteConfirmationDialog({
  project,
  action,
  returnTo,
  t,
}: {
  project: any;
  action: (formData: FormData) => Promise<void>;
  returnTo: string;
  t: any;
}) {
  return (
    <Card className="border border-hairline shadow-dark bg-canvas overflow-hidden rounded-xl max-w-md w-full mx-auto animate-in fade-in zoom-in-95 duration-200">
      <CardHeader className="pb-4 bg-canvas-soft/60 border-b border-hairline-cool">
        <CardTitle className="text-lg font-bold text-destructive flex items-center gap-2">
          <AlertCircle className="size-5 shrink-0" />
          <span className="truncate">{t("delete_dialog.title", { name: project.name }) || `Delete ${project.name}`}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
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
      </CardContent>
    </Card>
  );
}
