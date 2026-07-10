"use server";

import { prisma } from "@/lib/server/prisma";
import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/server/current-user";
import type { ActionResult } from "@/lib/portal/action-result";

export async function createPatAction(name: string, scopes: string[] = ["project:read"]): Promise<ActionResult<{ rawToken: string }>> {
  const user = await requireCurrentUser();
  if (!name.trim()) {
    return { ok: false, code: "VALIDATION_ERROR", message: "Token name is required.", fieldErrors: { name: ["Token name is required."] } };
  }

  // Generate random secure token
  const rawToken = "lp_pat_" + randomBytes(24).toString("hex"); // e.g. lp_pat_ + 48 hex characters
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await prisma.personalAccessToken.create({
    data: {
      name,
      tokenHash,
      scopes,
      userId: user.id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Expires in 1 year
    },
  });

  revalidatePath("/settings/tokens");
  return { ok: true, code: "TOKEN_CREATED", message: "Token created.", data: { rawToken } };
}

export async function revokePatAction(patId: string): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const result = await prisma.personalAccessToken.deleteMany({
    where: { id: patId, userId: user.id },
  });

  revalidatePath("/settings/tokens");
  return result.count
    ? { ok: true, code: "TOKEN_REVOKED", message: "Token revoked." }
    : { ok: false, code: "NOT_FOUND", message: "Token not found." };
}
