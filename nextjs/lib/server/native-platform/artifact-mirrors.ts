import { createHash } from "node:crypto";

import { prisma } from "@/lib/server/prisma";

type PublishArtifactMirrorInput = {
  projectId: string;
  deploymentId: string;
  provider: "ipfs" | "arweave";
  policy?: "web2-only" | "hybrid" | "decentralized-preferred";
  requestedBy?: string | null;
};

type AdapterPublishResult = {
  locator: string;
  cid?: string | null;
  txId?: string | null;
  metadata?: Record<string, unknown>;
};

function buildDigest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function buildIpfsCid(seed: string) {
  return `bafy${seed.slice(0, 48)}`;
}

function buildArweaveTx(seed: string) {
  return seed.slice(0, 43);
}

export async function listArtifactMirrors(projectId: string) {
  return prisma.nativeArtifactMirror.findMany({
    where: { projectId },
    include: {
      deployment: {
        select: {
          version: true,
          target: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function publishArtifactMirror(input: PublishArtifactMirrorInput) {
  const deployment = await prisma.nativeDeployment.findFirst({
    where: {
      id: input.deploymentId,
      projectId: input.projectId,
    },
  });

  if (!deployment) {
    throw new Error("Deployment not found.");
  }

  const digest = buildDigest(
    [
      input.projectId,
      input.deploymentId,
      input.provider,
      deployment.version,
      deployment.storagePath,
      deployment.bundleUrl || "",
    ].join(":")
  );

  const policy = input.policy || "hybrid";

  const proofManifest = {
    digest,
    provider: input.provider,
    deploymentId: deployment.id,
    projectId: input.projectId,
    version: deployment.version,
    bundleUrl: deployment.bundleUrl,
    storagePath: deployment.storagePath,
    generatedAt: new Date().toISOString(),
  };

  const currentMirror = await prisma.nativeArtifactMirror.findFirst({
    where: {
      projectId: input.projectId,
      deploymentId: deployment.id,
      provider: input.provider,
    },
  });

  const attempt = (currentMirror?.retryCount || 0) + 1;

  try {
    const published = await publishViaAdapter({
      provider: input.provider,
      digest,
      deployment,
      proofManifest,
    });

    return prisma.nativeArtifactMirror.upsert({
      where: {
        deploymentId_provider: {
          deploymentId: deployment.id,
          provider: input.provider,
        },
      },
      create: {
        projectId: input.projectId,
        deploymentId: deployment.id,
        provider: input.provider,
        policy,
        status: "published",
        locator: published.locator,
        cid: published.cid || null,
        txId: published.txId || null,
        retryCount: attempt,
        lastError: null,
        proofManifest: proofManifest as any,
        metadata: {
          ...(published.metadata || {}),
          requestedBy: input.requestedBy || null,
        },
        publishedAt: new Date(),
      },
      update: {
        policy,
        status: "published",
        locator: published.locator,
        cid: published.cid || null,
        txId: published.txId || null,
        retryCount: attempt,
        lastError: null,
        proofManifest: proofManifest as any,
        metadata: {
          ...(published.metadata || {}),
          requestedBy: input.requestedBy || null,
        },
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error: any) {
    const fallbackCid = input.provider === "ipfs" ? buildIpfsCid(digest) : null;
    const fallbackTxId = input.provider === "arweave" ? buildArweaveTx(digest) : null;
    const fallbackLocator = input.provider === "ipfs" ? `ipfs://${fallbackCid}` : `ar://${fallbackTxId}`;

    return prisma.nativeArtifactMirror.upsert({
      where: {
        deploymentId_provider: {
          deploymentId: deployment.id,
          provider: input.provider,
        },
      },
      create: {
        projectId: input.projectId,
        deploymentId: deployment.id,
        provider: input.provider,
        policy,
        status: "failed",
        locator: fallbackLocator,
        cid: fallbackCid,
        txId: fallbackTxId,
        retryCount: attempt,
        lastError: error?.message || "Mirror publish failed.",
        proofManifest: proofManifest as any,
        metadata: {
          fallbackLocator,
          requestedBy: input.requestedBy || null,
        },
      },
      update: {
        policy,
        status: "failed",
        locator: fallbackLocator,
        cid: fallbackCid,
        txId: fallbackTxId,
        retryCount: attempt,
        lastError: error?.message || "Mirror publish failed.",
        proofManifest: proofManifest as any,
        metadata: {
          fallbackLocator,
          requestedBy: input.requestedBy || null,
        },
        updatedAt: new Date(),
      },
    });
  }
}

export async function deleteArtifactMirror(projectId: string, mirrorId: string) {
  await prisma.nativeArtifactMirror.deleteMany({
    where: {
      id: mirrorId,
      projectId,
    },
  });
}

export async function retryArtifactMirror(projectId: string, mirrorId: string) {
  const mirror = await prisma.nativeArtifactMirror.findFirst({
    where: { id: mirrorId, projectId },
  });
  if (!mirror) {
    throw new Error("Artifact mirror not found.");
  }

  return publishArtifactMirror({
    projectId,
    deploymentId: mirror.deploymentId,
    provider: mirror.provider as "ipfs" | "arweave",
    policy: mirror.policy as "web2-only" | "hybrid" | "decentralized-preferred",
  });
}

async function publishViaAdapter({
  provider,
  digest,
  deployment,
  proofManifest,
}: {
  provider: "ipfs" | "arweave";
  digest: string;
  deployment: { id: string; version: string; storagePath: string; bundleUrl: string | null; projectId: string };
  proofManifest: Record<string, unknown>;
}): Promise<AdapterPublishResult> {
  const endpoint =
    provider === "ipfs"
      ? process.env.LEPOS_IPFS_PIN_ENDPOINT
      : process.env.LEPOS_ARWEAVE_PUBLISH_ENDPOINT;
  const token =
    provider === "ipfs"
      ? process.env.LEPOS_IPFS_PIN_TOKEN
      : process.env.LEPOS_ARWEAVE_PUBLISH_TOKEN;

  if (!endpoint) {
    throw new Error(`${provider} adapter endpoint is not configured.`);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      provider,
      deploymentId: deployment.id,
      projectId: deployment.projectId,
      version: deployment.version,
      storagePath: deployment.storagePath,
      bundleUrl: deployment.bundleUrl,
      proofManifest,
      digest,
    }),
  });

  if (!response.ok) {
    throw new Error(`${provider} adapter returned ${response.status}.`);
  }

  const payload = await response.json().catch(() => ({}));
  if (provider === "ipfs") {
    const cid = String(payload.cid || payload.hash || "");
    if (!cid) {
      throw new Error("IPFS adapter response did not include cid.");
    }
    return {
      locator: `ipfs://${cid}`,
      cid,
      metadata: payload,
    };
  }

  const txId = String(payload.txId || payload.id || "");
  if (!txId) {
    throw new Error("Arweave adapter response did not include txId.");
  }

  return {
    locator: `ar://${txId}`,
    txId,
    metadata: payload,
  };
}
