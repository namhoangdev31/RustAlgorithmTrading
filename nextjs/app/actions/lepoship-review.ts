"use server";

import { revalidatePath } from "next/cache";
import { localizedHref, redirect } from "@/i18n/navigation";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function withQueryParam(href: string, key: string, value: string) {
  return `${href}${href.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

async function requireAdmin() {
  const user = await requireCurrentUser();
  if (user.userType !== "admin") {
    throw new Error("Forbidden: admin access required.");
  }
  return user;
}

// ---------------------------------------------------------------------------
// Approve
// ---------------------------------------------------------------------------

export async function approveReviewQueueAction(formData: FormData) {
  const user = await requireAdmin();
  const queueItemId = readFormValue(formData, "queueItemId");
  const returnTo = readFormValue(formData, "returnTo") || "/admin/reviews";

  if (!queueItemId) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "review", "missing_id"));
  }

  let failure: string | null = null;
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Read the queue item and verify it is still pending.
      const item = await tx.bundleReviewQueue.findUnique({
        where: { id: queueItemId },
        select: {
          id: true,
          bundleId: true,
          submittedVersionId: true,
          status: true,
        },
      });

      if (!item) {
        throw new Error("Queue item not found.");
      }
      if (item.status !== "pending") {
        throw new Error("Queue item has already been reviewed.");
      }

      const now = new Date();

      // Conditional updates make a repeated/concurrent decision a no-op.
      const claimed = await tx.bundleReviewQueue.updateMany({
        where: { id: item.id, status: "pending" },
        data: {
          status: "approved",
          reviewerId: user.id,
          reviewedAt: now,
          updatedAt: now,
        },
      });
      if (claimed.count !== 1) {
        throw new Error("Queue item has already been reviewed.");
      }

      const published = await tx.bundles.updateMany({
        where: { id: item.bundleId, status: "reviewing" },
        data: {
          status: "published",
          publishedAt: now,
          rejectionReason: null,
          updatedAt: now,
        },
      });
      if (published.count !== 1) {
        throw new Error("Bundle is no longer awaiting review.");
      }

      // 4. Append review history
      await tx.bundleReviewHistory.create({
        data: {
          id: crypto.randomUUID(),
          bundleId: item.bundleId,
          versionId: item.submittedVersionId,
          action: "approved",
          actorId: user.id,
          createdAt: now,
        },
      });
    });

  } catch (error: any) {
    failure = error instanceof Error ? error.message : "approve_failed";
  }

  const target = await localizedHref(returnTo);
  if (failure) redirect(withQueryParam(target, "review", failure));
  revalidatePath("/admin/reviews");
  redirect(withQueryParam(target, "review", "approved"));
}

// ---------------------------------------------------------------------------
// Reject
// ---------------------------------------------------------------------------

const rejectSchema = z.object({
  queueItemId: z.string().min(1, "Queue item ID is required."),
  rejectionReason: z.string().min(1, "A rejection reason is required."),
});

export async function rejectReviewQueueAction(formData: FormData) {
  const user = await requireAdmin();
  const returnTo = readFormValue(formData, "returnTo") || "/admin/reviews";

  const parsed = rejectSchema.safeParse({
    queueItemId: readFormValue(formData, "queueItemId"),
    rejectionReason: readFormValue(formData, "rejectionReason"),
  });

  if (!parsed.success) {
    const target = await localizedHref(returnTo);
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    redirect(withQueryParam(target, "review", msg));
  }

  const { queueItemId, rejectionReason } = parsed.data;

  let failure: string | null = null;
  try {
    await prisma.$transaction(async (tx) => {
      const item = await tx.bundleReviewQueue.findUnique({
        where: { id: queueItemId },
        select: {
          id: true,
          bundleId: true,
          submittedVersionId: true,
          status: true,
        },
      });

      if (!item) {
        throw new Error("Queue item not found.");
      }
      if (item.status !== "pending") {
        throw new Error("Queue item has already been reviewed.");
      }

      const now = new Date();
      const claimed = await tx.bundleReviewQueue.updateMany({
        where: { id: item.id, status: "pending" },
        data: {
          status: "rejected",
          reviewerId: user.id,
          reviewedAt: now,
          updatedAt: now,
        },
      });
      if (claimed.count !== 1) {
        throw new Error("Queue item has already been reviewed.");
      }

      const rejected = await tx.bundles.updateMany({
        where: { id: item.bundleId, status: "reviewing" },
        data: {
          status: "rejected",
          rejectionReason,
          updatedAt: now,
        },
      });
      if (rejected.count !== 1) {
        throw new Error("Bundle is no longer awaiting review.");
      }

      // 3. Append review history
      await tx.bundleReviewHistory.create({
        data: {
          id: crypto.randomUUID(),
          bundleId: item.bundleId,
          versionId: item.submittedVersionId,
          action: "rejected",
          actorId: user.id,
          reason: rejectionReason,
          createdAt: now,
        },
      });
    });

  } catch (error: any) {
    failure = error instanceof Error ? error.message : "reject_failed";
  }

  const target = await localizedHref(returnTo);
  if (failure) redirect(withQueryParam(target, "review", failure));
  revalidatePath("/admin/reviews");
  redirect(withQueryParam(target, "review", "rejected"));
}
