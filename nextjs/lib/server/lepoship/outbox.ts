import { Prisma, type PrismaClient } from "@/prisma/generated/client";

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
