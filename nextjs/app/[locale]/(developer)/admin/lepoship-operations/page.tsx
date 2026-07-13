import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reconcileLepoShipFinance } from "@/lib/server/lepoship/reconciliation";
import { prisma } from "@/lib/server/prisma";
import { Button } from "@/components/ui/button";
import { replayOutboxEventAction } from "@/app/actions/lepoship-operations";

export default async function LepoShipOperationsPage() {
  const [outbox, failedBuilds, overrides, finance] = await Promise.all([
    prisma.bundleOutboxEvents.findMany({ where: { status: "dead_letter" }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.bundleBuildJobs.findMany({ where: { status: "failed" }, include: { release: { select: { version: true, buildNumber: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.bundleReleaseOverridesV2.findMany({ where: { revokedAt: null, expiresAt: { gt: new Date() } }, include: { approvals: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    reconcileLepoShipFinance(),
  ]);
  return <div className="space-y-4">
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardHeader><CardTitle className="text-sm">Ledger</CardTitle></CardHeader><CardContent><Badge variant={finance.balanced ? "default" : "destructive"}>{finance.balanced ? "balanced" : `${finance.imbalances.length} drift`}</Badge></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">Outbox DLQ</CardTitle></CardHeader><CardContent><Badge variant={outbox.length ? "destructive" : "outline"}>{outbox.length}</Badge></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">Failed Stripe events</CardTitle></CardHeader><CardContent><Badge variant={finance.failedStripeEvents ? "destructive" : "outline"}>{finance.failedStripeEvents}</Badge></CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Failed builds</CardTitle></CardHeader><CardContent className="space-y-2">{failedBuilds.length === 0 ? <p className="text-sm text-muted-foreground">No failed builds.</p> : failedBuilds.map((build) => <div key={build.id} className="rounded-md border border-hairline p-3 text-sm"><strong>v{build.release.version} #{build.release.buildNumber}</strong><p className="text-xs text-destructive">{build.errorCode}: {build.errorMessage}</p></div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>Emergency overrides</CardTitle></CardHeader><CardContent className="space-y-2">{overrides.length === 0 ? <p className="text-sm text-muted-foreground">No active override requests.</p> : overrides.map((override) => <div key={override.id} className="flex flex-wrap justify-between gap-2 rounded-md border border-hairline p-3 text-sm"><span>{override.reason}</span><Badge variant={override.approvals.length >= 2 ? "default" : "secondary"}>{override.approvals.length}/2 approvals</Badge></div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>Dead-letter outbox</CardTitle></CardHeader><CardContent className="space-y-2">{outbox.length === 0 ? <p className="text-sm text-muted-foreground">DLQ is empty.</p> : outbox.map((event) => <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hairline p-3 text-sm"><div><strong>{event.eventType}</strong><p className="text-xs text-muted-foreground">{event.eventKey} · attempts {event.attempts}</p></div><form action={replayOutboxEventAction}><input type="hidden" name="eventId" value={event.id} /><input type="hidden" name="reason" value="Operations dashboard replay" /><Button size="sm" variant="outline">Replay</Button></form></div>)}</CardContent></Card>
  </div>;
}
