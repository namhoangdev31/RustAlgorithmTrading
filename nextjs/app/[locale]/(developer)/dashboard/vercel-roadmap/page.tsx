"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Search, CheckCircle2, Circle, Milestone, Play, Code, Terminal, Check } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { getAdvancedVercelSdkResource, getVercelProjectsAction } from "@/app/actions/vercel";

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
  { id: "artifacts", name: "Artifacts", methods: ["vercel.artifacts.artifactExists()", "vercel.artifacts.artifactQuery()", "vercel.artifacts.downloadArtifact()", "vercel.artifacts.recordEvents()", "vercel.artifacts.status()", "vercel.artifacts.uploadArtifact()"], status: "full" },
  { id: "authentication", name: "Auth Tokens", methods: ["vercel.authentication.createAuthToken()", "vercel.authentication.deleteAuthToken()", "vercel.authentication.listAuthTokens()"], status: "full" },
  { id: "billing", name: "Billing & Credits", methods: ["vercel.billing.buyCredits()"], status: "full" },
  { id: "bulkRedirects", name: "Bulk Redirects", methods: ["vercel.bulkRedirects.stageRedirects()"], status: "full" },
  { id: "certs", name: "Certificates", methods: ["vercel.certs.issueCert()", "vercel.certs.uploadCert()", "vercel.certs.removeCert()", "vercel.certs.getCertById()"], status: "full" },
  { id: "checks", name: "Checks", methods: ["vercel.checks.createCheck()", "vercel.checks.getAllChecks()", "vercel.checks.getCheck()", "vercel.checks.rerequestCheck()", "vercel.checks.updateCheck()"], status: "full" },
  { id: "checksV2", name: "Checks V2", methods: ["vercel.checksV2.createDeploymentCheckRun()", "vercel.checksV2.createProjectCheck()", "vercel.checksV2.deleteProjectCheck()", "vercel.checksV2.getDeploymentCheckRun()", "vercel.checksV2.getProjectCheck()", "vercel.checksV2.listCheckRuns()", "vercel.checksV2.listDeploymentCheckRuns()", "vercel.checksV2.listProjectChecks()", "vercel.checksV2.updateDeploymentCheckRun()", "vercel.checksV2.updateProjectCheck()"], status: "full" },
  { id: "deployments", name: "Deployments", methods: ["vercel.deployments.getDeployments()", "vercel.deployments.cancelDeployment()", "vercel.deployments.getDeployment()"], status: "full" },
  { id: "dns", name: "DNS", methods: ["vercel.dns.createRecord()", "vercel.dns.getRecords()", "vercel.dns.removeRecord()", "vercel.dns.updateRecord()"], status: "full" },
  { id: "domains", name: "Domain Management", methods: ["vercel.domains.createOrReplaceDomain()", "vercel.domains.getDomain()", "vercel.domains.checkDomainStatus()"], status: "full" },
  { id: "domainsRegistrar", name: "Domains Registrar", methods: ["vercel.domainsRegistrar.buyDomains()", "vercel.domainsRegistrar.buySingleDomain()", "vercel.domainsRegistrar.getBulkAvailability()", "vercel.domainsRegistrar.getDomainAuthCode()", "vercel.domainsRegistrar.getDomainAvailability()", "vercel.domainsRegistrar.getDomainPrice()", "vercel.domainsRegistrar.getTldPrice()", "vercel.domainsRegistrar.renewDomain()", "vercel.domainsRegistrar.transferInDomain()"], status: "full" },
  { id: "drains", name: "Drains", methods: ["vercel.drains.createDrain()", "vercel.drains.deleteDrain()", "vercel.drains.getDrain()", "vercel.drains.getDrains()", "vercel.drains.testDrain()", "vercel.drains.updateDrain()"], status: "full" },
  { id: "edgeCache", name: "Edge Cache", methods: ["vercel.edgeCache.dangerouslyDeleteBySrcImages()", "vercel.edgeCache.dangerouslyDeleteByTags()", "vercel.edgeCache.invalidateBySrcImages()", "vercel.edgeCache.invalidateByTags()"], status: "full" },
  { id: "edgeConfig", name: "Edge Config", methods: ["vercel.edgeConfig.createEdgeConfig()", "vercel.edgeConfig.getEdgeConfigs()", "vercel.edgeConfig.getEdgeConfig()", "vercel.edgeConfig.updateEdgeConfig()"], status: "full" },
  { id: "environment", name: "Environment", methods: ["vercel.environment.createCustomEnvironment()", "vercel.environment.createSharedEnvVariable()", "vercel.environment.deleteSharedEnvVariable()", "vercel.environment.getCustomEnvironment()", "vercel.environment.getSharedEnvVar()", "vercel.environment.listSharedEnvVariable()", "vercel.environment.removeCustomEnvironment()", "vercel.environment.updateCustomEnvironment()", "vercel.environment.updateSharedEnvVariable()"], status: "full" },
  { id: "env", name: "Environment Variables", methods: ["vercel.env.filterProjectEnvs()", "vercel.env.createProjectEnv()", "vercel.env.patchProjectEnv()", "vercel.env.removeProjectEnv()"], status: "full" },
  { id: "featureFlags", name: "Feature Flags", methods: ["vercel.featureFlags.createFlag()", "vercel.featureFlags.createFlagSegment()", "vercel.featureFlags.createSDKKey()", "vercel.featureFlags.deleteFlag()", "vercel.featureFlags.deleteFlagSegment", "vercel.featureFlags.deleteSDKKey()", "vercel.featureFlags.getFlag()", "vercel.featureFlags.listFlags()", "vercel.featureFlags.updateFlag()"], status: "full" },
  { id: "integrations", name: "Integrations & Log Drains", methods: ["vercel.integrations.getConfigurations()", "vercel.integrations.createLogDrain()", "vercel.integrations.deleteLogDrain()"], status: "full" },
  { id: "logDrains", name: "Log Drains", methods: ["vercel.logDrains.createConfigurableLogDrain()", "vercel.logDrains.createLogDrain()", "vercel.logDrains.deleteConfigurableLogDrain()", "vercel.logDrains.deleteIntegrationLogDrain()", "vercel.logDrains.getAllLogDrains()", "vercel.logDrains.getConfigurableLogDrain()", "vercel.logDrains.getIntegrationLogDrains()"], status: "full" },
  { id: "logs", name: "Logs", methods: ["vercel.logs.getRuntimeLogs()"], status: "full" },
  { id: "marketplace", name: "Marketplace", methods: ["vercel.marketplace.createEvent()", "vercel.marketplace.getAccountInfo()", "vercel.marketplace.getIntegrationResource()", "vercel.marketplace.getInvoice()", "vercel.marketplace.submitBillingData()", "vercel.marketplace.submitInvoice()", "vercel.marketplace.updateResource()"], status: "full" },
  { id: "microfrontends", name: "Microfrontends", methods: ["vercel.microfrontends.createMicrofrontendsGroupWithApplications()", "vercel.microfrontends.getMicrofrontendsConfig()", "vercel.microfrontends.getMicrofrontendsGroups()"], status: "full" },
  { id: "networking", name: "Networking", methods: ["vercel.networking.createNetwork()", "vercel.networking.deleteNetwork()", "vercel.networking.listNetworks()", "vercel.networking.readNetwork()", "vercel.networking.updateNetwork()", "vercel.networking.updateStaticIps()"], status: "full" },
  { id: "projectMembers", name: "Project Members", methods: ["vercel.projectMembers.addProjectMember()", "vercel.projectMembers.getProjectMembers()", "vercel.projectMembers.removeProjectMember()"], status: "full" },
  { id: "projectRoutes", name: "Project Routes", methods: ["vercel.projectRoutes.addRoute()", "vercel.projectRoutes.deleteRoutes()", "vercel.projectRoutes.editRoute()", "vercel.projectRoutes.generateRoute()", "vercel.projectRoutes.getRoutes()", "vercel.projectRoutes.stageRoutes()"], status: "full" },
  { id: "projects", name: "Projects", methods: ["vercel.projects.createProject()", "vercel.projects.getProject()", "vercel.projects.updateProject()", "vercel.projects.deleteProject()"], status: "full" },
  { id: "rollingRelease", name: "Rolling Release", methods: ["vercel.rollingRelease.approveRollingReleaseStage()", "vercel.rollingRelease.completeRollingRelease()", "vercel.rollingRelease.deleteRollingReleaseConfig()", "vercel.rollingRelease.getRollingRelease()", "vercel.rollingRelease.getRollingReleaseConfig()", "vercel.rollingRelease.updateRollingReleaseConfig()"], status: "full" },
  { id: "sandboxes", name: "Sandboxes", methods: ["vercel.sandboxes.createSessionDirectory()", "vercel.sandboxes.createSessionSnapshot()", "vercel.sandboxes.deleteSandbox()", "vercel.sandboxes.deleteSessionSnapshot()", "vercel.sandboxes.extendSessionTimeout()", "vercel.sandboxes.getNamedSandbox()", "vercel.sandboxes.getSession()", "vercel.sandboxes.listSandboxes()", "vercel.sandboxes.listSessions()", "vercel.sandboxes.stopSession()"], status: "full" },
  { id: "secrets", name: "Secrets & API Keys", methods: ["vercel.secrets.createSecret()", "vercel.secrets.deleteSecret()", "vercel.secrets.listSecrets()"], status: "full" },
  { id: "security", name: "Security", methods: ["vercel.security.addBypassIp()", "vercel.security.getActiveAttackStatus()", "vercel.security.getBypassIp()", "vercel.security.getFirewallConfig()", "vercel.security.getSecurityFirewallEvents()", "vercel.security.putFirewallConfig()", "vercel.security.removeBypassIp()", "vercel.security.updateAttackChallengeMode()", "vercel.security.updateFirewallConfig()"], status: "full" },
  { id: "teams", name: "Teams", methods: ["vercel.teams.createTeam()", "vercel.teams.getTeam()", "vercel.teams.getTeamMembers()"], status: "full" },
  { id: "user", name: "User", methods: ["vercel.user.getAuthUser()", "vercel.user.listEventTypes()", "vercel.user.listUserEvents()", "vercel.user.requestDelete()"], status: "full" },
  { id: "webhooks", name: "Webhooks", methods: ["vercel.webhooks.createWebhook()", "vercel.webhooks.getWebhooks()", "vercel.webhooks.deleteWebhook()"], status: "full" }
];

