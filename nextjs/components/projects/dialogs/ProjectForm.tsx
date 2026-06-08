"use client";

import { Link } from "@/i18n/navigation";
import { Sparkles, Clipboard, Check, Calendar, AlertCircle, Trash2, GitBranch } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { linkProjectRepositoryAction, unlinkProjectRepositoryAction } from "@/app/actions/admin";
import { GithubIcon } from "@/components/ui/icon";

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
  initialName = "",
  initialDescription = "",
  github = { connected: false, repos: [] },
  initialRepoFullName = "",
}: {
  action: (formData: FormData) => Promise<void>;
  project?: any;
  organizations?: { id: string; name: string }[];
  activeOrganizationId?: string;
  returnTo: string;
  title?: string;
  t?: any;
  vercelConnected?: boolean;
  initialName?: string;
  initialDescription?: string;
  github?: { connected: boolean; repos: any[] };
  initialRepoFullName?: string;
}) {
  const t = useTranslations("Dashboard");
  const [projectNameState, setProjectNameState] = useState(project?.name ?? initialName);
  const [category, setCategory] = useState(project?.bundle?.category ?? "web");
  const [deployToVercel, setDeployToVercel] = useState(false);
  const [isCustomVercelName, setIsCustomVercelName] = useState(false);
  const [vercelProjectName, setVercelProjectName] = useState("");
  const [origin, setOrigin] = useState("");
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [copiedWebhookSecret, setCopiedWebhookSecret] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

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

  const githubIntegration = project?.bundle?.externalIntegrations?.find(
    (i: any) => i.integrationType === "github"
  );

  let configData: any = {};
  try {
    if (githubIntegration?.config) {
      configData = JSON.parse(githubIntegration.config);
    }
  } catch {}

  const webhookSecret = configData.webhookSecret || "";
  const logs: any[] = configData.logs || [];
  const webhookUrl = origin ? `${origin}/api/webhooks/github` : "";

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formContent = (
    <div className="space-y-6">
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
          <Select value={category} onValueChange={setCategory} name="category">
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
          <Textarea name="description" defaultValue={project?.description ?? initialDescription} rows={3} placeholder="Explain what this project is about..." className="border-hairline bg-canvas text-sm shadow-light text-ink" />
        </div>

        <div className="grid gap-2 md:col-span-2">
          <Label className={fieldLabelClass}>{t("form.bundle_summary") || "Bundle Summary"}</Label>
          <Input defaultValue={project?.bundle?.shortDescription ?? ""} name="shortDescription" placeholder="Short summary of the compiled bundle" className={fieldControlClass} />
        </div>

        {/* GitHub Integration for project creation */}
        {!project && github.connected && (
          <div className="grid gap-2 md:col-span-2 border-t border-hairline pt-4 mt-2">
            <Label className={fieldLabelClass}>Link GitHub Repository (Optional)</Label>
            <Select name="repoFullName" defaultValue={initialRepoFullName || ""}>
              <SelectTrigger className={fieldControlClass}>
                <SelectValue placeholder="Select a GitHub repository to link" />
              </SelectTrigger>
              <SelectContent className="bg-canvas border border-hairline rounded-lg">
                <SelectItem value="" className="cursor-pointer hover:bg-canvas-soft rounded-md">None (Do not link)</SelectItem>
                {github.repos.map((repo) => (
                  <SelectItem key={repo.id} value={repo.fullName} className="cursor-pointer hover:bg-canvas-soft rounded-md">
                    {repo.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-ink-mute-2 leading-relaxed">
              Select a repository to automatically trigger package build and release when tagging or creating releases.
            </p>
          </div>
        )}

        {/* Vercel Integration Section */}
        {category === "web" && (
          <div className="md:col-span-2 mt-2 pt-2 border-t border-hairline-cool animate-in fade-in duration-200">
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
                        href={`https://vercel.com/new`}
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
        )}

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

      {/* GitHub Repository integration section for edit project */}
      {project && (
        <div className="border-t border-hairline pt-6 mt-6">
          <Label className="text-xs font-bold text-ink uppercase tracking-wider block mb-4 flex items-center gap-2">
            <GithubIcon className="size-4" />
            {t("form.github_integration") || "GitHub Repository Integration"}
          </Label>

          {githubIntegration ? (
            <div className="space-y-4">
              <div className="p-4 bg-canvas-soft border border-hairline rounded-lg flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded bg-canvas flex items-center justify-center font-bold text-ink shrink-0 border border-hairline text-sm">
                    <GitBranch className="size-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink flex items-center gap-2">
                      <span>{t("form.linked_repository") || "Linked Repository"}</span>
                      <span className="size-2 rounded-full bg-primary inline-block" />
                    </div>
                    <div className="text-xs text-ink-mute mt-0.5 font-mono">{githubIntegration.displayName}</div>
                    <div className="text-[10px] text-ink-mute mt-1">
                      {t("form.linked_repository") ? "Linked" : "Linked"}: {new Date(githubIntegration.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <form action={unlinkProjectRepositoryAction} className="shrink-0">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Button type="submit" variant="destructive" size="sm" className="h-8 text-xs font-semibold rounded-sm bg-destructive hover:bg-destructive-deep text-destructive-foreground cursor-pointer flex items-center gap-1.5">
                    <Trash2 className="size-3.5" />
                    {t("form.disconnect_repository") || "Disconnect Repository"}
                  </Button>
                </form>
              </div>

              {/* Webhook details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-canvas-soft/40 border border-hairline rounded-lg space-y-2">
                  <div className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">{t("form.webhook_url") || "Webhook URL"}</div>
                  <div className="flex items-center gap-2 bg-canvas border border-hairline rounded p-2 text-xs font-mono text-ink-secondary truncate">
                    <span className="truncate flex-1">{webhookUrl}</span>
                    <Button
                       type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-ink-mute hover:text-ink hover:bg-canvas-soft"
                      onClick={() => copyToClipboard(webhookUrl, setCopiedWebhookUrl)}
                    >
                      {copiedWebhookUrl ? <Check className="size-3.5 text-primary" /> : <Clipboard className="size-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-canvas-soft/40 border border-hairline rounded-lg space-y-2">
                  <div className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">{t("form.webhook_secret") || "Webhook Secret"}</div>
                  <div className="flex items-center gap-2 bg-canvas border border-hairline rounded p-2 text-xs font-mono text-ink-secondary truncate">
                    <span className="truncate flex-1">whsec_••••••••••••••••</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-ink-mute hover:text-ink hover:bg-canvas-soft"
                      onClick={() => copyToClipboard(webhookSecret, setCopiedWebhookSecret)}
                    >
                      {copiedWebhookSecret ? <Check className="size-3.5 text-primary" /> : <Clipboard className="size-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Webhook Delivery Logs */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-ink-mute uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {t("form.delivery_logs") || "Recent Package Delivery Logs (Webhook runs)"}
                </div>
                <div className="border border-hairline bg-canvas rounded-lg overflow-hidden max-h-[200px] overflow-y-auto divide-y divide-hairline">
                  {logs.length > 0 ? (
                    logs.map((log: any, idx: number) => (
                      <div key={idx} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-canvas-soft/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              log.status === "success" || log.statusCode === 200
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-destructive/10 text-destructive border border-destructive/20"
                            }`}>
                              {log.statusCode || (log.status === "success" ? 200 : 500)}
                            </span>
                            <span className="font-bold text-ink-secondary font-mono">{log.event || "push"}</span>
                          </div>
                          <p className="text-ink-mute text-[11px]">{log.message}</p>
                        </div>
                        <div className="text-[10px] text-ink-mute-2 shrink-0 font-mono text-right">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : "Unknown date"}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-ink-mute">
                      {t("form.no_events_received") || "No events received yet. Push a tag/release to trigger a package bundle build."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-canvas-soft border border-hairline border-dashed rounded-lg text-center space-y-4">
              <div className="mx-auto size-10 rounded-full bg-canvas border border-hairline flex items-center justify-center shadow-light">
                <GitBranch className="size-5 text-ink-mute-2" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-xs font-bold text-ink">{t("form.no_linked_repo") || "No Linked Git Repository"}</h4>
                <p className="text-xs text-ink-mute leading-relaxed">
                  {t("form.github_desc") || "Connecting a GitHub repository automatically compiles and ingests mobile/web bundle updates when you release tags."}
                </p>
              </div>

              {github.connected ? (
                <form action={linkProjectRepositoryAction} className="max-w-md mx-auto flex gap-2">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Select name="repoFullName" required>
                    <SelectTrigger className={fieldControlClass + " flex-1 text-left"}>
                      <SelectValue placeholder={t("form.select_repo") || "Select a repository"} />
                    </SelectTrigger>
                    <SelectContent className="bg-canvas border border-hairline rounded-lg max-h-[260px] overflow-y-auto">
                      {github.repos.map((repo) => (
                        <SelectItem key={repo.id} value={repo.fullName} className="cursor-pointer hover:bg-canvas-soft rounded-md text-xs font-medium">
                          {repo.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="submit" className="h-10 bg-primary hover:bg-primary-deep text-primary-foreground font-semibold px-4 rounded-sm text-xs shadow-light">
                    {t("form.link_repository") || "Link Repository"}
                  </Button>
                </form>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs text-ink-mute">{t("form.connect_first") || "Connect your GitHub account first in workspace settings to link."}</p>
                  <Button asChild variant="outline" className="h-8 text-[11px] font-semibold border-hairline-strong rounded-sm bg-canvas">
                    <Link href="/projects?tab=settings">{t("form.go_to_settings") || "Go to settings"}</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
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
