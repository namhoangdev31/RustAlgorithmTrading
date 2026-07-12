"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";

async function requireBundleOwner(userId: string, projectId: string) {
  // Require at least 'editor' role to configure ads
  const access = await requireProjectRole(userId, projectId, "editor");
  const bundle = access.project.bundle;
  if (!bundle) throw new Error("LepoShip bundle not found.");
  return bundle;
}

export async function upsertAdConfigAction(projectId: string, data: {
  provider: string;
  appId: string;
  bannerId?: string;
  interstitialId?: string;
  rewardedId?: string;
  nativeId?: string;
  isTestMode: boolean;
  isActive: boolean;
}) {
  const user = await requireCurrentUser();
  const bundle = await requireBundleOwner(user.id, projectId);
  const now = new Date();

  const config = await prisma.bundleAdConfigurations.upsert({
    where: { bundleId: bundle.id },
    create: {
      id: crypto.randomUUID(),
      bundleId: bundle.id,
      provider: data.provider,
      appId: data.appId,
      bannerId: data.bannerId || null,
      interstitialId: data.interstitialId || null,
      rewardedId: data.rewardedId || null,
      nativeId: data.nativeId || null,
      isTestMode: data.isTestMode,
      isActive: data.isActive,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      provider: data.provider,
      appId: data.appId,
      bannerId: data.bannerId || null,
      interstitialId: data.interstitialId || null,
      rewardedId: data.rewardedId || null,
      nativeId: data.nativeId || null,
      isTestMode: data.isTestMode,
      isActive: data.isActive,
      updatedAt: now,
    },
  });

  revalidatePath(`/lepoship/${projectId}/settings/ads`);
  return config;
}
