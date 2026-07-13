"use server";

import { revalidatePath } from "next/cache";
import { localizedHref, redirect } from "@/i18n/navigation";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";
import { syncProjectFeatureFlags } from "@/lib/server/feature-flags";
import { calculateRequiredSamplePerVariant } from "@/lib/ab-testing/statistics";
import { estimateBaselineConversionRate } from "@/lib/server/ab-testing/baseline";
import { finalizeExperiment } from "@/lib/server/lepoship/release-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function withQueryParam(href: string, key: string, value: string) {
  return `${href}${href.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

async function requireEditableBundle(userId: string, projectId: string) {
  const access = await requireProjectRole(userId, projectId, "editor");
  const bundle = access.project.bundle;
  if (!bundle) throw new Error("LepoShip bundle not found.");
  return bundle;
}

async function requireAdminBundle(userId: string, projectId: string) {
  const access = await requireProjectRole(userId, projectId, "admin");
  const bundle = access.project.bundle;
  if (!bundle) throw new Error("LepoShip bundle not found.");
  return bundle;
}

function readList(formData: FormData, key: string) {
  return readFormValue(formData, key).split(",").map((value) => value.trim()).filter(Boolean);
}

function readOsTargeting(formData: FormData) {
  const ios = { min: readFormValue(formData, "minIosVersion") || undefined, max: readFormValue(formData, "maxIosVersion") || undefined };
  const android = { min: readFormValue(formData, "minAndroidVersion") || undefined, max: readFormValue(formData, "maxAndroidVersion") || undefined };
  return {
    ...(ios.min || ios.max ? { ios } : {}),
    ...(android.min || android.max ? { android } : {}),
  };
}

// ---------------------------------------------------------------------------
// Create A/B Test
// ---------------------------------------------------------------------------

export async function createAbTestAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = readFormValue(formData, "returnTo") || `/lepoship/${projectId}/ab-tests`;

  if (!projectId) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "missing_project"));
  }

  let bundle: Awaited<ReturnType<typeof requireEditableBundle>>;
  try {
    bundle = await requireEditableBundle(user.id, projectId);
  } catch {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "access_denied"));
  }

  const testName = readFormValue(formData, "testName");
  const hypothesis = readFormValue(formData, "hypothesis") || null;
  const metricType = readFormValue(formData, "metricType") || "install_event";
  const metricEventName = readFormValue(formData, "metricEventName") || null;
  const trafficSplitRaw = readFormValue(formData, "trafficSplit");
  const trafficSplit = trafficSplitRaw === ""
    ? 50
    : Number(trafficSplitRaw);
  const targetBuildNumberRaw = readFormValue(formData, "targetBuildNumber");
  const targetBuildNumber = Number(targetBuildNumberRaw);

  if (!testName) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "missing_name"));
  }
  if (!["install_event", "analytics_event", "retention_d1", "retention_d7"].includes(metricType) || (metricType === "analytics_event" && !metricEventName)) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "invalid_metric"));
  }

  if (!Number.isInteger(trafficSplit) || trafficSplit < 0 || trafficSplit > 100) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "invalid_traffic_split"));
  }

  // Validate target build number exists in an active release track.
  if (!Number.isInteger(targetBuildNumber) || targetBuildNumber < 1) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "missing_target_build"));
  }

  const track = await prisma.bundleReleases.findFirst({
      where: {
        bundleId: bundle.id,
        buildNumber: targetBuildNumber,
        status: { in: ["approved", "active"] },
      },
      select: { id: true },
    });
  if (!track) {
      const target = await localizedHref(returnTo);
      redirect(withQueryParam(target, "ab", "invalid_target_build"));
  }

  // variantA = current/control, variantB stores the target build number
  const variantAConfig = JSON.stringify({ type: "control", description: "Current latest release" });
  const variantBConfig = JSON.stringify({ type: "experiment", targetBuildNumber });

  await prisma.bundleAbTests.create({
    data: {
      id: crypto.randomUUID(),
      bundleId: bundle.id,
      testName,
      hypothesis,
      variantAConfig,
      variantBConfig,
      metric: metricType === "analytics_event" ? metricEventName || "analytics_event" : metricType,
      metricType,
      metricEventName,
      conversionWindowHours: Math.max(1, Math.min(720, Number(readFormValue(formData, "conversionWindowHours") || 24))),
      targetCountries: readList(formData, "targetCountries").map((value) => value.toUpperCase()),
      targetLocales: readList(formData, "targetLocales").map((value) => value.toLowerCase()),
      targetPlatforms: readList(formData, "targetPlatforms").map((value) => value.toLowerCase()),
      targetOsVersions: readOsTargeting(formData),
      treatmentReleaseId: track.id,
      trafficSplit,
      status: "draft",
      createdAt: new Date(),
    },
  });

  revalidatePath(`/lepoship/${projectId}/ab-tests`);
  const target = await localizedHref(returnTo);
  redirect(withQueryParam(target, "ab", "created"));
}

// ---------------------------------------------------------------------------
// Update A/B Test (draft only)
// ---------------------------------------------------------------------------

export async function updateAbTestAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const testId = readFormValue(formData, "testId");
  const returnTo = readFormValue(formData, "returnTo") || `/lepoship/${projectId}/ab-tests`;

  if (!projectId || !testId) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "missing_params"));
  }

  let bundle: Awaited<ReturnType<typeof requireEditableBundle>>;
  try {
    bundle = await requireEditableBundle(user.id, projectId);
  } catch {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "access_denied"));
  }

  const test = await prisma.bundleAbTests.findFirst({
    where: { id: testId, bundleId: bundle.id },
    select: { id: true, status: true },
  });

  if (!test) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "not_found"));
  }
  if (test.status !== "draft") {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "cannot_edit_running"));
  }

  const testName = readFormValue(formData, "testName") || undefined;
  const hypothesis = readFormValue(formData, "hypothesis") || undefined;
  const metric = readFormValue(formData, "metric") || undefined;
  const trafficSplitRaw = readFormValue(formData, "trafficSplit");
  const trafficSplit = trafficSplitRaw ? Number(trafficSplitRaw) : undefined;
  const targetBuildNumberRaw = readFormValue(formData, "targetBuildNumber");
  const targetBuildNumber = targetBuildNumberRaw ? Number(targetBuildNumberRaw) : undefined;

  if (trafficSplit !== undefined && (!Number.isInteger(trafficSplit) || trafficSplit < 0 || trafficSplit > 100)) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "invalid_traffic_split"));
  }

  const data: Record<string, unknown> = {};
  if (testName !== undefined) data.testName = testName;
  if (hypothesis !== undefined) data.hypothesis = hypothesis;
  if (metric !== undefined) data.metric = metric;
  if (trafficSplit !== undefined) data.trafficSplit = trafficSplit;
  if (targetBuildNumber !== undefined) {
    // Validate new target
    const track = await prisma.bundleReleases.findFirst({
      where: { bundleId: bundle.id, buildNumber: targetBuildNumber, status: { in: ["approved", "active"] } },
      select: { id: true },
    });
    if (!track) {
      const target = await localizedHref(returnTo);
      redirect(withQueryParam(target, "ab", "invalid_target_build"));
    }
    data.variantBConfig = JSON.stringify({ type: "experiment", targetBuildNumber });
    data.treatmentReleaseId = track.id;
  }

  if (Object.keys(data).length > 0) {
    await prisma.bundleAbTests.update({
      where: { id: testId },
      data,
    });
  }

  revalidatePath(`/lepoship/${projectId}/ab-tests`);
  const target = await localizedHref(returnTo);
  redirect(withQueryParam(target, "ab", "updated"));
}

// ---------------------------------------------------------------------------
// Start A/B Test
// ---------------------------------------------------------------------------

export async function startAbTestAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const testId = readFormValue(formData, "testId");
  const returnTo = readFormValue(formData, "returnTo") || `/lepoship/${projectId}/ab-tests`;

  if (!projectId || !testId) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "missing_params"));
  }

  let bundle: Awaited<ReturnType<typeof requireAdminBundle>>;
  try {
    bundle = await requireAdminBundle(user.id, projectId);
  } catch {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "access_denied"));
  }

  const test = await prisma.bundleAbTests.findFirst({
    where: { id: testId, bundleId: bundle.id },
    select: { id: true, status: true, variantBConfig: true, treatmentReleaseId: true, metricType: true, metricEventName: true, _count: { select: { exposures: true } } },
  });

  if (!test || !["draft", "paused_guardrail"].includes(test.status) || (test.status === "paused_guardrail" && test._count.exposures > 0)) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "cannot_start"));
  }

  const baseline = await estimateBaselineConversionRate(bundle.id, test.metricType, test.metricEventName);
  const requiredSample = calculateRequiredSamplePerVariant(baseline, 0.1, 0.9, 0.8);
  try {
    await prisma.$transaction(async (tx) => {
      const liveBundle = await tx.bundles.findUnique({
        where: { id: bundle.id },
        include: { channels: { where: { name: "production" }, include: { currentRelease: true }, take: 1 } },
      });
      if (!liveBundle || liveBundle.activeDeliveryMode !== "none" || liveBundle.activeAbTestId || liveBundle.activeRolloutId) throw new Error("already_running");
      const freshTest = await tx.bundleAbTests.findFirst({
        where: { id: testId, bundleId: bundle.id, status: { in: ["draft", "paused_guardrail"] } },
        include: { treatmentRelease: true, _count: { select: { exposures: true } } },
      });
      if (!freshTest || (freshTest.status === "paused_guardrail" && freshTest._count.exposures > 0)) throw new Error("cannot_start");
      let treatment = freshTest.treatmentRelease;
      if (!treatment) {
        const legacyBuild = Number(JSON.parse(freshTest.variantBConfig).targetBuildNumber);
        treatment = await tx.bundleReleases.findFirst({ where: { bundleId: bundle.id, buildNumber: legacyBuild, status: { in: ["approved", "active"] } } });
      }
      const control = liveBundle.channels[0]?.currentRelease;
      if (!control) throw new Error("primary_unavailable");
      if (!treatment || !["approved", "active"].includes(treatment.status)) throw new Error("target_unavailable");
      if (control.id === treatment.id) throw new Error("same_variants");
      if (treatment.buildNumber <= control.buildNumber) throw new Error("treatment_must_be_newer");
      await tx.bundleAbTests.update({
        where: { id: testId },
        data: {
          status: "running",
          analysisStatus: "collecting",
          controlReleaseId: control.id,
          treatmentReleaseId: treatment.id,
          baselineConversionRate: baseline,
          minimumSamplePerVariant: requiredSample,
          startedAt: new Date(),
          pausedAt: null,
          pauseReason: null,
        },
      });
      await tx.bundles.update({
        where: { id: bundle.id },
        data: { activeAbTestId: testId, activeRolloutId: null, activeDeliveryMode: "experiment" },
      });
    }, { isolationLevel: "Serializable" });
  } catch (error: any) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", error.message || "cannot_start"));
  }

  // Sync flags to edge providers
  await syncProjectFeatureFlags(projectId);

  revalidatePath(`/lepoship/${projectId}/ab-tests`);
  const target = await localizedHref(returnTo);
  redirect(withQueryParam(target, "ab", "started"));
}

// ---------------------------------------------------------------------------
// Pause A/B Test
// ---------------------------------------------------------------------------

export async function pauseAbTestAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const testId = readFormValue(formData, "testId");
  const pauseReason = readFormValue(formData, "pauseReason") || "Paused manually by administrator.";
  const returnTo = readFormValue(formData, "returnTo") || `/lepoship/${projectId}/ab-tests/${testId}`;
  if (!projectId || !testId) redirect(withQueryParam(await localizedHref(returnTo), "ab", "missing_params"));

  let bundle: Awaited<ReturnType<typeof requireAdminBundle>>;
  try {
    bundle = await requireAdminBundle(user.id, projectId);
  } catch {
    redirect(withQueryParam(await localizedHref(returnTo), "ab", "access_denied"));
  }
  const test = await prisma.bundleAbTests.findFirst({
    where: { id: testId, bundleId: bundle.id, status: "running" },
    select: { id: true, controlReleaseId: true },
  });
  if (!test?.controlReleaseId) redirect(withQueryParam(await localizedHref(returnTo), "ab", "not_running"));

  await prisma.$transaction(async (tx) => {
    await tx.bundleAbTests.update({
      where: { id: test.id },
      data: { status: "paused_guardrail", pausedAt: new Date(), pauseReason, pausedById: user.id, recommendedWinner: "A" },
    });
  }, { isolationLevel: "Serializable" });
  await syncProjectFeatureFlags(projectId);
  revalidatePath(`/lepoship/${projectId}/ab-tests/${testId}`);
  redirect(withQueryParam(await localizedHref(returnTo), "ab", "paused"));
}

// ---------------------------------------------------------------------------
// End A/B Test
// ---------------------------------------------------------------------------

export async function endAbTestAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const testId = readFormValue(formData, "testId");
  const winnerVariant = readFormValue(formData, "winnerVariant");
  const endReason = readFormValue(formData, "endReason") || null;
  const returnTo = readFormValue(formData, "returnTo") || `/lepoship/${projectId}/ab-tests`;

  if (!projectId || !testId || !["A", "B"].includes(winnerVariant)) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "missing_params"));
  }

  let bundle: Awaited<ReturnType<typeof requireAdminBundle>>;
  try {
    bundle = await requireAdminBundle(user.id, projectId);
  } catch {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "access_denied"));
  }

  const test = await prisma.bundleAbTests.findFirst({
    where: { id: testId, bundleId: bundle.id, status: { in: ["running", "paused_guardrail"] } },
    include: { controlRelease: true, treatmentRelease: true },
  });

  if (!test) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "not_running"));
  }

  if (!test.controlRelease || !test.treatmentRelease || (winnerVariant === "B" && (test.analysisStatus !== "conclusive" || test.recommendedWinner !== "B"))) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "winner_not_allowed"));
  }

  await finalizeExperiment({
    testId,
    winnerVariant: winnerVariant as "A" | "B",
    actorId: user.id,
    reason: endReason || "Experiment ended by administrator.",
  });

  // Re-sync flags (removes ended test from active set)
  await syncProjectFeatureFlags(projectId);

  revalidatePath(`/lepoship/${projectId}/ab-tests`);
  const target = await localizedHref(returnTo);
  redirect(withQueryParam(target, "ab", "ended"));
}

// ---------------------------------------------------------------------------
// Delete A/B Test (draft only)
// ---------------------------------------------------------------------------

export async function deleteAbTestAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const testId = readFormValue(formData, "testId");
  const returnTo = readFormValue(formData, "returnTo") || `/lepoship/${projectId}/ab-tests`;

  if (!projectId || !testId) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "missing_params"));
  }

  try {
    await requireEditableBundle(user.id, projectId);
  } catch {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "access_denied"));
  }

  const test = await prisma.bundleAbTests.findFirst({
    where: { id: testId, status: "draft" },
    select: { id: true },
  });

  if (!test) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "cannot_delete"));
  }

  await prisma.bundleAbTests.delete({ where: { id: testId } });

  revalidatePath(`/lepoship/${projectId}/ab-tests`);
  const target = await localizedHref(returnTo);
  redirect(withQueryParam(target, "ab", "deleted"));
}
