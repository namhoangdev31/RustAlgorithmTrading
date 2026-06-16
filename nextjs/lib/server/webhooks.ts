import { prisma } from "@/lib/server/prisma";
import crypto from "crypto";

interface WebhookPayload {
  event: string;
  formId: string;
  formName: string;
  submissionId: string;
  data: any;
  createdAt: string;
}

/**
 * Triggers a webhook delivery immediately.
 */
export async function triggerFormWebhook(
  formId: string,
  submissionId: string,
  data: any
): Promise<void> {
  const form = await prisma.form.findUnique({
    where: { id: formId },
  });

  if (!form || !form.webhookUrl) {
    return;
  }

  const payload: WebhookPayload = {
    event: "form.submission.created",
    formId,
    formName: form.name,
    submissionId,
    data,
    createdAt: new Date().toISOString(),
  };

  const url = form.webhookUrl;
  const secret = form.webhookSecret;

  // Create delivery record in database
  const delivery = await prisma.formWebhookDelivery.create({
    data: {
      formId,
      submissionId,
      url,
      status: "PENDING",
      attempts: 0,
    },
  });

  await executeWebhookSend(delivery.id, url, secret, payload, 1);
}

/**
 * Sweeps and retries failed webhook deliveries.
 */
export async function retryFailedWebhooks(): Promise<{ processed: number; succeeded: number }> {
  const now = new Date();
  
  // Find failed deliveries that are due for a retry
  const deliveries = await prisma.formWebhookDelivery.findMany({
    where: {
      status: "FAILED",
      attempts: { lt: 5 },
      nextRetryAt: { lte: now },
    },
    include: {
      form: true,
      submission: true,
    },
  });

  let succeeded = 0;

  for (const delivery of deliveries) {
    const payload: WebhookPayload = {
      event: "form.submission.created",
      formId: delivery.formId,
      formName: delivery.form.name,
      submissionId: delivery.submissionId,
      data: delivery.submission.data,
      createdAt: delivery.createdAt.toISOString(),
    };

    const success = await executeWebhookSend(
      delivery.id,
      delivery.url,
      delivery.form.webhookSecret,
      payload,
      delivery.attempts + 1
    );

    if (success) {
      succeeded++;
    }
  }

  return {
    processed: deliveries.length,
    succeeded,
  };
}

/**
 * Performs the HTTP POST request to the webhook URL and updates the delivery status.
 */
async function executeWebhookSend(
  deliveryId: string,
  url: string,
  secret: string | null,
  payload: WebhookPayload,
  attemptNumber: number
): Promise<boolean> {
  const payloadString = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "LepoShip-Webhook-Client/1.0",
  };

  // Sign payload if secret exists
  if (secret) {
    const signature = crypto
      .createHmac("sha256", secret)
      .update(payloadString)
      .digest("hex");
    headers["x-lepoship-signature"] = `sha256=${signature}`;
  }

  let success = false;
  let errorMsg: string | null = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      success = true;
    } else {
      errorMsg = `HTTP Error status ${response.status}: ${response.statusText}`;
    }
  } catch (err: any) {
    errorMsg = err.message || "Network connection failed";
  }

  if (success) {
    await prisma.formWebhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "SUCCESS",
        attempts: attemptNumber,
        lastError: null,
        nextRetryAt: null,
      },
    });
    return true;
  } else {
    // Calculate backoff delay: 1m, 5m, 30m, 2h, 12h
    const backoffDelays = [1, 5, 30, 120, 720];
    const delayMinutes = backoffDelays[attemptNumber - 1] || 1440;
    const nextRetryAt = attemptNumber < 5 ? new Date(Date.now() + delayMinutes * 60 * 1000) : null;

    await prisma.formWebhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "FAILED",
        attempts: attemptNumber,
        lastError: errorMsg || "Unknown Error",
        nextRetryAt,
      },
    });
    return false;
  }
}

export interface GitWebhookPayload {
  provider: "github" | "gitlab" | "bitbucket";
  repoFullName: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
  sender: string;
  eventType: "push" | "pull_request";
  prNumber?: number;
}

/**
 * Verifies the signature of Git webhooks based on the provider specifications.
 */
