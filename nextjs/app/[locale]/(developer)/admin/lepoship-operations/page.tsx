import { redirect } from "next/navigation";

import { replayOutboxEventAction, runCronJobFromOperationsAction } from "@/app/actions/lepoship-operations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CONTROL_PLANE_CRON_JOBS,
  getControlPlaneCronStatus,
  type ControlPlaneCronRun,
  type ControlPlaneCronStatus,
} from "@/lib/server/control-plane-cron";
import { requireCurrentUser } from "@/lib/server/current-user";
import { reconcileLepoShipFinance } from "@/lib/server/lepoship/reconciliation";
import { prisma } from "@/lib/server/prisma";

export default async function LepoShipOperationsPage() {
  const user = await requireCurrentUser();
  if (user.userType !== "admin") redirect("/dashboard");

  const [outbox, failedBuilds, overrides, finance, cronStatus] = await Promise.all([
    prisma.bundleOutboxEvents.findMany({ where: { status: "dead_letter" }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.bundleBuildJobs.findMany({ where: { status: "failed" }, include: { release: { select: { version: true, buildNumber: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.bundleReleaseOverridesV2.findMany({ where: { revokedAt: null, expiresAt: { gt: new Date() } }, include: { approvals: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    reconcileLepoShipFinance(),
    getControlPlaneCronStatus(user.id),
  ]);

  const jobsByName = new Map(cronStatus.jobs.map((job) => [job.job, job]));
  const failedRuns = cronStatus.recentRuns.filter((run) => run.status === "failed").length;
  const staleJobs = cronStatus.jobs.filter((job) => !job.latestRun).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">LepoShip operations</h1>
        <p className="text-sm text-muted-foreground">
          Go control-plane cron ownership, recent run history, and manual recovery controls.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Go scheduler</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={cronStatus.jobs.some((job) => job.enabled) ? "default" : "destructive"}>
              {cronStatus.jobs.some((job) => job.enabled) ? "enabled" : "disabled"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Cron failures</CardTitle></CardHeader>
          <CardContent><Badge variant={failedRuns ? "destructive" : "outline"}>{failedRuns}</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Ledger</CardTitle></CardHeader>
          <CardContent><Badge variant={finance.balanced ? "default" : "destructive"}>{finance.balanced ? "balanced" : `${finance.imbalances.length} drift`}</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Outbox DLQ</CardTitle></CardHeader>
          <CardContent><Badge variant={outbox.length ? "destructive" : "outline"}>{outbox.length}</Badge></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Go cron jobs</CardTitle>
          <CardDescription>
            Status is read from Go `/api/internal/cron/status`; manual runs call Go `/api/internal/cron/:job/run`.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!cronStatus.success ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {cronStatus.error || "Unable to load Go cron status."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Last run</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Next run</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CONTROL_PLANE_CRON_JOBS.map((definition) => {
                  const status = jobsByName.get(definition.job);
                  return (
                    <TableRow key={definition.job}>
                      <TableCell>
                        <div className="font-medium">{definition.label}</div>
                        <div className="text-xs text-muted-foreground">{definition.job}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{status?.schedule ?? "unknown"}</TableCell>
                      <TableCell>{formatRunTime(status?.latestRun)}</TableCell>
                      <TableCell><CronRunBadge status={status} /></TableCell>
                      <TableCell>{formatDate(status?.nextRunAt)}</TableCell>
                      <TableCell className="text-right">
                        <form action={runCronJobFromOperationsAction}>
                          <input type="hidden" name="job" value={definition.job} />
                          <Button size="sm" variant="outline">Run now</Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {staleJobs > 0 && cronStatus.success ? (
            <p className="mt-3 text-xs text-muted-foreground">{staleJobs} job(s) have no persisted run yet.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent cron runs</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {cronStatus.recentRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cron runs recorded yet.</p>
          ) : (
            cronStatus.recentRuns.slice(0, 20).map((run) => (
              <div key={run.id} className="grid gap-2 rounded-md border border-hairline p-3 text-sm md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>{run.job}</strong>
                    <Badge variant={run.status === "success" ? "default" : run.status === "failed" ? "destructive" : "secondary"}>{run.status}</Badge>
                    <span className="text-xs text-muted-foreground">{run.trigger}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{run.message || run.error || "No message"}</p>
                </div>
                <div className="text-xs text-muted-foreground md:text-right">
                  <div>{formatDate(run.startedAt)}</div>
                  <div>{run.durationMs}ms · processed {run.processed} · skipped {run.skipped}</div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Failed builds</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {failedBuilds.length === 0 ? <p className="text-sm text-muted-foreground">No failed builds.</p> : failedBuilds.map((build) => (
              <div key={build.id} className="rounded-md border border-hairline p-3 text-sm">
                <strong>v{build.release.version} #{build.release.buildNumber}</strong>
                <p className="text-xs text-destructive">{build.errorCode}: {build.errorMessage}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Emergency overrides</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {overrides.length === 0 ? <p className="text-sm text-muted-foreground">No active override requests.</p> : overrides.map((override) => (
              <div key={override.id} className="flex flex-wrap justify-between gap-2 rounded-md border border-hairline p-3 text-sm">
                <span>{override.reason}</span>
                <Badge variant={override.approvals.length >= 2 ? "default" : "secondary"}>{override.approvals.length}/2 approvals</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Dead-letter outbox</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {outbox.length === 0 ? <p className="text-sm text-muted-foreground">DLQ is empty.</p> : outbox.map((event) => (
            <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hairline p-3 text-sm">
              <div>
                <strong>{event.eventType}</strong>
                <p className="text-xs text-muted-foreground">{event.eventKey} · attempts {event.attempts}</p>
              </div>
              <form action={replayOutboxEventAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="reason" value="Operations dashboard replay" />
                <Button size="sm" variant="outline">Replay</Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function CronRunBadge({ status }: { status?: ControlPlaneCronStatus }) {
  const run = status?.latestRun;
  if (!run) return <Badge variant="secondary">never run</Badge>;
  if (run.status === "success") return <Badge variant="default">success</Badge>;
  if (run.status === "failed") return <Badge variant="destructive">failed</Badge>;
  return <Badge variant="secondary">{run.status}</Badge>;
}

function formatRunTime(run?: ControlPlaneCronRun) {
  if (!run) return "Never";
  return (
    <span className="text-sm">
      {formatDate(run.startedAt)}
      <span className="block text-xs text-muted-foreground">
        {run.durationMs}ms · processed {run.processed} · skipped {run.skipped}
      </span>
    </span>
  );
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
