"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/server/current-user";
import { signedGoControlPlaneFetch } from "@/lib/server/go-control-plane";
import { prisma } from "@/lib/server/prisma";

async function authorizeProject(projectId: string) {
  const user = await requireCurrentUser();
  if (user.userType !== "admin") {
    const membership = await prisma.projectMembership.findUnique({ where: { projectId_userId: { projectId, userId: user.id } } });
    if (!membership || membership.inviteStatus !== "accepted" || !["admin", "editor"].includes(membership.role)) throw new Error("FORBIDDEN");
  }
  return user;
}

export async function retryVerificationAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const releaseId = String(formData.get("releaseId") ?? "");
  const user = await authorizeProject(projectId);
  const response = await signedGoControlPlaneFetch(`/api/v1/releases/${releaseId}/verification/retry`, {
    method: "POST", userId: user.id, idempotencyKey: crypto.randomUUID(),
  });
  if (!response.ok) throw new Error(`VERIFICATION_RETRY_FAILED:${response.status}:${await response.text()}`);
  revalidatePath(`/lepoship/${projectId}/builds`);
}

export async function cancelVerificationAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const runId = String(formData.get("runId") ?? "");
  const user = await authorizeProject(projectId);
  const response = await signedGoControlPlaneFetch(`/api/v1/verification-runs/${runId}/cancel`, {
    method: "POST", userId: user.id, idempotencyKey: crypto.randomUUID(),
  });
  if (!response.ok) throw new Error(`VERIFICATION_CANCEL_FAILED:${response.status}:${await response.text()}`);
  revalidatePath(`/lepoship/${projectId}/verification/${runId}`);
}
