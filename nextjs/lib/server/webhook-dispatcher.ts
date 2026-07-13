import { prisma } from "@/lib/server/prisma";
import { createHmac } from "crypto";
import { assertSafeWebhookUrl } from "@/lib/server/lepoship/safe-webhook-url";

export interface WebhookEventPayload {
  eventId: string;
  eventType: string;
  timestamp: string;
  bundleId: string;
  data: any;
}

/**
 * Dispatch an outbound webhook event immediately (or attempt to).
 * If dispatch fails, schedule for retry using backoff intervals.
 */
export async function queueWebhookEvent(
  bundleId: string,
  eventType: string,
  eventKey: string, // Unique eventKey for idempotency and deduplication
  data: any
) {
  const now = new Date();
  
  // Find all active webhooks for this bundle subscribed to this eventType
  const webhooks = await prisma.bundleWebhooks.findMany({
    where: {
      bundleId,
      isActive: true,
    },
  });

  for (const webhook of webhooks) {
    // Check if subscribed to the event
    let subscribedEvents: string[] = [];
    try {
      subscribedEvents = JSON.parse(webhook.events || "[]");
    } catch {}

    if (!subscribedEvents.includes(eventType) && !subscribedEvents.includes("*")) {
      continue;
    }

    const payload: WebhookEventPayload = {
      eventId: eventKey,
      eventType,
      timestamp: now.toISOString(),
      bundleId,
      data,
    };

    const payloadStr = JSON.stringify(payload);

    // Save Delivery Log entry (idempotently via unique webhookId_eventKey)
    try {
      await prisma.bundleWebhookDeliveries.create({
        data: {
          id: crypto.randomUUID(),
          webhookId: webhook.id,
          eventKey,
          eventType,
          payload: payloadStr,
          status: "pending",
          nextRetryAt: now, // Dispatch immediately
          createdAt: now,
          updatedAt: now,
        },
      });
    } catch (err: any) {
      // Event already queued/delivered for this webhook, skip
      continue;
    }

    // Delivery is performed by the authenticated retry cron. Never start
    // unawaited network work inside a request/serverless invocation.
  }
}

/**
 * Perform the actual HTTP post, verify response status, sign with HMAC,
 * and handle failure retry scheduling and auto-disable.
 */
