import { Vercel } from "@vercel/sdk";
import { prisma } from "@/lib/server/prisma";
import { decryptSecret } from "@/lib/server/secret-crypto";

export const VERCEL_RETRY_CONFIG = {
  retries: {
    strategy: "backoff" as const,
    backoff: {
      initialInterval: 500,
      maxInterval: 10000,
      exponent: 1.5,
      maxElapsedTime: 30000,
    },
    retryConnectionErrors: true,
  },
};

export async function getVercelClient(userId: string): Promise<Vercel> {
  const connection = await prisma.workspaceProviderConnection.findFirst({
    where: {
      provider: "vercel",
      status: "active",
      organization: { OR: [{ userId }, { members: { some: { userId, inviteStatus: "accepted" } } }] },
    },
    select: { encryptedCredential: true },
  });
  const rows = connection ? [] : await prisma.$queryRawUnsafe<Array<{ encrypted_value: string }>>(
    "SELECT encrypted_value FROM user_secrets WHERE user_id = $1 AND provider = $2 LIMIT 1",
    userId,
    "vercel"
  );
  const encryptedCredential = connection?.encryptedCredential || rows[0]?.encrypted_value;

  if (!encryptedCredential) {
    throw new Error("Vercel API key is not configured. Please set it in Settings.");
  }

  const apiKey = decryptSecret(encryptedCredential);
  return new Vercel({
    bearerToken: apiKey,
  });
}

export async function hasVercelApiKey(userId: string): Promise<boolean> {
  try {
    const connection = await prisma.workspaceProviderConnection.findFirst({
      where: {
        provider: "vercel",
        status: "active",
        organization: { OR: [{ userId }, { members: { some: { userId, inviteStatus: "accepted" } } }] },
      },
      select: { id: true },
    });
    if (connection) return true;
    const rows = await prisma.$queryRawUnsafe<Array<{ encrypted_value: string }>>(
      "SELECT encrypted_value FROM user_secrets WHERE user_id = $1 AND provider = $2 LIMIT 1",
      userId,
      "vercel"
    );
    return !!rows && rows.length > 0;
  } catch (error) {
    console.error("Error checking Vercel API key:", error);
    return false;
  }
}

export async function testVercelToken(apiKey: string): Promise<boolean> {
  const vercel = new Vercel({
    bearerToken: apiKey,
  });

  await vercel.user.getAuthUser();
  return true;
}

