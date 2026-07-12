"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";
import { createHash, randomBytes } from "crypto";

async function requireBundleOwner(userId: string, projectId: string) {
  // Requires editor permission at least to view/manage API keys
  const access = await requireProjectRole(userId, projectId, "editor");
  const bundle = access.project.bundle;
  if (!bundle) throw new Error("LepoShip bundle not found.");
  return bundle;
}

/**
 * Generate a new lp_sdk_ token for the project's bundle.
 * Plaintext token is only returned ONCE.
 */
export async function createSdkTokenAction(projectId: string, label: string) {
  const user = await requireCurrentUser();
  const bundle = await requireBundleOwner(user.id, projectId);

  // Generate 8 character prefix and 32 character secret
  const prefix = randomBytes(4).toString("hex"); // 8 chars
  const secret = randomBytes(16).toString("hex"); // 32 chars
  const plaintextToken = `lp_sdk_${prefix}_${secret}`;
  
  const tokenHash = createHash("sha256").update(plaintextToken).digest("hex");
  const now = new Date();

  const token = await prisma.bundleSdkTokens.create({
    data: {
      id: crypto.randomUUID(),
      bundleId: bundle.id,
      tokenPrefix: prefix,
      tokenHash,
      label: label || "SDK Ingestion Key",
      isRevoked: false,
      createdAt: now,
    },
  });

  revalidatePath(`/lepoship/${projectId}/settings/sdk-tokens`);

  return {
    id: token.id,
    label: token.label,
    createdAt: token.createdAt,
    plaintextToken, // ONLY visible on generation
  };
}

export async function listSdkTokensAction(projectId: string) {
  const user = await requireCurrentUser();
  const bundle = await requireBundleOwner(user.id, projectId);

  return await prisma.bundleSdkTokens.findMany({
    where: {
      bundleId: bundle.id,
      isRevoked: false,
    },
    select: {
      id: true,
      tokenPrefix: true,
      label: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeSdkTokenAction(projectId: string, tokenId: string) {
  const user = await requireCurrentUser();
  const bundle = await requireBundleOwner(user.id, projectId);

  const token = await prisma.bundleSdkTokens.update({
    where: { id: tokenId, bundleId: bundle.id },
    data: { isRevoked: true },
  });

  revalidatePath(`/lepoship/${projectId}/settings/sdk-tokens`);
  return token;
}
