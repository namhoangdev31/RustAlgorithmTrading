import { Link } from "@/i18n/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ProjectForm({
  action,
  project,
  organizations = [],
  activeOrganizationId,
  returnTo,
  title,
  t,
}: {
  action: (formData: FormData) => Promise<void>;
  project?: any;
  organizations?: { id: string; name: string }[];
  activeOrganizationId?: string;
  returnTo: string;
  title: string;
  t: any;
}) {
  return (
    <Card className="border border-hairline shadow-dark bg-canvas overflow-hidden rounded-xl animate-in fade-in zoom-in-95 duration-200">
      <CardHeader className="border-b border-hairline-cool pb-5 bg-canvas-soft/60">
        <CardTitle className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs text-ink-mute mt-1 leading-relaxed">
          {t("form.description") || "Enter the details of your project below."}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form action={action} className="grid gap-5 md:grid-cols-2">
          {project ? <input type="hidden" name="projectId" value={project.id} /> : null}
          <input type="hidden" name="returnTo" value={returnTo} />

          <div className="grid gap-2 md:col-span-2">
            <Label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">
              {t("form.project_name") || "Project Name"} <span className="text-destructive">*</span>
            </Label>
            <Input defaultValue={project?.name ?? ""} name="projectName" required placeholder="e.g. My Algorithmic Trading Platform" className="h-10 bg-canvas border-hairline focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-sm text-sm shadow-light" />
          </div>

          {!project && organizations.length > 0 ? (
            <div className="grid gap-2 md:col-span-2">
              <Label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">{t("form.organization") || "Organization"}</Label>
              <Select defaultValue={activeOrganizationId} name="organizationId">
                <SelectTrigger className="h-10 bg-canvas border-hairline focus:ring-1 focus:ring-primary transition-all rounded-sm text-sm shadow-light">
                  <SelectValue placeholder={t("form.select_organization") || "Select an organization"} />
                </SelectTrigger>
                <SelectContent className="bg-canvas border border-hairline rounded-lg shadow-dark">
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id} className="cursor-pointer hover:bg-canvas-soft rounded-md">{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">{t("form.bundle_name") || "Bundle Name"}</Label>
            <Input defaultValue={project?.bundle?.name ?? ""} name="bundleName" placeholder="e.g. trading-bot-bundle" className="h-10 bg-canvas border-hairline focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-sm text-sm shadow-light" />
          </div>

          <div className="grid gap-2">
            <Label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">{t("form.project_type") || "Project Type"}</Label>
            <Select defaultValue={project?.bundle?.category ?? "web"} name="category">
              <SelectTrigger className="h-10 bg-canvas border-hairline focus:ring-1 focus:ring-primary transition-all rounded-sm text-sm shadow-light">
                <SelectValue placeholder={t("form.select_project_type") || "Select type"} />
              </SelectTrigger>
              <SelectContent className="bg-canvas border border-hairline rounded-lg">
                <SelectItem value="web" className="cursor-pointer hover:bg-canvas-soft rounded-md">{t("form.project_type_options.web") || "Web App"}</SelectItem>
                <SelectItem value="mobile" className="cursor-pointer hover:bg-canvas-soft rounded-md">{t("form.project_type_options.mobile") || "Mobile App"}</SelectItem>
                <SelectItem value="desktop" className="cursor-pointer hover:bg-canvas-soft rounded-md">{t("form.project_type_options.desktop") || "Desktop App"}</SelectItem>
                <SelectItem value="api" className="cursor-pointer hover:bg-canvas-soft rounded-md">{t("form.project_type_options.api") || "API / Service"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">{t("form.status") || "Status"}</Label>
            <Select defaultValue={project?.bundle?.status ?? "draft"} name="status">
              <SelectTrigger className="h-10 bg-canvas border-hairline focus:ring-1 focus:ring-primary transition-all rounded-sm text-sm shadow-light">
                <SelectValue placeholder={t("form.select_status") || "Select status"} />
              </SelectTrigger>
              <SelectContent className="bg-canvas border border-hairline rounded-lg">
                <SelectItem value="draft" className="cursor-pointer hover:bg-canvas-soft rounded-md">{t("form.status_options.draft") || "Draft"}</SelectItem>
                <SelectItem value="review" className="cursor-pointer hover:bg-canvas-soft rounded-md">{t("form.status_options.review") || "Review"}</SelectItem>
                <SelectItem value="published" className="cursor-pointer hover:bg-canvas-soft rounded-md">{t("form.status_options.published") || "Published"}</SelectItem>
                <SelectItem value="archived" className="cursor-pointer hover:bg-canvas-soft rounded-md">{t("form.status_options.archived") || "Archived"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">{t("form.project_description") || "Project Description"}</Label>
            <textarea name="description" defaultValue={project?.description ?? ""} rows={3} placeholder="Explain what this project is about..." className="w-full rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-all duration-200 font-sans shadow-light" />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">{t("form.bundle_summary") || "Bundle Summary"}</Label>
            <Input defaultValue={project?.bundle?.shortDescription ?? ""} name="shortDescription" placeholder="Short summary of the compiled bundle" className="h-10 bg-canvas border-hairline focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-sm text-sm shadow-light" />
          </div>

          <div className="flex items-center justify-end gap-3 md:col-span-2 pt-5 border-t border-hairline-cool mt-2">
            <Button asChild variant="outline" className="h-10 hover:bg-canvas-soft transition-colors border-hairline-strong rounded-sm text-xs font-semibold px-4 text-ink">
              <Link href={returnTo}>{t("form.cancel") || "Cancel"}</Link>
            </Button>
            <Button type="submit" className="h-10 bg-primary hover:bg-primary-deep text-primary-foreground font-semibold transition-all duration-200 px-6 rounded-sm shadow-light text-xs">
              {project ? (t("form.save_changes") || "Save Changes") : (t("form.create_project") || "Create Project")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
