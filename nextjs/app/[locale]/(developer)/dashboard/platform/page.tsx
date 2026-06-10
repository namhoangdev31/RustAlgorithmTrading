import {
  Activity,
  AppWindow,
  Boxes,
  Cable,
  Flag,
  GitBranch,
  LineChart,
  Rocket,
  ShieldCheck,
  Store,
  TerminalSquare,
} from "lucide-react";

import {
  createFeatureFlagAction,
  createInternalDeploymentAction,
  recordMonitoringSnapshotAction,
  upsertMarketplaceAction,
  upsertPlatformConfigAction,
  upsertWebhookAction,
} from "@/app/actions/platform";
import { ActivityTable, MetricCard } from "@/components/dashboard/platform-control-widgets";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getPlatformControlPlane } from "@/lib/server/platform-control";

type ProjectOption = {
  id: string;
  name: string;
  bundle: {
    id: string;
    name: string;
    version: string;
    buildNumber: number;
    status: string;
  } | null;
};

function ProjectSelect({ projects }: { projects: ProjectOption[] }) {
  return (
    <NativeSelect name="projectId" required>
      {projects.map((project) => (
        <NativeSelectOption key={project.id} value={project.id}>
          {project.name}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

export default async function PlatformControlPlanePage() {
  const user = await requireCurrentUser();
  const data = await getPlatformControlPlane(user.id);
  const projects = data.projects.filter((project) => project.bundle);
  const completion = Math.round(
    ([
      data.metrics.previewReleases > 0,
      data.metrics.featureFlags > 0,
      data.metrics.webhooks > 0,
      data.metrics.integrations > 0,
      data.metrics.securityFindings >= 0,
      data.metrics.apiErrors >= 0,
    ].filter(Boolean).length /
      6) *
      100
  );

  return (
    <>
      <PageHeader
        title="Platform control plane"
        description="Deployment, DX, advanced features, enterprise controls, marketplace, and monitoring for the 8-phase release."
      />

      <div className="flex flex-col gap-6">
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="Releases" value={data.metrics.releases} icon={Rocket} />
          <MetricCard label="Feature flags" value={data.metrics.featureFlags} icon={Flag} />
          <MetricCard label="Integrations" value={data.metrics.integrations} icon={Boxes} />
          <MetricCard label="Open incidents" value={data.metrics.unresolvedCrashes} icon={Activity} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>8-phase readiness</CardTitle>
            <CardDescription>SSR-first completion surface backed by Prisma and Vercel/GitHub only.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="secondary">Production v1</Badge>
              <span className="text-sm text-muted-foreground">{completion}% configured</span>
            </div>
            <Progress value={completion} />
          </CardContent>
        </Card>

        {projects.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No project bundles</CardTitle>
              <CardDescription>Create a project with a bundle before configuring platform phases.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="text-primary" />
                  Deployment and preview
                </CardTitle>
                <CardDescription>Queue internal deployment records for production or preview.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={createInternalDeploymentAction}>
                  <input type="hidden" name="returnTo" value="/dashboard/platform" />
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Project</FieldLabel>
                      <ProjectSelect projects={projects} />
                    </Field>
                    <Field>
                      <FieldLabel>Target</FieldLabel>
                      <NativeSelect name="target" defaultValue="preview">
                        <NativeSelectOption value="preview">Preview</NativeSelectOption>
                        <NativeSelectOption value="production">Production</NativeSelectOption>
                      </NativeSelect>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="releaseNotes">Release notes</FieldLabel>
                      <Textarea id="releaseNotes" name="releaseNotes" placeholder="Queued from GitHub PR, manual QA, or release train." />
                    </Field>
                    <Button type="submit">
                      <GitBranch data-icon="inline-start" />
                      Queue deployment
                    </Button>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TerminalSquare className="text-primary" />
                  DX contracts
                </CardTitle>
                <CardDescription>Capture CLI/API/SDK-ready contracts without exposing public REST APIs.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={upsertPlatformConfigAction}>
                  <input type="hidden" name="returnTo" value="/dashboard/platform" />
                  <input type="hidden" name="configType" value="dx_contracts" />
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Project</FieldLabel>
                      <ProjectSelect projects={projects} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="dxName">Contract name</FieldLabel>
                      <Input id="dxName" name="displayName" defaultValue="LepoS CLI contract" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="command">Command surface</FieldLabel>
                      <Input id="command" name="command" defaultValue="lepos deploy --target preview" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="dxNotes">Notes</FieldLabel>
                      <Textarea id="dxNotes" name="notes" placeholder="Server action backed contract, no /api/v1 exposure." />
                    </Field>
                    <Button type="submit" variant="outline">Save DX contract</Button>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="text-primary" />
                  Feature flags and A/B tests
                </CardTitle>
                <CardDescription>Server-side flags rendered through SSR and stored in Prisma.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={createFeatureFlagAction}>
                  <input type="hidden" name="returnTo" value="/dashboard/platform" />
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Project</FieldLabel>
                      <ProjectSelect projects={projects} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="testName">Flag name</FieldLabel>
                      <Input id="testName" name="testName" placeholder="checkout_redesign" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="trafficSplit">Traffic split</FieldLabel>
                      <Input id="trafficSplit" name="trafficSplit" type="number" min={0} max={100} defaultValue={50} />
                    </Field>
                    <Field>
                      <FieldLabel>Status</FieldLabel>
                      <NativeSelect name="status" defaultValue="draft">
                        <NativeSelectOption value="draft">Draft</NativeSelectOption>
                        <NativeSelectOption value="running">Running</NativeSelectOption>
                      </NativeSelect>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="metric">Metric</FieldLabel>
                      <Input id="metric" name="metric" defaultValue="activation" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="hypothesis">Hypothesis</FieldLabel>
                      <Textarea id="hypothesis" name="hypothesis" />
                    </Field>
                    <Button type="submit">
                      <Flag data-icon="inline-start" />
                      Create flag
                    </Button>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AppWindow className="text-primary" />
                  Advanced platform config
                </CardTitle>
                <CardDescription>Edge, image, form, enterprise, and status-page controls.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={upsertPlatformConfigAction}>
                  <input type="hidden" name="returnTo" value="/dashboard/platform" />
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Project</FieldLabel>
                      <ProjectSelect projects={projects} />
                    </Field>
                    <Field>
                      <FieldLabel>Capability</FieldLabel>
                      <NativeSelect name="configType" defaultValue="image_optimization">
                        <NativeSelectOption value="edge_functions">Edge functions</NativeSelectOption>
                        <NativeSelectOption value="image_optimization">Image optimization</NativeSelectOption>
                        <NativeSelectOption value="form_handling">Form handling</NativeSelectOption>
                        <NativeSelectOption value="enterprise_controls">Enterprise controls</NativeSelectOption>
                        <NativeSelectOption value="marketplace_registry">Marketplace registry</NativeSelectOption>
                        <NativeSelectOption value="monitoring_dashboard">Monitoring dashboard</NativeSelectOption>
                        <NativeSelectOption value="status_page">Status page</NativeSelectOption>
                      </NativeSelect>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="configName">Display name</FieldLabel>
                      <Input id="configName" name="displayName" placeholder="Image optimization policy" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="policy">Policy</FieldLabel>
                      <Textarea id="policy" name="policy" placeholder="Regions, limits, allowlists, retention, or compliance notes." />
                    </Field>
                    <Button type="submit" variant="outline">
                      <ShieldCheck data-icon="inline-start" />
                      Save capability
                    </Button>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cable className="text-primary" />
                  Webhooks
                </CardTitle>
                <CardDescription>Register deployment/status hooks without sending external requests from this UI.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={upsertWebhookAction}>
                  <input type="hidden" name="returnTo" value="/dashboard/platform" />
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Project</FieldLabel>
                      <ProjectSelect projects={projects} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="webhookUrl">URL</FieldLabel>
                      <Input id="webhookUrl" name="url" placeholder="internal://deployment-status" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="events">Events</FieldLabel>
                      <Input id="events" name="events" defaultValue="deployment.created,deployment.ready" />
                    </Field>
                    <Button type="submit" variant="outline">Register webhook</Button>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="text-primary" />
                  Marketplace listing
                </CardTitle>
                <CardDescription>Manage internal marketplace metadata, verification, and featured state.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={upsertMarketplaceAction}>
                  <input type="hidden" name="returnTo" value="/dashboard/platform" />
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Project</FieldLabel>
                      <ProjectSelect projects={projects} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="listingName">Listing name</FieldLabel>
                      <Input id="listingName" name="listingName" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="region">Region</FieldLabel>
                      <Input id="region" name="region" defaultValue="global" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="shortDescription">Short description</FieldLabel>
                      <Input id="shortDescription" name="shortDescription" />
                    </Field>
                    <Field>
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" /> Featured</label>
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isVerified" /> Verified</label>
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isEditorChoice" /> Editor choice</label>
                    </Field>
                    <Button type="submit">
                      <Store data-icon="inline-start" />
                      Save listing
                    </Button>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="text-primary" />
                  Monitoring and status
                </CardTitle>
                <CardDescription>Record API/error/security snapshots for Phase 8 dashboards.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={recordMonitoringSnapshotAction}>
                  <input type="hidden" name="returnTo" value="/dashboard/platform" />
                  <FieldGroup className="grid gap-4 md:grid-cols-3">
                    <Field>
                      <FieldLabel>Project</FieldLabel>
                      <ProjectSelect projects={projects} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="endpoint">Endpoint</FieldLabel>
                      <Input id="endpoint" name="endpoint" defaultValue="/health" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="method">Method</FieldLabel>
                      <Input id="method" name="method" defaultValue="GET" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="callCount">Calls</FieldLabel>
                      <Input id="callCount" name="callCount" type="number" defaultValue={1000} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="errorCount">Errors</FieldLabel>
                      <Input id="errorCount" name="errorCount" type="number" defaultValue={0} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="avgLatencyMs">Avg latency</FieldLabel>
                      <Input id="avgLatencyMs" name="avgLatencyMs" type="number" defaultValue={80} />
                    </Field>
                    <Field className="md:col-span-3">
                      <FieldLabel htmlFor="findings">Findings</FieldLabel>
                      <Textarea id="findings" name="findings" placeholder="Optional incident, scan, or release-health notes." />
                    </Field>
                    <Field className="md:col-span-3">
                      <Button type="submit" variant="outline">
                        <Activity data-icon="inline-start" />
                        Record snapshot
                      </Button>
                    </Field>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent control-plane activity</CardTitle>
            <CardDescription>Deployments, flags, webhooks, integrations, API health, and security scans.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <ActivityTable
                title="Releases"
                rows={data.recentReleases.map((item) => [
                  item.bundle.name,
                  item.track,
                  item.version,
                  item.status,
                ])}
              />
              <ActivityTable
                title="Feature flags"
                rows={data.featureFlags.map((item) => [
                  item.bundle.name,
                  item.testName,
                  `${item.trafficSplit}%`,
                  item.status,
                ])}
              />
              <ActivityTable
                title="Integrations"
                rows={data.integrations.map((item) => [
                  item.bundle.name,
                  item.integrationType,
                  item.displayName,
                  item.isActive ? "active" : "paused",
                ])}
              />
              <ActivityTable
                title="API health"
                rows={data.apiUsage.map((item) => [
                  item.bundle.name,
                  `${item.method} ${item.endpoint}`,
                  `${Number(item.callCount)} calls`,
                  `${Number(item.errorCount)} errors`,
                ])}
              />
            </div>
            <Separator />
            <div className="grid gap-3 md:grid-cols-3">
              <Badge variant="secondary">Preview deployments: {data.metrics.previewReleases}</Badge>
              <Badge variant="secondary">Webhook configs: {data.metrics.webhooks}</Badge>
              <Badge variant={data.metrics.securityFindings ? "destructive" : "secondary"}>
                Security findings: {data.metrics.securityFindings}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
