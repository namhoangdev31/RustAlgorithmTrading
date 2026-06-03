"use client";

import { Link } from "@/i18n/navigation";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const fieldLabelClass = "text-[11px] font-bold text-ink-mute uppercase tracking-wider";
const fieldControlClass =
  "h-10 bg-canvas border-hairline focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-sm text-sm shadow-light text-ink";

export function ProjectForm({
  action,
  project,
  organizations = [],
  activeOrganizationId,
  returnTo,
  title,
  t: _unusedT,
  vercelConnected = false,
}: {
  action: (formData: FormData) => Promise<void>;
  project?: any;
  organizations?: { id: string; name: string }[];
  activeOrganizationId?: string;
  returnTo: string;
  title?: string;
  t?: any;
  vercelConnected?: boolean;
}) {
  const t = useTranslations("Dashboard");
  const [projectNameState, setProjectNameState] = useState(project?.name ?? "");
  const [deployToVercel, setDeployToVercel] = useState(false);
  const [isCustomVercelName, setIsCustomVercelName] = useState(false);
  const [vercelProjectName, setVercelProjectName] = useState("");

  // Sync vercel name with project name if not custom
  useEffect(() => {
    if (!isCustomVercelName) {
      const slug = projectNameState
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setVercelProjectName(slug);
    }
  }, [projectNameState, isCustomVercelName]);

  const formContent = (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      {project ? <input type="hidden" name="projectId" value={project.id} /> : null}
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className="grid gap-2 md:col-span-2">
        <Label className={fieldLabelClass}>
          {t("form.project_name") || "Project Name"} <span className="text-destructive">*</span>
        </Label>
        <Input
          value={projectNameState}
          onChange={(e) => setProjectNameState(e.target.value)}
          name="projectName"
          required
          placeholder="e.g. My Awesome Mobile Web View"
          className={fieldControlClass}
        />
      </div>

      {!project && organizations.length > 0 ? (
        <div className="grid gap-2 md:col-span-2">
          <Label className={fieldLabelClass}>{t("form.organization") || "Organization"}</Label>
          <Select defaultValue={activeOrganizationId ?? organizations[0]?.id} name="organizationId">
            <SelectTrigger className={fieldControlClass}>
              <SelectValue placeholder={t("form.select_organization") || "Select an organization"} />
            </SelectTrigger>
            <SelectContent className="bg-canvas border border-hairline rounded-lg shadow-dark">
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id} className="cursor-pointer hover:bg-canvas-soft rounded-md">
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label className={fieldLabelClass}>{t("form.bundle_name") || "Bundle Name"}</Label>
        <Input defaultValue={project?.bundle?.name ?? ""} name="bundleName" placeholder="e.g. webview-bundle" className={fieldControlClass} />
      </div>

      <div className="grid gap-2">
        <Label className={fieldLabelClass}>{t("form.project_type") || "Project Type"}</Label>
        <Select defaultValue={project?.bundle?.category ?? "web"} name="category">
          <SelectTrigger className={fieldControlClass}>
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
        <Label className={fieldLabelClass}>{t("form.status") || "Status"}</Label>
        <Select defaultValue={project?.bundle?.status ?? "draft"} name="status">
          <SelectTrigger className={fieldControlClass}>
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
        <Label className={fieldLabelClass}>{t("form.project_description") || "Project Description"}</Label>
        <Textarea name="description" defaultValue={project?.description ?? ""} rows={3} placeholder="Explain what this project is about..." className="border-hairline bg-canvas text-sm shadow-light text-ink" />
      </div>

      <div className="grid gap-2 md:col-span-2">
        <Label className={fieldLabelClass}>{t("form.bundle_summary") || "Bundle Summary"}</Label>
        <Input defaultValue={project?.bundle?.shortDescription ?? ""} name="shortDescription" placeholder="Short summary of the compiled bundle" className={fieldControlClass} />
      </div>

      {/* Vercel Integration Section */}
      <div className="md:col-span-2 mt-2 pt-2 border-t border-hairline-cool">
        <Label className="text-[11px] font-bold text-primary uppercase tracking-wider block mb-3">Vercel Deployment</Label>
        
        {!project ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="deployToVercel"
                id="deployToVercel"
                checked={deployToVercel}
                onChange={(e) => setDeployToVercel(e.target.checked)}
                disabled={!vercelConnected}
                className="size-4.5 rounded border-hairline text-primary focus:ring-primary bg-canvas cursor-pointer disabled:cursor-not-allowed"
              />
              <Label htmlFor="deployToVercel" className="text-sm font-semibold text-ink cursor-pointer select-none">
                Link & Deploy with Vercel
              </Label>
              {!vercelConnected && (
                <span className="text-[9px] bg-canvas-soft border border-hairline text-ink-mute px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Not Connected
                </span>
              )}
            </div>

            {!vercelConnected ? (
              <p className="text-xs text-ink-mute-2 pl-7 leading-relaxed">
                You need to connect your Vercel Account under{" "}
                <Link href="/projects?tab=settings" className="underline text-primary hover:text-primary-deep font-medium">
                  Settings &gt; Integrations
                </Link>{" "}
                to enable automatic deployments.
              </p>
            ) : (
              <p className="text-xs text-ink-mute-2 pl-7 leading-relaxed">
                Create a web-hosting project on Vercel linked to this project instantly.
              </p>
            )}

            {vercelConnected && deployToVercel && (
              <div className="pl-7 space-y-3 pt-1 border-l-2 border-primary/20 animate-in slide-in-from-top-1 duration-200">
                <div className="grid gap-2">
                  <Label className={fieldLabelClass}>
                    Vercel Project Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    name="vercelProjectName"
                    value={vercelProjectName}
                    onChange={(e) => {
                      setVercelProjectName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                      setIsCustomVercelName(true);
                    }}
                    required={deployToVercel}
                    placeholder="e.g. my-awesome-web-view"
                    className={fieldControlClass}
                    pattern="^[a-z0-9]([a-z0-9-]*[a-z0-9])?$"
                    maxLength={100}
                  />
                  <p className="text-[10px] text-ink-mute-2 leading-relaxed">
                    Only lowercase letters, numbers, and hyphens. Must start/end with an alphanumeric character. Max 100 characters.
                  </p>
                </div>
                {vercelProjectName && (
                  <div className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/5 border border-primary/10 rounded px-2.5 py-1.5 w-fit">
                    <Sparkles className="size-3.5" />
                    <span>Project URL preview: <strong>{vercelProjectName}.vercel.app</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {project.vercelProjectName ? (
              <div className="p-4 bg-canvas-soft border border-hairline rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded bg-canvas flex items-center justify-center font-bold text-ink shrink-0 border border-hairline text-sm">
                    ▲
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink">Linked Vercel Project</div>
                    <div className="text-xs text-ink-mute mt-0.5 font-mono">{project.vercelProjectName}</div>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline" className="h-8 text-xs font-semibold border-hairline-strong hover:bg-canvas bg-canvas shrink-0">
                  <a
                    href={`https://vercel.com/new`} // Vercel dashboard projects url helper
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Vercel Dashboard
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-xs text-ink-mute-2 leading-relaxed">
                This project is not linked to Vercel. You can deploy it using the upload buttons in the overview tab.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="md:col-span-2 mt-2">
        <Separator />
      </div>

      <div className="flex items-center justify-end gap-3 md:col-span-2 pt-2">
        <Button asChild variant="outline" className="h-10 hover:bg-canvas-soft transition-colors border-hairline-strong rounded-sm text-xs font-semibold px-4 text-ink">
          <Link href={returnTo}>{t("form.cancel") || "Cancel"}</Link>
        </Button>
        <Button type="submit" className="h-10 bg-primary hover:bg-primary-deep text-primary-foreground font-semibold transition-all duration-200 px-6 rounded-sm shadow-light text-xs">
          {project ? (t("form.save_changes") || "Save Changes") : (t("form.create_project") || "Create Project")}
        </Button>
      </div>
    </form>
  );

  if (!title) {
    return formContent;
  }

  return (
    <Card className="border border-hairline shadow-dark bg-canvas overflow-hidden rounded-xl animate-in fade-in zoom-in-95 duration-200 py-0">
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
        {formContent}
      </CardContent>
    </Card>
  );
}
