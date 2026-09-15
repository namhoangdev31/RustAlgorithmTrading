import { prisma } from "./prisma";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

interface SIEMConfig {
  splunkEndpoint?: string;
  splunkToken?: string;
  datadogApiKey?: string;
  datadogSite?: string;
  s3Bucket?: string;
  s3Region?: string;
  isActive?: boolean;
  logSchemaMapping?: Record<string, string>;
}

function mapLogSchema(logEntry: any, schemaMapping?: Record<string, string>): any {
  if (!schemaMapping || Object.keys(schemaMapping).length === 0) {
    return logEntry;
  }
  const mappedEntry: any = {};
  for (const [key, value] of Object.entries(logEntry)) {
    const mappedKey = schemaMapping[key] || key;
    mappedEntry[mappedKey] = value;
  }
  return mappedEntry;
}

async function retryWithBackoff(
  fn: () => Promise<boolean>,
  onFailure: (lastError: string) => Promise<void>,
  maxRetries = 3
) {
  (async () => {
    let success = false;
    let lastError = "Unknown error";
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        success = await fn();
        if (success) break;
      } catch (err: any) {
        lastError = err.message || String(err);
      }
      
      const delay = Math.pow(2, attempt + 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    if (!success) {
      await onFailure(lastError);
    }
  })();
}

async function writeToDlq(bundleId: string, destination: string, errorMsg: string, event: any) {
  try {
    const dlqDir = path.join(process.cwd(), "public", "bundles", "siem-dlq", bundleId);
    const dlqFile = path.join(dlqDir, "dlq.jsonl");

    await fs.mkdir(dlqDir, { recursive: true });
    const dlqPayload = {
      dlqId: crypto.randomUUID(),
      failedAt: new Date().toISOString(),
      destination,
      error: errorMsg,
      event,
    };
    const logLine = JSON.stringify(dlqPayload) + "\n";
    await fs.appendFile(dlqFile, logLine, "utf-8");
    console.log(`[SIEM DLQ] Event written to DLQ for bundle ${bundleId} (destination: ${destination}): ${errorMsg}`);
  } catch (err: any) {
    console.error("[SIEM DLQ] Failed to write to DLQ file:", err.message);
  }
}

export async function streamAuditLog(bundleId: string, logEntry: any) {
  try {
    
    const integrations = await prisma.bundleExternalIntegrations.findMany({
      where: {
        bundleId,
        isActive: true,
      },
    });

    if (integrations.length === 0) return;

    for (const integration of integrations) {
      let config: SIEMConfig = {};
      try {
        config = JSON.parse(integration.config);
      } catch {
        continue;
      }

      const policyText = (config as any).policy || "";
      const isEnterprise = integration.integrationType === "enterprise_controls";

      const splunkEndpoint = config.splunkEndpoint || extractPolicyValue(policyText, "splunk_endpoint") || (config as any).endpoint;
      const splunkToken = config.splunkToken || extractPolicyValue(policyText, "splunk_token");

      if (splunkEndpoint && splunkToken && (isEnterprise || integration.integrationType === "splunk")) {
        await sendToSplunk(splunkEndpoint, splunkToken, logEntry, config.logSchemaMapping, bundleId);
      }

      const datadogApiKey = config.datadogApiKey || extractPolicyValue(policyText, "datadog_api_key");
      const datadogSite = config.datadogSite || extractPolicyValue(policyText, "datadog_site") || "datadoghq.com";

      if (datadogApiKey && (isEnterprise || integration.integrationType === "datadog")) {
        await sendToDatadog(datadogApiKey, datadogSite, logEntry, config.logSchemaMapping, bundleId);
      }

      const s3Bucket = config.s3Bucket || extractPolicyValue(policyText, "s3_bucket") || "lepos-audit-logs";
      const s3Region = config.s3Region || extractPolicyValue(policyText, "s3_region") || "us-east-1";

      if (s3Bucket && (isEnterprise || integration.integrationType === "aws_s3")) {
        await sendToS3(bundleId, s3Bucket, s3Region, logEntry, config.logSchemaMapping);
      }
    }
  } catch (error) {
    console.error("[AuditStream] Error streaming audit log:", error);
  }
}

export async function streamWorkspaceAudit(organizationId: string, auditEntry: any) {
  try {
    
    const projects = await prisma.project.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      select: {
        bundle: {
          select: { id: true },
        },
      },
    });

    const bundleIds = projects.flatMap((p) => (p.bundle ? [p.bundle.id] : []));

    for (const bundleId of bundleIds) {
      await streamAuditLog(bundleId, {
        ...auditEntry,
        scope: "workspace",
        organizationId,
      });
    }
  } catch (error) {
    console.error("[AuditStream] Error streaming workspace audit log:", error);
  }
}

