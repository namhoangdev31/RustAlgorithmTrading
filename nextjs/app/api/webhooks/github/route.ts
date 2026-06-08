import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { decryptSecret } from "@/lib/server/secret-crypto";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

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
