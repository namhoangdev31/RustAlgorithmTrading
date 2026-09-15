import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { decryptSecret } from "@/lib/server/secret-crypto";
import {
  verifyGitWebhookSignature,
  parseGitWebhookPayload,
  enqueueGitWebhook,
} from "@/lib/server/webhooks";

export async function POST(request: NextRequest) {
  const headers = request.headers;

  let provider: "github" | "gitlab" | "bitbucket" = "github";
  let signature: string | null = null;

  if (headers.get("x-github-event")) {
    provider = "github";
    signature = headers.get("x-hub-signature-256");
  } else if (headers.get("x-gitlab-event")) {
    provider = "gitlab";
    signature = headers.get("x-gitlab-token");
  } else if (headers.get("x-event-key")) {
    provider = "bitbucket";
    signature = headers.get("x-bitbucket-signature");
  } else {
    
    const urlProvider = request.nextUrl.searchParams.get("provider");
    if (urlProvider === "gitlab") provider = "gitlab";
    else if (urlProvider === "bitbucket") provider = "bitbucket";
  }

  let rawBody = "";
  let payload: any = null;

  try {
    rawBody = await request.text();
    payload = JSON.parse(rawBody);
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let repoName = "";
  if (provider === "github") {
    repoName = payload?.repository?.full_name || "";
  } else if (provider === "gitlab") {
    repoName = payload?.project?.path_with_namespace || "";
  } else if (provider === "bitbucket") {
    repoName = payload?.repository?.full_name || "";
  }

  if (!repoName) {
    return NextResponse.json({ error: "Missing repository identity" }, { status: 400 });
  }

  const integration = await prisma.bundleExternalIntegrations.findFirst({
    where: {
      integrationType: provider,
      displayName: repoName,
      isActive: true,
    },
  });

  if (!integration) {
    return NextResponse.json(
      { error: `No active ${provider} integration configured for repository: ${repoName}` },
      { status: 404 }
    );
  }

  let webhookSecret: string | null = null;
  try {
    const configObj = JSON.parse(integration.config || "{}");
    const secretToken = configObj.webhookSecret || configObj.secretToken || configObj.authSecret;
    if (secretToken) {
      webhookSecret = decryptSecret(secretToken);
    }
  } catch (decryptErr) {
    console.error("[Git Webhook] Failed decrypting integration secret token:", decryptErr);
  }

  const isSignatureValid = verifyGitWebhookSignature(
    signature,
    rawBody,
    webhookSecret,
    provider
  );

  if (!isSignatureValid) {
    console.warn(`[Git Webhook Warning] Webhook signature verification failed for provider: ${provider}, Repo: ${repoName}`);
    return NextResponse.json({ error: "Webhook signature mismatch" }, { status: 401 });
  }

  const parsed = parseGitWebhookPayload(payload, provider);
  if (!parsed) {
    return NextResponse.json({ error: "Failed to map payload schemas" }, { status: 422 });
  }

  const enqueued = await enqueueGitWebhook(parsed);

  return NextResponse.json(
    {
      status: enqueued ? "queued" : "processed_synced",
      provider,
      repository: repoName,
      branch: parsed.branch,
      timestamp: new Date().toISOString(),
    },
    { status: 202 }
  );
}
