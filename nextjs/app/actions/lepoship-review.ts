"use server";

import { revalidatePath } from "next/cache";
import { localizedHref, redirect } from "@/i18n/navigation";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { z } from "zod";
import { reconcileReleasePromotion, rejectRelease } from "@/lib/server/lepoship/release-service";

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
    const canonicalItem = await prisma.bundleReviewQueue.findUnique({
      where: { id: queueItemId },
      include: { release: { include: { approvals: true } } },
    });
    if (canonicalItem?.release) {
      const release = canonicalItem.release;
      const privacy = await prisma.bundlePrivacyDeclarations.findUnique({ where: { bundleId: canonicalItem.bundleId } });
      if (!privacy || !["submitted", "approved"].includes(privacy.declarationStatus)) throw new Error("A submitted privacy declaration is required.");
      await prisma.$transaction(async (tx) => {
        const claimed = await tx.bundleReviewQueue.updateMany({
          where: { id: canonicalItem.id, status: "pending" },
          data: { status: "approved", reviewerId: user.id, reviewedAt: new Date(), updatedAt: new Date() },
        });
        if (claimed.count !== 1) throw new Error("Queue item has already been reviewed.");
        for (const kind of ["moderation", "privacy"] as const) {
          await tx.bundleReleaseApprovals.upsert({
            where: { releaseId_kind: { releaseId: canonicalItem.release!.id, kind } },
            create: { id: crypto.randomUUID(), releaseId: canonicalItem.release!.id, kind, status: "approved", actorId: user.id, policyVersion: "production-gate-v2", createdAt: new Date() },
            update: { status: "approved", actorId: user.id, policyVersion: "production-gate-v2", createdAt: new Date() },
          });
        }
        await tx.bundleReleases.update({ where: { id: release.id }, data: { approvedAt: new Date(), updatedAt: new Date() } });
        await tx.bundlePrivacyDeclarations.update({ where: { bundleId: canonicalItem.bundleId }, data: { declarationStatus: "approved", reviewedAt: new Date(), updatedAt: new Date() } });
      }, { isolationLevel: "Serializable" });
      await reconcileReleasePromotion({ releaseId: release.id, actorId: user.id, reason: "Moderation and privacy approval completed." });
    } else {
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
      const [privacy, scan, version, emergencyOverride] = await Promise.all([
        tx.bundlePrivacyDeclarations.findUnique({ where: { bundleId: item.bundleId }, select: { declarationStatus: true } }),
        item.submittedVersionId ? tx.bundleSecurityScanResults.findFirst({ where: { bundleId: item.bundleId, versionId: item.submittedVersionId, result: "passed" }, orderBy: { scannedAt: "desc" } }) : null,
        item.submittedVersionId ? tx.bundleVersionHistory.findUnique({ where: { id: item.submittedVersionId }, select: { version: true, buildNumber: true } }) : null,
        tx.bundleReleaseOverrides.findFirst({ where: { bundleId: item.bundleId, versionId: item.submittedVersionId, revokedAt: null, expiresAt: { gt: now } }, orderBy: { createdAt: "desc" } }),
      ]);
      if (!emergencyOverride && (!privacy || !["submitted", "approved"].includes(privacy.declarationStatus))) throw new Error("A submitted privacy declaration is required before publication.");
      if (!emergencyOverride && !scan) throw new Error("A passing security scan is required before publication.");

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
        where: { id: item.bundleId, status: { in: ["draft", "submitted"] } },
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
      if (privacy) await tx.bundlePrivacyDeclarations.update({ where: { bundleId: item.bundleId }, data: { declarationStatus: "approved", reviewedAt: now, updatedAt: now } });

      if (version) await tx.bundleVersionHistory.update({ where: { id: item.submittedVersionId! }, data: { status: "published", publishedAt: now } });

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
    }

  } catch (error: any) {
    failure = error instanceof Error ? error.message : "approve_failed";
  }

  const target = await localizedHref(returnTo);
  if (failure) redirect(withQueryParam(target, "review", failure));
  revalidatePath("/admin/reviews");
  redirect(withQueryParam(target, "review", "approved"));
}

