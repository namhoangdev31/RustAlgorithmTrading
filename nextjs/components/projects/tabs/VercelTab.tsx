"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ShieldAlert, AlertCircle } from "lucide-react";
import { EdgeConfigVarsCard } from "@/components/projects/EdgeConfigVarsCard";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { VercelSidebar, type VercelTabSection } from "./vercel/VercelSidebar";

import { ObservabilityTab } from "./vercel/ObservabilityTab";
import { RedirectsTab } from "./vercel/RedirectsTab";
import { CertsTab } from "./vercel/CertsTab";
import { AccessGroupsTab } from "./vercel/AccessGroupsTab";
import { TokensTab } from "./vercel/TokensTab";
import { CreditsTab } from "./vercel/CreditsTab";
import { AliasesTab } from "./vercel/AliasesTab";
import { ArtifactsTab } from "./vercel/ArtifactsTab";
import { DnsTab } from "./vercel/DnsTab";
import { RegistrarTab } from "./vercel/RegistrarTab";
import { LogDrainsTab } from "./vercel/LogDrainsTab";
import { RuntimeLogsTab } from "./vercel/RuntimeLogsTab";
import { IntegrationsTab } from "./vercel/IntegrationsTab";
import { EdgeCacheTab } from "./vercel/EdgeCacheTab";
import { WebhooksTab } from "./vercel/WebhooksTab";
import { WafTab } from "./vercel/WafTab";
import { ProjectMembersTab } from "./vercel/ProjectMembersTab";
import { ConnectedAccountTab } from "./vercel/ConnectedAccountTab";
import { FeatureMatrixTab } from "./vercel/FeatureMatrixTab";

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
  const [activeSection, setActiveSection] = useState<VercelTabSection>("observability");

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
      <VercelSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

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

        {activeSection === "observability" && (
          <ObservabilityTab project={project} returnTo={returnTo} />
        )}
        {activeSection === "redirects" && (
          <RedirectsTab project={project} returnTo={returnTo} />
        )}
        {activeSection === "certs" && (
          <CertsTab returnTo={returnTo} />
        )}
        {activeSection === "access-groups" && (
          <AccessGroupsTab project={project} vercelAccessGroups={vercelAccessGroups} locale={locale} returnTo={returnTo} />
        )}
        {activeSection === "tokens" && (
          <TokensTab vercelTokens={vercelTokens} locale={locale} returnTo={returnTo} />
        )}
        {activeSection === "credits" && (
          <CreditsTab returnTo={returnTo} />
        )}
        {activeSection === "edge-config" && (
          <EdgeConfigVarsCard
            vercelProjectEnvVars={vercelProjectEnvVars}
            vercelProjectId={project.vercelProjectId || ""}
            projectId={project.id}
            locale={locale}
            returnTo={returnTo}
          />
        )}
        {activeSection === "aliases" && (
          <AliasesTab project={project} locale={locale} returnTo={returnTo} />
        )}
        {activeSection === "artifacts" && (
          <ArtifactsTab project={project} />
        )}
        {activeSection === "dns" && (
          <DnsTab project={project} returnTo={returnTo} />
        )}
        {activeSection === "registrar" && (
          <RegistrarTab project={project} returnTo={returnTo} />
        )}
        {activeSection === "drains" && (
          <LogDrainsTab project={project} returnTo={returnTo} />
        )}
        {activeSection === "logs" && (
          <RuntimeLogsTab project={project} />
        )}
        {activeSection === "integrations" && (
          <IntegrationsTab project={project} />
        )}
        {activeSection === "edge-cache" && (
          <EdgeCacheTab project={project} returnTo={returnTo} />
        )}
        {activeSection === "webhooks" && (
          <WebhooksTab project={project} returnTo={returnTo} />
        )}
        {activeSection === "waf" && (
          <WafTab project={project} returnTo={returnTo} />
        )}
        {activeSection === "project-members" && (
          <ProjectMembersTab project={project} returnTo={returnTo} />
        )}
        {activeSection === "user-profile" && (
          <ConnectedAccountTab project={project} />
        )}
        {activeSection === "matrix" && (
          <FeatureMatrixTab />
        )}
      </div>
    </div>
  );
}
