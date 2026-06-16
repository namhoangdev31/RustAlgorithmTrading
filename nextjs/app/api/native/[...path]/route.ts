import { NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";
import { nativeErrorResponse, requireNativeProjectAccess, requireNativeInternalOrPat } from "@/lib/server/native-platform/auth";
import { purgeNativeCache } from "@/lib/server/native-platform/cache";
import { syncProjectRouting } from "@/lib/server/native-platform/deployments";
import { runNativeEdgeFunction } from "@/lib/server/native-platform/edge-functions";
import { redisSetJson, nativeRedisKeys } from "@/lib/server/native-platform/redis";
import { anonymizeIpAddress } from "@/lib/server/waf-anonymizer";

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const { path } = await context.params;
    const resource = path.join("/");

    // Dynamic Domain Global Resolution API (Self-healing Edge routing resolution)
    if (resource === "resolve") {
      await requireNativeInternalOrPat(request, "project:read");
      const domainParam = searchParams.get("domain") || "";
      if (!domainParam) {
        return NextResponse.json({ error: "domain parameter is required." }, { status: 400 });
      }

      const domainConfig = await prisma.nativeDomainConfig.findUnique({
        where: { domain: domainParam },
        include: {
          project: {
            include: {
              activeNativeDeployment: true,
            },
          },
        },
      });

      if (!domainConfig || !domainConfig.project) {
        return NextResponse.json({ error: "Domain not registered." }, { status: 404 });
      }

      const project = domainConfig.project;
      const activeDeployment = project.activeNativeDeployment;

      if (!activeDeployment) {
        return NextResponse.json({ error: "No active deployment found." }, { status: 404 });
      }

      const snapshot = {
        projectId: project.id,
        deploymentId: activeDeployment.id,
        target: activeDeployment.target,
        storagePath: activeDeployment.storagePath,
        bundleUrl: activeDeployment.bundleUrl,
        updatedAt: new Date().toISOString(),
      };

      // Populate Redis cache dynamically (self-healing fallback cache)
      await redisSetJson(nativeRedisKeys.domain(domainParam), {
        ...snapshot,
        domain: domainParam,
        sslStatus: domainConfig.sslStatus,
      });

      return NextResponse.json({ success: true, routing: snapshot });
    }

    const projectId = searchParams.get("projectId") || "";
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    await requireNativeProjectAccess(request, projectId, "project:read", "viewer");

    if (resource === "routing") {
      await syncProjectRouting(projectId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown native resource." }, { status: 404 });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const body = await request.json();
    const { path } = await context.params;
    const resource = path.join("/");
    const projectId = String(body.projectId || "");
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    if (resource === "edge/execute") {
      await requireNativeProjectAccess(request, projectId, "edge:execute", "viewer");
      const result = await runNativeEdgeFunction({
        code: String(body.code || ""),
        request: body.request,
        timeoutMs: Number(body.timeoutMs || 50),
        wasmBytes: body.wasmBytes ? String(body.wasmBytes) : undefined,
        isWasm: body.isWasm ? Boolean(body.isWasm) : undefined,
      });
      return NextResponse.json(result);
    }

    if (resource === "cache/purge") {
      await requireNativeProjectAccess(request, projectId, "deployment:trigger", "editor");
      const purged = await purgeNativeCache(projectId, String(body.path || "/"));
      return NextResponse.json({ purged });
    }

    if (resource === "domains") {
      await requireNativeProjectAccess(request, projectId, "project:write", "editor");
      const domain = await prisma.nativeDomainConfig.upsert({
        where: { domain: String(body.domain || "") },
        create: {
          projectId,
          domain: String(body.domain || ""),
          txtRecordToken: `lepos-domain-${crypto.randomUUID()}`,
          sslStatus: body.sslStatus || "PENDING",
        },
        update: {
          sslStatus: body.sslStatus || "PENDING",
          lastDnsCheckAt: new Date(),
          updatedAt: new Date(),
        },
      });
      await syncProjectRouting(projectId);
      return NextResponse.json({ domain }, { status: 201 });
    }

    if (resource === "waf/events") {
      await requireNativeProjectAccess(request, projectId, "security:write", "editor");
      
      const rawIp = body.ipAddress || null;
      const { masked, hash } = anonymizeIpAddress(rawIp, projectId);
      
      const incomingMetadata = typeof body.metadata === "object" && body.metadata !== null ? body.metadata : {};
      const metadata = {
        ...incomingMetadata,
        ipHash: hash,
      };

      const event = await prisma.nativeWafEvent.create({
        data: {
          projectId,
          fingerprint: String(body.fingerprint || crypto.randomUUID()),
          ipAddress: masked,
          action: body.action || "challenge",
          reason: body.reason || null,
          userAgent: body.userAgent || request.headers.get("user-agent"),
          metadata: metadata,
        },
      });
      return NextResponse.json({ event }, { status: 201 });
    }

    if (resource === "debug/sessions") {
      await requireNativeProjectAccess(request, projectId, "debug:write", "editor");
      const session = await prisma.nativeDebugSession.create({
        data: {
          projectId,
          sessionId: String(body.sessionId || crypto.randomUUID()),
          device: body.device || null,
          status: "open",
        },
      });
      return NextResponse.json({ session }, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown native resource." }, { status: 404 });
  } catch (error) {
    return nativeErrorResponse(error);
  }
}