export async function createEmergencyReleaseOverrideAction(formData: FormData) {
  const user = await requireAdmin();
  const queueItemId = readFormValue(formData, "queueItemId");
  const reason = readFormValue(formData, "overrideReason");
  const returnTo = readFormValue(formData, "returnTo") || "/admin/review-queue";
  if (!queueItemId || reason.length < 10) throw new Error("A detailed override reason is required.");
  const item = await prisma.bundleReviewQueue.findUnique({
    where: { id: queueItemId },
    include: { release: { include: { approvals: true, verificationRuns: { orderBy: { createdAt: "desc" }, take: 1 } } } },
  });
  if (!item?.release || item.status !== "pending") throw new Error("Pending canonical release review item not found.");
  const security = item.release.approvals.find((approval) => approval.kind === "security" && approval.status === "approved");
  const reviewRun = item.release.verificationRuns[0];
  if (!security && !(reviewRun?.status === "completed" && reviewRun.decision === "review")) throw new Error("Emergency override is allowed only for a verification REVIEW decision; reject and incomplete cannot be bypassed.");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.bundleReleaseOverridesV2.create({ data: { id: crypto.randomUUID(), bundleId: item.bundleId, releaseId: item.release.id, createdById: user.id, reason, expiresAt, createdAt: now } }),
    prisma.bundleAuditLog.create({ data: { id: crypto.randomUUID(), bundleId: item.bundleId, userId: user.id, action: "emergency_release_override", fieldName: "release_gates", oldValue: JSON.stringify({ reason, expiresAt }), createdAt: now } }),
  ]);
  revalidatePath("/admin/review-queue");
  const target = await localizedHref(returnTo);
  redirect(withQueryParam(target, "review", "override_created"));
}

export async function approveEmergencyReleaseOverrideAction(formData: FormData) {
  const user = await requireAdmin();
  const overrideId = readFormValue(formData, "overrideId");
  if (!overrideId) throw new Error("Override ID is required.");
  const override = await prisma.bundleReleaseOverridesV2.findUnique({ where: { id: overrideId }, include: { approvals: true } });
  if (!override || override.revokedAt || override.expiresAt <= new Date()) throw new Error("Active override not found.");
  if (override.createdById === user.id) throw new Error("Override creator cannot approve their own request.");
  const releaseId = override.releaseId;
  await prisma.$transaction(async (tx) => {
    await tx.bundleReleaseOverrideApprovals.upsert({
      where: { overrideId_approverId: { overrideId, approverId: user.id } },
      create: { id: crypto.randomUUID(), overrideId, approverId: user.id, createdAt: new Date() },
      update: {},
    });
    await tx.bundleAuditLog.create({
      data: { id: crypto.randomUUID(), bundleId: override.bundleId, userId: user.id, action: "emergency_override_approved", fieldName: overrideId, createdAt: new Date() },
    });
    const approvalCount = await tx.bundleReleaseOverrideApprovals.count({ where: { overrideId } });
    if (approvalCount >= 2) {
      const run = await tx.verificationRuns.findFirst({ where: { releaseId, status: "completed", decision: "review" }, orderBy: { createdAt: "desc" } });
      if (run) {
        await tx.bundleReleases.update({ where: { id: releaseId }, data: { eligibleVerificationRunId: run.id, updatedAt: new Date() } });
        await tx.bundleReleaseApprovals.upsert({
          where: { releaseId_kind: { releaseId, kind: "security" } },
          create: { id: crypto.randomUUID(), releaseId, kind: "security", status: "approved", actorId: user.id, policyVersion: run.policyVersionId, evidence: { source: "verification_review_override", runId: run.id, overrideId }, createdAt: new Date() },
          update: { status: "approved", actorId: user.id, policyVersion: run.policyVersionId, evidence: { source: "verification_review_override", runId: run.id, overrideId }, createdAt: new Date() },
        });
      }
    }
  });
  await reconcileReleasePromotion({ releaseId, actorId: user.id, reason: "Two-person verification review override completed." });
  revalidatePath("/admin/review-queue");
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
    const canonicalItem = await prisma.bundleReviewQueue.findUnique({ where: { id: queueItemId }, select: { id: true, releaseId: true, status: true } });
    if (canonicalItem?.releaseId) {
      const claimed = await prisma.bundleReviewQueue.updateMany({
        where: { id: queueItemId, status: "pending" },
        data: { status: "rejected", reviewerId: user.id, reviewedAt: new Date(), notes: rejectionReason, updatedAt: new Date() },
      });
      if (claimed.count !== 1) throw new Error("Queue item has already been reviewed.");
      await rejectRelease({ releaseId: canonicalItem.releaseId, actorId: user.id, reason: rejectionReason });
    } else {
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
    }

  } catch (error: any) {
    failure = error instanceof Error ? error.message : "reject_failed";
  }

  const target = await localizedHref(returnTo);
  if (failure) redirect(withQueryParam(target, "review", failure));
  revalidatePath("/admin/reviews");
  redirect(withQueryParam(target, "review", "rejected"));
}
