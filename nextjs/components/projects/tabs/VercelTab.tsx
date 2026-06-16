"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Settings,
  Globe,
  ShieldAlert,
  Key,
  CreditCard,
  Activity,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ShieldCheck,
  PlusCircle,
  HelpCircle,
  Sliders
} from "lucide-react";
import { EdgeConfigVarsCard } from "@/components/projects/EdgeConfigVarsCard";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/shared/time";

import {
  createAccessGroupAction,
  deleteAccessGroupAction,
  createAuthTokenAction,
  deleteAuthTokenAction,
  buyCreditsAction,
  toggleObservabilityAction,
  issueCertificateAction,
  uploadCertificateAction,
  deleteCertificateAction,
  stageRedirectsAction
} from "@/app/actions/vercel";

interface VercelTabProps {
  project: any;
  vercelConnected: boolean;
  vercelAccessGroups: any[];
  vercelTokens: any[];
  vercelConnectionError?: boolean;
  locale: string;
  returnTo: string;
  vercelProjectEnvVars?: any[];
}

export function VercelTab({
  project,
  vercelConnected,
  vercelAccessGroups,
  vercelTokens,
  vercelConnectionError,
  locale,
  returnTo,
  vercelProjectEnvVars = [],
}: VercelTabProps) {
  const t = useTranslations("VercelTab");
  const [activeSection, setActiveSection] = useState<"observability" | "redirects" | "certs" | "access-groups" | "tokens" | "credits" | "matrix" | "edge-config">("observability");

  if (!vercelConnected) {
    return (
      <Card className="bg-canvas border border-hairline p-8 text-center rounded-lg max-w-xl mx-auto my-8">
        <CardHeader className="flex flex-col items-center justify-center space-y-3 pb-2">
          <div className="size-12 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink-mute">
            <ShieldAlert className="size-6 text-destructive" />
          </div>
          <CardTitle className="text-lg font-bold text-ink">{t("title")}</CardTitle>
          <CardDescription className="text-sm text-ink-mute">
            {t("not_connected")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button asChild className="bg-primary hover:bg-primary-deep text-primary-foreground font-semibold text-xs h-9 rounded-sm px-6">
            <Link href="/dashboard/settings">
              Configure Vercel API Key
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-300 w-full">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 select-none border-b border-hairline lg:border-b-0 lg:border-r lg:border-hairline pr-0 lg:pr-4 no-scrollbar">
        <button
          onClick={() => setActiveSection("observability")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "observability"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Activity className="size-4 shrink-0" />
          {t("observability.title")}
        </button>
        <button
          onClick={() => setActiveSection("redirects")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "redirects"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Globe className="size-4 shrink-0" />
          {t("redirects.title")}
        </button>
        <button
          onClick={() => setActiveSection("certs")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "certs"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <ShieldCheck className="size-4 shrink-0" />
          {t("certs.title")}
        </button>
        <button
          onClick={() => setActiveSection("access-groups")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "access-groups"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Settings className="size-4 shrink-0" />
          {t("access_groups.title")}
        </button>
        <button
          onClick={() => setActiveSection("tokens")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "tokens"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Key className="size-4 shrink-0" />
          {t("tokens.title")}
        </button>
        <button
          onClick={() => setActiveSection("credits")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "credits"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <CreditCard className="size-4 shrink-0" />
          {t("credits.title")}
        </button>
        <button
          onClick={() => setActiveSection("edge-config")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "edge-config"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <Sliders className="size-4 shrink-0" />
          Edge Config Sync
        </button>
        <button
          onClick={() => setActiveSection("matrix")}
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all text-left whitespace-nowrap ${
            activeSection === "matrix"
              ? "bg-canvas-soft border border-hairline text-ink font-bold shadow-sm"
              : "text-ink-mute hover:text-ink hover:bg-canvas-soft/40 border border-transparent"
          }`}
        >
          <HelpCircle className="size-4 shrink-0" />
          {t("matrix.title")}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {vercelConnectionError && (
          <Alert variant="destructive" className="mb-6 bg-destructive/5 border-destructive/20 text-destructive rounded-lg">
            <AlertCircle className="size-4 shrink-0" />
            <AlertTitle className="text-xs font-bold uppercase tracking-wider">Connection Error</AlertTitle>
            <AlertDescription className="text-xs font-semibold mt-1">
              {t("api_error")}
            </AlertDescription>
          </Alert>
        )}

        {/* 1. API Observability */}
        {activeSection === "observability" && (
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
        )}

        {/* 2. Redirect Rules */}
        {activeSection === "redirects" && (
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
        )}

        {/* 3. SSL Certificates */}
        {activeSection === "certs" && (
          <div className="space-y-6">
            {/* Issue Certificate */}
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">{t("certs.title")} — Issue SSL</CardTitle>
                <CardDescription className="text-xs text-ink-mute">{t("certs.desc")}</CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0">
                <form action={issueCertificateAction} className="space-y-4">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <div className="space-y-1.5">
                    <Label htmlFor="cns" className="text-xs font-bold text-ink-secondary">{t("certs.domain_label")}</Label>
                    <Input
                      id="cns"
                      name="cns"
                      placeholder={t("certs.domain_placeholder")}
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                    />
                  </div>
                  <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                    <CheckCircle className="size-3.5 mr-1.5" />
                    {t("certs.issue_btn")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Upload Certificate */}
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">{t("certs.upload_btn")}</CardTitle>
                <CardDescription className="text-xs text-ink-mute">Upload a custom TLS/SSL certificate chain for external routing.</CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0">
                <form action={uploadCertificateAction} className="space-y-4">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="cert" className="text-xs font-bold text-ink-secondary">{t("certs.cert_label")}</Label>
                    <Textarea
                      id="cert"
                      name="cert"
                      placeholder="-----BEGIN CERTIFICATE-----&#10;..."
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-mono min-h-20 rounded-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="key" className="text-xs font-bold text-ink-secondary">{t("certs.key_label")}</Label>
                    <Textarea
                      id="key"
                      name="key"
                      placeholder="-----BEGIN PRIVATE KEY-----&#10;..."
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-mono min-h-20 rounded-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ca" className="text-xs font-bold text-ink-secondary">{t("certs.ca_label")}</Label>
                    <Textarea
                      id="ca"
                      name="ca"
                      placeholder="-----BEGIN CERTIFICATE-----&#10;..."
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-mono min-h-20 rounded-sm"
                    />
                  </div>

                  <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                    <PlusCircle className="size-3.5 mr-1.5" />
                    {t("certs.upload_btn")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Revoke Certificate */}
            <Card className="bg-canvas border border-destructive/20 rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-destructive">{t("certs.remove_btn")}</CardTitle>
                <CardDescription className="text-xs text-ink-mute">Revoke or delete an existing certificate by ID.</CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0">
                <form action={deleteCertificateAction} className="space-y-4">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <div className="space-y-1.5">
                    <Label htmlFor="certId" className="text-xs font-bold text-ink-secondary">{t("certs.cert_id_label")}</Label>
                    <Input
                      id="certId"
                      name="certId"
                      placeholder={t("certs.cert_id_placeholder")}
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                    />
                  </div>
                  <Button type="submit" className="bg-destructive hover:bg-destructive-deep text-white text-xs font-semibold h-9 rounded-sm px-4">
                    <Trash2 className="size-3.5 mr-1.5" />
                    {t("certs.remove_btn")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 4. Access Groups */}
        {activeSection === "access-groups" && (
          <div className="space-y-6">
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">{t("access_groups.title")}</CardTitle>
                <CardDescription className="text-xs text-ink-mute">{t("access_groups.desc")}</CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0">
                <form action={createAccessGroupAction} className="space-y-4">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor="groupName" className="text-xs font-bold text-ink-secondary">{t("access_groups.name_label")}</Label>
                      <Input
                        id="groupName"
                        name="name"
                        placeholder={t("access_groups.name_placeholder")}
                        required
                        className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                      />
                    </div>
                    <Button type="submit" className="sm:self-end bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                      <Plus className="size-3.5 mr-1.5" />
                      {t("access_groups.create_btn")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-canvas border border-hairline rounded-lg p-0">
              <CardHeader className="p-5 border-b border-hairline">
                <CardTitle className="text-sm font-bold text-ink">Active Access Groups</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {vercelAccessGroups.length === 0 ? (
                  <div className="p-6 text-center text-xs text-ink-mute">
                    {t("access_groups.empty")}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("access_groups.col_id")}</TableHead>
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("access_groups.col_name")}</TableHead>
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("access_groups.col_created")}</TableHead>
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vercelAccessGroups.map((group) => (
                        <TableRow key={group.id} className="border-b border-hairline hover:bg-canvas-soft/10">
                          <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary">{group.id}</TableCell>
                          <TableCell className="px-5 py-3 text-xs font-semibold text-ink">{group.name}</TableCell>
                          <TableCell className="px-5 py-3 text-xs text-ink-mute">
                            {group.createdAt ? formatRelativeTime(new Date(group.createdAt), locale) : "N/A"}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-right">
                            <form action={deleteAccessGroupAction}>
                              <input type="hidden" name="idOrName" value={group.id} />
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <Button type="submit" variant="ghost" className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 px-2 rounded-sm text-xs">
                                <Trash2 className="size-3.5" />
                              </Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 5. Auth Tokens */}
        {activeSection === "tokens" && (
          <div className="space-y-6">
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">{t("tokens.title")}</CardTitle>
                <CardDescription className="text-xs text-ink-mute">{t("tokens.desc")}</CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0">
                <form action={createAuthTokenAction} className="space-y-4">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor="tokenName" className="text-xs font-bold text-ink-secondary">{t("tokens.name_label")}</Label>
                      <Input
                        id="tokenName"
                        name="name"
                        placeholder={t("tokens.name_placeholder")}
                        required
                        className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                      />
                    </div>
                    <Button type="submit" className="sm:self-end bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                      <Plus className="size-3.5 mr-1.5" />
                      {t("tokens.create_btn")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-canvas border border-hairline rounded-lg p-0">
              <CardHeader className="p-5 border-b border-hairline">
                <CardTitle className="text-sm font-bold text-ink">Active Tokens</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {vercelTokens.length === 0 ? (
                  <div className="p-6 text-center text-xs text-ink-mute">
                    {t("tokens.empty")}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("tokens.col_id")}</TableHead>
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("tokens.col_name")}</TableHead>
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("tokens.col_created")}</TableHead>
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vercelTokens.map((token) => (
                        <TableRow key={token.id} className="border-b border-hairline hover:bg-canvas-soft/10">
                          <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary">{token.id}</TableCell>
                          <TableCell className="px-5 py-3 text-xs font-semibold text-ink">{token.name}</TableCell>
                          <TableCell className="px-5 py-3 text-xs text-ink-mute">
                            {token.createdAt ? formatRelativeTime(new Date(token.createdAt), locale) : "N/A"}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-right">
                            <form action={deleteAuthTokenAction}>
                              <input type="hidden" name="tokenId" value={token.id} />
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <Button type="submit" variant="ghost" className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 px-2 rounded-sm text-xs">
                                <Trash2 className="size-3.5" />
                              </Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 6. Billing & Credits */}
        {activeSection === "credits" && (
          <Card className="bg-canvas border border-hairline rounded-lg p-5">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-base font-bold text-ink">{t("credits.title")}</CardTitle>
              <CardDescription className="text-xs text-ink-mute">{t("credits.desc")}</CardDescription>
            </CardHeader>
            <Separator className="bg-hairline my-4" />
            <CardContent className="px-0 space-y-4">
              <form action={buyCreditsAction} className="space-y-4">
                <input type="hidden" name="returnTo" value={returnTo} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="creditType" className="text-xs font-bold text-ink-secondary">{t("credits.type_label")}</Label>
                    <Select name="creditType" defaultValue="v0">
                      <SelectTrigger className="bg-canvas-soft border-hairline text-xs font-medium h-9 rounded-sm">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-canvas border border-hairline rounded-md">
                        <SelectItem value="v0" className="text-xs font-medium cursor-pointer py-2 rounded focus:bg-canvas-soft">v0 Credits</SelectItem>
                        <SelectItem value="gateway" className="text-xs font-medium cursor-pointer py-2 rounded focus:bg-canvas-soft">AI Gateway Credits</SelectItem>
                        <SelectItem value="agent" className="text-xs font-medium cursor-pointer py-2 rounded focus:bg-canvas-soft">AI Agent Credits</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="amount" className="text-xs font-bold text-ink-secondary">{t("credits.amount_label")}</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      placeholder={t("credits.amount_placeholder")}
                      required
                      min="1"
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                    />
                  </div>
                </div>

                <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                  <CreditCard className="size-3.5 mr-1.5" />
                  {t("credits.buy_btn")}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Edge Config Centralized Sync Dashboard */}
        {activeSection === "edge-config" && (
          <EdgeConfigVarsCard
            vercelProjectEnvVars={vercelProjectEnvVars}
            vercelProjectId={project.vercelProjectId || ""}
            projectId={project.id}
            locale={locale}
            returnTo={returnTo}
          />
        )}

        {/* 7. Vercel SDK Feature Matrix */}
        {activeSection === "matrix" && (
          <div className="space-y-6">
            <Card className="bg-canvas border border-hairline rounded-lg p-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-bold text-ink">{t("matrix.title")}</CardTitle>
                <CardDescription className="text-xs text-ink-mute">{t("matrix.desc")}</CardDescription>
              </CardHeader>
              <Separator className="bg-hairline my-4" />
              <CardContent className="px-0">
                <div className="overflow-x-auto rounded-md border border-hairline">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow className="bg-canvas-soft/40 border-b border-hairline">
                        <TableHead className="px-5 py-3 text-[10px] uppercase font-bold text-ink-mute w-1/4">{t("matrix.col_category")}</TableHead>
                        <TableHead className="px-5 py-3 text-[10px] uppercase font-bold text-ink-mute w-1/4">{t("matrix.col_methods")}</TableHead>
                        <TableHead className="px-5 py-3 text-[10px] uppercase font-bold text-ink-mute w-1/4">{t("matrix.col_status")}</TableHead>
                        <TableHead className="px-5 py-3 text-[10px] uppercase font-bold text-ink-mute w-1/4">{t("matrix.col_notes")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* 1. Aliases */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Aliases</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Manage domain configurations and aliases.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.aliases.assignAlias()</div>
                          <div>vercel.aliases.listAliases()</div>
                          <div>vercel.aliases.deleteAlias()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. Custom domains and vercel.app subdomains can be configured and managed directly in the <span className="font-semibold">Domains</span> tab.
                        </TableCell>
                      </TableRow>

                      {/* 2. Deployments */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Deployments</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Automated web builds and deployment tracking.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.deployments.getDeployments()</div>
                          <div>vercel.deployments.cancelDeployment()</div>
                          <div>vercel.deployments.getDeployment()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. Real-time build logs, status badges, cancelation actions, and deployment URL links are inside the <span className="font-semibold">Deployments</span> tab.
                        </TableCell>
                      </TableRow>

                      {/* 3. Projects */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Projects</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Vercel project linking and settings.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.projects.createProject()</div>
                          <div>vercel.projects.getProject()</div>
                          <div>vercel.projects.updateProject()</div>
                          <div>vercel.projects.deleteProject()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. Linking and disconnecting Vercel Project IDs or names is configured in <span className="font-semibold">Project Settings</span>.
                        </TableCell>
                      </TableRow>

                      {/* 4. Secrets */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Secrets & API Keys</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Encrypt and store Vercel API authorization credentials.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.secrets.createSecret()</div>
                          <div>vercel.secrets.deleteSecret()</div>
                          <div>vercel.secrets.listSecrets()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. The Vercel Bearer token is saved encrypted in the `user_secrets` DB table, managed under the user's account <span className="font-semibold">Settings</span>.
                        </TableCell>
                      </TableRow>

                      {/* 5. Access Groups */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Access Groups</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Team organization and member permissions.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.accessGroups.createAccessGroup()</div>
                          <div>vercel.accessGroups.deleteAccessGroup()</div>
                          <div>vercel.accessGroups.listAccessGroups()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. Access Group creations and revocations are supported directly in the sidebar <span className="font-semibold">Access Groups</span> menu. Requires Enterprise Vercel plan.
                        </TableCell>
                      </TableRow>

                      {/* 6. Auth Tokens */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Auth Tokens</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">API token access scopes.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.authentication.createAuthToken()</div>
                          <div>vercel.authentication.deleteAuthToken()</div>
                          <div>vercel.authentication.listAuthTokens()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. List current active keys, create new API credentials, or revoke tokens in the <span className="font-semibold">Auth Tokens</span> section.
                        </TableCell>
                      </TableRow>

                      {/* 7. Observability */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Observability</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Toggle HTTP request telemetry.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.apiObservability.updateObservabilityConfigurationProject()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. Easily toggle API observability metrics compilation for web bundles in the <span className="font-semibold">Observability</span> tab.
                        </TableCell>
                      </TableRow>

                      {/* 8. Certificates */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Certificates</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">TLS/SSL certificates management.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.certs.issueCert()</div>
                          <div>vercel.certs.uploadCert()</div>
                          <div>vercel.certs.removeCert()</div>
                          <div>vercel.certs.getCertById()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. Manage custom certificates manually by entering domain CNs, uploading PEM files (cert/key/ca), or removing certificate records under the <span className="font-semibold">SSL Certificates</span> view.
                        </TableCell>
                      </TableRow>

                      {/* 9. Redirects */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Bulk Redirects</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Edge routing path redirects.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.bulkRedirects.stageRedirects()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. Stage path redirection rules (source to destination routing) inside the <span className="font-semibold">Redirect Rules</span> section.
                        </TableCell>
                      </TableRow>

                      {/* 10. Billing */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Billing & Credits</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Pre-purchase credits for serverless API endpoints.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.billing.buyCredits()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary">
                            {t("matrix.status_full")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Fully integrated. Buy prepaid billing credits (v0, gateway, agent credit types) in the <span className="font-semibold">Billing Credits</span> sub-tab.
                        </TableCell>
                      </TableRow>

                      {/* 11. Edge Config */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Edge Config</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Low-latency Key-Value store at edge.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.edgeConfig.createEdgeConfig()</div>
                          <div>vercel.edgeConfig.getEdgeConfigs()</div>
                          <div>vercel.edgeConfig.getEdgeConfig()</div>
                          <div>vercel.edgeConfig.updateEdgeConfig()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-canvas-soft border-hairline text-ink-mute">
                            {t("matrix.status_none")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Not implemented. Plan is to utilize Edge Config to cache configuration flags for the trading signals engine.
                        </TableCell>
                      </TableRow>

                      {/* 12. Env Variables */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Environment Variables</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Project environment variables configuration.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.env.filterProjectEnvs()</div>
                          <div>vercel.env.createProjectEnv()</div>
                          <div>vercel.env.patchProjectEnv()</div>
                          <div>vercel.env.removeProjectEnv()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-canvas-soft border-hairline text-ink-mute">
                            {t("matrix.status_none")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Not implemented. Currently configured statically in `.env.local`. Planned for dynamic project-wide configurations management.
                        </TableCell>
                      </TableRow>

                      {/* 13. Webhooks */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Webhooks</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Subscribe to deployment events.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.webhooks.createWebhook()</div>
                          <div>vercel.webhooks.getWebhooks()</div>
                          <div>vercel.webhooks.deleteWebhook()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-canvas-soft border-hairline text-ink-mute">
                            {t("matrix.status_none")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Not implemented. Plan is to notify execution engines when a production build is successfully deployed.
                        </TableCell>
                      </TableRow>

                      {/* 14. Integrations */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Integrations & Log Drains</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Stream web logs to external analysis platforms.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.integrations.getConfigurations()</div>
                          <div>vercel.integrations.createLogDrain()</div>
                          <div>vercel.integrations.deleteLogDrain()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-canvas-soft border-hairline text-ink-mute">
                            {t("matrix.status_none")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Not implemented. Log stream pipelines are currently ingested locally on the database instead.
                        </TableCell>
                      </TableRow>

                      {/* 15. Teams */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Teams</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Scoping domains, projects, and users to teams.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.teams.createTeam()</div>
                          <div>vercel.teams.getTeam()</div>
                          <div>vercel.teams.getTeamMembers()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-canvas-soft border-hairline text-ink-mute">
                            {t("matrix.status_none")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Not implemented. Multitenancy scoping is managed locally via the project workspace organization database model.
                        </TableCell>
                      </TableRow>

                      {/* 16. Domains */}
                      <TableRow className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-4">
                          <div className="font-semibold text-xs text-ink">Domain Management</div>
                          <div className="text-[10px] text-ink-mute mt-0.5">Purchase and register custom domains.</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-mono text-[10px] text-ink-secondary space-y-1">
                          <div>vercel.domains.createOrReplaceDomain()</div>
                          <div>vercel.domains.getDomain()</div>
                          <div>vercel.domains.checkDomainStatus()</div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-canvas-soft border-hairline text-ink-mute">
                            {t("matrix.status_none")}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed">
                          Not implemented. Domains are resolved and managed via domain Aliases integration instead.
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