export async function dispatchDelivery(webhookId: string, eventKey: string): Promise<boolean> {
  const now = new Date();

  // Load delivery and webhook configuration
  const delivery = await prisma.bundleWebhookDeliveries.findUnique({
    where: { webhookId_eventKey: { webhookId, eventKey } },
    include: { webhook: true },
  });

  if (!delivery || delivery.status === "delivered") return true;

  const webhook = delivery.webhook;
  if (!webhook.isActive) return false;

  const payloadStr = delivery.payload;
  const signature = webhook.secret
    ? createHmac("sha256", webhook.secret).update(payloadStr).digest("hex")
    : "";

  let httpStatus: number | null = null;
  let responseBody = "";
  let success = false;

  try {
    // 5-second timeout safeguard
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const safeUrl = await assertSafeWebhookUrl(webhook.url);
    const res = await fetch(safeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "LepoShip-Webhook-Dispatcher/2026.1",
        "X-LepoShip-Event": delivery.eventType,
        "X-LepoShip-Signature": signature,
      },
      body: payloadStr,
      signal: controller.signal,
      redirect: "error",
    });

    clearTimeout(timeout);
    httpStatus = res.status;
    responseBody = await res.text();
    success = res.ok;
  } catch (err: any) {
    responseBody = err.message || "Network Error / Timeout";
  }

  // Update webhook stats and check for auto-disable
  const nextAttempt = delivery.attempt + 1;
  
  if (success) {
    // Reset consecutive failures
    await prisma.$transaction([
      prisma.bundleWebhookDeliveries.update({
        where: { id: delivery.id },
        data: {
          status: "delivered",
          httpStatus,
          responseBody: responseBody.slice(0, 1000),
          attempt: nextAttempt,
          nextRetryAt: null,
          updatedAt: now,
        },
      }),
      prisma.bundleWebhooks.update({
        where: { id: webhook.id },
        data: {
          consecutiveFailures: 0,
          lastTriggeredAt: now,
          updatedAt: now,
        },
      }),
    ]);
    return true;
  } else {
    // Calculate exponential retry backoff: 1m, 5m, 30m, 2h, 12h
    const backoffs = [60, 300, 1800, 7200, 43200];
    const delay = backoffs[delivery.attempt] || null;
    const nextRetryAt = delay ? new Date(now.getTime() + delay * 1000) : null;
    const finalStatus = nextRetryAt ? "pending" : "failed";

    const newConsecutiveFailures = webhook.consecutiveFailures + 1;
    // Auto-disable webhook after 5 consecutive failures
    const shouldDisable = newConsecutiveFailures >= 5;

    await prisma.$transaction([
      prisma.bundleWebhookDeliveries.update({
        where: { id: delivery.id },
        data: {
          status: finalStatus,
          httpStatus,
          responseBody: responseBody.slice(0, 1000),
          attempt: nextAttempt,
          nextRetryAt,
          updatedAt: now,
        },
      }),
      prisma.bundleWebhooks.update({
        where: { id: webhook.id },
        data: {
          failureCount: webhook.failureCount + 1,
          consecutiveFailures: newConsecutiveFailures,
          isActive: shouldDisable ? false : webhook.isActive,
          lastTriggeredAt: now,
          updatedAt: now,
        },
      }),
    ]);

    return false;
  }
}

/**
 * Poll recent LepoShipBuild and BundleReleaseTracks states,
 * generating corresponding webhook events if not already processed.
 */
export async function pollBuilderWebhookEvents() {
  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  // 1. Poll LepoShipBuild states
  const recentBuilds = await prisma.lepoShipBuild.findMany({
    where: {
      updatedAt: { gte: fifteenMinutesAgo },
    },
  });

  for (const build of recentBuilds) {
    const bundle = await prisma.bundles.findFirst({
      where: { projectId: build.projectId },
      select: { id: true },
    });
    if (!bundle) continue;

    if (build.status === "queued" || build.status === "building") {
      await queueWebhookEvent(
        bundle.id,
        "build:started",
        `wh_evt_build_started_${build.id}_${build.status}`,
        {
          buildId: build.id,
          projectId: build.projectId,
          status: build.status,
          platform: build.platform,
        }
      );
    } else if (build.status === "success") {
      await queueWebhookEvent(
        bundle.id,
        "build:success",
        `wh_evt_build_success_${build.id}`,
        {
          buildId: build.id,
          projectId: build.projectId,
          status: build.status,
          platform: build.platform,
          artifactUrl: build.artifactUrl,
        }
      );
    } else if (build.status === "failed") {
      await queueWebhookEvent(
        bundle.id,
        "build:failed",
        `wh_evt_build_failed_${build.id}`,
        {
          buildId: build.id,
          projectId: build.projectId,
          status: build.status,
          platform: build.platform,
          error: build.error,
        }
      );
    }
  }

  // 2. Poll BundleReleaseTracks states for active status
  const recentReleaseTracks = await prisma.bundleReleaseTracks.findMany({
    where: {
      status: "active",
      createdAt: { gte: fifteenMinutesAgo },
    },
  });

  for (const track of recentReleaseTracks) {
    await queueWebhookEvent(
      track.bundleId,
      "release:published",
      `wh_evt_release_published_${track.id}`,
      {
        trackId: track.id,
        trackName: track.track,
        version: track.version,
        buildNumber: track.buildNumber,
        storagePath: track.storagePath,
        releaseNotes: track.releaseNotes,
      }
    );
  }
}
