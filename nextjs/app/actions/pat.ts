"use server";

import { prisma } from "@/lib/server/prisma";
import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

export async function createPatAction(userId: string, name: string, scopes: string[] = ["project:read"]) {
  if (!name.trim()) {
    throw new Error("Token name is required.");
  }

  // Generate random secure token
  const rawToken = "lp_pat_" + randomBytes(24).toString("hex"); // e.g. lp_pat_ + 48 hex characters
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await prisma.personalAccessToken.create({
    data: {
      name,
      tokenHash,
      scopes,
      userId,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Expires in 1 year
    },
  });

  revalidatePath("/dashboard/settings/tokens");
  return { rawToken };
}

export async function revokePatAction(patId: string) {
  await prisma.personalAccessToken.delete({
    where: { id: patId },
  });

  revalidatePath("/dashboard/settings/tokens");
  return { success: true };
}

export async function getUserPatsAction(userId: string) {
  return prisma.personalAccessToken.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      scopes: true,
      createdAt: true,
      expiresAt: true,
      lastUsedAt: true,
    },
  });
}
