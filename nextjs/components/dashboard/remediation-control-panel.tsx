import {
  approveNativeRemediationRunAction,
  createNativeRemediationRunAction,
  executeNativeRemediationRunAction,
} from "@/app/actions/native-platform";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/shared/time";

export function RemediationControlPanel({
  projectId,
  locale,
  runs,
  deployments,
  returnTo,
}: {
  projectId: string;
  locale: string;
  runs: any[];
  deployments: any[];
  returnTo?: string;
}) {
  return (
    <Card className="border border-hairline bg-canvas py-0">
      <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5">
        <CardTitle className="text-base font-bold text-ink">Closed-Loop Remediation</CardTitle>
        <CardDescription className="text-xs text-ink-mute">
          Create observe/suggest/auto-apply remediation runs with dry-run, approval, execution, and post-check evidence.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <form action={createNativeRemediationRunAction} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="projectId" value={projectId} />
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <Input name="actionType" placeholder="routing_refresh" />
          <Input name="mode" placeholder="suggest" />
          <Input name="summary" placeholder="Refresh routing snapshot after failover." />
          <Input name="path" placeholder="/api/orders" />
          <Input name="deploymentId" placeholder={deployments[0]?.id || "rollback deployment id"} />
          <Input name="region" placeholder="ap-southeast-1" />
          <Input name="drainState" placeholder="draining" />
          <label className="flex items-center gap-2 rounded-md border border-hairline px-3 text-xs text-ink-secondary">
            <input type="checkbox" name="dryRun" defaultChecked />
            Dry run
          </label>
          <div className="md:col-span-4">
            <Button type="submit" size="sm">Create Remediation Run</Button>
          </div>
        </form>

        {runs.length ? (
          <div className="overflow-x-auto rounded-md border border-hairline">
            <Table>
              <TableHeader>
                <TableRow className="bg-canvas-soft/40">
                  <TableHead>Action</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dry run</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="text-xs">{run.actionType}</TableCell>
                    <TableCell className="text-xs">{run.mode}</TableCell>
                    <TableCell><Badge variant="secondary">{run.status}</Badge></TableCell>
                    <TableCell className="text-xs">{run.dryRun ? "yes" : "no"}</TableCell>
                    <TableCell className="text-xs">{formatRelativeTime(new Date(run.createdAt), locale)}</TableCell>
                    <TableCell className="flex gap-2">
                      {run.status === "suggested" ? (
                        <form action={approveNativeRemediationRunAction}>
                          <input type="hidden" name="projectId" value={projectId} />
                          <input type="hidden" name="runId" value={run.id} />
                          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                          <Button type="submit" size="sm" variant="outline">Approve</Button>
                        </form>
                      ) : null}
                      {run.status === "approved" || run.status === "suggested" ? (
                        <form action={executeNativeRemediationRunAction}>
                          <input type="hidden" name="projectId" value={projectId} />
                          <input type="hidden" name="runId" value={run.id} />
                          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                          <Button type="submit" size="sm">Execute</Button>
                        </form>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-hairline bg-canvas-soft/30 px-4 py-6 text-xs text-ink-mute">
            No remediation runs have been created yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
