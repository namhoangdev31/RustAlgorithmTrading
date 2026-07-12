"use server";

import { revalidatePath } from "next/cache";
import { localizedHref, redirect } from "@/i18n/navigation";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";
import { syncProjectFeatureFlags } from "@/lib/server/feature-flags";

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
  const metric = readFormValue(formData, "metric") || "retention";
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

  if (!Number.isInteger(trafficSplit) || trafficSplit < 0 || trafficSplit > 100) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "invalid_traffic_split"));
  }

  // Validate target build number exists in an active release track.
  if (!Number.isInteger(targetBuildNumber) || targetBuildNumber < 1) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "missing_target_build"));
  }

  {
    const track = await prisma.bundleReleaseTracks.findFirst({
      where: {
        bundleId: bundle.id,
        buildNumber: targetBuildNumber,
        status: "active",
      },
      select: { id: true },
    });
    if (!track) {
      const target = await localizedHref(returnTo);
      redirect(withQueryParam(target, "ab", "invalid_target_build"));
    }
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
      metric,
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
    const track = await prisma.bundleReleaseTracks.findFirst({
      where: { bundleId: bundle.id, buildNumber: targetBuildNumber, status: "active" },
      select: { id: true },
    });
    if (!track) {
      const target = await localizedHref(returnTo);
      redirect(withQueryParam(target, "ab", "invalid_target_build"));
    }
    data.variantBConfig = JSON.stringify({ type: "experiment", targetBuildNumber });
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

  let bundle: Awaited<ReturnType<typeof requireEditableBundle>>;
  try {
    bundle = await requireEditableBundle(user.id, projectId);
  } catch {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "access_denied"));
  }

  const test = await prisma.bundleAbTests.findFirst({
    where: { id: testId, bundleId: bundle.id },
    select: { id: true, status: true, variantBConfig: true },
  });

  if (!test || test.status !== "draft") {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "cannot_start"));
  }

  // Enforce single running test per bundle
  const runningTest = await prisma.bundleAbTests.findFirst({
    where: { bundleId: bundle.id, status: "running" },
    select: { id: true },
  });
  if (runningTest) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "already_running"));
  }

  // Validate target build is still available
  try {
    const config = JSON.parse(test.variantBConfig);
    if (config.targetBuildNumber) {
      const track = await prisma.bundleReleaseTracks.findFirst({
        where: { bundleId: bundle.id, buildNumber: config.targetBuildNumber, status: "active" },
        select: { id: true },
      });
      if (!track) {
        const target = await localizedHref(returnTo);
        redirect(withQueryParam(target, "ab", "target_unavailable"));
      }
    }
  } catch {
    // Non-critical: proceed without target validation if config parse fails
  }

  await prisma.bundleAbTests.update({
    where: { id: testId },
    data: { status: "running", startedAt: new Date() },
  });

  // Sync flags to edge providers
  await syncProjectFeatureFlags(projectId);

  revalidatePath(`/lepoship/${projectId}/ab-tests`);
  const target = await localizedHref(returnTo);
  redirect(withQueryParam(target, "ab", "started"));
}

// ---------------------------------------------------------------------------
// End A/B Test
// ---------------------------------------------------------------------------

export async function endAbTestAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const testId = readFormValue(formData, "testId");
  const winnerVariant = readFormValue(formData, "winnerVariant") || null;
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
    where: { id: testId, bundleId: bundle.id, status: "running" },
    select: { id: true },
  });

  if (!test) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "ab", "not_running"));
  }

  await prisma.bundleAbTests.update({
    where: { id: testId },
    data: {
      status: "ended",
      endedAt: new Date(),
      winnerVariant,
    },
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
