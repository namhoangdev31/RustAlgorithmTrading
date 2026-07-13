import { Prisma, type PrismaClient } from "@/prisma/generated/client";
import { prisma } from "@/lib/server/prisma";
import { queueWebhookEvent } from "@/lib/server/webhook-dispatcher";

type Db = PrismaClient | Prisma.TransactionClient;

export async function enqueueOutboxEvent(db: Db, input: {
  eventKey: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Prisma.InputJsonValue;
}) {
  return db.bundleOutboxEvents.upsert({
    where: { eventKey: input.eventKey },
    create: { id: crypto.randomUUID(), ...input, createdAt: new Date() },
    update: {},
  });
}

export async function drainOutbox(limit = 50) {
  const now = new Date();
  const leaseOwner = crypto.randomUUID();
  const leasedUntil = new Date(now.getTime() + 60_000);
  const events = await prisma.$transaction(async (tx) => tx.$queryRaw<Array<{
    id: string;
    event_key: string;
    aggregate_id: string;
    event_type: string;
    payload: Prisma.JsonValue;
    attempts: number;
  }>>(Prisma.sql`
    WITH candidates AS (
      SELECT id
      FROM bundle_outbox_events
      WHERE (
        (status = 'pending' AND (next_attempt_at IS NULL OR next_attempt_at <= ${now}))
        OR (status = 'processing' AND leased_until < ${now})
      )
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    UPDATE bundle_outbox_events AS event
    SET status = 'processing', lease_owner = ${leaseOwner}, leased_until = ${leasedUntil}
    FROM candidates
    WHERE event.id = candidates.id
    RETURNING event.id, event.event_key, event.aggregate_id, event.event_type, event.payload, event.attempts
  `), {
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  });
  for (const event of events) {
    try {
      const payload = event.payload as Record<string, unknown>;
      const bundleId = String(payload.bundleId || event.aggregate_id);
      await queueWebhookEvent(bundleId, event.event_type, event.event_key, payload);
      await prisma.bundleOutboxEvents.update({
        where: { id: event.id },
        data: { status: "processed", processedAt: new Date(), attempts: { increment: 1 }, leaseOwner: null, leasedUntil: null },
      });
    } catch (error) {
      const attempts = event.attempts + 1;
      await prisma.bundleOutboxEvents.update({
        where: { id: event.id },
        data: {
          status: attempts >= 8 ? "dead_letter" : "pending",
          attempts,
          nextAttemptAt: attempts >= 8 ? null : new Date(Date.now() + Math.min(3600, 2 ** attempts * 15) * 1000),
          lastError: error instanceof Error ? error.message.slice(0, 2000) : "Unknown outbox error",
          leaseOwner: null,
          leasedUntil: null,
        },
      });
    }
  }
  return { processed: events.length };
}
