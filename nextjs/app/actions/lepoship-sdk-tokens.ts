"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";
import { createHash, randomBytes } from "crypto";

async function requireBundleOwner(userId: string, projectId: string) {
  const access = await requireProjectRole(userId, projectId, "admin");
  const bundle = access.project.bundle;
  if (!bundle) throw new Error("LepoShip bundle not found.");
  return bundle;
}

export async function createSdkTokenAction(projectId: string, label: string) {
  const user = await requireCurrentUser();
  const bundle = await requireBundleOwner(user.id, projectId);

  const prefix = randomBytes(4).toString("hex"); 
  const secret = randomBytes(16).toString("hex"); 
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
      scopes: ["ota:read", "telemetry:write", "reports:write", "license:verify"],
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
      scopes: true,
      expiresAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function rotateSdkTokenAction(projectId: string, tokenId: string) {
  const user = await requireCurrentUser();
  const bundle = await requireBundleOwner(user.id, projectId);
  const previous = await prisma.bundleSdkTokens.findFirst({ where: { id: tokenId, bundleId: bundle.id, isRevoked: false } });
  if (!previous) throw new Error("SDK token not found.");
  const prefix = randomBytes(4).toString("hex");
  const plaintextToken = `lp_sdk_${prefix}_${randomBytes(16).toString("hex")}`;
  const now = new Date();
  const next = await prisma.$transaction(async (tx) => {
    await tx.bundleSdkTokens.update({
      where: { id: previous.id },
      data: { expiresAt: now, rotationGraceUntil: new Date(now.getTime() + 24 * 60 * 60 * 1_000) },
    });
    const created = await tx.bundleSdkTokens.create({
      data: {
        id: crypto.randomUUID(), bundleId: bundle.id, tokenPrefix: prefix,
        tokenHash: createHash("sha256").update(plaintextToken).digest("hex"),
        label: previous.label, scopes: previous.scopes, isRevoked: false, createdAt: now,
      },
    });
    await tx.bundleAuditLog.create({
      data: { id: crypto.randomUUID(), bundleId: bundle.id, userId: user.id, action: "sdk_token_rotated", fieldName: previous.id, createdAt: now },
    });
    return created;
  });
  revalidatePath(`/lepoship/${projectId}/settings/sdk-tokens`);
  return { id: next.id, plaintextToken, createdAt: next.createdAt };
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
