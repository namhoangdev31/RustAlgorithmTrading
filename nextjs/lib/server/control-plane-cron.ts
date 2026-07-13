import { signedGoControlPlaneFetch } from "@/lib/server/go-control-plane";

export const CONTROL_PLANE_CRON_JOBS = [
  { job: "bundle-abuse", label: "Bundle abuse" },
  { job: "retention-calculator", label: "Retention calculator" },
  { job: "ab-experiments", label: "AB experiments" },
  { job: "ranking-calculator", label: "Ranking calculator" },
  { job: "bundle-webhooks", label: "Bundle webhooks" },
  { job: "webhook-retry", label: "Form webhook retry" },
  { job: "ssl-renew", label: "SSL renew" },
  { job: "lepoship-outbox", label: "Outbox" },
  { job: "lepoship-reconcile", label: "Finance reconcile" },
  { job: "cleanup-previews", label: "Preview cleanup" },
  { job: "cleanup-waf-logs", label: "WAF log cleanup" },
  { job: "sync-storage", label: "Storage sync" },
] as const;

export type ControlPlaneCronRun = {
  id: string;
  job: string;
  status: string;
  processed: number;
  skipped: number;
  message: string;
  error?: string;
  startedAt: string;
  finishedAt?: string;
  durationMs: number;
  trigger: string;
};

export type ControlPlaneCronStatus = {
  job: string;
  schedule: string;
  enabled: boolean;
  nextRunAt?: string;
  latestRun?: ControlPlaneCronRun;
};

export type ControlPlaneCronStatusResponse = {
  success: boolean;
  jobs: ControlPlaneCronStatus[];
  recentRuns: ControlPlaneCronRun[];
  error?: string;
};

export async function getControlPlaneCronStatus(userId: string): Promise<ControlPlaneCronStatusResponse> {
  const res = await signedGoControlPlaneFetch("/api/internal/cron/status", {
    method: "GET",
    userId,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      success: false,
      jobs: [],
      recentRuns: [],
      error: data.error || `Go control plane returned ${res.status}`,
    };
  }
  return {
    success: true,
    jobs: Array.isArray(data.jobs) ? data.jobs : [],
    recentRuns: Array.isArray(data.recentRuns) ? data.recentRuns : [],
  };
}
