import { prisma } from "@/lib/server/prisma";

export async function claimIdempotency(scope: string, key: string, requestHash: string) {
  const now = new Date();
  const leaseOwner = crypto.randomUUID();
  const existing = await prisma.lepoShipIdempotencyKeys.findUnique({ where: { scope_key: { scope, key } } });
  if (existing) {
    if (existing.requestHash !== requestHash) throw new Error("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST");
    if (existing.status === "completed") return { id: existing.id, replay: existing.response, inProgress: false };
    if (existing.status === "processing" && existing.leasedUntil && existing.leasedUntil > now) {
      return { id: existing.id, replay: null, inProgress: true };
    }
    const reclaimed = await prisma.lepoShipIdempotencyKeys.updateMany({
      where: { id: existing.id, OR: [{ leasedUntil: null }, { leasedUntil: { lte: now } }, { status: "failed" }] },
      data: { status: "processing", leaseOwner, leasedUntil: new Date(now.getTime() + 60_000), lastError: null },
    });
    return { id: existing.id, replay: null, inProgress: reclaimed.count === 0 };
  }
  try {
    const created = await prisma.lepoShipIdempotencyKeys.create({
      data: {
        id: crypto.randomUUID(), scope, key, requestHash, status: "processing",
        leaseOwner, leasedUntil: new Date(now.getTime() + 60_000),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), createdAt: new Date(),
      },
    });
    return { id: created.id, replay: null, inProgress: false };
  } catch {
    return claimIdempotency(scope, key, requestHash);
  }
}

export async function completeIdempotency(id: string, response: object) {
  await prisma.lepoShipIdempotencyKeys.update({
    where: { id },
    data: { status: "completed", response, completedAt: new Date(), leaseOwner: null, leasedUntil: null },
  });
}

export async function failIdempotency(id: string, error: unknown) {
  await prisma.lepoShipIdempotencyKeys.update({
    where: { id },
    data: {
      status: "failed",
      lastError: error instanceof Error ? error.message.slice(0, 2_000) : String(error).slice(0, 2_000),
      leaseOwner: null,
      leasedUntil: null,
    },
  });
}
