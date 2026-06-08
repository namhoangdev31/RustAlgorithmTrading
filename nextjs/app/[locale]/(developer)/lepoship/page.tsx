import { getTranslations } from "next-intl/server";
import { FolderGit, Wrench } from "lucide-react";

export default async function LeposhipPage() {
  const t = await getTranslations("Dashboard.shell.nav");

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 w-full">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 select-none text-xs font-medium text-ink-mute">
          <span className="text-ink font-semibold text-sm flex items-center gap-2">
            <FolderGit className="size-4" />
            {t("lepoship_projects")}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center border border-dashed border-hairline-strong rounded-xl bg-canvas-soft/50">
        <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Wrench className="size-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-ink mb-2">{t("lepoship_projects")}</h3>
        <p className="text-sm text-ink-secondary max-w-md">
          This workspace area is designated for self-developed LepoShip projects. Internal project management UI and functionalities will be developed here.
        </p>
      </div>
    </div>
  );
}
