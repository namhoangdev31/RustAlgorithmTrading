import { prisma } from "@/lib/server/prisma";
import { createAiDiagnostic } from "./diagnostics";

export async function aggregateLogContext(projectId: string, timeRange?: { from: Date; to: Date }) {
  const from = timeRange?.from ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  const to = timeRange?.to ?? new Date();

  const crashes = await prisma.nativeCrashReport.findMany({
    where: {
      projectId,
      createdAt: { gte: from, lte: to },
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const deployments = await prisma.nativeDeployment.findMany({
    where: {
      projectId,
      createdAt: { gte: from, lte: to },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  const lines = [
    `=== Project Meta ===`,
    `ID: ${projectId}`,
    `Name: ${project?.name || "Unknown"}`,
    `Description: ${project?.description || "N/A"}`,
    ``,
    `=== Recent Deployments ===`,
  ];

  for (const dep of deployments) {
    lines.push(`- Deployment: ID=${dep.id}, Version=${dep.version}, Status=${dep.status}, CreatedAt=${dep.createdAt.toISOString()}`);
  }

  lines.push(``, `=== Recent Crash Reports ===`);
  for (const crash of crashes) {
    lines.push(`- Crash: ID=${crash.id}, Error=${crash.errorMessage}, Environment=${crash.environment}, Platform=${crash.platform}, Resolved=${crash.isResolved}, Mapped=${!!crash.parsedStack}, CreatedAt=${crash.createdAt.toISOString()}`);
    if (crash.errorStack) {
      lines.push(`  Stack Trace:`);
      lines.push(crash.errorStack.split("\n").slice(0, 3).map(l => `    ${l}`).join("\n"));
    }
  }

  return {
    context: lines.join("\n"),
    crashCount: crashes.length,
    deploymentCount: deployments.length,
  };
}

export async function suggestResourceScaling(projectId: string) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [recentCrashesCount, totalCrashes24h] = await Promise.all([
    prisma.nativeCrashReport.count({
      where: { projectId, createdAt: { gte: oneHourAgo } },
    }),
    prisma.nativeCrashReport.count({
      where: { projectId, createdAt: { gte: oneDayAgo } },
    }),
  ]);

  const recommendations = [];

  if (recentCrashesCount > 10) {
    recommendations.push({
      type: "instances" as const,
      severity: "high" as const,
      description: "Auto-scale instance count or increase replica counts.",
      rationale: `Detected a high frequency of errors (${recentCrashesCount} in the last hour). Scaling up instances will help absorb load and isolate transient crashes.`,
    });
    recommendations.push({
      type: "memory" as const,
      severity: "medium" as const,
      description: "Increase function memory limit to 512MB or 1024MB.",
      rationale: "Rapid crashing can indicate memory leaks under load. Raising limits provides additional buffer.",
    });
  } else if (totalCrashes24h > 50) {
    recommendations.push({
      type: "database" as const,
      severity: "medium" as const,
      description: "Enable connection pooling or upgrade database tier.",
      rationale: `Frequent persistent errors (${totalCrashes24h} in 24 hours) may stress database connection pools, leading to thread exhaustion.`,
    });
  } else {
    recommendations.push({
      type: "memory" as const,
      severity: "low" as const,
      description: "Resource usage and error rate are stable. No scaling is recommended at this time.",
      rationale: "Error frequency is within acceptable thresholds (less than 50 crashes in 24 hours).",
    });
  }

  return { recommendations };
}

export async function generateFixDiff(crashReportId: string) {
  let diagnostic = await prisma.nativeAiDiagnostic.findFirst({
    where: { crashReportId },
    orderBy: { createdAt: "desc" },
  });

  if (!diagnostic) {
    const crash = await prisma.nativeCrashReport.findUnique({
      where: { id: crashReportId },
    });
    if (!crash) {
      throw new Error(`Crash report not found: ${crashReportId}`);
    }
    
    diagnostic = await createAiDiagnostic({
      projectId: crash.projectId,
      crashReportId,
    });
  }

  return {
    crashId: crashReportId,
    diagnosticId: diagnostic.id,
    suggestedDiff: diagnostic.suggestedDiff,
    summary: diagnostic.summary,
  };
}

export async function runFullDiagnostic(projectId: string) {
  const logContext = await aggregateLogContext(projectId);
  const scaling = await suggestResourceScaling(projectId);

  const latestUnresolved = await prisma.nativeCrashReport.findFirst({
    where: { projectId, isResolved: false },
    orderBy: { createdAt: "desc" },
  });

  let latestDiagnostic = null;
  if (latestUnresolved) {
    latestDiagnostic = await generateFixDiff(latestUnresolved.id);
  }

  return {
    projectId,
    logContextSummary: {
      crashCount: logContext.crashCount,
      deploymentCount: logContext.deploymentCount,
    },
    scalingRecommendations: scaling.recommendations,
    latestUnresolvedCrash: latestUnresolved
      ? {
          id: latestUnresolved.id,
          errorMessage: latestUnresolved.errorMessage,
          createdAt: latestUnresolved.createdAt,
        }
      : null,
    aiDiagnostic: latestDiagnostic,
    analyzedAt: new Date().toISOString(),
  };
}

export async function getDiagnosticHistory(projectId: string, options?: { limit?: number; offset?: number }) {
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  const diagnostics = await prisma.nativeAiDiagnostic.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: limit,
    include: {
      crashReport: {
        select: {
          errorMessage: true,
          fingerprint: true,
        },
      },
    },
  });

  return diagnostics;
}

export async function rateDiagnostic(diagnosticId: string, rating: "helpful" | "unhelpful") {
  const diagnostic = await prisma.nativeAiDiagnostic.findUnique({
    where: { id: diagnosticId },
  });

  if (!diagnostic) {
    throw new Error(`Diagnostic not found: ${diagnosticId}`);
  }

  const meta = (diagnostic.metadata as Record<string, any>) || {};
  meta.userRating = rating;

  return prisma.nativeAiDiagnostic.update({
    where: { id: diagnosticId },
    data: {
      metadata: meta,
    },
  });
}
