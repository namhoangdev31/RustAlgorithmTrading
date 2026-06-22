"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function FeatureMatrixTab() {
  const t = useTranslations("VercelTab");

  return (
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
  );
}
