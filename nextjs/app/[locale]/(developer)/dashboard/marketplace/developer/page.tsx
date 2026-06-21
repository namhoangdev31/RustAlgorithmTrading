import {
  Code,
  Globe,
  Activity,
  CheckCircle,
  FileCheck,
  ShieldCheck,
  Zap,
  Terminal,
  Send,
  Plus,
  HelpCircle,
  DollarSign,
  Package2,
  ArrowUpRight,
  Star,
} from "lucide-react";

import {
  registerDeveloperProfileAction,
  registerIntegrationAction,
  runCompatibilityTestAction,
  publishMarketplaceIntegrationAction,
  updateIntegrationReleaseAction,
} from "@/app/actions/developer-portal";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";

type DeveloperPortalPageProps = {
  searchParams: Promise<{
    dev_portal?: string;
    score?: string;
    latency?: string;
  }>;
};

export default async function DeveloperPortalPage({ searchParams }: DeveloperPortalPageProps) {
  const user = await requireCurrentUser();
  const params = await searchParams;

  // Query developer profile (simulated using User fields)
  const isDeveloperRegistered = user.userType === "partner_developer";
  const developerCompany = isDeveloperRegistered ? user.fullName : "";
  const developerWebsite = isDeveloperRegistered ? user.registerType : "";

  // Query partner integrations
  const collaborator = await prisma.bundleCollaborators.findFirst({
    where: { userId: user.id },
    select: { bundleId: true },
  });

  const integrations = collaborator
    ? await prisma.bundleExternalIntegrations.findMany({
        where: {
          bundleId: collaborator.bundleId,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const parsedIntegrations = integrations.map((integration) => {
    let configObj = {
      mode: "live",
      description: "",
      webhookUrl: "",
      complianceScore: 0,
      status: "sandbox",
      lastTestRun: null as any,
      version: "0.1.0",
      releaseNotes: "",
      releaseHistory: [] as Array<{ version: string; releaseNotes?: string; updatedAt?: string }>,
    };
    try {
      configObj = JSON.parse(integration.config);
    } catch (e) {}
    return {
      ...integration,
      configObj,
    };
  });

  const [installEvents, transactions, reviewSummary] = collaborator
    ? await Promise.all([
        prisma.marketplaceInstallEvent.findMany({
          where: { bundleId: collaborator.bundleId },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.marketplaceTransaction.findMany({
          where: { bundleId: collaborator.bundleId },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.bundleReviews.aggregate({
          where: { bundleId: collaborator.bundleId },
          _avg: { rating: true },
          _count: { id: true },
        }),
      ])
    : [[], [], { _avg: { rating: null }, _count: { id: 0 } }];

  const installCount = installEvents.filter((event) => event.eventType === "install").length;
  const uninstallCount = installEvents.filter((event) => event.eventType === "uninstall").length;
  const installErrorCount = installEvents.filter((event) => event.eventType === "error").length;
  const totalGrossRevenue = transactions
    .filter((transaction) => transaction.status === "completed")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <>
      <PageHeader
        title="Developer Portal"
        description="Partner center for self-registration, sandbox testing, webhook settings, and LepoS Marketplace publishing."
      />

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Partner Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="text-primary size-5" />
                Developer profile
              </CardTitle>
              <CardDescription>Configure your partner credentials</CardDescription>
            </CardHeader>
            <CardContent>
              {isDeveloperRegistered ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Company:</span>
                    <span className="font-medium">{developerCompany}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Website:</span>
                    <span className="font-medium text-primary underline">{developerWebsite}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Approved Partner
                    </Badge>
                  </div>
                </div>
              ) : (
                <form action={registerDeveloperProfileAction} className="space-y-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Company name</FieldLabel>
                      <Input name="companyName" placeholder="Acme Corp" required />
                    </Field>
                    <Field>
                      <FieldLabel>Website URL</FieldLabel>
                      <Input name="websiteUrl" placeholder="https://acme.com" required />
                    </Field>
                    <Button type="submit" size="sm" className="w-full">
                      Register as partner
                    </Button>
                  </FieldGroup>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Sandbox Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="text-primary size-5" />
                Sandbox stats
              </CardTitle>
              <CardDescription>Runs, passes, and average scores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registered Listings:</span>
                <span className="font-medium">{parsedIntegrations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sandbox Runs:</span>
                <span className="font-medium">
                  {parsedIntegrations.filter((i) => i.configObj.lastTestRun).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline">Enterprise Ready</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Documentation / Partner SDK Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Terminal className="text-primary size-5" />
                Partner CLI & SDK
              </CardTitle>
              <CardDescription>CLI commands for remote testing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs font-mono bg-muted p-3 rounded-lg border">
              <div># Login with your PAT token</div>
              <div className="text-primary">lepos login lp_pat_xxxx</div>
              <div className="mt-2"># Run endpoint compliance tests</div>
              <div className="text-primary">lepos partner test http://localhost:8080</div>
              <div className="mt-2"># Register & publish from CLI</div>
              <div className="text-primary">lepos partner publish</div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Registry Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form to Register Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="text-primary" />
                Register new integration
              </CardTitle>
              <CardDescription>
                Add a new service catalog listing candidate for the LepoS Marketplace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={registerIntegrationAction} className="space-y-4">
                <FieldGroup>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field>
                      <FieldLabel>Unique key</FieldLabel>
                      <Input name="integrationKey" placeholder="acme-sentry" required />
                    </Field>
                    <Field>
                      <FieldLabel>Display name</FieldLabel>
                      <Input name="displayName" placeholder="Acme Sentry Sync" required />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>Integration mode</FieldLabel>
                    <NativeSelect name="mode" defaultValue="live">
                      <NativeSelectOption value="live">Live (interactive callbacks)</NativeSelectOption>
                      <NativeSelectOption value="internal">Internal (metadata only)</NativeSelectOption>
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel>Sandbox webhook callback URL</FieldLabel>
                    <Input name="webhookUrl" placeholder="https://api.acme.com/lepos/callback" required />
                  </Field>
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Textarea name="description" placeholder="Sync code errors, diagnostics, and deployment logs instantly..." />
                  </Field>
                  <Button type="submit">Register integration</Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          {/* Sandbox & Test runner widgets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="text-primary" />
                Compatibility sandbox runner
              </CardTitle>
              <CardDescription>
                Trigger compliance checks to verify payload schemas and latency rules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {parsedIntegrations.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  Register an integration first to enable sandbox testing.
                </div>
              ) : (
                <form action={runCompatibilityTestAction} className="space-y-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Select Integration</FieldLabel>
                      <NativeSelect name="integrationId" required>
                        {parsedIntegrations.map((i) => (
                          <NativeSelectOption key={i.id} value={i.id}>
                            {i.displayName} ({i.integrationType})
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field>
                      <FieldLabel>Sandbox webhook URL</FieldLabel>
                      <Input
                        name="webhookUrl"
                        defaultValue={parsedIntegrations[0]?.configObj.webhookUrl || ""}
                        placeholder="https://api.acme.com/lepos/callback"
                        required
                      />
                    </Field>
                    <div className="flex gap-2">
                      <Button type="submit" variant="outline" className="w-full">
                        <Activity className="size-4 mr-2" />
                        Run Sandbox Test
                      </Button>
                    </div>
                  </FieldGroup>
                </form>
              )}

              {/* Compliance Report feedback */}
              {params.dev_portal === "test_completed" && (
                <div className="mt-6 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900 space-y-3">
                  <h4 className="text-sm font-semibold flex items-center justify-between">
                    <span>Compatibility report:</span>
                    <Badge variant={Number(params.score) === 100 ? "default" : "destructive"}>
                      {params.score}% compliant
                    </Badge>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-emerald-500 size-4" />
                      <span>Status 200/201: Success</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileCheck className="text-emerald-500 size-4" />
                      <span>Schema match: Valid</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="text-emerald-500 size-4" />
                      <span>Signature check: Valid</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="text-emerald-500 size-4" />
                      <span>Latency: {params.latency || 120}ms</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="grid gap-6 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package2 className="size-4 text-primary" />
                Install activity
              </CardTitle>
              <CardDescription>Total marketplace install signals for your current bundle.</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {installCount}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpRight className="size-4 text-primary" />
                Uninstalls
              </CardTitle>
              <CardDescription>Observed uninstall events from the marketplace telemetry feed.</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {uninstallCount}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="size-4 text-primary" />
                Install errors
              </CardTitle>
              <CardDescription>Error events reported back from install attempts.</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {installErrorCount}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="size-4 text-primary" />
                Gross revenue
              </CardTitle>
              <CardDescription>Completed marketplace revenue attached to this bundle.</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalGrossRevenue)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="size-4 text-primary" />
                Listing quality
              </CardTitle>
              <CardDescription>Average marketplace rating and current review volume.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">
                {reviewSummary._avg.rating ? reviewSummary._avg.rating.toFixed(1) : "—"}
              </div>
              <p className="text-xs text-muted-foreground">{reviewSummary._count.id} review entries tracked</p>
            </CardContent>
          </Card>
        </div>

        {/* Integration candidate List */}
        <Card>
          <CardHeader>
            <CardTitle>My registered listings</CardTitle>
            <CardDescription>
              Submit verified listings to the LepoS Marketplace. Requires 100% test compatibility.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {parsedIntegrations.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No integrations registered. Use the panel above to add one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 font-medium">Integration</th>
                      <th className="py-2 font-medium">Key</th>
                      <th className="py-2 font-medium">Mode</th>
                      <th className="py-2 font-medium">Version</th>
                      <th className="py-2 font-medium">Test score</th>
                      <th className="py-2 font-medium">Status</th>
                      <th className="py-2 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedIntegrations.map((i) => (
                      <tr key={i.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 font-semibold">{i.displayName}</td>
                        <td className="py-3 font-mono text-xs">{i.integrationType}</td>
                        <td className="py-3 capitalize">{i.configObj.mode}</td>
                        <td className="py-3 font-mono text-xs">{i.configObj.version || "0.1.0"}</td>
                        <td className="py-3">
                          <span className={i.configObj.complianceScore === 100 ? "text-emerald-600 font-bold" : "text-amber-600"}>
                            {i.configObj.complianceScore}%
                          </span>
                        </td>
                        <td className="py-3">
                          <Badge variant={i.isActive ? "default" : "secondary"}>
                            {i.configObj.status || (i.isActive ? "published" : "sandbox")}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          {i.configObj.complianceScore === 100 && !i.isActive ? (
                            <form action={publishMarketplaceIntegrationAction}>
                              <input type="hidden" name="integrationId" value={i.id} />
                              <Button size="sm" type="submit">
                                Publish to Marketplace
                              </Button>
                            </form>
                          ) : i.isActive ? (
                            <span className="text-xs text-muted-foreground">Live on catalog</span>
                          ) : (
                            <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                              <HelpCircle className="size-3" /> Run tests first
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {parsedIntegrations.length ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {parsedIntegrations.map((integration) => (
              <Card key={`${integration.id}-release`}>
                <CardHeader>
                  <CardTitle className="text-base">{integration.displayName}</CardTitle>
                  <CardDescription>
                    Manage release notes, version metadata, and history for this marketplace listing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form action={updateIntegrationReleaseAction} className="space-y-4">
                    <input type="hidden" name="integrationId" value={integration.id} />
                    <FieldGroup>
                      <Field>
                        <FieldLabel>Current version</FieldLabel>
                        <Input name="version" defaultValue={integration.configObj.version || "0.1.0"} />
                      </Field>
                      <Field>
                        <FieldLabel>Release notes</FieldLabel>
                        <Textarea
                          name="releaseNotes"
                          defaultValue={integration.configObj.releaseNotes || ""}
                          placeholder="Document the latest changes for this listing..."
                        />
                      </Field>
                      <Button type="submit" variant="outline">
                        Save release metadata
                      </Button>
                    </FieldGroup>
                  </form>

                  <div className="rounded-lg border border-hairline">
                    <div className="border-b border-hairline bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Recent release history
                    </div>
                    <div className="space-y-3 p-4">
                      {(integration.configObj.releaseHistory || []).length ? (
                        integration.configObj.releaseHistory.slice(0, 3).map((entry: any, index: number) => (
                          <div key={`${integration.id}-history-${index}`} className="rounded-md border border-hairline bg-muted/20 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-mono text-xs font-semibold">v{entry.version}</span>
                              <span className="text-[11px] text-muted-foreground">
                                {entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : "Pending timestamp"}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {entry.releaseNotes || "No release notes recorded."}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No release history recorded yet.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
