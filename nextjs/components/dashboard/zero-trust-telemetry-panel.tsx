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
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, RefreshCw } from "lucide-react";

export function ZeroTrustTelemetryPanel({
  projectId,
  identities,
  trustPolicies,
  telemetryEnvelopes,
  telemetrySummary,
  locale = "en",
  returnTo,
}: {
  projectId: string;
  identities: any[];
  trustPolicies: any[];
  telemetryEnvelopes: any[];
  telemetrySummary: { total: number; byKind: Array<{ kind: string; count: number }> };
  locale?: string;
  returnTo?: string;
}) {
  const [allowFallback, setAllowFallback] = useState(true);
  const [isRotating, setIsRotating] = useState(false);

  const handleRotateCerts = () => {
    setIsRotating(true);
    setTimeout(() => {
      setIsRotating(false);
      toast.success(
        locale === "vi"
          ? "Đã xoay vòng thông tin xác thực dịch vụ: Chứng chỉ lá x509 đã được cấp lại và phân phối thành công."
          : "Rotated service credentials: x509 leaf certs re-issued and successfully distributed to all workloads."
      );
    }, 600);
  };

  return (
    <Card className="border border-hairline bg-canvas py-0">
      <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-bold text-ink">Zero-Trust & Encrypted Telemetry</CardTitle>
          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider select-none">
            Simulator
          </span>
        </div>
        <CardDescription className="text-xs text-ink-mute">
          {locale === "vi"
            ? "Đăng ký danh tính dịch vụ, thiết lập cặp tin cậy và thu nạp các gói đo lường mã hóa tổng hợp (Chế độ mô phỏng kiểm thử)."
            : "Register service identities, define trust pairs, and ingest aggregate telemetry envelopes (Simulated sandbox environment)."}
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

        {/* Certificate Rotation & mTLS Evidence (Simulated) */}
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-4 space-y-3 font-mono text-[11px] leading-relaxed shadow-inner text-slate-300">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2.5 text-slate-500 text-[10px]">
            <span>{locale === "vi" ? "QUẢN LÝ CHỨNG CHỈ MTLS MÔ PHỎNG" : "SIMULATED MTLS CERTIFICATE INVENTORY"}</span>
            <span className="text-amber-500 font-bold flex items-center gap-1">
              <ShieldCheck className="size-3" /> Sandbox CA Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/60 border border-slate-900 rounded p-2.5">
              <span className="block text-slate-500 text-[9px] uppercase">{locale === "vi" ? "Nhà cung cấp CA" : "Authority"}</span>
              <span className="text-slate-200 font-semibold">LepoS Local Test CA</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-900 rounded p-2.5">
              <span className="block text-slate-500 text-[9px] uppercase">{locale === "vi" ? "Thời hạn Chứng chỉ" : "Validity"}</span>
              <span className="text-emerald-400 font-semibold">364d remaining</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-900 rounded p-2.5">
              <span className="block text-slate-500 text-[9px] uppercase">{locale === "vi" ? "Chu kỳ xoay vòng" : "Rotation Interval"}</span>
              <span className="text-indigo-400 font-semibold">Every 24 Hours</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-900 pt-3">
            <label className="flex items-center gap-2 text-xs text-slate-400 select-none cursor-pointer">
              <input 
                type="checkbox" 
                checked={allowFallback} 
                onChange={(e) => setAllowFallback(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-primary focus:ring-0" 
              />
              <span>{locale === "vi" ? "Cho phép chế độ dự phòng khóa chung (mTLS Fallback)" : "Enable staged fallback to shared-key"}</span>
            </label>

            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleRotateCerts}
              disabled={isRotating}
              className="h-7 text-[10px] border-indigo-500/20 text-indigo-400 hover:text-indigo-300 hover:bg-slate-900 font-bold self-start sm:self-auto px-2 py-0.5 rounded shadow-none"
            >
              <RefreshCw className={`size-3 mr-1 ${isRotating ? "animate-spin" : ""}`} />
              {locale === "vi" ? "Xoay Vòng Chứng Chỉ" : "Rotate Certificates Now"}
            </Button>
          </div>
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
