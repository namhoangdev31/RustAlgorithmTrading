import { PageHeader } from "@/components/portal/PageHeader";
import { RiskLimitsForm, type RiskLimitsValue } from "@/components/portal/RiskLimitsForm";
import { UnavailableState } from "@/components/portal/UnavailableState";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/server/prisma";

function mapLimits(payload: Record<string, unknown>): RiskLimitsValue {
  return {
    maxShares: Number(payload.max_shares),
    maxNotionalPerPosition: Number(payload.max_notional_per_position),
    maxTotalExposure: Number(payload.max_total_exposure),
    maxOpenPositions: Number(payload.max_open_positions),
    defaultStopLossPercent: Number(payload.default_stop_loss_percent),
    trailingStopPercent: Number(payload.trailing_stop_percent),
    circuitBreakerEnabled: payload.circuit_breaker_enabled === true,
    dailyLossThreshold: Number(payload.daily_loss_threshold),
    maxDailyLoss: Number(payload.max_daily_loss),
    maxWeeklyLoss: Number(payload.max_weekly_loss),
    maxMonthlyLoss: Number(payload.max_monthly_loss),
    enforceMarketHours: payload.enforce_market_hours === true,
    maxPositionCorrelation: Number(payload.max_position_correlation),
    enforceCorrelationCheck: payload.enforce_correlation_check === true,
  };
}

export default async function RiskLimitsPage() {
  const controlPlaneUrl = process.env.GO_CONTROL_PLANE_URL;
  const apiKey = process.env.TELEMETRY_API_KEY || process.env.LEPOS_INTERNAL_API_KEY;
  let initialValue: RiskLimitsValue | null = null;
  let providerError: string | null = null;

  if (!controlPlaneUrl || !apiKey) {
    providerError = "The Go control plane URL or internal API credential is not configured.";
  } else {
    try {
      const response = await fetch(`${controlPlaneUrl}/api/system/risk-limits`, {
        headers: { "x-api-key": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error(`Go control plane returned HTTP ${response.status}.`);
      initialValue = mapLimits(await response.json());
    } catch (error) {
      providerError = error instanceof Error ? error.message : "Risk control plane unavailable.";
    }
  }

  const auditEvents = await prisma.riskEvent.findMany({
    where: { eventType: "CONFIG_CHANGE" },
    orderBy: { occurredAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Risk Limits" description="Administrative safeguards enforced by the trading control plane." />
      {initialValue ? (
        <RiskLimitsForm initialValue={initialValue} />
      ) : (
        <UnavailableState title="Risk control plane unavailable" description={providerError || "Current risk limits could not be loaded."} providerName="Go control plane" />
      )}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent policy changes</CardTitle><CardDescription>Persisted risk events generated after accepted control-plane updates.</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {auditEvents.length === 0 ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No risk policy changes recorded.</div> : auditEvents.map((event) => (
            <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div><p className="text-sm font-medium">{event.message}</p><p className="text-xs text-muted-foreground">{event.occurredAt.toLocaleString()}</p></div>
              <StatusBadge status={event.severity === "ERROR" ? "error" : "info"} label={event.severity} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