export function verifyGitWebhookSignature(
  signature: string | null,
  rawBody: string,
  secret: string | null,
  provider: "github" | "gitlab" | "bitbucket"
): boolean {
  if (!secret) {
    return true;
  }
  if (!signature) {
    return false;
  }

  if (provider === "github") {
    const computedSignature =
      "sha256=" +
      crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
  }

  if (provider === "gitlab") {
    return signature === secret;
  }

  if (provider === "bitbucket") {
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    return signature === computedSignature;
  }

  return false;
}

/**
 * Standardizes the webhook payload schemas across different Git providers.
 */
export function parseGitWebhookPayload(
  payload: any,
  provider: "github" | "gitlab" | "bitbucket"
): GitWebhookPayload | null {
  try {
    if (provider === "github") {
      const isPr = !!payload.pull_request;
      return {
        provider,
        repoFullName: payload.repository?.full_name || "",
        branch: isPr
          ? payload.pull_request?.base?.ref || "main"
          : payload.ref?.replace("refs/heads/", "") || "main",
        commitHash: isPr
          ? payload.pull_request?.head?.sha || ""
          : payload.after || "",
        commitMessage: isPr
          ? payload.pull_request?.title || ""
          : payload.head_commit?.message || "Triggered by push",
        sender: payload.sender?.login || "unknown",
        eventType: isPr ? "pull_request" : "push",
        prNumber: payload.number,
      };
    }

    if (provider === "gitlab") {
      const eventName = payload.object_kind || "push";
      const isPr = eventName === "merge_request";
      return {
        provider,
        repoFullName: payload.project?.path_with_namespace || "",
        branch: isPr
          ? payload.object_attributes?.target_branch || "main"
          : payload.ref?.replace("refs/heads/", "") || "main",
        commitHash: isPr
          ? payload.object_attributes?.last_commit?.id || ""
          : payload.after || "",
        commitMessage: isPr
          ? payload.object_attributes?.title || ""
          : payload.commits?.[0]?.message || "Triggered by GitLab push",
        sender: payload.user?.username || payload.user_username || "unknown",
        eventType: isPr ? "pull_request" : "push",
        prNumber: isPr ? payload.object_attributes?.iid : undefined,
      };
    }

    if (provider === "bitbucket") {
      const isPr = !!payload.pullrequest;
      return {
        provider,
        repoFullName: payload.repository?.full_name || "",
        branch: isPr
          ? payload.pullrequest?.destination?.branch?.name || "main"
          : payload.push?.changes?.[0]?.new?.name || "main",
        commitHash: isPr
          ? payload.pullrequest?.source?.commit?.hash || ""
          : payload.push?.changes?.[0]?.new?.target?.hash || "",
        commitMessage: isPr
          ? payload.pullrequest?.title || ""
          : payload.push?.changes?.[0]?.new?.target?.message || "Triggered by Bitbucket push",
        sender: payload.actor?.username || "unknown",
        eventType: isPr ? "pull_request" : "push",
        prNumber: isPr ? payload.pullrequest?.id : undefined,
      };
    }
  } catch (err) {
    console.error(`[Webhook Parser ERROR] Failed parsing payload for provider ${provider}:`, err);
  }
  return null;
}

/**
 * Enqueues a standardized Git webhook payload into a Redis List acting as Ingestion Queue.
 */
export async function enqueueGitWebhook(payload: GitWebhookPayload): Promise<boolean> {
  const { getNativeRedis } = await import("./native-platform/redis");
  const redis = getNativeRedis();
  if (!redis) {
    console.warn("[Webhook Ingestion Queue] Redis not active. Processing webhook synchronously.");
    return false;
  }

  try {
    const queueKey = "git:webhook:queue";
    await redis.rpush(queueKey, JSON.stringify({ ...payload, enqueuedAt: new Date().toISOString() }));
    console.log(`[Webhook Ingestion Queue] Enqueued push/PR event for ${payload.repoFullName} (${payload.provider})`);
    return true;
  } catch (err: any) {
    console.error("[Webhook Ingestion Queue ERROR] Failed to enqueue webhook:", err.message);
    return false;
  }
}
