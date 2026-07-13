"use server";

import { revalidatePath } from "next/cache";
import { localizedHref, redirect } from "@/i18n/navigation";

import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";
import { finalizeRollout, rollbackRelease } from "@/lib/server/lepoship/release-service";

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function readReturnTo(formData: FormData, fallback: string) {
  return localizedHref(readFormValue(formData, "returnTo") || fallback);
}

function withQueryParam(href: string, key: string, value: string) {
  return `${href}${href.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

function readPercent(formData: FormData) {
  const value = Number(readFormValue(formData, "rolloutPercent"));
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

async function requireEditableBundle(userId: string, projectId: string) {
  const access = await requireProjectRole(userId, projectId, "editor");
  const bundle = access.project.bundle;

  if (!bundle) {
    throw new Error("LepoShip bundle not found.");
  }

  return bundle;
}

async function requireAdminBundle(userId: string, projectId: string) {
  const access = await requireProjectRole(userId, projectId, "admin");
  if (!access.project.bundle) throw new Error("LepoShip bundle not found.");
  return access.project.bundle;
}

export async function saveLepoShipRuntimeConfigAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = await readReturnTo(formData, `/lepoship/${projectId}`);

  if (!projectId) {
    redirect(withQueryParam(returnTo, "lepoship", "missing_project"));
  }

  let bundle: Awaited<ReturnType<typeof requireEditableBundle>>;
  try {
    bundle = await requireEditableBundle(user.id, projectId);
  } catch {
    redirect(withQueryParam(returnTo, "lepoship", "access_denied"));
  }

  await prisma.bundleRuntimeConfig.upsert({
    where: { bundleId: bundle.id },
    create: {
      id: crypto.randomUUID(),
      bundleId: bundle.id,
      minOsVersion: readFormValue(formData, "minOsVersion") || null,
      runtimeType: readFormValue(formData, "runtimeType") || "standard",
      targetPlatforms: readFormValue(formData, "targetPlatforms") || null,
      sdkVersion: readFormValue(formData, "sdkVersion") || null,
      offlineSupported: readFormValue(formData, "offlineSupported") === "on",
      updatedAt: new Date(),
    },
    update: {
      minOsVersion: readFormValue(formData, "minOsVersion") || null,
      runtimeType: readFormValue(formData, "runtimeType") || "standard",
      targetPlatforms: readFormValue(formData, "targetPlatforms") || null,
      sdkVersion: readFormValue(formData, "sdkVersion") || null,
      offlineSupported: readFormValue(formData, "offlineSupported") === "on",
      updatedAt: new Date(),
    },
  });
  const configKey = readFormValue(formData, "configKey");
  const configValue = readFormValue(formData, "configValue");
  const configTrack = readFormValue(formData, "configTrack") || "global";
  if (configKey) {
    if (configTrack !== "global" && !configTrack.startsWith("channel:") && !configTrack.startsWith("release:")) {
      throw new Error("Runtime config scope must be global, channel:<name>, or release:<id>.");
    }
    let value: unknown = configValue;
    try { value = JSON.parse(configValue); } catch {}
    const selector = { bundleId: bundle.id, environment: "production", track: configTrack, configKey };
    const existing = await prisma.bundleRuntimeConfigEntries.findUnique({
      where: { bundleId_environment_track_configKey: selector },
      select: { revision: true },
    });
    await prisma.bundleRuntimeConfigEntries.upsert({
      where: { bundleId_environment_track_configKey: selector },
      create: { id: crypto.randomUUID(), ...selector, value: value as never, revision: 1, createdAt: new Date(), updatedAt: new Date() },
      update: { value: value as never, revision: (existing?.revision || 0) + 1, updatedAt: new Date() },
    });
  }

  revalidatePath(`/lepoship/${projectId}`);
  redirect(withQueryParam(returnTo, "lepoship", "runtime_saved"));
}

export async function updateLepoShipRolloutAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const trackId = readFormValue(formData, "trackId");
  const targetCountry = readFormValue(formData, "targetCountry") || null;
  const targetLocale = readFormValue(formData, "targetLocale") || null;
  const targetPlatform = readFormValue(formData, "targetPlatform") || null;
  const returnTo = await readReturnTo(formData, `/lepoship/${projectId}`);

  if (!projectId || !trackId) {
    redirect(withQueryParam(returnTo, "lepoship", "missing_rollout"));
  }

  let bundle: Awaited<ReturnType<typeof requireEditableBundle>>;
  try {
    bundle = await requireEditableBundle(user.id, projectId);
  } catch {
    redirect(withQueryParam(returnTo, "lepoship", "access_denied"));
  }

  const track = await prisma.bundleReleases.findFirst({
    where: { id: trackId, bundleId: bundle.id, status: "approved" },
    select: { id: true, channelId: true },
  });

  if (!track) {
    redirect(withQueryParam(returnTo, "lepoship", "track_not_found"));
  }

  const existing = await prisma.bundleDeliveryRollouts.findFirst({
    where: {
      bundleId: bundle.id,
      candidateReleaseId: trackId,
    },
    select: { id: true },
  });
  const rolloutPercent = readPercent(formData);
  const now = new Date();

  if (rolloutPercent > 0) {
    const activeExperiment = await prisma.bundles.findUnique({
      where: { id: bundle.id },
      select: { activeDeliveryMode: true, activeAbTestId: true, activeRolloutId: true, channels: { where: { id: track.channelId }, select: { currentReleaseId: true }, take: 1 } },
    });
    if (activeExperiment?.activeDeliveryMode === "experiment" || activeExperiment?.activeAbTestId) {
      redirect(withQueryParam(returnTo, "lepoship", "rollout_conflicts_with_ab_test"));
    }
    if (!activeExperiment?.channels[0]?.currentReleaseId) redirect(withQueryParam(returnTo, "lepoship", "primary_unavailable"));
  }

  const savedRollout = await prisma.$transaction(async (tx) => {
    const currentBundle = await tx.bundles.findUnique({
      where: { id: bundle.id },
      include: { channels: { where: { id: track.channelId }, take: 1 } },
    });
    if (!currentBundle?.channels[0]?.currentReleaseId) throw new Error("primary_unavailable");
    if (currentBundle.activeDeliveryMode === "experiment") throw new Error("rollout_conflicts_with_ab_test");
    const rollout = existing
      ? await tx.bundleDeliveryRollouts.update({
          where: { id: existing.id },
          data: {
            percentage: rolloutPercent,
            status: rolloutPercent <= 0 ? "paused" : rolloutPercent >= 100 ? "completed" : "running",
            pausedAt: rolloutPercent <= 0 ? now : null,
            completedAt: rolloutPercent >= 100 ? now : null,
            targeting: { targetCountry, targetLocale, targetPlatform },
            updatedAt: now,
          },
        })
      : await tx.bundleDeliveryRollouts.create({
          data: {
            id: crypto.randomUUID(), bundleId: bundle.id, channelId: track.channelId,
            baselineReleaseId: currentBundle.channels[0].currentReleaseId!, candidateReleaseId: track.id,
            percentage: rolloutPercent,
            status: rolloutPercent <= 0 ? "paused" : rolloutPercent >= 100 ? "completed" : "running",
            targeting: { targetCountry, targetLocale, targetPlatform }, startedAt: now,
            pausedAt: rolloutPercent <= 0 ? now : null, completedAt: rolloutPercent >= 100 ? now : null,
            createdAt: now, updatedAt: now,
          },
        });
    await tx.bundles.update({
      where: { id: bundle.id },
      data: rolloutPercent > 0 && rolloutPercent < 100
        ? { activeRolloutId: rollout.id, activeAbTestId: null, activeDeliveryMode: "rollout" }
        : { activeRolloutId: null, activeDeliveryMode: "none" },
    });
    return rollout;
  }, { isolationLevel: "Serializable" });
  if (rolloutPercent >= 100) {
    await finalizeRollout({ rolloutId: savedRollout.id, actorId: user.id, reason: "Rollout reached 100%." });
  }

  revalidatePath(`/lepoship/${projectId}`);
  redirect(withQueryParam(returnTo, "lepoship", "rollout_updated"));
}

export async function rollbackLepoShipTrackAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const trackId = readFormValue(formData, "trackId");
  const returnTo = await readReturnTo(formData, `/lepoship/${projectId}`);

  if (!projectId || !trackId) {
    redirect(withQueryParam(returnTo, "lepoship", "missing_track"));
  }

  let bundle: Awaited<ReturnType<typeof requireEditableBundle>>;
  try {
    bundle = await requireAdminBundle(user.id, projectId);
  } catch {
    redirect(withQueryParam(returnTo, "lepoship", "access_denied"));
  }

  const failedRelease = await prisma.bundleReleases.findFirst({ where: { id: trackId, bundleId: bundle.id, status: "active" } });
  if (!failedRelease) redirect(withQueryParam(returnTo, "lepoship", "fallback_unavailable"));
  await rollbackRelease({ bundleId: bundle.id, channel: "production", actorId: user.id, reason: readFormValue(formData, "reason") || "Manual rollback" });

  revalidatePath(`/lepoship/${projectId}`);
  redirect(withQueryParam(returnTo, "lepoship", "track_rolled_back"));
}

export async function createLepoShipUpdatePhaseAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const trackId = readFormValue(formData, "trackId");
  const returnTo = await readReturnTo(formData, `/lepoship/${projectId}`);

  if (!projectId || !trackId) {
    redirect(withQueryParam(returnTo, "lepoship", "missing_phase"));
  }

  let bundle: Awaited<ReturnType<typeof requireEditableBundle>>;
  try {
    bundle = await requireEditableBundle(user.id, projectId);
  } catch {
    redirect(withQueryParam(returnTo, "lepoship", "access_denied"));
  }

  const track = await prisma.bundleReleaseTracks.findFirst({
    where: { id: trackId, bundleId: bundle.id },
    select: {
      version: true,
      buildNumber: true,
      storagePath: true,
      releaseNotes: true,
    },
  });

  if (!track) {
    redirect(withQueryParam(returnTo, "lepoship", "track_not_found"));
  }

  const now = new Date();
  const version = await prisma.bundleVersionHistory.upsert({
    where: {
      bundleId_version_buildNumber: {
        bundleId: bundle.id,
        version: track.version,
        buildNumber: track.buildNumber,
      },
    },
    create: {
      id: crypto.randomUUID(),
      bundleId: bundle.id,
      version: track.version,
      buildNumber: track.buildNumber,
      storagePath: track.storagePath,
      changelog: track.releaseNotes,
      status: "published",
      publishedAt: now,
      createdAt: now,
    },
    update: {
      storagePath: track.storagePath,
      changelog: track.releaseNotes,
      status: "published",
      publishedAt: now,
    },
    select: { id: true },
  });

  await prisma.bundleUpdatePhases.create({
    data: {
      id: crypto.randomUUID(),
      bundleId: bundle.id,
      versionId: version.id,
      phaseOrder: Number(readFormValue(formData, "phaseOrder")) || 1,
      percentage: readPercent(formData),
      targetCountry: readFormValue(formData, "targetCountry") || null,
      status: "pending",
      createdAt: now,
    },
  });

  revalidatePath(`/lepoship/${projectId}`);
  redirect(withQueryParam(returnTo, "lepoship", "phase_created"));
}
