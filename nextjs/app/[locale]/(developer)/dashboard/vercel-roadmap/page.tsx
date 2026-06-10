"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Search, CheckCircle2, Circle, Milestone } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Status = "full" | "partial" | "none";

interface Namespace {
  id: string;
  name: string;
  methods: string[];
  status: Status;
}

const namespaces: Namespace[] = [
  { id: "accessGroups", name: "Access Groups", methods: ["vercel.accessGroups.createAccessGroup()", "vercel.accessGroups.deleteAccessGroup()", "vercel.accessGroups.listAccessGroups()"], status: "full" },
  { id: "aliases", name: "Aliases", methods: ["vercel.aliases.assignAlias()", "vercel.aliases.listAliases()", "vercel.aliases.deleteAlias()"], status: "full" },
  { id: "apiObservability", name: "Observability", methods: ["vercel.apiObservability.updateObservabilityConfigurationProject()"], status: "full" },
  { id: "artifacts", name: "Artifacts", methods: ["vercel.artifacts.artifactExists()", "vercel.artifacts.artifactQuery()", "vercel.artifacts.downloadArtifact()", "vercel.artifacts.recordEvents()", "vercel.artifacts.status()", "vercel.artifacts.uploadArtifact()"], status: "none" },
  { id: "authentication", name: "Auth Tokens", methods: ["vercel.authentication.createAuthToken()", "vercel.authentication.deleteAuthToken()", "vercel.authentication.listAuthTokens()"], status: "full" },
  { id: "billing", name: "Billing & Credits", methods: ["vercel.billing.buyCredits()"], status: "full" },
  { id: "bulkRedirects", name: "Bulk Redirects", methods: ["vercel.bulkRedirects.stageRedirects()"], status: "full" },
  { id: "certs", name: "Certificates", methods: ["vercel.certs.issueCert()", "vercel.certs.uploadCert()", "vercel.certs.removeCert()", "vercel.certs.getCertById()"], status: "full" },
  { id: "checks", name: "Checks", methods: ["vercel.checks.createCheck()", "vercel.checks.getAllChecks()", "vercel.checks.getCheck()", "vercel.checks.rerequestCheck()", "vercel.checks.updateCheck()"], status: "partial" },
  { id: "checksV2", name: "Checks V2", methods: ["vercel.checksV2.createDeploymentCheckRun()", "vercel.checksV2.createProjectCheck()", "vercel.checksV2.deleteProjectCheck()", "vercel.checksV2.getDeploymentCheckRun()", "vercel.checksV2.getProjectCheck()", "vercel.checksV2.listCheckRuns()", "vercel.checksV2.listDeploymentCheckRuns()", "vercel.checksV2.listProjectChecks()", "vercel.checksV2.updateDeploymentCheckRun()", "vercel.checksV2.updateProjectCheck()"], status: "none" },
  { id: "deployments", name: "Deployments", methods: ["vercel.deployments.getDeployments()", "vercel.deployments.cancelDeployment()", "vercel.deployments.getDeployment()"], status: "full" },
  { id: "dns", name: "DNS", methods: ["vercel.dns.createRecord()", "vercel.dns.getRecords()", "vercel.dns.removeRecord()", "vercel.dns.updateRecord()"], status: "partial" },
  { id: "domains", name: "Domain Management", methods: ["vercel.domains.createOrReplaceDomain()", "vercel.domains.getDomain()", "vercel.domains.checkDomainStatus()"], status: "none" },
  { id: "domainsRegistrar", name: "Domains Registrar", methods: ["vercel.domainsRegistrar.buyDomains()", "vercel.domainsRegistrar.buySingleDomain()", "vercel.domainsRegistrar.getBulkAvailability()", "vercel.domainsRegistrar.getDomainAuthCode()", "vercel.domainsRegistrar.getDomainAvailability()", "vercel.domainsRegistrar.getDomainPrice()", "vercel.domainsRegistrar.getTldPrice()", "vercel.domainsRegistrar.renewDomain()", "vercel.domainsRegistrar.transferInDomain()"], status: "none" },
  { id: "drains", name: "Drains", methods: ["vercel.drains.createDrain()", "vercel.drains.deleteDrain()", "vercel.drains.getDrain()", "vercel.drains.getDrains()", "vercel.drains.testDrain()", "vercel.drains.updateDrain()"], status: "none" },
  { id: "edgeCache", name: "Edge Cache", methods: ["vercel.edgeCache.dangerouslyDeleteBySrcImages()", "vercel.edgeCache.dangerouslyDeleteByTags()", "vercel.edgeCache.invalidateBySrcImages()", "vercel.edgeCache.invalidateByTags()"], status: "none" },
  { id: "edgeConfig", name: "Edge Config", methods: ["vercel.edgeConfig.createEdgeConfig()", "vercel.edgeConfig.getEdgeConfigs()", "vercel.edgeConfig.getEdgeConfig()", "vercel.edgeConfig.updateEdgeConfig()"], status: "partial" },
  { id: "environment", name: "Environment", methods: ["vercel.environment.createCustomEnvironment()", "vercel.environment.createSharedEnvVariable()", "vercel.environment.deleteSharedEnvVariable()", "vercel.environment.getCustomEnvironment()", "vercel.environment.getSharedEnvVar()", "vercel.environment.listSharedEnvVariable()", "vercel.environment.removeCustomEnvironment()", "vercel.environment.updateCustomEnvironment()", "vercel.environment.updateSharedEnvVariable()"], status: "partial" },
  { id: "env", name: "Environment Variables", methods: ["vercel.env.filterProjectEnvs()", "vercel.env.createProjectEnv()", "vercel.env.patchProjectEnv()", "vercel.env.removeProjectEnv()"], status: "full" },
  { id: "featureFlags", name: "Feature Flags", methods: ["vercel.featureFlags.createFlag()", "vercel.featureFlags.createFlagSegment()", "vercel.featureFlags.createSDKKey()", "vercel.featureFlags.deleteFlag()", "vercel.featureFlags.deleteFlagSegment()", "vercel.featureFlags.deleteSDKKey()", "vercel.featureFlags.getFlag()", "vercel.featureFlags.listFlags()", "vercel.featureFlags.updateFlag()"], status: "partial" },
  { id: "integrations", name: "Integrations & Log Drains", methods: ["vercel.integrations.getConfigurations()", "vercel.integrations.createLogDrain()", "vercel.integrations.deleteLogDrain()"], status: "partial" },
  { id: "logDrains", name: "Log Drains", methods: ["vercel.logDrains.createConfigurableLogDrain()", "vercel.logDrains.createLogDrain()", "vercel.logDrains.deleteConfigurableLogDrain()", "vercel.logDrains.deleteIntegrationLogDrain()", "vercel.logDrains.getAllLogDrains()", "vercel.logDrains.getConfigurableLogDrain()", "vercel.logDrains.getIntegrationLogDrains()"], status: "partial" },
  { id: "logs", name: "Logs", methods: ["vercel.logs.getRuntimeLogs()"], status: "partial" },
  { id: "marketplace", name: "Marketplace", methods: ["vercel.marketplace.createEvent()", "vercel.marketplace.getAccountInfo()", "vercel.marketplace.getIntegrationResource()", "vercel.marketplace.getInvoice()", "vercel.marketplace.submitBillingData()", "vercel.marketplace.submitInvoice()", "vercel.marketplace.updateResource()"], status: "partial" },
  { id: "microfrontends", name: "Microfrontends", methods: ["vercel.microfrontends.createMicrofrontendsGroupWithApplications()", "vercel.microfrontends.getMicrofrontendsConfig()", "vercel.microfrontends.getMicrofrontendsGroups()"], status: "none" },
  { id: "networking", name: "Networking", methods: ["vercel.networking.createNetwork()", "vercel.networking.deleteNetwork()", "vercel.networking.listNetworks()", "vercel.networking.readNetwork()", "vercel.networking.updateNetwork()", "vercel.networking.updateStaticIps()"], status: "none" },
  { id: "projectMembers", name: "Project Members", methods: ["vercel.projectMembers.addProjectMember()", "vercel.projectMembers.getProjectMembers()", "vercel.projectMembers.removeProjectMember()"], status: "partial" },
  { id: "projectRoutes", name: "Project Routes", methods: ["vercel.projectRoutes.addRoute()", "vercel.projectRoutes.deleteRoutes()", "vercel.projectRoutes.editRoute()", "vercel.projectRoutes.generateRoute()", "vercel.projectRoutes.getRoutes()", "vercel.projectRoutes.stageRoutes()"], status: "none" },
  { id: "projects", name: "Projects", methods: ["vercel.projects.createProject()", "vercel.projects.getProject()", "vercel.projects.updateProject()", "vercel.projects.deleteProject()"], status: "full" },
  { id: "rollingRelease", name: "Rolling Release", methods: ["vercel.rollingRelease.approveRollingReleaseStage()", "vercel.rollingRelease.completeRollingRelease()", "vercel.rollingRelease.deleteRollingReleaseConfig()", "vercel.rollingRelease.getRollingRelease()", "vercel.rollingRelease.getRollingReleaseConfig()", "vercel.rollingRelease.updateRollingReleaseConfig()"], status: "none" },
  { id: "sandboxes", name: "Sandboxes", methods: ["vercel.sandboxes.createSessionDirectory()", "vercel.sandboxes.createSessionSnapshot()", "vercel.sandboxes.deleteSandbox()", "vercel.sandboxes.deleteSessionSnapshot()", "vercel.sandboxes.extendSessionTimeout()", "vercel.sandboxes.getNamedSandbox()", "vercel.sandboxes.getSession()", "vercel.sandboxes.listSandboxes()", "vercel.sandboxes.listSessions()", "vercel.sandboxes.stopSession()"], status: "none" },
  { id: "secrets", name: "Secrets & API Keys", methods: ["vercel.secrets.createSecret()", "vercel.secrets.deleteSecret()", "vercel.secrets.listSecrets()"], status: "full" },
  { id: "security", name: "Security", methods: ["vercel.security.addBypassIp()", "vercel.security.getActiveAttackStatus()", "vercel.security.getBypassIp()", "vercel.security.getFirewallConfig()", "vercel.security.getSecurityFirewallEvents()", "vercel.security.putFirewallConfig()", "vercel.security.removeBypassIp()", "vercel.security.updateAttackChallengeMode()", "vercel.security.updateFirewallConfig()"], status: "partial" },
  { id: "teams", name: "Teams", methods: ["vercel.teams.createTeam()", "vercel.teams.getTeam()", "vercel.teams.getTeamMembers()"], status: "none" },
  { id: "user", name: "User", methods: ["vercel.user.getAuthUser()", "vercel.user.listEventTypes()", "vercel.user.listUserEvents()", "vercel.user.requestDelete()"], status: "none" },
  { id: "webhooks", name: "Webhooks", methods: ["vercel.webhooks.createWebhook()", "vercel.webhooks.getWebhooks()", "vercel.webhooks.deleteWebhook()"], status: "partial" }
];

