import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { decryptSecret } from "@/lib/server/secret-crypto";
import { runAutomatedQaTests } from "@/lib/server/automated-qa";
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
  let path = parsedUrl.pathname;
  if (!path) path = "/";

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
    path,
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
    console.log(`[Auto-Pruning R2/S3 Mock] Cloud credentials not configured. Simulating delete of s3://${bucket}/${key}`);
    return true;
  }

  try {
    const cleanEndpoint = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
    const objectUrl = `${cleanEndpoint}/${bucket}/${key}`;

    console.log(`[Auto-Pruning R2/S3] Deleting cloud object: ${bucket}/${key}`);
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

    if (response.ok || response.status === 404) {
      console.log(`[Auto-Pruning R2/S3] Successfully deleted ${key}`);
      return true;
    } else {
      const text = await response.text();
      console.warn(`[Auto-Pruning R2/S3 WARNING] Failed to delete: HTTP ${response.status} - ${text}`);
      return false;
    }
  } catch (error: any) {
    console.error(`[Auto-Pruning R2/S3 ERROR] Failed: ${error?.message || error}`);
    return false;
  }
}

async function appendIntegrationLog(
  integrationId: string,
  currentConfigStr: string,
  logEntry: {
    event: string;
    status: "success" | "error";
    statusCode: number;
    message: string;
  }
) {
  try {
    let configObj: any = { logs: [] };
    try {
      configObj = JSON.parse(currentConfigStr);
    } catch (_) {}

    if (!configObj.logs) {
      configObj.logs = [];
    }

    const newLog = {
      ...logEntry,
      timestamp: new Date().toISOString(),
    };
    configObj.logs = [newLog, ...configObj.logs].slice(0, 20);

    await prisma.bundleExternalIntegrations.update({
      where: { id: integrationId },
      data: {
        config: JSON.stringify(configObj),
        lastSyncAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to append integration log:", error);
  }
}

export async function POST(request: NextRequest) {
  const event = request.headers.get("x-github-event") || "push";
  let payload: any = null;
  let rawBody = "";

  try {
    rawBody = await request.text();
    payload = JSON.parse(rawBody);
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const repoFullName = payload?.repository?.full_name;
  if (!repoFullName) {
    return NextResponse.json({ error: "Missing repository information" }, { status: 400 });
  }

  // Find the active integration matching this repository
  const integration = await prisma.bundleExternalIntegrations.findFirst({
    where: {
      integrationType: "github",
      displayName: repoFullName,
      isActive: true,
    },
    include: {
      bundle: true,
    },
  });

  if (!integration) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  const bundle = integration.bundle;
  if (!bundle) {
    return NextResponse.json({ error: "No bundle associated with this integration" }, { status: 400 });
  }

  // Verify HMAC-SHA256 signature
  const signature = request.headers.get("x-hub-signature-256");
  if (!signature) {
    await appendIntegrationLog(integration.id, integration.config, {
      event,
      status: "error",
      statusCode: 400,
      message: "Signature verification failed: Missing x-hub-signature-256 header",
    });
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let configObj: any = {};
  try {
    configObj = JSON.parse(integration.config);
  } catch (e) {
    return NextResponse.json({ error: "Malformed integration config" }, { status: 500 });
  }

  const webhookSecret = configObj.webhookSecret;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const hmac = crypto.createHmac("sha256", webhookSecret);
  hmac.update(rawBody);
  const expectedSignature = "sha256=" + hmac.digest("hex");

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    await appendIntegrationLog(integration.id, integration.config, {
      event,
      status: "error",
      statusCode: 401,
      message: "Signature verification failed: Signature mismatch",
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Handle Ping Event
  if (event === "ping") {
    await appendIntegrationLog(integration.id, integration.config, {
      event,
      status: "success",
      statusCode: 200,
      message: "Ping event received and signature verified successfully",
    });
    return NextResponse.json({ success: true, message: "pong" });
  }

  // Handle Pull Request Event for Previews & Auto-pruning
  if (event === "pull_request") {
    const action = payload.action;
    const prNumber = payload.number;
    const projectId = bundle.projectId;

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId on bundle" }, { status: 400 });
    }

    if (action === "closed") {
      try {
        console.log(`[PR Webhook] PR #${prNumber} closed. Initiating auto-pruning of preview deployment...`);
        
        // 1. Delete preview deployment records in the database
        const deletedDeployments = await prisma.nativeDeployment.deleteMany({
          where: {
            projectId: projectId,
            storagePath: { contains: `/pr-${prNumber}` }
          }
        });
        console.log(`[PR Webhook] Deleted ${deletedDeployments.count} native deployment records for PR #${prNumber}`);

        // 2. Delete preview release track records in the database
        const deletedTracks = await prisma.bundleReleaseTracks.deleteMany({
          where: {
            bundle: { projectId: projectId },
            version: { contains: `pr-${prNumber}` }
          }
        });
        console.log(`[PR Webhook] Deleted ${deletedTracks.count} release track records for PR #${prNumber}`);

        // 3. Auto-prune directory resources on Disk
        const prDir = path.join(process.cwd(), "public", "bundles", projectId, `pr-${prNumber}`);
        const prDirExists = await fs.access(prDir).then(() => true).catch(() => false);
        if (prDirExists) {
          await fs.rm(prDir, { recursive: true, force: true });
          console.log(`[PR Webhook] Pruned physical storage directory: ${prDir}`);
        }

        // 4. Auto-prune static assets in Cloud Storage (R2/S3)
        const prKeys = [
          `lepoship/previews/${projectId}/pr-${prNumber}/index.html`,
          `lepoship/previews/${projectId}/pr-${prNumber}/patch-manifest.json`,
          `bundles/${projectId}/pr-${prNumber}-build.zip`
        ];
        for (const key of prKeys) {
          await deleteFromR2OrS3(key);
        }
        
        await appendIntegrationLog(integration.id, integration.config, {
          event,
          status: "success",
          statusCode: 200,
          message: `Auto-pruned database records, local storage, and Cloud R2/S3 assets for PR #${prNumber} successfully.`,
        });
        
        return NextResponse.json({
          success: true,
          pruned: true,
          prNumber,
        });
      } catch (error: any) {
        console.error(`[PR Webhook] Failed to prune preview deployment for PR #${prNumber}:`, error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (action !== "opened" && action !== "synchronize") {
      return NextResponse.json({ success: true, message: `Ignored: PR action ${action} is not handled.` });
    }

    const sha = payload.pull_request?.head?.sha;
    const branch = payload.pull_request?.head?.ref;
    
    try {
      const githubAccessTokenEncrypted = configObj.githubAccessToken;
      if (!githubAccessTokenEncrypted) {
        throw new Error("GitHub Access Token is missing or not configured");
      }
      const decryptedToken = decryptSecret(githubAccessTokenEncrypted);
      
      const previewUrl = `https://pr-${prNumber}-${bundle.slug}.preview.lepos.dev`;

      const latestDeployment = await prisma.nativeDeployment.findFirst({
        where: { projectId, target: "preview" },
        orderBy: { createdAt: "desc" },
      });
      const deploymentId = latestDeployment?.id || `preview-${prNumber}`;

      // Run Automated QA suite against the Ephemeral Preview environment
      const qaReport = await runAutomatedQaTests(previewUrl, projectId, deploymentId);

      // 1. Post a comment on the PR containing preview link & QA Test Report
      const commentUrl = `https://api.github.com/repos/${repoFullName}/issues/${prNumber}/comments`;
      await fetch(commentUrl, {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${decryptedToken}`,
          "User-Agent": "Lepos-BDS",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: `🚀 **LepoS Preview Deployment Ready!**\n\n- **Branch**: \`${branch}\`\n- **Commit**: \`${sha?.substring(0, 7) || "unknown"}\`\n- **Preview Link**: [Visit Preview](${previewUrl})\n\n${qaReport.markdownReport}`
        })
      });

      // 2. Post status checks to GitHub
      if (sha) {
        const statusUrl = `https://api.github.com/repos/${repoFullName}/statuses/${sha}`;
        
        // Post preview deployment status
        await fetch(statusUrl, {
          method: "POST",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${decryptedToken}`,
            "User-Agent": "Lepos-BDS",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            state: "success",
            target_url: previewUrl,
            description: "Preview deployment successfully deployed!",
            context: "lepos/preview"
          })
        });

        // Post automated QA status
        await fetch(statusUrl, {
          method: "POST",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${decryptedToken}`,
            "User-Agent": "Lepos-BDS",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            state: qaReport.success ? "success" : "failure",
            target_url: previewUrl,
            description: `Automated QA ${qaReport.success ? "passed" : "failed"}! (Score: ${qaReport.score}%)`,
            context: "lepos/qa"
          })
        });
      }

      await appendIntegrationLog(integration.id, integration.config, {
        event,
        status: "success",
        statusCode: 200,
        message: `Successfully generated preview deployment and executed QA tests for PR #${prNumber} at ${previewUrl} (Score: ${qaReport.score}%)`,
      });

      return NextResponse.json({
        success: true,
        previewUrl,
        prNumber,
        sha,
      });
    } catch (error: any) {
      const errorMsg = error?.message || "Internal server error during PR handling";
      await appendIntegrationLog(integration.id, integration.config, {
        event,
        status: "error",
        statusCode: 500,
        message: `Failed preview build for PR #${prNumber}: ${errorMsg}`,
      });
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  }

  // Handle Push Event (filter branch vs tag)
  if (event === "push") {
    const ref = payload.ref || "";
    if (!ref.startsWith("refs/tags/")) {
      // Silence branch updates without cluttering with errors
      return NextResponse.json({ success: true, message: "Ignored: push to branch instead of tag" });
    }
  }

  // Handle Release Event (filter published)
  if (event === "release") {
    const action = payload.action;
    if (action !== "published") {
      return NextResponse.json({ success: true, message: `Ignored: release action is not published (${action})` });
    }
  }

  // Extract the tag name
  let tag = "";
  if (event === "push") {
    const ref = payload.ref || "";
    tag = ref.replace("refs/tags/", "");
  } else if (event === "release") {
    tag = payload.release?.tag_name || "";
  }

  if (!tag) {
    await appendIntegrationLog(integration.id, integration.config, {
      event,
      status: "error",
      statusCode: 400,
      message: "Could not determine tag/version name from payload",
    });
    return NextResponse.json({ error: "Could not determine tag name" }, { status: 400 });
  }

  try {
    const githubAccessTokenEncrypted = configObj.githubAccessToken;
    if (!githubAccessTokenEncrypted) {
      throw new Error("GitHub Access Token is missing or not configured");
    }

    const decryptedToken = decryptSecret(githubAccessTokenEncrypted);
    const projectId = bundle.projectId;
    if (!projectId) {
      throw new Error("Bundle has no associated project_id");
    }

    // Clean tag name for versioning (strip leading v)
    const cleanTag = tag.startsWith("v") || tag.startsWith("V") ? tag.substring(1) : tag;
    const newVersion = cleanTag;
    const newBuildNumber = bundle.buildNumber + 1;

    // Check if the release track for this version already exists to avoid duplication
    const existingTrack = await prisma.bundleReleaseTracks.findUnique({
      where: {
        bundleId_track_version: {
          bundleId: bundle.id,
          track: "production",
          version: newVersion,
        },
      },
    });

    if (existingTrack) {
      const msg = `Version ${newVersion} already exists in track production. Skipping build.`;
      await appendIntegrationLog(integration.id, integration.config, {
        event,
        status: "success",
        statusCode: 200,
        message: msg,
      });
      return NextResponse.json({ success: true, message: msg });
    }

    // Fetch zipball from GitHub
    const downloadUrl = `https://api.github.com/repos/${repoFullName}/zipball/${tag}`;
    const response = await fetch(downloadUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${decryptedToken}`,
        "User-Agent": "Lepos-BDS",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub download failed with status ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileSize = BigInt(buffer.length);

    // Compute checksum (SHA-256)
    const hash = crypto.createHash("sha256");
    hash.update(buffer);
    const checksum = hash.digest("hex");

    // Define saving path under public/bundles/[projectId]
    const safeTagName = tag.replace(/[^a-zA-Z0-9.-]/g, "_");
    const timestamp = Date.now();
    const fileName = `github-${safeTagName}-${timestamp}.zip`;
    const uploadDir = path.join(process.cwd(), "public", "bundles", projectId);

    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    const relativeStoragePath = `/bundles/${projectId}/${fileName}`;
    const now = new Date();

    // Update DB
    await prisma.$transaction(async (tx) => {
      // Update Bundles record
      await tx.bundles.update({
        where: { id: bundle.id },
        data: {
          version: newVersion,
          buildNumber: newBuildNumber,
          storagePath: relativeStoragePath,
          fileSize: fileSize,
          checksum: checksum,
          status: "published",
          updatedAt: now,
        },
      });

      // Insert Release Track entry
      await tx.bundleReleaseTracks.create({
        data: {
          id: crypto.randomUUID(),
          bundleId: bundle.id,
          track: "production",
          version: newVersion,
          buildNumber: newBuildNumber,
          storagePath: relativeStoragePath,
          releaseNotes: `GitHub auto-release from tag ${tag}`,
          status: "active",
          createdAt: now,
        },
      });
    });

    await appendIntegrationLog(integration.id, integration.config, {
      event,
      status: "success",
      statusCode: 200,
      message: `Successfully packaged tag ${tag} as version ${newVersion} (build ${newBuildNumber})`,
    });

    return NextResponse.json({
      success: true,
      version: newVersion,
      buildNumber: newBuildNumber,
      storagePath: relativeStoragePath,
    });
  } catch (error: any) {
    const errorMsg = error?.message || "Internal server error";
    await appendIntegrationLog(integration.id, integration.config, {
      event,
      status: "error",
      statusCode: 500,
      message: `Failed packaging tag ${tag}: ${errorMsg}`,
    });
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
