import {
  ingestNativeTelemetryEnvelopeAction,
  upsertNativeServiceIdentityAction,
  upsertNativeServiceTrustPolicyAction,
} from "@/app/actions/native-platform";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ZeroTrustTelemetryPanel({
  projectId,
  identities,
  trustPolicies,
  telemetryEnvelopes,
  telemetrySummary,
  returnTo,
}: {
  projectId: string;
  identities: any[];
  trustPolicies: any[];
  telemetryEnvelopes: any[];
  telemetrySummary: { total: number; byKind: Array<{ kind: string; count: number }> };
  returnTo?: string;
}) {
  return (
    <Card className="border border-hairline bg-canvas py-0">
      <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5">
        <CardTitle className="text-base font-bold text-ink">Zero-Trust & Encrypted Telemetry</CardTitle>
        <CardDescription className="text-xs text-ink-mute">
          Register service identities, define trust pairs, and ingest aggregate telemetry envelopes without storing raw payloads.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <form action={upsertNativeServiceIdentityAction} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="projectId" value={projectId} />
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <Input name="serviceName" placeholder="edge-gateway" />
          <Input name="role" placeholder="gateway" />
          <Input name="scopes" placeholder="project:read,project:write" />
          <Input name="sharedSecret" placeholder="rotate-me" />
          <Input name="mtlsMode" placeholder="optional" />
          <Input name="certificateFingerprint" placeholder="sha256:..." />
          <Input name="status" placeholder="active" />
          <div className="md:col-span-4">
            <Button type="submit" size="sm">Upsert Service Identity</Button>
          </div>
        </form>

        <form action={upsertNativeServiceTrustPolicyAction} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="projectId" value={projectId} />
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <Input name="sourceService" placeholder="edge-gateway" />
          <Input name="targetService" placeholder="nextjs-control-plane" />
          <Input name="allowedScopes" placeholder="project:read,project:write" />
          <Input name="status" placeholder="active" />
          <label className="flex items-center gap-2 rounded-md border border-hairline px-3 text-xs text-ink-secondary">
            <input type="checkbox" name="enforceMtls" />
            Enforce mTLS
          </label>
          <label className="flex items-center gap-2 rounded-md border border-hairline px-3 text-xs text-ink-secondary">
            <input type="checkbox" name="allowSharedKeyFallback" defaultChecked />
            Shared-key fallback
          </label>
          <div className="md:col-span-4">
            <Button type="submit" size="sm" variant="outline">Save Trust Policy</Button>
          </div>
        </form>

        <form action={ingestNativeTelemetryEnvelopeAction} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="projectId" value={projectId} />
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <Input name="serviceName" placeholder="edge-gateway" />
          <Input name="kind" placeholder="gateway_event" />
          <Input name="encryptionMode" placeholder="aggregate" />
          <Input name="aggregateKey" placeholder="gateway.health" />
          <Input name="summary" placeholder="redis cache warm and healthy" />
          <div className="md:col-span-4">
            <Button type="submit" size="sm" variant="outline">Ingest Telemetry Envelope</Button>
          </div>
        </form>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Envelopes: {telemetrySummary?.total || 0}</Badge>
          {telemetrySummary?.byKind?.map((entry) => (
            <Badge key={entry.kind} variant="outline">{entry.kind}: {entry.count}</Badge>
          ))}
        </div>

        {identities.length ? (
          <div className="overflow-x-auto rounded-md border border-hairline">
            <Table>
              <TableHeader>
                <TableRow className="bg-canvas-soft/40">
                  <TableHead>Service</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>mTLS</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {identities.map((identity) => (
                  <TableRow key={identity.id}>
                    <TableCell>{identity.serviceName}</TableCell>
                    <TableCell>{identity.role}</TableCell>
                    <TableCell>{identity.mtlsMode}</TableCell>
                    <TableCell><Badge variant="secondary">{identity.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}

        {trustPolicies.length ? (
          <div className="overflow-x-auto rounded-md border border-hairline">
            <Table>
              <TableHeader>
                <TableRow className="bg-canvas-soft/40">
                  <TableHead>Source</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>mTLS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trustPolicies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>{policy.sourceService}</TableCell>
                    <TableCell>{policy.targetService}</TableCell>
                    <TableCell className="max-w-[260px] truncate text-xs">{policy.allowedScopes.join(", ")}</TableCell>
                    <TableCell>{policy.enforceMtls ? "required" : "optional"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}

        {telemetryEnvelopes.length ? (
          <div className="overflow-x-auto rounded-md border border-hairline">
            <Table>
              <TableHeader>
                <TableRow className="bg-canvas-soft/40">
                  <TableHead>Kind</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Encryption</TableHead>
                  <TableHead>Aggregate key</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {telemetryEnvelopes.map((envelope) => (
                  <TableRow key={envelope.id}>
                    <TableCell>{envelope.kind}</TableCell>
                    <TableCell>{envelope.serviceName || "-"}</TableCell>
                    <TableCell>{envelope.encryptionMode}</TableCell>
                    <TableCell className="text-xs text-ink-mute">{envelope.aggregateKey || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
