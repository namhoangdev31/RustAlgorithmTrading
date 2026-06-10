import {
  Activity,
  Boxes,
  Braces,
  Cable,
  ChartSpline,
  GitPullRequest,
  KeyRound,
  RadioTower,
  ShieldCheck,
  Smartphone,
  Store,
  Workflow,
} from "lucide-react";

import {
  createZeroPlanExperimentAction,
  createZeroPlanWebhookAction,
  recordZeroPlanSignalAction,
  upsertZeroPlanCapabilityAction,
} from "@/app/actions/zero-plan";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  PhaseBadge,
  ZeroMetricCard,
  ZeroTable,
} from "@/components/dashboard/zero-plan-widgets";
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
import {
  getZeroPlanControlPlane,
  ZERO_PLAN_PHASES,
} from "@/lib/server/zero-plan-control";

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

function CapabilitySelect() {
  return (
    <NativeSelect name="capability" required>
      {ZERO_PLAN_PHASES.map((phase) => (
        <NativeSelectOption key={phase.capability} value={phase.capability}>
          {phase.phase}: {phase.title}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

export default async function ZeroPlanPage() {
  const user = await requireCurrentUser();
  const data = await getZeroPlanControlPlane(user.id);
  const projects = data.projects.filter((project) => project.bundle);
  const readiness = Math.round((data.metrics.configured / ZERO_PLAN_PHASES.length) * 100);

  return (
    <>
      <PageHeader
        title="Zero Plan"
        description="Phase 9-18 developer preview control plane"
      />

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              LepoS & LepoShip Zero Plan
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Phase 9-18 are implemented as SSR control-plane workflows with
              Prisma-backed records. Public API v1, Redis, Cloudflare, AWS,
              Apple, and Google calls stay disabled for this release.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={readiness} className="max-w-md" />
            <span className="text-sm text-muted-foreground">{readiness}% ready</span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <ZeroMetricCard label="Configured phases" value={data.metrics.configured} icon={Workflow} />
          <ZeroMetricCard label="Release runs" value={data.metrics.releaseRuns} icon={GitPullRequest} />
          <ZeroMetricCard label="Telemetry" value={data.metrics.telemetrySignals} icon={ChartSpline} />
          <ZeroMetricCard label="Security" value={data.metrics.securitySignals} icon={ShieldCheck} />
          <ZeroMetricCard label="Webhooks" value={data.metrics.webhooks} icon={Cable} />
          <ZeroMetricCard label="Experiments" value={data.metrics.experiments} icon={Activity} />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {data.phases.map((phase) => (
            <Card key={phase.capability}>
              <CardHeader className="gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardDescription>{phase.phase}</CardDescription>
                    <CardTitle className="text-base">{phase.title}</CardTitle>
                  </div>
                  <PhaseBadge configured={phase.configured} />
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {phase.summary}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Capability Contract</CardTitle>
              <CardDescription>
                Configure any phase as an internal SSR contract, not as a public REST API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={upsertZeroPlanCapabilityAction} className="space-y-4">
                <input type="hidden" name="returnTo" value="/dashboard/zero-plan" />
                <FieldGroup>
                  <Field>
                    <FieldLabel>Project</FieldLabel>
                    <ProjectSelect projects={projects} />
                  </Field>
                  <Field>
                    <FieldLabel>Phase</FieldLabel>
                    <CapabilitySelect />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field>
                      <FieldLabel>Display name</FieldLabel>
                      <Input name="displayName" placeholder="CLI contracts" />
                    </Field>
                    <Field>
                      <FieldLabel>Owner</FieldLabel>
                      <Input name="owner" placeholder="Platform team" />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>Command or policy</FieldLabel>
                    <Input name="command" placeholder="lepos deploy --preview" />
                  </Field>
                  <Field>
                    <FieldLabel>Notes</FieldLabel>
                    <Textarea name="notes" placeholder="Internal contract details" />
                    <FieldDescription>
                      PAT capability stores only SHA-256 token hash and preview text.
                    </FieldDescription>
                  </Field>
                  <Button type="submit">
                    <KeyRound data-icon="inline-start" />
                    Save capability
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Telemetry & Security Signal</CardTitle>
              <CardDescription>
                Record Speed Insights, cache purge, WAF, compute, and storage snapshots.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={recordZeroPlanSignalAction} className="space-y-4">
                <input type="hidden" name="returnTo" value="/dashboard/zero-plan" />
                <FieldGroup>
                  <Field>
                    <FieldLabel>Project</FieldLabel>
                    <ProjectSelect projects={projects} />
                  </Field>
                  <Field>
                    <FieldLabel>Capability</FieldLabel>
                    <CapabilitySelect />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-4">
                    <Field>
                      <FieldLabel>Signal</FieldLabel>
                      <Input name="signal" placeholder="vitals" />
                    </Field>
                    <Field>
                      <FieldLabel>Calls</FieldLabel>
                      <Input name="calls" type="number" defaultValue="1" min="0" />
                    </Field>
                    <Field>
                      <FieldLabel>Errors</FieldLabel>
                      <Input name="errors" type="number" defaultValue="0" min="0" />
                    </Field>
                    <Field>
                      <FieldLabel>Avg ms</FieldLabel>
                      <Input name="avgLatencyMs" type="number" defaultValue="0" min="0" />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>Notes</FieldLabel>
                    <Textarea name="notes" placeholder="Validation snapshot" />
                  </Field>
                  <Button type="submit">
                    <RadioTower data-icon="inline-start" />
                    Record signal
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Forms, Hooks & Preview Comments</CardTitle>
              <CardDescription>
                Internal webhooks stand in for form submission, deploy hook, and preview comment routes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createZeroPlanWebhookAction} className="space-y-4">
                <input type="hidden" name="returnTo" value="/dashboard/zero-plan" />
                <FieldGroup>
                  <Field>
                    <FieldLabel>Project</FieldLabel>
                    <ProjectSelect projects={projects} />
                  </Field>
                  <Field>
                    <FieldLabel>Internal URL</FieldLabel>
                    <Input name="url" defaultValue="internal://zero-plan/forms" />
                  </Field>
                  <Field>
                    <FieldLabel>Events</FieldLabel>
                    <Input name="events" defaultValue="forms.submission,preview.comment,deploy.hook" />
                  </Field>
                  <Button type="submit">
                    <Braces data-icon="inline-start" />
                    Create hook
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>A/B Experiment</CardTitle>
              <CardDescription>
                SSR-side experiment records for Phase 16 without client SDK evaluation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createZeroPlanExperimentAction} className="space-y-4">
                <input type="hidden" name="returnTo" value="/dashboard/zero-plan" />
                <FieldGroup>
                  <Field>
                    <FieldLabel>Project</FieldLabel>
                    <ProjectSelect projects={projects} />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field>
                      <FieldLabel>Name</FieldLabel>
                      <Input name="testName" placeholder="Homepage conversion" />
                    </Field>
                    <Field>
                      <FieldLabel>Traffic split</FieldLabel>
                      <Input name="trafficSplit" type="number" defaultValue="50" min="1" max="99" />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>Hypothesis</FieldLabel>
                    <Textarea name="hypothesis" placeholder="Variant B improves activation." />
                  </Field>
                  <Button type="submit">
                    <Boxes data-icon="inline-start" />
                    Start experiment
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="grid gap-4 xl:grid-cols-2">
          <ZeroTable
            title="Capabilities"
            rows={data.capabilities.map((item) => [
              item.bundle.name,
              item.integrationType,
              item.displayName,
              item.isActive ? "active" : "inactive",
            ])}
          />
          <ZeroTable
            title="Release Runs"
            rows={data.releases.map((item) => [
              item.bundle.name,
              item.track,
              item.version,
              item.status,
            ])}
          />
          <ZeroTable
            title="Telemetry"
            rows={data.telemetry.map((item) => [
              item.bundle.name,
              item.endpoint,
              Number(item.callCount),
              `${Number(item.errorCount)} errors`,
            ])}
          />
          <ZeroTable
            title="Security"
            rows={data.security.map((item) => [
              item.bundle.name,
              item.scanType,
              item.severity || "low",
              item.result,
            ])}
          />
          <ZeroTable
            title="Hooks"
            rows={data.webhooks.map((item) => [
              item.bundle.name,
              item.events,
              item.url,
              item.isActive ? "active" : "inactive",
            ])}
          />
          <ZeroTable
            title="Experiments"
            rows={data.experiments.map((item) => [
              item.bundle.name,
              item.metric,
              `${item.trafficSplit}%`,
              item.status,
            ])}
          />
        </div>
      </div>
    </>
  );
}