const namespaceMethods: Record<string, string[]> = {
  accessGroups: ["accessGroups.createAccessGroup", "accessGroups.deleteAccessGroup", "accessGroups.listAccessGroups"],
  aliases: ["aliases.assignAlias", "aliases.listAliases", "aliases.deleteAlias"],
  apiObservability: ["apiObservability.updateObservabilityConfigurationProject"],
  artifacts: ["artifacts.artifactExists", "artifacts.artifactQuery", "artifacts.downloadArtifact", "artifacts.status"],
  authentication: ["authentication.listAuthTokens"],
  billing: ["billing.buyCredits"],
  bulkRedirects: ["bulkRedirects.stageRedirects"],
  certs: ["certs.getCertById"],
  checks: ["checks.createCheck", "checks.getAllChecks", "checks.getCheck", "checks.rerequestCheck", "checks.updateCheck"],
  checksV2: ["checksV2.listProjectChecks", "checksV2.getProjectCheck", "checksV2.listCheckRuns"],
  deployments: ["deployments.getDeployments", "deployments.getDeployment"],
  dns: ["dns.getRecords"],
  domains: ["domains.getDomain", "domains.checkDomainStatus"],
  domainsRegistrar: ["domainsRegistrar.getDomainPrice", "domainsRegistrar.getDomainAvailability"],
  drains: ["drains.getDrains"],
  edgeCache: ["edgeCache.invalidateByTags"],
  edgeConfig: ["edgeConfig.getEdgeConfigs"],
  environment: ["environment.listSharedEnvVariable"],
  env: ["env.filterProjectEnvs"],
  featureFlags: ["featureFlags.listFlags"],
  integrations: ["integrations.getConfigurations"],
  logDrains: ["logDrains.getAllLogDrains"],
  logs: ["logs.getRuntimeLogs"],
  marketplace: ["marketplace.getAccountInfo"],
  microfrontends: ["microfrontends.getMicrofrontendsGroups"],
  networking: ["networking.listNetworks"],
  projectMembers: ["projectMembers.getProjectMembers"],
  projectRoutes: ["projectRoutes.getRoutes"],
  projects: ["projects.getProject"],
  rollingRelease: ["rollingRelease.getRollingRelease"],
  sandboxes: ["sandboxes.listSessions"],
  secrets: ["secrets.listSecrets"],
  security: ["security.getFirewallConfig", "security.getActiveAttackStatus"],
  teams: ["teams.getTeam"],
  user: ["user.getAuthUser", "user.listUserEvents"],
  webhooks: ["webhooks.getWebhooks"]
};

