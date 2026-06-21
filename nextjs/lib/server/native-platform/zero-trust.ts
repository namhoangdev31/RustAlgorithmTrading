import { createCipheriv, createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/server/prisma";

type UpsertServiceIdentityInput = {
  projectId: string;
  serviceName: string;
  role?: string;
  scopes?: string[];
  mtlsMode?: "disabled" | "optional" | "required";
  status?: string;
  sharedSecret?: string | null;
  certificateFingerprint?: string | null;
  metadata?: unknown;
};

type UpsertTrustPolicyInput = {
  projectId: string;
  sourceService: string;
  targetService: string;
  allowedScopes: string[];
  enforceMtls?: boolean;
  allowSharedKeyFallback?: boolean;
  status?: string;
  metadata?: unknown;
};

type IngestTelemetryEnvelopeInput = {
  projectId: string;
  serviceName?: string | null;
  kind: string;
  encryptionMode?: string;
  aggregateKey?: string | null;
  redactedSummary?: unknown;
  metadata?: unknown;
  rawPayload?: unknown;
};

function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

function getTelemetryEncryptionMaterial() {
  const rawKey = process.env.LEPOS_NATIVE_TELEMETRY_KEY || "";
  if (!rawKey) {
    return null;
  }

  return {
    key: createHash("sha256").update(rawKey).digest(),
    keyVersion: process.env.LEPOS_NATIVE_TELEMETRY_KEY_VERSION || "v1",
  };
}

function encryptTelemetryPayload(payload: unknown) {
  const material = getTelemetryEncryptionMaterial();
  if (!material) {
    return {
      ciphertext: null,
      nonce: null,
      keyVersion: null,
    };
  }

  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", material.key, nonce);
  const plaintext = Buffer.from(JSON.stringify(payload ?? {}), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: Buffer.concat([encrypted, tag]).toString("base64"),
    nonce: nonce.toString("base64"),
    keyVersion: material.keyVersion,
  };
}

export function compareServiceSecret(secret: string, secretHash: string | null | undefined) {
  if (!secretHash) {
    return false;
  }
  return hashSecret(secret) === secretHash;
}

export async function listServiceIdentities(projectId: string) {
  return prisma.nativeServiceIdentity.findMany({
    where: { projectId },
    orderBy: { serviceName: "asc" },
  });
}

export async function listServiceTrustPolicies(projectId: string) {
  return prisma.nativeServiceTrustPolicy.findMany({
    where: { projectId },
    orderBy: [{ sourceService: "asc" }, { targetService: "asc" }],
  });
}

export async function listTelemetryEnvelopes(projectId: string) {
  return prisma.nativeTelemetryEnvelope.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
}

export async function upsertServiceIdentity(input: UpsertServiceIdentityInput) {
  return prisma.nativeServiceIdentity.upsert({
    where: {
      projectId_serviceName: {
        projectId: input.projectId,
        serviceName: input.serviceName,
      },
    },
    create: {
      projectId: input.projectId,
      serviceName: input.serviceName,
      role: input.role || "internal",
      scopes: input.scopes || [],
      mtlsMode: input.mtlsMode || "optional",
      status: input.status || "active",
      sharedSecretHash: input.sharedSecret ? hashSecret(input.sharedSecret) : null,
      certificateFingerprint: input.certificateFingerprint || null,
      metadata: (input.metadata || null) as any,
    },
    update: {
      role: input.role || "internal",
      scopes: input.scopes || [],
      mtlsMode: input.mtlsMode || "optional",
      status: input.status || "active",
      sharedSecretHash: input.sharedSecret ? hashSecret(input.sharedSecret) : undefined,
      certificateFingerprint: input.certificateFingerprint || null,
      metadata: (input.metadata || null) as any,
      updatedAt: new Date(),
    },
  });
}

export async function upsertTrustPolicy(input: UpsertTrustPolicyInput) {
  return prisma.nativeServiceTrustPolicy.upsert({
    where: {
      projectId_sourceService_targetService: {
        projectId: input.projectId,
        sourceService: input.sourceService,
        targetService: input.targetService,
      },
    },
    create: {
      projectId: input.projectId,
      sourceService: input.sourceService,
      targetService: input.targetService,
      allowedScopes: input.allowedScopes,
      enforceMtls: input.enforceMtls ?? false,
      allowSharedKeyFallback: input.allowSharedKeyFallback ?? true,
      status: input.status || "active",
      metadata: (input.metadata || null) as any,
    },
    update: {
      allowedScopes: input.allowedScopes,
      enforceMtls: input.enforceMtls ?? false,
      allowSharedKeyFallback: input.allowSharedKeyFallback ?? true,
      status: input.status || "active",
      metadata: (input.metadata || null) as any,
      updatedAt: new Date(),
    },
  });
}

export async function ingestTelemetryEnvelope(input: IngestTelemetryEnvelopeInput) {
  const digest = input.rawPayload
    ? createHash("sha256").update(JSON.stringify(input.rawPayload)).digest("hex")
    : null;
  const encrypted = encryptTelemetryPayload(input.rawPayload);

  return prisma.nativeTelemetryEnvelope.create({
    data: {
      projectId: input.projectId,
      serviceName: input.serviceName || null,
      kind: input.kind,
      encryptionMode: input.encryptionMode || "aggregate",
      aggregateKey: input.aggregateKey || null,
      payloadDigest: digest,
      ciphertext: encrypted.ciphertext,
      nonce: encrypted.nonce,
      keyVersion: encrypted.keyVersion,
      redactedSummary: (input.redactedSummary || null) as any,
      metadata: (input.metadata || null) as any,
    },
  });
}

export async function summarizeTelemetryEnvelopes(projectId: string) {
  const envelopes = await prisma.nativeTelemetryEnvelope.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const counts = new Map<string, number>();
  for (const envelope of envelopes) {
    counts.set(envelope.kind, (counts.get(envelope.kind) || 0) + 1);
  }

  return {
    total: envelopes.length,
    byKind: Array.from(counts.entries()).map(([kind, count]) => ({ kind, count })),
  };
}
