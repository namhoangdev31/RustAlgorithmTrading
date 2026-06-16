import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { resolveMasterKey } from "./secret-crypto";

/**
 * Replicates the bundle blob file to mock cloud region storage directories
 * to simulate high-availability Cross-Region Replication (CRR).
 */
export async function replicateBlobToRegions(
  projectId: string,
  safeFileName: string,
  sourceFilePath: string
): Promise<string[]> {
  const targetRegions = ["us-east-1", "eu-central-1", "ap-southeast-1"];
  const replicated: string[] = [];

  console.log(`[Cross-Region Replication] Starting CRR for project: ${projectId}, file: ${safeFileName}`);

  for (const region of targetRegions) {
    try {
      // Simulate storage bucket structure for each region under public/bundles/regions
      const destDir = path.join(process.cwd(), "public", "bundles", "regions", region, projectId);
      await fs.mkdir(destDir, { recursive: true });

      const destPath = path.join(destDir, safeFileName);
      await fs.copyFile(sourceFilePath, destPath);

      console.log(`[Cross-Region Replication] Replicated successfully to bucket region [${region}]`);
      replicated.push(region);
    } catch (error: any) {
      console.error(`[Cross-Region Replication] Failed to replicate to region [${region}]:`, error.message);
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
  const targetRegions = ["us-east-1", "eu-central-1", "ap-southeast-1"];
  const results: RegionVerificationResult[] = [];

  try {
    const sourceBuffer = await fs.readFile(sourceFilePath);
    const sourceChecksum = crypto.createHash("sha256").update(sourceBuffer).digest("hex");

    for (const region of targetRegions) {
      const destDir = path.join(process.cwd(), "public", "bundles", "regions", region, projectId);
      const destPath = path.join(destDir, safeFileName);

      try {
        let exists = false;
        try {
          await fs.access(destPath);
          exists = true;
        } catch {
          exists = false;
        }

        if (!exists) {
          console.log(`[Auto-Heal] Replica missing in region [${region}] for file: ${safeFileName}. Healing...`);
          await fs.mkdir(destDir, { recursive: true });
          await fs.copyFile(sourceFilePath, destPath);
          results.push({ region, status: "healed" });
          continue;
        }

        const replicaBuffer = await fs.readFile(destPath);
        const replicaChecksum = crypto.createHash("sha256").update(replicaBuffer).digest("hex");

        if (replicaChecksum === sourceChecksum) {
          results.push({ region, status: "healthy" });
        } else {
          console.warn(`[Auto-Heal] Replica corrupted in region [${region}] for file: ${safeFileName}. Checksum mismatch! Healing...`);
          await fs.copyFile(sourceFilePath, destPath);
          results.push({ region, status: "healed" });
        }
      } catch (err: any) {
        console.error(`[Auto-Heal] Failed to verify/heal region [${region}]:`, err.message);
        results.push({ region, status: "failed", error: err.message });
      }
    }
  } catch (error: any) {
    console.error(`[Auto-Heal] Error reading primary source file: ${sourceFilePath}`, error.message);
    throw error;
  }

  return results;
}
