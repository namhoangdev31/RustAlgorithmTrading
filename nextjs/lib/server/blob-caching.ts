import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { resolveMasterKey } from "./secret-crypto";

function replicationConfig() {
  const endpoint = process.env.LEPOS_REPLICATION_ADAPTER_ENDPOINT;
  const regions = (process.env.LEPOS_REPLICA_REGIONS || "")
    .split(",")
    .map((region) => region.trim())
    .filter(Boolean);
  return { endpoint, regions, token: process.env.LEPOS_REPLICATION_ADAPTER_TOKEN };
}

export async function replicateBlobToRegions(
  projectId: string,
  safeFileName: string,
  sourceFilePath: string
): Promise<string[]> {
  const { endpoint, regions: targetRegions, token } = replicationConfig();
  if (!endpoint || targetRegions.length === 0) return [];
  const replicated: string[] = [];
  const content = await fs.readFile(sourceFilePath);
  const checksum = crypto.createHash("sha256").update(content).digest("hex");

  for (const region of targetRegions) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: "replicate", projectId, fileName: safeFileName, region, checksum, content: content.toString("base64") }),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`Replication adapter returned HTTP ${response.status}.`);
      replicated.push(region);
    } catch {
      continue;
    }
  }

  return replicated;
}

/**
 * Generates the unified CDN endpoint URL.
 */
export function getCdnUrl(projectId: string, safeFileName: string): string {
  return `https://cdn.lepos.dev/bundles/${projectId}/${safeFileName}`;
}

/**
 * Checks if a file is sensitive based on its name/extension.
 */
export function isSensitiveFile(fileName: string): boolean {
  const name = fileName.toLowerCase();
  return (
    name.endsWith(".pem") ||
    name.endsWith(".env") ||
    name.endsWith(".key") ||
    name.startsWith("sensitive-") ||
    name.startsWith("secret-") ||
    name.startsWith("private-") ||
    name.includes("credential") ||
    name.includes("config")
  );
}

/**
 * Encrypts a buffer if the file is sensitive.
 */
export async function encryptBufferIfNeeded(fileName: string, buffer: Buffer): Promise<Buffer> {
  if (isSensitiveFile(fileName)) {
    console.log(`[Encryption at Rest] Encrypting sensitive file: ${fileName}`);
    const iv = crypto.randomBytes(12);
    const key = resolveMasterKey();
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const tag = cipher.getAuthTag();
    const magic = "LEPOS_ENC_V1:";
    const payload = `${magic}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
    return Buffer.from(payload, "utf8");
  }
  return buffer;
}

/**
 * Decrypts file content buffer if it was encrypted.
 */
export async function decryptFileIfNeeded(filePath: string): Promise<Buffer> {
  const content = await fs.readFile(filePath);
  const magic = "LEPOS_ENC_V1:";
  
  if (content.length >= magic.length && content.toString("utf8", 0, magic.length) === magic) {
    console.log(`[Encryption at Rest] Decrypting sensitive file on the fly: ${path.basename(filePath)}`);
    const payload = content.toString("utf8", magic.length);
    const [iv64, tag64, data64] = payload.split(":");
    if (!iv64 || !tag64 || !data64) {
      throw new Error("Invalid encrypted file format.");
    }
    const key = resolveMasterKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv64, "base64"));
    decipher.setAuthTag(Buffer.from(tag64, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(data64, "base64")),
      decipher.final(),
    ]);
    return decrypted;
  }
  return content;
}

export interface RegionVerificationResult {
  region: string;
  status: "healthy" | "healed" | "failed";
  error?: string;
}

/**
 * Verifies SHA-256 integrity of all replicas, auto-healing any missing or corrupted replica files.
 */
export async function verifyAndAutoHealReplicas(
  projectId: string,
  safeFileName: string,
  sourceFilePath: string
): Promise<RegionVerificationResult[]> {
  const { endpoint, regions: targetRegions, token } = replicationConfig();
  if (!endpoint || targetRegions.length === 0) return [];
  const results: RegionVerificationResult[] = [];
  const sourceBuffer = await fs.readFile(sourceFilePath);
  const checksum = crypto.createHash("sha256").update(sourceBuffer).digest("hex");
  for (const region of targetRegions) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: "verify-and-heal", projectId, fileName: safeFileName, region, checksum, content: sourceBuffer.toString("base64") }),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !["healthy", "healed"].includes(payload?.status)) throw new Error(`Replication adapter returned HTTP ${response.status}.`);
      results.push({ region, status: payload.status });
    } catch (error) {
      results.push({ region, status: "failed", error: error instanceof Error ? error.message : "Replica verification failed." });
    }
  }

  return results;
}
