import { CheckCircle2, CircleDashed, PlugZap, ShieldCheck } from "lucide-react";

import {
  registerDeveloperProfileAction,
  registerIntegrationAction,
  runCompatibilityTestAction,
} from "@/app/actions/developer-portal";
import { PageHeader } from "@/components/portal/PageHeader";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";

type PageProps = { searchParams: Promise<{ dev_portal?: string; score?: string; latency?: string }> };

export default async function MarketplaceOverviewPage({ searchParams }: PageProps) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const bundles = await prisma.bundles.findMany({
    where: {
      deletedAt: null,
      OR: [
        { developerId: user.id },
        { collaborators: { some: { userId: user.id } } },
        { project: { members: { some: { userId: user.id, inviteStatus: "accepted" } } } },
      ],
    },
    select: { id: true },
  });
  const bundleIds = bundles.map((bundle) => bundle.id);
  const integrations = await prisma.bundleExternalIntegrations.findMany({
    where: { bundleId: { in: bundleIds } },
    orderBy: { updatedAt: "desc" },
  });
  const runs = integrations.length
    ? await prisma.marketplaceCompatibilityRun.findMany({
        where: { integrationId: { in: integrations.map((integration) => integration.id) } },
        orderBy: { createdAt: "desc" },
        take: 8,
      })
    : [];

  const registered = user.userType === "partner_developer";
  const verifiedCount = integrations.filter((integration) => {
    try { return JSON.parse(integration.config).status === "verified"; } catch { return false; }
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Marketplace" description="Partner readiness, registered integrations, and persisted compatibility evidence." />

      {params.dev_portal ? (
        <div role="status" className="rounded-lg border bg-muted/40 p-3 text-sm">
          {params.dev_portal.replaceAll("_", " ")}{params.score ? ` · Score ${params.score}` : ""}{params.latency ? ` · ${params.latency}ms` : ""}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-5">{registered ? <CheckCircle2 className="size-5 text-success" /> : <CircleDashed className="size-5 text-muted-foreground" />}<div><p className="text-2xl font-semibold">{registered ? "Ready" : "Required"}</p><p className="text-xs text-muted-foreground">Partner profile</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5"><PlugZap className="size-5 text-muted-foreground" /><div><p className="text-2xl font-semibold">{integrations.length}</p><p className="text-xs text-muted-foreground">Registered integrations</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5"><ShieldCheck className="size-5 text-muted-foreground" /><div><p className="text-2xl font-semibold">{verifiedCount}</p><p className="text-xs text-muted-foreground">Verified by runtime evidence</p></div></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {!registered ? (
          <Card>
            <CardHeader><CardTitle className="text-base">Create partner profile</CardTitle><CardDescription>Register the identity displayed on marketplace listings.</CardDescription></CardHeader>
            <CardContent><form action={registerDeveloperProfileAction}><input type="hidden" name="returnTo" value="/marketplace" /><FieldGroup><Field><FieldLabel htmlFor="company-name">Company name</FieldLabel><Input id="company-name" name="companyName" required /></Field><Field><FieldLabel htmlFor="developer-email">Developer email</FieldLabel><Input id="developer-email" name="developerEmail" type="email" defaultValue={user.email || ""} required /></Field><Field><FieldLabel htmlFor="website-url">Website</FieldLabel><Input id="website-url" name="websiteUrl" type="url" /></Field><Button type="submit">Register profile</Button></FieldGroup></form></CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle className="text-base">Register integration</CardTitle><CardDescription>Create a sandbox listing candidate linked to an accessible project bundle.</CardDescription></CardHeader>
            <CardContent><form action={registerIntegrationAction}><input type="hidden" name="returnTo" value="/marketplace" /><FieldGroup><Field><FieldLabel htmlFor="display-name">Display name</FieldLabel><Input id="display-name" name="displayName" required /></Field><Field><FieldLabel htmlFor="integration-key">Integration key</FieldLabel><Input id="integration-key" name="integrationKey" placeholder="observability-webhook" required /></Field><Field><FieldLabel htmlFor="integration-mode">Mode</FieldLabel><NativeSelect id="integration-mode" name="mode" defaultValue="live"><NativeSelectOption value="live">Live endpoint</NativeSelectOption><NativeSelectOption value="sandbox">Sandbox endpoint</NativeSelectOption></NativeSelect></Field><Field><FieldLabel htmlFor="webhook-url">Webhook URL</FieldLabel><Input id="webhook-url" name="webhookUrl" type="url" required /></Field><Field><FieldLabel htmlFor="integration-description">Description</FieldLabel><Textarea id="integration-description" name="description" /><FieldDescription>Describe the capability and data exchanged.</FieldDescription></Field><Button type="submit">Register integration</Button></FieldGroup></form></CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Compatibility runner</CardTitle><CardDescription>Sends a bounded request to the selected endpoint and persists the result. Failed endpoints never receive a passing score.</CardDescription></CardHeader>
          <CardContent>
            {integrations.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Register an integration before running compatibility checks.</div>
            ) : (
              <form action={runCompatibilityTestAction}><input type="hidden" name="returnTo" value="/marketplace" /><FieldGroup><Field><FieldLabel htmlFor="integration-id">Integration</FieldLabel><NativeSelect id="integration-id" name="integrationId" required>{integrations.map((integration) => <NativeSelectOption key={integration.id} value={integration.id}>{integration.displayName}</NativeSelectOption>)}</NativeSelect></Field><Field><FieldLabel htmlFor="compatibility-url">Endpoint</FieldLabel><Input id="compatibility-url" name="webhookUrl" type="url" required /></Field><Button type="submit">Run compatibility check</Button></FieldGroup></form>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent compatibility evidence</CardTitle><CardDescription>Results are stored per integration and endpoint.</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {runs.length === 0 ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No compatibility runs.</div> : runs.map((run) => {
            const result = run.checkResults && typeof run.checkResults === "object" ? run.checkResults as Record<string, unknown> : {};
            const score = Number(result.score || 0);
            return <div key={run.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-mono text-sm">{run.endpoint}</p><p className="text-xs text-muted-foreground">{run.createdAt.toLocaleString()} · {String(result.latencyMs || 0)}ms</p></div><StatusBadge status={score === 100 ? "active" : score > 0 ? "warning" : "error"} label={`${score}/100`} /></div>;
          })}
        </CardContent>
      </Card>
    </div>
  );
}
