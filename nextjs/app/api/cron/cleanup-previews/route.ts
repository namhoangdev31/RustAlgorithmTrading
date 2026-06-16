import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { deprovisionStagingServices } from "@/lib/server/ephemeral-staging";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// AWS Signature V4 headers generator for Cloud storage operations
function getSignatureV4Headers(
  method: string,
  url: string,
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  service: string,
  body: Buffer | null
): Record<string, string> {
  const parsedUrl = new URL(url);
  const host = parsedUrl.host;
  let pathname = parsedUrl.pathname;
  if (!pathname) pathname = "/";

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]/g, "").split(".")[0] + "Z";
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = crypto
    .createHash("sha256")
    .update(body || "")
    .digest("hex");

  const headers: Record<string, string> = {
    host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
  };

  const sortedHeaderKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderKeys
    .map((k) => `${k.toLowerCase()}:${headers[k].trim()}`)
    .join("\n") + "\n";

  const signedHeaders = sortedHeaderKeys
    .map((k) => k.toLowerCase())
    .join(";");

  const canonicalRequest = [
    method,
    pathname,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = [dateStamp, region, service, "aws4_request"].join("/");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const kDate = crypto.createHmac("sha256", "AWS4" + secretAccessKey).update(dateStamp).digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(region).digest();
  const kService = crypto.createHmac("sha256", kRegion).update(service).digest();
  const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();

  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  headers["Authorization"] = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return headers;
}

// Delete object from R2/S3
async function deleteFromR2OrS3(key: string): Promise<boolean> {
  const accessKeyId = process.env.LEPOS_CACHE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.LEPOS_CACHE_SECRET_ACCESS_KEY;
  const bucket = process.env.LEPOS_CACHE_BUCKET;
  const endpoint = process.env.LEPOS_CACHE_ENDPOINT;
  const region = process.env.LEPOS_CACHE_REGION || "us-east-1";

  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    console.log(`[Cron Pruning Mock] Cloud credentials not configured. Simulating delete of s3://${bucket}/${key}`);
    return true;
  }

  try {
    const cleanEndpoint = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
    const objectUrl = `${cleanEndpoint}/${bucket}/${key}`;

    const headers = getSignatureV4Headers(
      "DELETE",
      objectUrl,
      accessKeyId,
      secretAccessKey,
      region,
      "s3",
      null
    );

    const response = await fetch(objectUrl, {
      method: "DELETE",
      headers,
    });

    return response.ok;
  } catch (error: any) {
    console.error(`[Cron Pruning S3 Error] Failed to delete ${key}:`, error.message);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    // 7 days ago threshold
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log(`[Cron Cleanup Previews] Scanning for preview deployments older than: ${sevenDaysAgo.toISOString()}`);

    // Find all native preview deployments older than 7 days
    const deployments = await prisma.nativeDeployment.findMany({
      where: {
        target: "preview",
        createdAt: { lt: sevenDaysAgo },
      },
    });

    if (deployments.length === 0) {
      return NextResponse.json({
        status: "success",
        message: "No inactive preview deployments found to prune.",
        prunedCount: 0,
      });
    }

    const prunedDetails: any[] = [];

    for (const dep of deployments) {
      console.log(`[Cron Cleanup] Pruning deployment ${dep.id} for project ${dep.projectId}`);

      // 1. Deprovision Staging Services & Mock DB
      await deprovisionStagingServices(dep.projectId, dep.id);

      // 2. Prune Local disk directory
      let prSegment = `deploy-${dep.id}`;
      if (dep.storagePath) {
        const prMatch = dep.storagePath.match(/(pr-\d+)/);
        if (prMatch) prSegment = prMatch[1];

        // Resolve absolute folder path
        const localDir = path.isAbsolute(dep.storagePath)
          ? dep.storagePath
          : path.join(process.cwd(), dep.storagePath);

        try {
          const dirExists = await fs.access(localDir).then(() => true).catch(() => false);
          if (dirExists) {
            await fs.rm(localDir, { recursive: true, force: true });
            console.log(`[Cron Cleanup] Pruned local folder: ${localDir}`);
          }
        } catch (err: any) {
          console.error(`[Cron Cleanup Error] Failed to delete local folder ${localDir}:`, err.message);
        }
      }

      // 3. Prune Cloud Storage assets (R2/S3)
      const cloudKeys = [
        `lepoship/previews/${dep.projectId}/${prSegment}/index.html`,
        `lepoship/previews/${dep.projectId}/${prSegment}/patch-manifest.json`,
        `bundles/${dep.projectId}/${prSegment}-build.zip`,
      ];
      for (const key of cloudKeys) {
        await deleteFromR2OrS3(key);
      }

      // 4. Delete DB native deployment record
      await prisma.nativeDeployment.delete({
        where: { id: dep.id },
      });

      // 5. Delete corresponding DB release track record (if version contains prSegment)
      await prisma.bundleReleaseTracks.deleteMany({
        where: {
          bundle: { projectId: dep.projectId },
          version: { contains: prSegment },
        },
      });

      prunedDetails.push({
        deploymentId: dep.id,
        projectId: dep.projectId,
        prSegment,
      });
    }

    return NextResponse.json({
      status: "success",
      message: `Pruned ${deployments.length} inactive preview deployments successfully.`,
      prunedCount: deployments.length,
      prunedDeployments: prunedDetails,
    });
  } catch (error: any) {
    console.error("[Cron Cleanup Previews] Major failure occurred:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
