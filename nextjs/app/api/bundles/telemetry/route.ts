import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { authenticateSdkRequest } from "@/lib/server/sdk-auth";
import { hashDeviceId } from "@/lib/server/device-hash";

/**
 * POST /api/bundles/telemetry
 * Handles batched telemetry (analytics & installs) ingestion with validation,
 * device ID hashing, size checking, and idempotency checks.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const projectIdHeader = request.headers.get("x-project-id");
    const deviceIdHeader = request.headers.get("x-device-id");

    const auth = await authenticateSdkRequest(authHeader, projectIdHeader);

    // Limit body size to 256KB
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > 262144) {
      return NextResponse.json({ error: "Payload too large. Max size is 256KB." }, { status: 413 });
    }

    const body = await request.json();
    const { analytics = [], installs = [], bundleId: clientBundleId } = body;

    // Resolve bundleId: authenticated identity always overrides client-supplied
    const bundleId = auth?.bundleId || clientBundleId;
    if (!bundleId) {
      return NextResponse.json({ error: "bundleId is required." }, { status: 400 });
    }

    // Enforce max batch size: 100 entries per batch
    if (analytics.length > 100 || installs.length > 100) {
      return NextResponse.json(
        { error: "Batch size limit exceeded. Max 100 analytics and 100 installs per request." },
        { status: 400 }
      );
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const validAnalytics: any[] = [];
    const validInstalls: any[] = [];

    // Process & Validate Analytics
    for (const event of analytics) {
      const { clientEventId, eventType, eventData, session_id, platformVersion, bundleVersion, ipAddress, timestamp } = event;
      if (!clientEventId || !eventType) continue;

      const eventTime = timestamp ? new Date(timestamp) : now;
      // Skip future timestamps or dates older than 30 days
      if (eventTime > now || eventTime < thirtyDaysAgo) continue;

      // Event payload limit: 8KB
      const eventDataStr = typeof eventData === "object" ? JSON.stringify(eventData) : String(eventData || "");
      if (eventDataStr.length > 8192) continue;

      const rawDeviceId = event.deviceId || deviceIdHeader || "";
      const deviceFingerprint = rawDeviceId ? hashDeviceId(rawDeviceId) : null;

      validAnalytics.push({
        id: crypto.randomUUID(),
        bundleId,
        userId: null, // Allow anonymous events
        sessionId: session_id ? String(session_id).slice(0, 100) : null,
        eventType: String(eventType).slice(0, 50),
        eventData: eventDataStr,
        platformVersion: platformVersion ? String(platformVersion).slice(0, 20) : null,
        bundleVersion: bundleVersion ? String(bundleVersion).slice(0, 50) : null,
        ipAddress: ipAddress ? String(ipAddress).slice(0, 45) : null,
        deviceFingerprint,
        clientEventId: String(clientEventId).slice(0, 255),
        createdAt: eventTime,
      });
    }

    // Process & Validate Installs
    for (const install of installs) {
      const { clientEventId, eventType, deviceId: clientDeviceId, platform, osVersion, bundleVersion, countryCode, timestamp } = install;
      if (!clientEventId || !eventType) continue;

      const eventTime = timestamp ? new Date(timestamp) : now;
      if (eventTime > now || eventTime < thirtyDaysAgo) continue;

      const rawDeviceId = clientDeviceId || deviceIdHeader || "";
      const deviceFingerprint = rawDeviceId ? hashDeviceId(rawDeviceId) : null;

      validInstalls.push({
        id: crypto.randomUUID(),
        bundleId,
        userId: null, // Make userId nullable for anonymous installs
        eventType: String(eventType).slice(0, 20),
        deviceId: rawDeviceId ? String(rawDeviceId).slice(0, 100) : null,
        deviceFingerprint,
        clientEventId: String(clientEventId).slice(0, 255),
        platform: platform ? String(platform).slice(0, 20) : null,
        osVersion: osVersion ? String(osVersion).slice(0, 30) : null,
        bundleVersion: bundleVersion ? String(bundleVersion).slice(0, 50) : null,
        countryCode: countryCode ? String(countryCode).slice(0, 5) : null,
        createdAt: eventTime,
      });
    }

    // Write to DB with skipDuplicates
    let insertedAnalytics = 0;
    let insertedInstalls = 0;

    if (validAnalytics.length > 0) {
      const res = await prisma.bundleAnalyticsEvents.createMany({
        data: validAnalytics,
        skipDuplicates: true,
      });
      insertedAnalytics = res.count;
    }

    if (validInstalls.length > 0) {
      const res = await prisma.bundleInstallEvents.createMany({
        data: validInstalls,
        skipDuplicates: true,
      });
      insertedInstalls = res.count;
    }

    const duplicatesAnalytics = validAnalytics.length - insertedAnalytics;
    const duplicatesInstalls = validInstalls.length - insertedInstalls;

    // HTTP 202 Accepted per spec
    return NextResponse.json(
      {
        inserted: insertedAnalytics + insertedInstalls,
        duplicates: duplicatesAnalytics + duplicatesInstalls,
        analytics: { inserted: insertedAnalytics, duplicates: duplicatesAnalytics },
        installs: { inserted: insertedInstalls, duplicates: duplicatesInstalls },
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("[Telemetry Ingestion API] Error:", error.message);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
