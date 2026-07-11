import { ConnectedDevicesPanel } from "@/components/dashboard/connected-devices-panel";
import { WafThreatMap } from "@/components/dashboard/waf-threat-map";
import { ZeroTrustTelemetryPanel } from "@/components/dashboard/zero-trust-telemetry-panel";
import { PageHeader } from "@/components/portal/PageHeader";
import { ResourceTable } from "@/components/portal/ResourceTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProjectSecuritySurface({ project, data, locale }: { project: { id: string; name: string }; data: any; locale: string }) {
  const returnTo = `/projects/${project.id}/security`;
  return (
    <div className="space-y-6">
      <PageHeader title="Security" description={`WAF events, trust policies, and connected devices for ${project.name}.`} />
      <WafThreatMap projectId={project.id} events={data.wafEvents || []} rules={data.wafRules || []} returnTo={returnTo} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Security events</CardTitle><CardDescription>Persisted WAF events only.</CardDescription></CardHeader>
          <CardContent><ResourceTable data={data.wafEvents || []} columns={[
            { header: "Fingerprint", accessor: (event: any) => event.fingerprint },
            { header: "Action", accessor: (event: any) => event.action },
            { header: "Reason", accessor: (event: any) => event.reason || "—" },
          ]} /></CardContent>
        </Card>
        <ConnectedDevicesPanel devices={data.connectedDevices || []} locale={locale} />
      </div>
      <ZeroTrustTelemetryPanel projectId={project.id} identities={data.serviceIdentities || []} trustPolicies={data.serviceTrustPolicies || []} telemetryEnvelopes={data.telemetryEnvelopes || []} telemetrySummary={data.telemetrySummary || { total: 0, byKind: [] }} locale={locale} returnTo={returnTo} />
    </div>
  );
}
