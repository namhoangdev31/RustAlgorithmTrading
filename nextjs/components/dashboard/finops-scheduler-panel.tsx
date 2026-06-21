import { recordNativeSchedulingSignalAction, upsertNativeSchedulingPolicyAction } from "@/app/actions/native-platform";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/shared/time";

export function FinopsSchedulerPanel({
  projectId,
  locale,
  policy,
  signals,
  returnTo,
}: {
  projectId: string;
  locale: string;
  policy: any;
  signals: any[];
  returnTo?: string;
}) {
  return (
    <Card className="border border-hairline bg-canvas py-0">
      <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5">
        <CardTitle className="text-base font-bold text-ink">FinOps & Carbon Scheduling</CardTitle>
        <CardDescription className="text-xs text-ink-mute">
          Define workload policy for deferrable jobs and ingest cost/carbon/queue signals used by the scheduler.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <form action={upsertNativeSchedulingPolicyAction} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="projectId" value={projectId} />
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <Input name="mode" defaultValue={policy?.mode || "observe"} placeholder="observe" />
          <Input name="costProvider" defaultValue={policy?.costProvider || ""} placeholder="manual-cost-feed" />
          <Input name="carbonProvider" defaultValue={policy?.carbonProvider || ""} placeholder="manual-carbon-feed" />
          <Input name="defaultWorkloadClass" defaultValue={policy?.defaultWorkloadClass || "interactive"} placeholder="deferrable" />
          <Input name="deferrableWindowStart" defaultValue={policy?.deferrableWindowStart || "01:00"} placeholder="01:00" />
          <Input name="deferrableWindowEnd" defaultValue={policy?.deferrableWindowEnd || "05:00"} placeholder="05:00" />
          <Input name="maxCarbonIntensity" defaultValue={String(policy?.maxCarbonIntensity ?? 250)} placeholder="250" />
          <Input name="maxCostScore" defaultValue={String(policy?.maxCostScore ?? 80)} placeholder="80" />
          <label className="flex items-center gap-2 rounded-md border border-hairline px-3 text-xs text-ink-secondary">
            <input type="checkbox" name="enabled" defaultChecked={policy?.enabled ?? false} />
            Scheduler enabled
          </label>
          <div className="md:col-span-4">
            <Button type="submit" size="sm">Save Scheduling Policy</Button>
          </div>
        </form>

        <form action={recordNativeSchedulingSignalAction} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="projectId" value={projectId} />
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <Input name="signalType" placeholder="carbon_intensity" />
          <Input name="source" placeholder="manual" />
          <Input name="region" placeholder="ap-southeast-1" />
          <Input name="value" placeholder="180" />
          <Input name="unit" placeholder="gco2eq/kwh" />
          <div className="md:col-span-4">
            <Button type="submit" size="sm" variant="outline">Record Signal</Button>
          </div>
        </form>

        {signals.length ? (
          <div className="overflow-x-auto rounded-md border border-hairline">
            <Table>
              <TableHeader>
                <TableRow className="bg-canvas-soft/40">
                  <TableHead>Signal</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Sampled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signals.map((signal) => (
                  <TableRow key={signal.id}>
                    <TableCell className="text-xs">{signal.signalType}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="secondary">{signal.value}{signal.unit ? ` ${signal.unit}` : ""}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{signal.source}</TableCell>
                    <TableCell className="text-xs">{signal.region || "-"}</TableCell>
                    <TableCell className="text-xs">{formatRelativeTime(new Date(signal.sampledAt), locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-hairline bg-canvas-soft/30 px-4 py-6 text-xs text-ink-mute">
            No scheduling signals have been recorded yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
