"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";
import { randomBytes } from "crypto";
import { assertSafeWebhookUrl } from "@/lib/server/lepoship/safe-webhook-url";

async function requireBundleOwner(userId: string, projectId: string) {
  // Requires editor to configure webhooks
  const access = await requireProjectRole(userId, projectId, "editor");
  const bundle = access.project.bundle;
  if (!bundle) throw new Error("LepoShip bundle not found.");
  return bundle;
}

export async function listWebhooksAction(projectId: string) {
  const user = await requireCurrentUser();
  const bundle = await requireBundleOwner(user.id, projectId);

  return await prisma.bundleWebhooks.findMany({
    where: { bundleId: bundle.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function createWebhookAction(projectId: string, data: {
  url: string;
  events: string[];
}) {
  const user = await requireCurrentUser();
  const bundle = await requireBundleOwner(user.id, projectId);
  const now = new Date();
  const webhookUrl = await assertSafeWebhookUrl(data.url);
  
  // Generate random HMAC secret
  const secret = `whsec_${randomBytes(24).toString("hex")}`;

  const webhook = await prisma.bundleWebhooks.create({
    data: {
      id: crypto.randomUUID(),
      bundleId: bundle.id,
      url: webhookUrl,
      secret,
      events: JSON.stringify(data.events),
      isActive: true,
      failureCount: 0,
      consecutiveFailures: 0,
      createdAt: now,
      updatedAt: now,
    },
  });

  revalidatePath(`/lepoship/${projectId}/settings/webhooks`);
  return webhook;
}

export async function updateWebhookAction(projectId: string, webhookId: string, data: {
  url: string;
  events: string[];
  isActive: boolean;
}) {
  const user = await requireCurrentUser();
  const bundle = await requireBundleOwner(user.id, projectId);
  const now = new Date();
  const webhookUrl = await assertSafeWebhookUrl(data.url);

  const webhook = await prisma.bundleWebhooks.update({
    where: { id: webhookId, bundleId: bundle.id },
    data: {
      url: webhookUrl,
      events: JSON.stringify(data.events),
      isActive: data.isActive,
      // If reactivating, reset failure counts
      ...(data.isActive ? { failureCount: 0, consecutiveFailures: 0 } : {}),
      updatedAt: now,
    },
  });

  revalidatePath(`/lepoship/${projectId}/settings/webhooks`);
  return webhook;
}

export async function rotateWebhookSecretAction(projectId: string, webhookId: string) {
  const user = await requireCurrentUser();
  const bundle = await requireBundleOwner(user.id, projectId);
  const now = new Date();
  
  const newSecret = `whsec_${randomBytes(24).toString("hex")}`;

  const webhook = await prisma.bundleWebhooks.update({
    where: { id: webhookId, bundleId: bundle.id },
    data: {
      secret: newSecret,
      updatedAt: now,
    },
  });

  revalidatePath(`/lepoship/${projectId}/settings/webhooks`);
  return webhook;
}

export async function deleteWebhookAction(projectId: string, webhookId: string) {
  const user = await requireCurrentUser();
  const bundle = await requireBundleOwner(user.id, projectId);

  const deleted = await prisma.bundleWebhooks.delete({
    where: { id: webhookId, bundleId: bundle.id },
  });

  revalidatePath(`/lepoship/${projectId}/settings/webhooks`);
  return deleted;
}
