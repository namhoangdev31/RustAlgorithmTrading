"use server";

import { requireCurrentUser } from "@/lib/server/current-user";
import { signedGoControlPlaneFetch } from "@/lib/server/go-control-plane";
import { randomUUID } from "crypto";

export async function runControlPlaneCronJobAction(job: string) {
  const user = await requireCurrentUser();
  const res = await signedGoControlPlaneFetch(`/api/internal/cron/${encodeURIComponent(job)}/run`, {
    userId: user.id,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data.error || `Go control plane returned ${res.status}` };
  }
  return { success: true, ...data };
}

export async function issueControlPlaneLicenseAction(input: {
  bundleId: string;
  entitlementType?: string;
  deviceLimit?: number;
}) {
  const user = await requireCurrentUser();
  const res = await signedGoControlPlaneFetch("/api/v1/entitlements/license", {
    userId: user.id,
    bundleId: input.bundleId,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data.error || `Go control plane returned ${res.status}` };
  }
  return { success: true, ...data };
}

export async function uploadReleaseToControlPlaneAction(formData: FormData) {
  const user = await requireCurrentUser();
  const bundleId = String(formData.get("bundleId") || "");
  const checksumSha256 = String(formData.get("checksumSha256") || "");
  const idempotencyKey = String(formData.get("idempotencyKey") || randomUUID());
  formData.set("checksum", checksumSha256);
  formData.set("idempotency", idempotencyKey);

  const res = await signedGoControlPlaneFetch("/api/v1/releases/upload", {
    userId: user.id,
    bundleId,
    checksumSha256,
    idempotencyKey,
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data.error || `Go control plane returned ${res.status}` };
  }
  return { success: true, ...data };
}
