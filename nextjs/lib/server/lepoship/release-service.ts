import { Prisma, type BundleApprovalKind } from "@/prisma/generated/client";

import { enqueueOutboxEvent } from "@/lib/server/lepoship/outbox";
import { prisma } from "@/lib/server/prisma";

type Tx = Prisma.TransactionClient;

export class ReleaseGateError extends Error {
  constructor(public readonly blockers: string[]) {
    super(`RELEASE_GATE_BLOCKED: ${blockers.join(", ")}`);
  }
}

async function ensureChannel(tx: Tx, bundleId: string, channelName: string) {
  return tx.bundleChannels.upsert({
    where: { bundleId_name: { bundleId, name: channelName } },
    create: {
      id: crypto.randomUUID(),
      bundleId,
      name: channelName,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    update: { isActive: true, updatedAt: new Date() },
  });
}

export async function createReleaseCandidate(input: {
  bundleId: string;
  channel?: string;
  version: string;
  buildNumber?: number;
  source: "manual" | "github" | "builder";
  sourceCommit?: string;
  releaseNotes?: string;
  actorId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const channel = await ensureChannel(tx, input.bundleId, input.channel ?? "production");
    const [bundle, latest] = await Promise.all([
      tx.bundles.findUniqueOrThrow({ where: { id: input.bundleId }, select: { buildNumber: true } }),
      tx.bundleReleases.aggregate({ where: { bundleId: input.bundleId }, _max: { buildNumber: true } }),
    ]);
    const buildNumber = input.buildNumber ?? Math.max(bundle.buildNumber, latest._max.buildNumber ?? 0) + 1;
    const release = await tx.bundleReleases.create({
      data: {
        id: crypto.randomUUID(),
        bundleId: input.bundleId,
        channelId: channel.id,
        version: input.version,
        buildNumber,
        status: "queued",
        source: input.source,
        sourceCommit: input.sourceCommit,
        releaseNotes: input.releaseNotes,
        createdById: input.actorId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await tx.bundleAuditLog.create({
      data: {
        id: crypto.randomUUID(),
        bundleId: input.bundleId,
        userId: input.actorId,
        action: "release_created",
        fieldName: release.id,
        oldValue: JSON.stringify({ version: input.version, buildNumber, source: input.source }),
        createdAt: new Date(),
      },
    });
    return release;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function submitRelease(releaseId: string, actorId?: string) {
  return prisma.$transaction(async (tx) => {
    const release = await tx.bundleReleases.findUniqueOrThrow({ where: { id: releaseId } });
    if (!(["scanning", "building"] as string[]).includes(release.status)) {
      throw new Error(`INVALID_RELEASE_TRANSITION: ${release.status} -> pending_review`);
    }
    const updated = await tx.bundleReleases.update({
      where: { id: releaseId },
      data: { status: "pending_review", submittedAt: new Date(), updatedAt: new Date() },
    });
    await audit(tx, release.bundleId, actorId, "release_submitted", releaseId);
    return updated;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function approveRelease(input: {
  releaseId: string;
  kind: BundleApprovalKind;
  actorId: string;
  evidence?: Prisma.InputJsonValue;
  policyVersion?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const release = await tx.bundleReleases.findUniqueOrThrow({ where: { id: input.releaseId } });
    if (!(["scanning", "pending_review", "approved"] as string[]).includes(release.status)) {
      throw new Error(`INVALID_RELEASE_APPROVAL_STATE: ${release.status}`);
    }
    const approval = await tx.bundleReleaseApprovals.upsert({
      where: { releaseId_kind: { releaseId: input.releaseId, kind: input.kind } },
      create: {
        id: crypto.randomUUID(),
        releaseId: input.releaseId,
        kind: input.kind,
        status: "approved",
        actorId: input.actorId,
        evidence: input.evidence,
        policyVersion: input.policyVersion,
        createdAt: new Date(),
      },
      update: {
        status: "approved",
        actorId: input.actorId,
        evidence: input.evidence,
        policyVersion: input.policyVersion,
        createdAt: new Date(),
      },
    });
    await audit(tx, release.bundleId, input.actorId, `release_${input.kind}_approved`, input.releaseId);
    return approval;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

function securityEvidenceHasCriticalFindings(evidence: Prisma.JsonValue | null): boolean {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) return true;
  const value = evidence as Record<string, Prisma.JsonValue>;
  return value.malwarePassed !== true || Number(value.criticalFindings ?? 1) > 0 || typeof value.digest !== "string";
}

async function releaseBlockers(tx: Tx, releaseId: string, allowedDeliveryMode: "experiment" | "rollout" | null = null) {
  const release = await tx.bundleReleases.findUniqueOrThrow({
    where: { id: releaseId },
    include: {
      artifacts: true,
      approvals: true,
      overrides: { where: { revokedAt: null, expiresAt: { gt: new Date() } }, include: { approvals: true } },
      bundle: { select: { activeDeliveryMode: true } },
    },
  });
  const blockers: string[] = [];
  const full = release.artifacts.find((artifact) => artifact.kind === "full");
  if (!full || full.checksumSha256.length !== 64 || full.fileSize <= BigInt(0)) blockers.push("immutable_full_artifact");

  const approvals = new Map(release.approvals.map((approval) => [approval.kind, approval]));
  const security = approvals.get("security");
  if (!security || security.status !== "approved" || securityEvidenceHasCriticalFindings(security.evidence)) {
    blockers.push("security_scan");
  }

  const validOverride = release.overrides.some((override) => {
    const uniqueApprovers = new Set(override.approvals.map((approval) => approval.approverId));
    return uniqueApprovers.size >= 2 && !uniqueApprovers.has(override.createdById);
  });
  for (const kind of ["privacy", "moderation"] as const) {
    if (approvals.get(kind)?.status !== "approved" && !validOverride) blockers.push(`${kind}_approval`);
  }
  if (release.bundle.activeDeliveryMode !== "none" && release.bundle.activeDeliveryMode !== allowedDeliveryMode) blockers.push("active_delivery_conflict");
  return { release, blockers };
}

export async function finalizeExperiment(input: {
  testId: string;
  winnerVariant: "A" | "B";
  actorId: string;
  reason: string;
}) {
  return prisma.$transaction(async (tx) => {
    const test = await tx.bundleAbTests.findUniqueOrThrow({
      where: { id: input.testId },
      include: { controlRelease: true, treatmentRelease: true },
    });
    if (!(["running", "paused_guardrail"] as string[]).includes(test.status) || !test.controlRelease || !test.treatmentRelease) {
      throw new Error("EXPERIMENT_NOT_RUNNING");
    }
    if (input.winnerVariant === "B" && (test.analysisStatus !== "conclusive" || test.recommendedWinner !== "B")) {
      throw new Error("TREATMENT_WINNER_GATE_NOT_MET");
    }
    const winner = input.winnerVariant === "B" ? test.treatmentRelease : test.controlRelease;
    const { blockers } = await releaseBlockers(tx, winner.id, "experiment");
    if (blockers.length) throw new ReleaseGateError(blockers);
    await tx.bundleChannels.update({ where: { id: winner.channelId }, data: { currentReleaseId: winner.id, updatedAt: new Date() } });
    await tx.bundleReleases.updateMany({
      where: { channelId: winner.channelId, status: "active", id: { not: winner.id } },
      data: { status: "approved", updatedAt: new Date() },
    });
    await tx.bundleReleases.update({
      where: { id: winner.id },
      data: { status: "active", activatedAt: new Date(), updatedAt: new Date() },
    });
    if (input.winnerVariant === "A") {
      await tx.bundleReleases.update({ where: { id: test.treatmentRelease.id }, data: { status: "rolled_back", updatedAt: new Date() } });
    }
    await tx.bundleAbTests.update({
      where: { id: test.id },
      data: { status: "ended", endedAt: new Date(), winnerVariant: input.winnerVariant, endedById: input.actorId, endReason: input.reason },
    });
    await tx.bundles.update({
      where: { id: test.bundleId },
      data: {
        activeAbTestId: null, activeDeliveryMode: "none",
        version: winner.version, buildNumber: winner.buildNumber,
      },
    });
    await audit(tx, test.bundleId, input.actorId, "experiment_finalized", winner.id, input.reason);
    await enqueueOutboxEvent(tx, {
      eventKey: `experiment.ended:${test.id}`,
      aggregateType: "bundle_experiment",
      aggregateId: test.id,
      eventType: "experiment.ended",
      payload: { bundleId: test.bundleId, testId: test.id, winnerVariant: input.winnerVariant, releaseId: winner.id },
    });
    return winner;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function finalizeRollout(input: { rolloutId: string; actorId: string; reason: string }) {
  return prisma.$transaction(async (tx) => {
    const rollout = await tx.bundleDeliveryRollouts.findUniqueOrThrow({
      where: { id: input.rolloutId },
      include: { candidateRelease: true },
    });
    if (!(["running", "completed"] as string[]).includes(rollout.status)) throw new Error("ROLLOUT_NOT_ACTIVE");
    const { blockers } = await releaseBlockers(tx, rollout.candidateReleaseId, "rollout");
    if (blockers.length) throw new ReleaseGateError(blockers);
    await tx.bundleChannels.update({ where: { id: rollout.channelId }, data: { currentReleaseId: rollout.candidateReleaseId, updatedAt: new Date() } });
    await tx.bundleReleases.updateMany({
      where: { channelId: rollout.channelId, status: "active", id: { not: rollout.candidateReleaseId } },
      data: { status: "approved", updatedAt: new Date() },
    });
    await tx.bundleReleases.update({
      where: { id: rollout.candidateReleaseId },
      data: { status: "active", activatedAt: new Date(), updatedAt: new Date() },
    });
    await tx.bundleDeliveryRollouts.update({
      where: { id: rollout.id },
      data: { status: "completed", percentage: 100, completedAt: new Date(), updatedAt: new Date() },
    });
    await tx.bundles.update({
      where: { id: rollout.bundleId },
      data: {
        activeRolloutId: null, activeDeliveryMode: "none",
        version: rollout.candidateRelease.version, buildNumber: rollout.candidateRelease.buildNumber,
      },
    });
    await audit(tx, rollout.bundleId, input.actorId, "rollout_finalized", rollout.candidateReleaseId, input.reason);
    await enqueueOutboxEvent(tx, {
      eventKey: `rollout.completed:${rollout.id}`,
      aggregateType: "bundle_rollout", aggregateId: rollout.id, eventType: "rollout.completed",
      payload: { bundleId: rollout.bundleId, rolloutId: rollout.id, releaseId: rollout.candidateReleaseId },
    });
    return rollout.candidateRelease;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function promoteRelease(input: { releaseId: string; actorId?: string; reason: string }) {
  return prisma.$transaction(async (tx) => {
    const { release, blockers } = await releaseBlockers(tx, input.releaseId);
    if (blockers.length) throw new ReleaseGateError(blockers);

    await tx.bundleChannels.update({
      where: { id: release.channelId },
      data: { currentReleaseId: release.id, updatedAt: new Date() },
    });
    await tx.bundleReleases.updateMany({
      where: { channelId: release.channelId, status: "active", id: { not: release.id } },
      data: { status: "approved", updatedAt: new Date() },
    });
    const activated = await tx.bundleReleases.update({
      where: { id: release.id },
      data: { status: "active", approvedAt: release.approvedAt ?? new Date(), activatedAt: new Date(), updatedAt: new Date() },
    });
    await tx.bundles.update({
      where: { id: release.bundleId },
      data: { status: "published", publishedAt: new Date(), version: release.version, buildNumber: release.buildNumber },
    });
    await audit(tx, release.bundleId, input.actorId, "release_promoted", release.id, input.reason);
    await enqueueOutboxEvent(tx, {
      eventKey: `release.promoted:${release.id}`,
      aggregateType: "bundle_release",
      aggregateId: release.id,
      eventType: "release.promoted",
      payload: { bundleId: release.bundleId, releaseId: release.id, channelId: release.channelId, reason: input.reason },
    });
    return activated;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function rejectRelease(input: { releaseId: string; actorId: string; reason: string }) {
  return prisma.$transaction(async (tx) => {
    const release = await tx.bundleReleases.findUniqueOrThrow({ where: { id: input.releaseId } });
    if (release.status === "active") throw new Error("ACTIVE_RELEASE_CANNOT_BE_REJECTED");
    const rejected = await tx.bundleReleases.update({
      where: { id: input.releaseId },
      data: { status: "rejected", updatedAt: new Date() },
    });
    await audit(tx, release.bundleId, input.actorId, "release_rejected", release.id, input.reason);
    return rejected;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function rollbackRelease(input: { bundleId: string; channel: string; actorId?: string; reason: string }) {
  return prisma.$transaction(async (tx) => {
    const channel = await tx.bundleChannels.findUniqueOrThrow({
      where: { bundleId_name: { bundleId: input.bundleId, name: input.channel } },
      include: { currentRelease: true },
    });
    const target = await tx.bundleReleases.findFirst({
      where: { channelId: channel.id, status: "approved", id: { not: channel.currentReleaseId ?? undefined } },
      orderBy: { activatedAt: "desc" },
    });
    if (!target || !channel.currentRelease) throw new Error("NO_SAFE_ROLLBACK_RELEASE");
    await tx.bundleReleases.update({ where: { id: channel.currentRelease.id }, data: { status: "rolled_back", updatedAt: new Date() } });
    await tx.bundleReleases.update({ where: { id: target.id }, data: { status: "active", activatedAt: new Date(), updatedAt: new Date() } });
    await tx.bundleChannels.update({ where: { id: channel.id }, data: { currentReleaseId: target.id, updatedAt: new Date() } });
    await tx.bundles.update({ where: { id: input.bundleId }, data: { version: target.version, buildNumber: target.buildNumber } });
    await audit(tx, input.bundleId, input.actorId, "release_rolled_back", target.id, input.reason);
    await enqueueOutboxEvent(tx, {
      eventKey: `release.rolled_back:${channel.currentRelease.id}:${target.id}`,
      aggregateType: "bundle_release",
      aggregateId: target.id,
      eventType: "release.rolled_back",
      payload: { bundleId: input.bundleId, failedReleaseId: channel.currentRelease.id, releaseId: target.id, reason: input.reason },
    });
    return target;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

async function audit(tx: Tx, bundleId: string, actorId: string | undefined, action: string, releaseId: string, detail?: string) {
  await tx.bundleAuditLog.create({
    data: {
      id: crypto.randomUUID(),
      bundleId,
      userId: actorId,
      action,
      fieldName: releaseId,
      oldValue: detail,
      createdAt: new Date(),
    },
  });
}
