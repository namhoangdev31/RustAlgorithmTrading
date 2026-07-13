import { createReadStream } from "node:fs";
import type { Readable } from "node:stream";

import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

export interface StoredArtifact {
  provider: "s3" | "r2";
  bucket: string;
  key: string;
  downloadUrl: string;
}

function requiredConfig() {
  const endpoint = process.env.LEPOS_ARTIFACT_ENDPOINT;
  const bucket = process.env.LEPOS_ARTIFACT_BUCKET;
  const accessKeyId = process.env.LEPOS_ARTIFACT_ACCESS_KEY_ID;
  const secretAccessKey = process.env.LEPOS_ARTIFACT_SECRET_ACCESS_KEY;
  const publicBase = process.env.LEPOS_ARTIFACT_PUBLIC_BASE_URL;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicBase) {
    throw new Error("ARTIFACT_STORAGE_REQUIRED");
  }
  return { endpoint, bucket, accessKeyId, secretAccessKey, publicBase: publicBase.replace(/\/$/, "") };
}

function client() {
  const config = requiredConfig();
  return new S3Client({
    region: process.env.LEPOS_ARTIFACT_REGION || "auto",
    endpoint: config.endpoint,
    forcePathStyle: process.env.LEPOS_ARTIFACT_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
}

export function artifactStorageConfigured() {
  try {
    requiredConfig();
    return true;
  } catch {
    return false;
  }
}

export async function putArtifact(
  key: string,
  body: Buffer | Uint8Array | Readable,
  options: { contentType: string; checksumSha256?: string },
): Promise<StoredArtifact> {
  const config = requiredConfig();
  const upload = new Upload({
    client: client(),
    params: {
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: options.contentType,
      Metadata: options.checksumSha256 ? { checksumSha256: options.checksumSha256 } : undefined,
    },
    queueSize: 4,
    partSize: 8 * 1024 * 1024,
    leavePartsOnError: false,
  });
  await upload.done();
  return {
    provider: process.env.LEPOS_ARTIFACT_PROVIDER === "s3" ? "s3" : "r2",
    bucket: config.bucket,
    key,
    downloadUrl: `${config.publicBase}/${key.split("/").map(encodeURIComponent).join("/")}`,
  };
}

export async function putArtifactFile(
  key: string,
  filePath: string,
  options: { contentType?: string; checksumSha256?: string } = {},
) {
  if (!options.checksumSha256) throw new Error("ARTIFACT_CHECKSUM_REQUIRED");
  return putArtifact(key, createReadStream(filePath), {
    contentType: options.contentType ?? "application/zip",
    checksumSha256: options.checksumSha256,
  });
}
