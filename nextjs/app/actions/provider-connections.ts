"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/portal/action-result";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireWorkspaceRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";
import { encryptSecret } from "@/lib/server/secret-crypto";
import { testVercelToken } from "@/lib/server/vercel";

const supportedProviders = ["github", "vercel", "cloudflare", "stripe"] as const;
type SupportedProvider = typeof supportedProviders[number];

async function validateProviderCredential(provider: SupportedProvider, credential: string) {
  if (provider === "vercel") {
    if (!await testVercelToken(credential)) throw new Error("Vercel rejected this token.");
    return;
  }

  const request: { url: string; headers: Record<string, string> } = provider === "github"
    ? { url: "https://api.github.com/user", headers: { authorization: `Bearer ${credential}`, accept: "application/vnd.github+json" } }
    : provider === "cloudflare"
      ? { url: "https://api.cloudflare.com/client/v4/user/tokens/verify", headers: { authorization: `Bearer ${credential}` } }
      : { url: "https://api.stripe.com/v1/account", headers: { authorization: `Basic ${Buffer.from(`${credential}:`).toString("base64")}` } };

  const response = await fetch(request.url, {
    headers: request.headers,
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`${provider} rejected the credential with HTTP ${response.status}.`);
}

export async function connectWorkspaceProviderAction(input: {
  organizationId: string;
  provider: string;
  credential: string;
}): Promise<ActionResult> {
  const user = await requireCurrentUser();
  await requireWorkspaceRole(user.id, input.organizationId, "admin");
  const provider = input.provider.toLowerCase() as SupportedProvider;
  if (!supportedProviders.includes(provider) || !input.credential.trim()) {
    return { ok: false, code: "VALIDATION_ERROR", message: "Choose a supported provider and enter its credential." };
  }

  try {
    await validateProviderCredential(provider, input.credential.trim());
    await prisma.$transaction([
      prisma.workspaceProviderConnection.upsert({
        where: { organizationId_provider: { organizationId: input.organizationId, provider } },
        create: {
          organizationId: input.organizationId,
          provider,
          encryptedCredential: encryptSecret(input.credential.trim()),
          status: "active",
        },
        update: {
          encryptedCredential: encryptSecret(input.credential.trim()),
          status: "active",
        },
      }),
      prisma.workspaceAuditEvent.create({
        data: {
          workspaceId: input.organizationId,
          actorId: user.id,
          actorEmail: user.email || "unknown",
          action: "provider.connected",
          resourceType: "workspace_provider_connection",
          resourceId: provider,
          metadata: { provider },
        },
      }),
    ]);
    revalidatePath("/integrations");
    return { ok: true, code: "PROVIDER_CONNECTED", message: `${provider} connected.` };
  } catch (error) {
    return { ok: false, code: "PROVIDER_UNAVAILABLE", message: error instanceof Error ? error.message : "Provider validation failed." };
  }
}

export async function disconnectWorkspaceProviderAction(input: {
  organizationId: string;
  connectionId: string;
}): Promise<ActionResult> {
  const user = await requireCurrentUser();
  await requireWorkspaceRole(user.id, input.organizationId, "admin");
  const connection = await prisma.workspaceProviderConnection.findFirst({
    where: { id: input.connectionId, organizationId: input.organizationId },
    select: { id: true, provider: true },
  });
  if (!connection) return { ok: false, code: "NOT_FOUND", message: "Provider connection not found." };

  await prisma.$transaction([
    prisma.projectProviderBinding.deleteMany({ where: { connectionId: connection.id } }),
    prisma.workspaceProviderConnection.delete({ where: { id: connection.id } }),
    prisma.workspaceAuditEvent.create({
      data: {
        workspaceId: input.organizationId,
        actorId: user.id,
        actorEmail: user.email || "unknown",
        action: "provider.disconnected",
        resourceType: "workspace_provider_connection",
        resourceId: connection.provider,
        metadata: { provider: connection.provider },
      },
    }),
  ]);
  revalidatePath("/integrations");
  return { ok: true, code: "PROVIDER_DISCONNECTED", message: `${connection.provider} disconnected.` };
}
