"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { signedGoControlPlaneFetch } from "@/lib/server/go-control-plane";
import { CONTROL_PLANE_CRON_JOBS } from "@/lib/server/control-plane-cron";

export async function replayOutboxEventAction(formData: FormData) {
  const user = await requireCurrentUser();
  if (user.userType !== "admin") throw new Error("Forbidden");
  const eventId = String(formData.get("eventId") ?? "");
  const reason = String(formData.get("reason") ?? "Manual DLQ replay").slice(0, 500);
  const event = await prisma.bundleOutboxEvents.findFirst({ where: { id: eventId, status: "dead_letter" } });
  if (!event) throw new Error("Dead-letter event not found.");
  await prisma.bundleOutboxEvents.update({
    where: { id: event.id },
    data: { status: "pending", attempts: 0, nextAttemptAt: new Date(), lastError: `Replay by ${user.id}: ${reason}`, leaseOwner: null, leasedUntil: null },
  });
  revalidatePath("/admin/lepoship-operations");
}

export async function runCronJobFromOperationsAction(formData: FormData) {
  const user = await requireCurrentUser();
  if (user.userType !== "admin") throw new Error("Forbidden");
  const job = String(formData.get("job") ?? "");
  if (!CONTROL_PLANE_CRON_JOBS.some((item) => item.job === job)) {
    throw new Error("Unknown LepoShip cron job.");
  }
  const res = await signedGoControlPlaneFetch(`/api/internal/cron/${encodeURIComponent(job)}/run`, {
    userId: user.id,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Go control plane returned ${res.status}`);
  }
  revalidatePath("/admin/lepoship-operations");
}