export async function getAuthorizedVercelClient(
  currentUserId: string,
  vercelProjectId: string,
  minRole: "admin" | "editor" | "viewer"
): Promise<{ vercel: Vercel; ownerId: string }> {
  // 1. Fetch project with organization and bundle details (collaborators)
  const project = await prisma.project.findFirst({
    where: { vercelProjectId, deletedAt: null },
    include: {
      organization: {
        select: {
          userId: true, // Organization owner user ID
        },
      },
      bundle: {
        select: {
          id: true,
          collaborators: {
            where: { userId: currentUserId },
          },
        },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found in workspace records.");
  }

  const ownerId = project.organization.userId;
  
  // 2. Check if current user is owner
  if (currentUserId === ownerId) {
    // Owner always has full access (admin equivalent)
    const vercel = await getVercelClient(ownerId);
    return { vercel, ownerId };
  }

  // 3. Otherwise, check collaborator entry
  const collaborator = project.bundle?.collaborators[0];
  if (!collaborator) {
    throw new Error("You do not have collaborator access to this project.");
  }

  // 4. Validate roles
  const role = collaborator.role;
  if (minRole === "admin" && role !== "admin") {
    throw new Error("Access denied: Only administrators are authorized to perform this operation.");
  }
  if (minRole === "editor" && role !== "admin" && role !== "editor") {
    throw new Error("Access denied: You must be an editor or administrator to perform this operation.");
  }

  // Collaborator is authorized! Let's use the owner's Vercel client.
  const vercel = await getVercelClient(ownerId);
  return { vercel, ownerId };
}

export interface MultiProviderConfig {
  provider: "vercel" | "netlify" | "aws" | "cloudflare";
  accountId?: string;
  projectId?: string;
  edgeConfigId?: string;
}

export async function getProviderClient(
  userId: string,
  config: MultiProviderConfig
): Promise<any> {
  const { provider, accountId } = config;
  const providerKey = accountId ? `${provider}_${accountId}` : provider;

  const workspaceConnection = await prisma.workspaceProviderConnection.findFirst({
    where: {
      provider: providerKey,
      status: "active",
      organization: {
        OR: [
          { userId },
          { members: { some: { userId, inviteStatus: "accepted" } } },
        ],
      },
    },
    select: { encryptedCredential: true },
  });
  const legacyRows = workspaceConnection ? [] : await prisma.$queryRawUnsafe<Array<{ encrypted_value: string }>>(
    "SELECT encrypted_value FROM user_secrets WHERE user_id = $1 AND provider = $2 LIMIT 1",
    userId,
    providerKey
  );
  const encryptedCredential = workspaceConnection?.encryptedCredential || legacyRows[0]?.encrypted_value;

  if (!encryptedCredential) {
    throw new Error(`API key for provider ${providerKey} is not configured.`);
  }

  const apiKey = decryptSecret(encryptedCredential);
  
  if (provider === "vercel") {
    return new Vercel({ bearerToken: apiKey });
  } else if (provider === "cloudflare") {
    return {
      provider,
      kv: {
        getVal: async (namespaceId: string, key: string) => {
          console.log(`[Cloudflare Client] GET KV key: ${key}`);
          try {
            const res = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`,
              {
                method: "GET",
                headers: {
                  "Authorization": `Bearer ${apiKey}`,
                },
              }
            );
            if (!res.ok) throw new Error(`CF error status ${res.status}`);
            return await res.text();
          } catch (e: any) {
            throw new Error(`Cloudflare KV read failed: ${e.message}`);
          }
        },
        putVal: async (namespaceId: string, key: string, value: string) => {
          console.log(`[Cloudflare Client] PUT KV key: ${key} = ${value}`);
          try {
            const res = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`,
              {
                method: "PUT",
                headers: {
                  "Authorization": `Bearer ${apiKey}`,
                  "Content-Type": "text/plain",
                },
                body: value,
              }
            );
            if (!res.ok) throw new Error(`CF error status ${res.status}`);
            return { success: true };
          } catch (e: any) {
            throw new Error(`Cloudflare KV write failed: ${e.message}`);
          }
        },
        deleteVal: async (namespaceId: string, key: string) => {
          console.log(`[Cloudflare Client] DELETE KV key: ${key}`);
          try {
            const res = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`,
              {
                method: "DELETE",
                headers: {
                  "Authorization": `Bearer ${apiKey}`,
                },
              }
            );
            if (!res.ok) throw new Error(`CF error status ${res.status}`);
            return { success: true };
          } catch (e: any) {
            throw new Error(`Cloudflare KV delete failed: ${e.message}`);
          }
        },
      },
    };
  } else if (provider === "netlify") {
    throw new Error("Netlify provider adapter is not implemented. No changes were applied.");
  } else {
    throw new Error(`${provider} provider adapter is not implemented. No changes were applied.`);
  }
}

/**
 * Centrally manages and synchronizes Edge Config across all linked providers.
 */
export async function syncCentralEdgeConfig(
  userId: string,
  projectProviders: MultiProviderConfig[],
  items: Array<{ operation: "create" | "update" | "upsert" | "delete"; key: string; value?: any }>
): Promise<boolean> {
  console.log(`[CentralEdgeConfig] Syncing Edge Config for ${projectProviders.length} providers...`);
  const promises = projectProviders.map(async (p) => {
    try {
      const client = await getProviderClient(userId, p);
      if (p.provider === "vercel") {
        if (p.edgeConfigId) {
          console.log(`[Vercel SDK] Patching Edge Config ${p.edgeConfigId} for project ${p.projectId}`);
          await client.edgeConfig.patchEdgeConfigItems({
            edgeConfigId: p.edgeConfigId,
            requestBody: { items }
          }, VERCEL_RETRY_CONFIG);
        } else {
          console.log(`[Vercel SDK] Missing edgeConfigId for project ${p.projectId}, skipped.`);
        }
      } else if (p.provider === "cloudflare" && p.projectId) {
        // For Cloudflare, projectId is the KV namespace ID
        const namespaceId = p.projectId;
        console.log(`[Cloudflare KV] Syncing to namespace ${namespaceId}`);
        for (const item of items) {
          if (item.operation === "delete") {
            await client.kv.deleteVal(namespaceId, item.key);
          } else {
            const stringVal = typeof item.value === "object" ? JSON.stringify(item.value) : String(item.value);
            await client.kv.putVal(namespaceId, item.key, stringVal);
          }
        }
      } else if (p.provider === "netlify") {
        await client.edgeConfig.sync(items);
      } else {
        await client.syncConfig(items);
      }
      return true;
    } catch (e: any) {
      console.error(`[CentralEdgeConfig] Failed to sync to ${p.provider}:`, e.message);
      return false;
    }
  });

  const results = await Promise.all(promises);
  return results.every(Boolean);
}
