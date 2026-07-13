import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { authenticateSdkRequest } from "@/lib/server/sdk-auth";
import { hashDeviceId } from "@/lib/server/device-hash";
import { readBoundedJson } from "@/lib/server/bounded-json";
import { hasSdkScope } from "@/lib/server/sdk-auth";
import { assertLepoShipEnvironment } from "@/lib/server/lepoship/environment";
import { enforceLepoShipRateLimit } from "@/lib/server/lepoship/rate-limit";

const VALID_REASONS = [
  "spam",
  "malware",
  "copyright",
  "inappropriate_content",
  "privacy_violation",
  "misleading",
  "broken",
  "other",
];

/**
 * POST /api/bundles/report
 * Accepts authenticated reports with client idempotency key.
 */
export async function ingestReportRequest(request: NextRequest) {
  try {
    assertLepoShipEnvironment();
    const authHeader = request.headers.get("authorization");
    const projectIdHeader = request.headers.get("x-project-id");
    const deviceIdHeader = request.headers.get("x-device-id");

    const auth = await authenticateSdkRequest(authHeader, projectIdHeader);
    if (!hasSdkScope(auth, "reports:write")) {
      return NextResponse.json({ error: "SDK token with reports:write scope is required" }, { status: 401 });
    }
    if (!request.headers.get("x-request-id")) {
      return NextResponse.json({ error: "x-request-id is required" }, { status: 400 });
    }
    if (!await enforceLepoShipRateLimit({ request, scope: "reports", identityId: auth.identityId, deviceId: deviceIdHeader, limit: 20, windowSeconds: 60 })) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
    const body = await readBoundedJson<any>(request, 32_768);
    const {
      reason,
      description,
      evidenceUrls,
      clientReportId,
      deviceId: clientDeviceId,
    } = body;

    const bundleId = auth.bundleId;

    // Validate reason
    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: `reason must be one of: ${VALID_REASONS.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate description length
    if (description && description.length > 2000) {
      return NextResponse.json({ error: "description must be ≤ 2000 characters" }, { status: 400 });
    }

    // Validate evidence URLs
    let parsedEvidenceUrls: string[] = [];
    if (evidenceUrls) {
      if (!Array.isArray(evidenceUrls) || evidenceUrls.length > 5) {
        return NextResponse.json({ error: "evidenceUrls must be an array of ≤ 5 items" }, { status: 400 });
      }
      for (const url of evidenceUrls) {
        if (typeof url !== "string" || !url.startsWith("https://")) {
          return NextResponse.json({ error: "All evidence URLs must start with https://" }, { status: 400 });
        }
      }
      parsedEvidenceUrls = evidenceUrls;
    }

    // Validate clientReportId
    if (!clientReportId || typeof clientReportId !== "string" || clientReportId.length > 255) {
      return NextResponse.json({ error: "clientReportId is required (max 255 chars)" }, { status: 400 });
    }

    // Hash device fingerprint
    const rawDeviceId = clientDeviceId || deviceIdHeader || "";
    const reporterFingerprint = rawDeviceId ? hashDeviceId(rawDeviceId) : null;

    // Rate-limit: ≤10 reports per device per hour
    if (reporterFingerprint) {
      const oneHourAgo = new Date(Date.now() - 3600_000);
      const recentReportsCount = await prisma.bundleUserReports.count({
        where: {
          reporterFingerprint,
          createdAt: { gte: oneHourAgo },
        },
      });
      if (recentReportsCount >= 10) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Max 10 reports per device per hour." },
          { status: 429 }
        );
      }
    }

    // Idempotent creation via clientReportId
    const existing = await prisma.bundleUserReports.findUnique({
      where: { clientReportId },
    });
    if (existing) {
      return NextResponse.json({ id: existing.id, status: "duplicate" }, { status: 200 });
    }

    const now = new Date();
    const report = await prisma.bundleUserReports.create({
      data: {
        id: crypto.randomUUID(),
        bundleId,
        reportedBy: null, // SDK-authenticated but anonymous
        reporterFingerprint,
        clientReportId,
        reason,
        description: description || null,
        evidenceUrls: parsedEvidenceUrls.length > 0 ? JSON.stringify(parsedEvidenceUrls) : null,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      },
    });

    return NextResponse.json({ id: report.id, status: "created" }, { status: 201 });
  } catch (error: any) {
    console.error("[Report API] Error:", error.message);
    if (error.message === "PAYLOAD_TOO_LARGE") return NextResponse.json({ error: error.message }, { status: 413 });
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "Gone", canonicalEndpoint: "/api/v1/reports" },
    { status: 410 },
  );
}
