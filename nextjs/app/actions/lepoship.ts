"use server";

import { revalidatePath } from "next/cache";
import { localizedHref, redirect } from "@/i18n/navigation";

import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";

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

  revalidatePath(`/lepoship/${projectId}`);
  redirect(withQueryParam(returnTo, "lepoship", "runtime_saved"));
}

export async function updateLepoShipRolloutAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const trackId = readFormValue(formData, "trackId");
  const targetCountry = readFormValue(formData, "targetCountry") || null;
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

  const track = await prisma.bundleReleaseTracks.findFirst({
    where: { id: trackId, bundleId: bundle.id },
    select: { id: true },
  });

  if (!track) {
    redirect(withQueryParam(returnTo, "lepoship", "track_not_found"));
  }

  const existing = await prisma.bundleRollouts.findFirst({
    where: {
      bundleId: bundle.id,
      trackId,
      targetCountry,
    },
    select: { id: true },
  });
  const rolloutPercent = readPercent(formData);
  const now = new Date();

  if (existing) {
    await prisma.bundleRollouts.update({
      where: { id: existing.id },
      data: {
        rolloutPercent,
        completedAt: rolloutPercent >= 100 ? now : null,
      },
    });
  } else {
    await prisma.bundleRollouts.create({
      data: {
        id: crypto.randomUUID(),
        bundleId: bundle.id,
        trackId,
        rolloutPercent,
        targetCountry,
        startedAt: now,
        completedAt: rolloutPercent >= 100 ? now : null,
        createdAt: now,
      },
    });
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
    bundle = await requireEditableBundle(user.id, projectId);
  } catch {
    redirect(withQueryParam(returnTo, "lepoship", "access_denied"));
  }

  const fallbackTrack = await prisma.bundleReleaseTracks.findFirst({
    where: {
      bundleId: bundle.id,
      id: { not: trackId },
      status: "active",
      storagePath: { not: "" },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      version: true,
      buildNumber: true,
      storagePath: true,
    },
  });

  await prisma.$transaction([
    prisma.bundleReleaseTracks.updateMany({
      where: { id: trackId, bundleId: bundle.id },
      data: { status: "rolled_back" },
    }),
    ...(fallbackTrack
      ? [
          prisma.bundles.update({
            where: { id: bundle.id },
            data: {
              version: fallbackTrack.version,
              buildNumber: fallbackTrack.buildNumber,
              storagePath: fallbackTrack.storagePath,
              status: "published",
              updatedAt: new Date(),
            },
          }),
        ]
      : []),
  ]);

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
