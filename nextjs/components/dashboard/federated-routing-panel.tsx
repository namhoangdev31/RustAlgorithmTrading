import { upsertNativeRegionReplicaAction, upsertNativeRoutingPolicyAction } from "@/app/actions/native-platform";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function FederatedRoutingPanel({
  projectId,
  policy,
  replicas,
  deployments,
  locale = "en",
  returnTo,
}: {
  projectId: string;
  policy: any;
  replicas: any[];
  deployments: any[];
  locale?: string;
  returnTo?: string;
}) {
  return (
    <Card className="border border-hairline bg-canvas py-0">
      <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold text-ink">
              {locale === "vi" ? "Định tuyến Liên kết & Bản sao" : "Federated Routing & Replicas"}
            </CardTitle>
            <CardDescription className="text-xs text-ink-mute">
              {locale === "vi"
                ? "Quản lý chính sách định tuyến đa vùng, sức khỏe bản sao, trạng thái drain và dữ liệu sao chép."
                : "Manage multi-region routing policy, replica health, drain state, and replication metadata."}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-full select-none shrink-0 h-5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{locale === "vi" ? "Sao chép: Hoạt động" : "Replication Feed: Active"}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <form action={upsertNativeRoutingPolicyAction} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="projectId" value={projectId} />
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <Input name="strategy" defaultValue={policy?.strategy || "latency"} placeholder="latency" />
          <Input name="consistency" defaultValue={policy?.consistency || "eventual"} placeholder="eventual" />
          <Input
            name="preferredRegions"
            defaultValue={Array.isArray(policy?.preferredRegions) ? policy.preferredRegions.join(", ") : ""}
            placeholder="ap-southeast-1, us-east-1"
          />
          <Input
            name="failoverThresholdMs"
            defaultValue={String(policy?.failoverThresholdMs || 250)}
            placeholder="250"
          />
          <Input
            name="snapshotTtlSeconds"
            defaultValue={String(policy?.snapshotTtlSeconds || 30)}
            placeholder="30"
          />
          <Input
            name="latencyProbeIntervalSeconds"
            defaultValue={String(policy?.latencyProbeIntervalSeconds || 30)}
            placeholder="30"
          />
          <label className="flex items-center gap-2 rounded-md border border-hairline px-3 text-xs text-ink-secondary">
            <input type="checkbox" name="stickySessions" defaultChecked={policy?.stickySessions ?? true} />
            Sticky sessions
          </label>
          <label className="flex items-center gap-2 rounded-md border border-hairline px-3 text-xs text-ink-secondary">
            <input type="checkbox" name="manualFailback" defaultChecked={policy?.manualFailback ?? false} />
            Manual failback
          </label>
          <div className="md:col-span-4">
            <Button type="submit" size="sm">Save Routing Policy</Button>
          </div>
        </form>

        <form action={upsertNativeRegionReplicaAction} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="projectId" value={projectId} />
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <Input name="region" placeholder="ap-southeast-1" />
          <Input name="provider" placeholder="aws" />
          <Input name="endpoint" placeholder="https://edge.example.com" />
          <Input name="latencyMs" placeholder="18" />
          <Input name="storagePath" placeholder="s3://bucket/app" />
          <Input name="bundleUrl" placeholder="https://preview.example.com" />
          <Input name="replicationVersion" placeholder="1.2.3-native.4" />
          <Input name="trafficPercent" placeholder="100" />
          <Input name="drainState" placeholder="accepting" />
          <Input name="healthStatus" placeholder="healthy" />
          <Input name="deploymentId" placeholder={deployments[0]?.id || "deployment id"} />
          <label className="flex items-center gap-2 rounded-md border border-hairline px-3 text-xs text-ink-secondary">
            <input type="checkbox" name="isPrimary" />
            Primary region
          </label>
          <div className="md:col-span-4">
            <Button type="submit" size="sm" variant="outline">Upsert Replica</Button>
          </div>
        </form>

        {replicas.length ? (
          <div className="overflow-x-auto rounded-md border border-hairline">
            <Table>
              <TableHeader>
                <TableRow className="bg-canvas-soft/40">
                  <TableHead>Region</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Drain</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Primary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {replicas.map((replica) => (
                  <TableRow key={replica.id}>
                    <TableCell>{replica.region}</TableCell>
                    <TableCell>{replica.provider}</TableCell>
                    <TableCell><Badge variant={replica.healthStatus === "healthy" ? "default" : "secondary"}>{replica.healthStatus}</Badge></TableCell>
                    <TableCell>{replica.drainState}</TableCell>
                    <TableCell>{replica.latencyMs ? `${replica.latencyMs}ms` : "-"}</TableCell>
                    <TableCell>{replica.isPrimary ? "yes" : "no"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-hairline bg-canvas-soft/30 px-4 py-6 text-xs text-ink-mute">
            No region replicas have been registered yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
