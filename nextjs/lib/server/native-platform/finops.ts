import { prisma } from "@/lib/server/prisma";

type SchedulingRecommendation = {
  workloadClass: string;
  delayMs: number;
  priority: number;
  reason: string;
  signalSummary: Record<string, number>;
};

type UpsertSchedulingPolicyInput = {
  projectId: string;
  enabled?: boolean;
  mode?: string;
  costProvider?: string | null;
  carbonProvider?: string | null;
  defaultWorkloadClass?: string;
  deferrableWindowStart?: string | null;
  deferrableWindowEnd?: string | null;
  maxCarbonIntensity?: number | null;
  maxCostScore?: number | null;
};

type RecordSchedulingSignalInput = {
  projectId: string;
  signalType: string;
  source: string;
  region?: string | null;
  value: number;
  unit?: string | null;
  metadata?: unknown;
};

function parseWindow(value: string | null | undefined) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }
  const [hours, minutes] = value.split(":").map((item) => Number(item));
  return { hours, minutes };
}

function getNextWindowDelay(start: string | null | undefined, end: string | null | undefined) {
  const startWindow = parseWindow(start);
  const endWindow = parseWindow(end);
  if (!startWindow || !endWindow) {
    return 0;
  }

  const now = new Date();
  const startAt = new Date(now);
  startAt.setHours(startWindow.hours, startWindow.minutes, 0, 0);
  const endAt = new Date(now);
  endAt.setHours(endWindow.hours, endWindow.minutes, 0, 0);

  if (startAt <= now && now <= endAt) {
    return 0;
  }

  if (now < startAt) {
    return startAt.getTime() - now.getTime();
  }

  startAt.setDate(startAt.getDate() + 1);
  return startAt.getTime() - now.getTime();
}

export async function getSchedulingPolicy(projectId: string) {
  return prisma.nativeSchedulingPolicy.upsert({
    where: { projectId },
    create: {
      projectId,
      enabled: false,
      mode: "observe",
      defaultWorkloadClass: "interactive",
    },
    update: {},
  });
}

export async function upsertSchedulingPolicy(input: UpsertSchedulingPolicyInput) {
  const current = await getSchedulingPolicy(input.projectId);
  return prisma.nativeSchedulingPolicy.update({
    where: { projectId: input.projectId },
    data: {
      enabled: input.enabled ?? current.enabled,
      mode: input.mode || current.mode,
      costProvider: input.costProvider ?? current.costProvider,
      carbonProvider: input.carbonProvider ?? current.carbonProvider,
      defaultWorkloadClass: input.defaultWorkloadClass || current.defaultWorkloadClass,
      deferrableWindowStart: input.deferrableWindowStart ?? current.deferrableWindowStart,
      deferrableWindowEnd: input.deferrableWindowEnd ?? current.deferrableWindowEnd,
      maxCarbonIntensity: input.maxCarbonIntensity ?? current.maxCarbonIntensity,
      maxCostScore: input.maxCostScore ?? current.maxCostScore,
      updatedAt: new Date(),
    },
  });
}

export async function recordSchedulingSignal(input: RecordSchedulingSignalInput) {
  return prisma.nativeSchedulingSignal.create({
    data: {
      projectId: input.projectId,
      signalType: input.signalType,
      source: input.source,
      region: input.region || null,
      value: input.value,
      unit: input.unit || null,
      metadata: (input.metadata || null) as any,
    },
  });
}

export async function listSchedulingSignals(projectId: string) {
  return prisma.nativeSchedulingSignal.findMany({
    where: { projectId },
    orderBy: { sampledAt: "desc" },
    take: 12,
  });
}

export async function getSchedulingRecommendation(projectId: string, workloadClass = "interactive"): Promise<SchedulingRecommendation> {
  const [policy, signals] = await Promise.all([
    getSchedulingPolicy(projectId),
    prisma.nativeSchedulingSignal.findMany({
      where: { projectId },
      orderBy: { sampledAt: "desc" },
      take: 20,
    }),
  ]);

  const latestByType = new Map<string, number>();
  for (const signal of signals) {
    if (!latestByType.has(signal.signalType)) {
      latestByType.set(signal.signalType, signal.value);
    }
  }

  const carbonScore = latestByType.get("carbon_intensity") ?? 0;
  const costScore = latestByType.get("cost_score") ?? 0;
  const queuePressure = latestByType.get("queue_pressure") ?? 0;

  if (!policy.enabled || workloadClass === "interactive" || workloadClass === "latency-sensitive") {
    return {
      workloadClass,
      delayMs: 0,
      priority: 1,
      reason: policy.enabled ? "interactive_bypass" : "policy_disabled",
      signalSummary: {
        carbonScore,
        costScore,
        queuePressure,
      },
    };
  }

  const windowDelay = getNextWindowDelay(policy.deferrableWindowStart, policy.deferrableWindowEnd);
  const carbonExceeded = policy.maxCarbonIntensity !== null && policy.maxCarbonIntensity !== undefined
    ? carbonScore > policy.maxCarbonIntensity
    : false;
  const costExceeded = policy.maxCostScore !== null && policy.maxCostScore !== undefined
    ? costScore > policy.maxCostScore
    : false;

  let delayMs = windowDelay;
  let reason = windowDelay > 0 ? "outside_deferrable_window" : "within_window";

  if (carbonExceeded || costExceeded || queuePressure > 80) {
    delayMs = Math.max(delayMs, 30 * 60 * 1000);
    reason = carbonExceeded
      ? "carbon_budget_exceeded"
      : costExceeded
        ? "cost_budget_exceeded"
        : "queue_pressure_high";
  }

  return {
    workloadClass,
    delayMs,
    priority: delayMs > 0 ? 6 : 3,
    reason,
    signalSummary: {
      carbonScore,
      costScore,
      queuePressure,
    },
  };
}