const METHOD_TEMPLATES: Record<string, string> = {
  "accessGroups.createAccessGroup": `{\n  "name": "my-access-group",\n  "projects": []\n}`,
  "accessGroups.deleteAccessGroup": `{\n  "id": "group_123"\n}`,
  "accessGroups.listAccessGroups": `{\n  "limit": 20\n}`,
  "aliases.assignAlias": `{\n  "alias": "my-alias.vercel.app"\n}`,
  "aliases.listAliases": `{\n  "limit": 20\n}`,
  "aliases.deleteAlias": `{\n  "alias": "my-alias.vercel.app"\n}`,
  "apiObservability.updateObservabilityConfigurationProject": `{\n  "enabled": true\n}`,
  "artifacts.artifactExists": `{\n  "hash": "my-artifact-hash"\n}`,
  "artifacts.artifactQuery": `{\n  "hashes": [\n    "my-artifact-hash"\n  ]\n}`,
  "artifacts.downloadArtifact": `{\n  "hash": "my-artifact-hash"\n}`,
  "artifacts.status": `{}`,
  "authentication.listAuthTokens": `{\n  "limit": 20\n}`,
  "billing.buyCredits": `{\n  "amount": 100\n}`,
  "bulkRedirects.stageRedirects": `{\n  "redirects": [\n    {\n      "source": "/old",\n      "destination": "/new"\n    }\n  ]\n}`,
  "certs.getCertById": `{\n  "id": "cert_123"\n}`,
  "checks.getAllChecks": `{\n  "deploymentId": "dpl_123"\n}`,
  "checksV2.listProjectChecks": `{}`,
  "deployments.getDeployments": `{\n  "limit": 10\n}`,
  "dns.getRecords": `{\n  "domain": "example.com"\n}`,
  "domains.getDomain": `{\n  "domain": "example.com"\n}`,
  "domains.checkDomainStatus": `{\n  "domain": "example.com"\n}`,
  "domainsRegistrar.getDomainPrice": `{\n  "name": "example.com"\n}`,
  "drains.getDrains": `{}`,
  "edgeCache.invalidateByTags": `{\n  "tags": [\n    "my-tag"\n  ]\n}`,
  "edgeConfig.getEdgeConfigs": `{}`,
  "environment.listSharedEnvVariable": `{\n  "limit": 10\n}`,
  "env.filterProjectEnvs": `{}`,
  "featureFlags.listFlags": `{}`,
  "integrations.getConfigurations": `{}`,
  "logDrains.getAllLogDrains": `{}`,
  "logs.getRuntimeLogs": `{\n  "deploymentId": "dpl_123"\n}`,
  "marketplace.getAccountInfo": `{}`,
  "microfrontends.getMicrofrontendsGroups": `{}`,
  "networking.listNetworks": `{}`,
  "projectMembers.getProjectMembers": `{}`,
  "projectRoutes.getRoutes": `{}`,
  "projects.getProject": `{}`,
  "rollingRelease.getRollingRelease": `{}`,
  "sandboxes.listSessions": `{}`,
  "secrets.listSecrets": `{}`,
  "security.getFirewallConfig": `{}`,
  "teams.getTeam": `{\n  "teamId": "team_123"\n}`,
  "user.getAuthUser": `{}`,
  "webhooks.getWebhooks": `{}`
};