export default function VercelRoadmapPage() {
  const t = useTranslations("VercelRoadmap");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "integrated" | "planned">("all");

  const integratedCount = namespaces.filter(n => n.status === "full" || n.status === "partial").length;
  const progressPercent = Math.round((integratedCount / namespaces.length) * 100);

  const filteredNamespaces = namespaces.filter(ns => {
    const matchesSearch = ns.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ns.methods.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (filterStatus === "integrated") return ns.status === "full" || ns.status === "partial";
    if (filterStatus === "planned") return ns.status === "none";
    
    return true;
  });

  return (
    <>
      <PageHeader
        description={t("description")}
        title={t("title")}
      />

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="bg-canvas border border-hairline rounded-xl overflow-hidden shadow-sm">
          <CardHeader className="bg-canvas-soft/40 border-b border-hairline">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-ink font-semibold flex items-center gap-2">
                  <Milestone className="w-5 h-5 text-primary" />
                  {t("metrics.progress_label")}
                </CardTitle>
                <CardDescription className="text-sm text-ink-mute mt-1">
                  {t("metrics.integrated_count", { count: integratedCount, total: namespaces.length })}
                </CardDescription>
              </div>
              <div className="text-2xl font-bold text-primary">
                {progressPercent}%
              </div>
            </div>
            
            <div className="mt-4 w-full bg-canvas-soft border border-hairline rounded-full h-3 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Filters */}
            <div className="p-4 border-b border-hairline flex flex-col sm:flex-row gap-4 items-center justify-between bg-canvas">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-mute" />
                <Input
                  placeholder={t("filters.search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-canvas-soft"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                {(["all", "integrated", "planned"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterStatus(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filterStatus === f 
                        ? "bg-ink text-canvas" 
                        : "bg-canvas-soft text-ink-mute hover:text-ink hover:bg-hairline"
                    }`}
                  >
                    {t(`filters.${f}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow className="bg-canvas-soft/40 border-b border-hairline hover:bg-canvas-soft/40">
                    <TableHead className="px-5 py-3 text-[10px] uppercase font-bold text-ink-mute w-1/4">{t("table.col_category")}</TableHead>
                    <TableHead className="px-5 py-3 text-[10px] uppercase font-bold text-ink-mute w-1/4">{t("table.col_methods")}</TableHead>
                    <TableHead className="px-5 py-3 text-[10px] uppercase font-bold text-ink-mute w-32">{t("table.col_status")}</TableHead>
                    <TableHead className="px-5 py-3 text-[10px] uppercase font-bold text-ink-mute">{t("table.col_notes")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNamespaces.map((ns) => (
                    <TableRow key={ns.id} className="border-b border-hairline hover:bg-canvas-soft/10 transition-colors">
                      <TableCell className="px-5 py-4 align-top">
                        <div className="font-semibold text-xs text-ink">{t(`notes.${ns.id}`)} {/* We will use the english name temporarily if no localized name. Actually, we didn't add names to the localization, so we'll just use ns.name directly as it's a developer name. */}
                          {ns.name}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 align-top">
                        <div className="font-mono text-[10px] text-ink-secondary space-y-1.5 bg-canvas-night p-3 rounded border border-hairline">
                          {ns.methods.map(m => (
                            <div key={m} className="text-canvas-soft break-all">{m}</div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 align-top">
                        {ns.status === "full" && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border bg-primary/10 border-primary/30 text-primary">
                            <CheckCircle2 className="w-3 h-3" />
                            {t("status.full")}
                          </span>
                        )}
                        {ns.status === "partial" && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border bg-accent-yellow/10 border-accent-yellow/30 text-accent-yellow">
                            <Circle className="w-3 h-3" />
                            {t("status.partial")}
                          </span>
                        )}
                        {ns.status === "none" && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border bg-canvas-soft border-hairline text-ink-mute">
                            <Circle className="w-3 h-3" />
                            {t("status.none")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-xs text-ink-secondary leading-relaxed align-top">
                        {t(`notes.${ns.id}`)}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {filteredNamespaces.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-ink-mute text-sm">
                        No namespaces found matching your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