function extractPolicyValue(policyText: string, key: string): string | null {
  if (!policyText) return null;
  
  const regex = new RegExp(`${key}\\s*[:=]\\s*([^\\s,;\\n]+)`, "i");
  const match = policyText.match(regex);
  return match ? match[1].trim() : null;
}

async function sendToSplunk(
  endpoint: string,
  token: string,
  event: any,
  schemaMapping?: Record<string, string>,
  bundleId?: string
) {
  const mappedEvent = mapLogSchema(event, schemaMapping);

  const performSend = async (): Promise<boolean> => {
    console.log(`[SIEM Splunk] Streaming event to ${endpoint}...`);
    const payload = {
      time: Math.floor(Date.now() / 1000),
      host: "lepos-platform",
      source: "audit-trail",
      sourcetype: "_json",
      event: mappedEvent,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Splunk ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Splunk HEC responded with status: ${response.status}`);
    }
    console.log(`[SIEM Splunk] Successfully streamed log.`);
    return true;
  };

  await retryWithBackoff(
    performSend,
    async (lastError) => {
      if (bundleId) {
        await writeToDlq(bundleId, "splunk", lastError, mappedEvent);
      }
    }
  );
}

async function sendToDatadog(
  apiKey: string,
  site: string,
  event: any,
  schemaMapping?: Record<string, string>,
  bundleId?: string
) {
  const mappedEvent = mapLogSchema(event, schemaMapping);

  const performSend = async (): Promise<boolean> => {
    const endpoint = `https://http-intake.logs.${site}/api/v2/logs`;
    console.log(`[SIEM Datadog] Streaming event to Datadog (${site})...`);
    
    const payload = {
      message: `Audit Event: ${mappedEvent.action || mappedEvent.title || "Unknown Action"}`,
      ddsource: "lepos",
      ddtags: `env:production,action:${mappedEvent.action || "workspace_event"}`,
      hostname: "lepos-platform",
      service: "audit-trail",
      audit: mappedEvent,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "DD-API-KEY": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Datadog logs API responded with status: ${response.status}`);
    }
    console.log(`[SIEM Datadog] Successfully streamed log.`);
    return true;
  };

  await retryWithBackoff(
    performSend,
    async (lastError) => {
      if (bundleId) {
        await writeToDlq(bundleId, "datadog", lastError, mappedEvent);
      }
    }
  );
}

async function sendToS3(
  bundleId: string,
  bucket: string,
  region: string,
  event: any,
  schemaMapping?: Record<string, string>
) {
  const mappedEvent = mapLogSchema(event, schemaMapping);

  const performSend = async (): Promise<boolean> => {
    const endpoint = process.env.LEPOS_AUDIT_S3_ADAPTER_ENDPOINT;
    if (!endpoint) throw new Error("AWS S3 audit adapter is not configured.");
    const token = process.env.LEPOS_AUDIT_S3_ADAPTER_TOKEN;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ bucket, region, bundleId, event: { ...mappedEvent, streamedAt: new Date().toISOString() } }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`AWS S3 audit adapter returned HTTP ${response.status}.`);
    return true;
  };

  await retryWithBackoff(
    performSend,
    async (lastError) => {
      await writeToDlq(bundleId, "aws_s3", lastError, mappedEvent);
    }
  );
}

let lastLogSignature = "0000000000000000000000000000000000000000000000000000000000000000";
const AUDIT_LOG_KEY = process.env.AUDIT_LOG_KEY
  ? crypto.scryptSync(process.env.AUDIT_LOG_KEY, "salt", 32)
  : crypto.randomBytes(32);

export async function encryptAndChainLog(logEntry: any): Promise<{
  encrypted: { iv: string; content: string; tag: string };
  signature: string;
  previousSignature: string;
}> {
  const plainText = JSON.stringify(logEntry);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", AUDIT_LOG_KEY, iv);
  
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  const prevSignature = lastLogSignature;
  const currentSignature = crypto
    .createHash("sha256")
    .update(encrypted + prevSignature)
    .digest("hex");
  
  lastLogSignature = currentSignature;

  return {
    encrypted: {
      iv: iv.toString("hex"),
      content: encrypted,
      tag
    },
    signature: currentSignature,
    previousSignature: prevSignature
  };
}
