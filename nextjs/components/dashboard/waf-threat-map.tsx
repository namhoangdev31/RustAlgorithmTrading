import { setNativeWafSensitivityAction } from "@/app/actions/native-platform";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type WafEvent = {
  id: string;
  fingerprint: string;
  ipAddress: string | null;
  action: string;
  reason: string | null;
  metadata?: Record<string, any> | null;
};

type WafRule = {
  id: string;
  name: string;
  action: string;
  type: string;
  pattern: string;
  enabled: boolean;
};

const SENSITIVITY_LEVELS = ["low", "medium", "high", "paranoid"] as const;

function getSensitivity(rules: WafRule[]) {
  const rule = rules.find((item) => item.name === "security-sensitivity" && item.type === "rate-limit");
  if (!rule) {
    return "medium";
  }

  const [, level = "medium"] = rule.pattern.split(":");
  return SENSITIVITY_LEVELS.includes(level as (typeof SENSITIVITY_LEVELS)[number]) ? level : "medium";
}

function getThreatSources(events: WafEvent[]) {
  const buckets = new Map<string, { label: string; count: number; action: string }>();

  for (const event of events) {
    const label =
      (event.metadata && typeof event.metadata.region === "string" && event.metadata.region) ||
      (event.metadata && typeof event.metadata.country === "string" && event.metadata.country) ||
      event.ipAddress ||
      "unknown-source";
    const current = buckets.get(label);
    buckets.set(label, {
      label,
      count: (current?.count || 0) + 1,
      action: event.action,
    });
  }

  return Array.from(buckets.values())
    .sort((left, right) => right.count - left.count)
    .slice(0, 6);
}

export function WafThreatMap({
  projectId,
  events,
  rules,
  returnTo,
}: {
  projectId: string;
  events: WafEvent[];
  rules: WafRule[];
  returnTo?: string;
}) {
  const sensitivity = getSensitivity(rules);
  const sources = getThreatSources(events);

  return (
    <Card className="border border-hairline bg-canvas py-0">
      <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5">
        <CardTitle className="text-base font-bold text-ink">Threat Map & WAF Sensitivity</CardTitle>
        <CardDescription className="text-xs text-ink-mute">
          Visualize recent blocked sources and tune the security posture without editing raw rules.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {SENSITIVITY_LEVELS.map((level) => (
            <form action={setNativeWafSensitivityAction} key={level}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="level" value={level} />
              {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
              <Button
                type="submit"
                size="sm"
                variant={sensitivity === level ? "default" : "outline"}
                className="capitalize"
              >
                {level}
              </Button>
            </form>
          ))}
          <Badge variant="secondary" className="capitalize">
            Active profile: {sensitivity}
          </Badge>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4">
          <div className="relative h-52 overflow-hidden rounded-lg border border-slate-900 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.18),_transparent_55%),linear-gradient(180deg,rgba(15,23,42,1),rgba(2,6,23,1))]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />
            {sources.length ? (
              sources.map((source, index) => {
                const top = 18 + (index % 3) * 28;
                const left = 10 + index * 14;
                return (
                  <div
                    key={source.label}
                    className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                    style={{ left: `${Math.min(left, 86)}%`, top: `${Math.min(top, 82)}%` }}
                  >
                    <span className="relative flex size-4">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
                      <span className="relative inline-flex size-4 rounded-full border border-red-300 bg-red-500" />
                    </span>
                    <span className="rounded bg-slate-950/90 px-2 py-1 text-[10px] font-medium text-slate-200 shadow-lg">
                      {source.label}
                    </span>
                    <span className="text-[9px] text-slate-400">{source.count} events</span>
                  </div>
                );
              })
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                No recent threat events to visualize.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {sources.map((source) => (
            <div key={source.label} className="rounded-lg border border-hairline bg-canvas-soft/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold text-ink">{source.label}</span>
                <Badge variant="outline" className="capitalize">
                  {source.action}
                </Badge>
              </div>
              <p className="mt-2 text-[11px] text-ink-mute">{source.count} threat events captured in the current window.</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