export default function VercelRoadmapPage() {
  const t = useTranslations("VercelRoadmap");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "integrated" | "planned">("all");

  // Playground States
  const [projects, setProjects] = useState<Array<{ id: string; name: string; vercelProjectId: string }>>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedNamespace, setSelectedNamespace] = useState("accessGroups");
  const [selectedMethod, setSelectedMethod] = useState("accessGroups.createAccessGroup");
  const [payloadText, setPayloadText] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [execResult, setExecResult] = useState<any>(null);
  const [execSuccess, setExecSuccess] = useState<boolean | null>(null);

  // Load Vercel Projects on Mount
  useEffect(() => {
    async function fetchProjects() {
      const res = await getVercelProjectsAction();
      if (res.success && res.projects) {
        const validProjects = res.projects
          .filter((p): p is typeof p & { vercelProjectId: string } => p.vercelProjectId !== null)
          .map(p => ({
            id: p.id,
            name: p.name,
            vercelProjectId: p.vercelProjectId,
          }));
        setProjects(validProjects);
        if (validProjects.length > 0) {
          setSelectedProjectId(validProjects[0].vercelProjectId);
        }
      }
    }
    fetchProjects();
  }, []);

  // Update selected method and template when namespace changes
  useEffect(() => {
    const methods = namespaceMethods[selectedNamespace] || [];
    if (methods.length > 0) {
      setSelectedMethod(methods[0]);
    }
  }, [selectedNamespace]);

  // Update template payload when method changes
  useEffect(() => {
    setPayloadText(METHOD_TEMPLATES[selectedMethod] || "{}");
  }, [selectedMethod]);

  const handleExecute = async () => {
    if (!selectedProjectId) return;
    setIsExecuting(true);
    setExecResult(null);
    setExecSuccess(null);

    let parsedPayload: Record<string, any> = {};
    try {
      if (payloadText.trim()) {
        parsedPayload = JSON.parse(payloadText);
      }
    } catch {
      setExecResult({ error: t("playground.error_invalid_json") });
      setExecSuccess(false);
      setIsExecuting(false);
      return;
    }

    try {
      const res = await getAdvancedVercelSdkResource(selectedProjectId, selectedMethod as any, parsedPayload);
      if (res.success) {
        setExecSuccess(true);
        setExecResult(res.result || { message: t("playground.success_message") });
      } else {
        setExecSuccess(false);
        setExecResult({ error: res.error });
      }
    } catch (e: any) {
      setExecSuccess(false);
      setExecResult({ error: e?.message || "Execution failed" });
    } finally {
      setIsExecuting(false);
    }
  };

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
        
        {/* Playground Card */}
        <Card className="bg-canvas border border-hairline rounded-xl overflow-hidden shadow-sm">
          <CardHeader className="bg-canvas-soft/40 border-b border-hairline">
            <CardTitle className="text-lg text-ink font-semibold flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              {t("playground.title")}
            </CardTitle>
            <CardDescription className="text-sm text-ink-mute">
              {t("playground.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {projects.length === 0 ? (
              <div className="py-6 text-center text-ink-mute text-sm bg-canvas-soft border border-dashed rounded-lg">
                No active Vercel-linked projects found in the workspace. Please set up a project domain or link Vercel in settings first.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Configuration Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-ink-mute">
                      Project Link
                    </label>
                    <NativeSelect
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                    >
                      {projects.map((p) => (
                        <NativeSelectOption key={p.id} value={p.vercelProjectId}>
                          {p.name} ({p.vercelProjectId})
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-ink-mute">
                        {t("playground.namespace_label")}
                      </label>
                      <NativeSelect
                        value={selectedNamespace}
                        onChange={(e) => setSelectedNamespace(e.target.value)}
                      >
                        {namespaces.map((ns) => (
                          <NativeSelectOption key={ns.id} value={ns.id}>
                            {ns.name}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-ink-mute">
                        {t("playground.method_label")}
                      </label>
                      <NativeSelect
                        value={selectedMethod}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                      >
                        {(namespaceMethods[selectedNamespace] || []).map((m) => (
                          <NativeSelectOption key={m} value={m}>
                            {m.split(".")[1]}()
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-ink-mute flex items-center justify-between">
                      <span>{t("playground.payload_label")}</span>
                      <span className="text-[10px] text-primary lowercase font-normal italic">JSON params format</span>
                    </label>
                    <Textarea
                      value={payloadText}
                      onChange={(e) => setPayloadText(e.target.value)}
                      placeholder={t("playground.payload_placeholder")}
                      className="font-mono text-xs bg-canvas-soft border-hairline min-h-[140px] h-[180px]"
                    />
                  </div>

                  <Button
                    onClick={handleExecute}
                    disabled={isExecuting || !selectedProjectId}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {isExecuting ? (
                      <span>{t("playground.executing")}</span>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>{t("playground.btn_execute")}</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Output Display Column */}
                <div className="flex flex-col h-full space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink-mute flex items-center justify-between">
                    <span>{t("playground.response_label")}</span>
                    {execSuccess !== null && (
                      <Badge variant={execSuccess ? "default" : "destructive"} className="text-[10px] uppercase font-bold px-2 py-0.5">
                        {execSuccess ? "Success" : "Failed"}
                      </Badge>
                    )}
                  </label>

                  <div className="flex-1 min-h-[280px] lg:min-h-0 bg-canvas-night border border-hairline rounded-lg p-4 font-mono text-[10px] overflow-auto text-canvas-soft select-text">
                    {execResult ? (
                      <pre className="whitespace-pre-wrap word-break">{JSON.stringify(execResult, null, 2)}</pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-ink-mute text-xs">
                        <Terminal className="w-8 h-8 mb-2 opacity-50" />
                        <span>Console output will appear here after execution...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global Progress Card */}
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
                        <div className="font-semibold text-xs text-ink">
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
