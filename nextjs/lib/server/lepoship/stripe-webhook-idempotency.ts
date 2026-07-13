import { createHash } from "node:crypto";

import { prisma } from "@/lib/server/prisma";

export async function claimStripeWebhook(eventId: string, eventType: string, rawBody: string) {
  const payloadHash = createHash("sha256").update(rawBody).digest("hex");
  const existing = await prisma.bundleStripeWebhookEvents.findUnique({ where: { eventId } });
  if (existing) {
    if (existing.payloadHash !== payloadHash) throw new Error("STRIPE_EVENT_PAYLOAD_MISMATCH");
    if (existing.status !== "failed") return null;
    return prisma.bundleStripeWebhookEvents.update({
      where: { id: existing.id }, data: { status: "processing", error: null, processedAt: null },
    });
  }
  try {
    return await prisma.bundleStripeWebhookEvents.create({
      data: {
        id: crypto.randomUUID(), eventId, eventType, payloadHash,
        status: "processing", createdAt: new Date(),
      },
    });
  } catch {
    return null;
  }
}

export async function completeStripeWebhook(id: string) {
  await prisma.bundleStripeWebhookEvents.update({ where: { id }, data: { status: "completed", processedAt: new Date() } });
}

export async function failStripeWebhook(id: string, error: unknown) {
  await prisma.bundleStripeWebhookEvents.update({
    where: { id },
    data: { status: "failed", error: error instanceof Error ? error.message.slice(0, 2_000) : String(error).slice(0, 2_000) },
  });
}
