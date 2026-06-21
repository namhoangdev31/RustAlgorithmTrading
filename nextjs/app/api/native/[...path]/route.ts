import { NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";
import { nativeErrorResponse, requireNativeProjectAccess } from "@/lib/server/native-platform/auth";
import { listArtifactMirrors, publishArtifactMirror, retryArtifactMirror } from "@/lib/server/native-platform/artifact-mirrors";
import { purgeNativeCache } from "@/lib/server/native-platform/cache";
import { getSchedulingPolicy, listSchedulingSignals, recordSchedulingSignal, upsertSchedulingPolicy } from "@/lib/server/native-platform/finops";
import { approveRemediationRun, createRemediationRun, executeRemediationRun, listRemediationRuns } from "@/lib/server/native-platform/remediation";
import { buildRoutingSnapshot, getRoutingPolicy, listRegionReplicas, recordRegionReplicaHeartbeat, upsertRegionReplica, upsertRoutingPolicy } from "@/lib/server/native-platform/routing";
import { syncProjectRouting } from "@/lib/server/native-platform/deployments";
import { runNativeEdgeFunction } from "@/lib/server/native-platform/edge-functions";
import { redisSetJson, nativeRedisKeys } from "@/lib/server/native-platform/redis";
import { ingestTelemetryEnvelope, listServiceIdentities, listServiceTrustPolicies, listTelemetryEnvelopes, upsertServiceIdentity, upsertTrustPolicy } from "@/lib/server/native-platform/zero-trust";
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
      await requireNativeProjectAccess(request, project.id, "project:read", "viewer");
      if (!project.activeNativeDeployment) {
        return NextResponse.json({ error: "No active deployment found." }, { status: 404 });
      }

      const baseSnapshot = await buildRoutingSnapshot(project.id);
      if (!baseSnapshot) {
        return NextResponse.json({ error: "No routing snapshot available." }, { status: 404 });
      }
      const snapshot = {
        ...baseSnapshot,
        domain: domainParam,
        sslStatus: domainConfig.sslStatus,
      };

      // Populate Redis cache dynamically (self-healing fallback cache)
      await redisSetJson(
        nativeRedisKeys.domain(domainParam),
        snapshot,
        snapshot.routingPolicy?.snapshotTtlSeconds || undefined
      );

      return NextResponse.json({ success: true, routing: snapshot });
    }

    const projectId = searchParams.get("projectId") || "";
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    await requireNativeProjectAccess(request, projectId, "project:read", "viewer");

    if (resource === "routing") {
      await syncProjectRouting(projectId);
      const snapshot = await buildRoutingSnapshot(projectId);
      return NextResponse.json({ success: true, routing: snapshot });
    }

    if (resource === "routing/replicas") {
      const [policy, replicas] = await Promise.all([
        getRoutingPolicy(projectId),
        listRegionReplicas(projectId),
      ]);
      return NextResponse.json({ policy, replicas });
    }

    if (resource === "routing/policy") {
      const policy = await getRoutingPolicy(projectId);
      return NextResponse.json({ policy });
    }

    if (resource === "artifacts/mirrors") {
      const mirrors = await listArtifactMirrors(projectId);
      return NextResponse.json({ mirrors });
    }

    if (resource === "remediation/runs") {
      const runs = await listRemediationRuns(projectId);
      return NextResponse.json({ runs });
    }

    if (resource === "scheduling") {
      const [policy, signals] = await Promise.all([
        getSchedulingPolicy(projectId),
        listSchedulingSignals(projectId),
      ]);
      return NextResponse.json({ policy, signals });
    }

    if (resource === "security") {
      const [identities, trustPolicies, telemetryEnvelopes] = await Promise.all([
        listServiceIdentities(projectId),
        listServiceTrustPolicies(projectId),
        listTelemetryEnvelopes(projectId),
      ]);
      return NextResponse.json({ identities, trustPolicies, telemetryEnvelopes });
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

    if (resource === "routing/replicas") {
      await requireNativeProjectAccess(request, projectId, "project:write", "editor");
      const replica = await upsertRegionReplica({
        projectId,
        region: String(body.region || ""),
        provider: String(body.provider || "edge"),
        deploymentId: body.deploymentId ? String(body.deploymentId) : null,
        endpoint: body.endpoint ? String(body.endpoint) : null,
        bundleUrl: body.bundleUrl ? String(body.bundleUrl) : null,
        storagePath: body.storagePath ? String(body.storagePath) : null,
        healthStatus: body.healthStatus ? String(body.healthStatus) : "healthy",
        drainState: body.drainState ? String(body.drainState) : "accepting",
        latencyMs: Number.isFinite(Number(body.latencyMs)) ? Math.round(Number(body.latencyMs)) : null,
        trafficPercent: Number.isFinite(Number(body.trafficPercent)) ? Math.round(Number(body.trafficPercent)) : 0,
        isPrimary: Boolean(body.isPrimary),
        replicationVersion: body.replicationVersion ? String(body.replicationVersion) : null,
        vectorClock: typeof body.vectorClock === "object" ? body.vectorClock : null,
        metadata: typeof body.metadata === "object" ? body.metadata : null,
      });
      await syncProjectRouting(projectId);
      return NextResponse.json({ replica }, { status: 201 });
    }

    if (resource === "routing/heartbeat") {
      await requireNativeProjectAccess(request, projectId, "project:write", "editor");
      const replica = await recordRegionReplicaHeartbeat({
        projectId,
        region: String(body.region || ""),
        provider: String(body.provider || "edge"),
        deploymentId: body.deploymentId ? String(body.deploymentId) : null,
        endpoint: body.endpoint ? String(body.endpoint) : null,
        bundleUrl: body.bundleUrl ? String(body.bundleUrl) : null,
        storagePath: body.storagePath ? String(body.storagePath) : null,
        healthStatus: body.healthStatus ? String(body.healthStatus) : "healthy",
        drainState: body.drainState ? String(body.drainState) : "accepting",
        latencyMs: Number.isFinite(Number(body.latencyMs)) ? Math.round(Number(body.latencyMs)) : null,
        trafficPercent: Number.isFinite(Number(body.trafficPercent)) ? Math.round(Number(body.trafficPercent)) : 0,
        isPrimary: Boolean(body.isPrimary),
        replicationVersion: body.replicationVersion ? String(body.replicationVersion) : null,
        vectorClock: typeof body.vectorClock === "object" ? body.vectorClock : null,
        metadata: typeof body.metadata === "object" ? body.metadata : null,
      });
      await syncProjectRouting(projectId);
      return NextResponse.json({ replica });
    }

    if (resource === "routing/policy") {
      await requireNativeProjectAccess(request, projectId, "project:write", "editor");
      const policy = await upsertRoutingPolicy(projectId, {
        strategy: body.strategy ? String(body.strategy) : undefined,
        consistency: body.consistency ? String(body.consistency) : undefined,
        stickySessions: typeof body.stickySessions === "boolean" ? body.stickySessions : undefined,
        manualFailback: typeof body.manualFailback === "boolean" ? body.manualFailback : undefined,
        snapshotTtlSeconds: Number.isFinite(Number(body.snapshotTtlSeconds))
          ? Number(body.snapshotTtlSeconds)
          : undefined,
        failoverThresholdMs: Number.isFinite(Number(body.failoverThresholdMs))
          ? Number(body.failoverThresholdMs)
          : undefined,
        latencyProbeIntervalSeconds: Number.isFinite(Number(body.latencyProbeIntervalSeconds))
          ? Number(body.latencyProbeIntervalSeconds)
          : undefined,
        preferredRegions: Array.isArray(body.preferredRegions)
          ? body.preferredRegions.map(String)
          : undefined,
      });
      await syncProjectRouting(projectId);
      return NextResponse.json({ policy });
    }

    if (resource === "artifacts/mirrors") {
      await requireNativeProjectAccess(request, projectId, "project:write", "editor");
      if (body.action === "retry") {
        const mirror = await retryArtifactMirror(projectId, String(body.mirrorId || ""));
        await syncProjectRouting(projectId);
        return NextResponse.json({ mirror });
      }
      const mirror = await publishArtifactMirror({
        projectId,
        deploymentId: String(body.deploymentId || ""),
        provider: String(body.provider || "ipfs") as "ipfs" | "arweave",
        policy: (body.policy ? String(body.policy) : "hybrid") as "web2-only" | "hybrid" | "decentralized-preferred",
      });
      await syncProjectRouting(projectId);
      return NextResponse.json({ mirror }, { status: 201 });
    }

    if (resource === "remediation/runs") {
      await requireNativeProjectAccess(request, projectId, "project:write", "editor");
      const action = String(body.action || "create");

      if (action === "approve") {
        const run = await approveRemediationRun(String(body.runId || ""), String(body.userId || ""));
        return NextResponse.json({ run });
      }

      if (action === "execute") {
        const run = await executeRemediationRun(String(body.runId || ""), body.userId ? String(body.userId) : null);
        return NextResponse.json({ run });
      }

      const run = await createRemediationRun({
        projectId,
        actionType: String(body.actionType || "routing_refresh") as
          | "cache_purge"
          | "routing_refresh"
          | "deployment_rollback"
          | "replica_drain",
        mode: String(body.mode || "suggest") as "observe" | "suggest" | "approve" | "auto-apply",
        summary: String(body.summary || "Native remediation run"),
        dryRun: body.dryRun !== false,
        diagnosticId: body.diagnosticId ? String(body.diagnosticId) : null,
        requestedByUserId: body.userId ? String(body.userId) : null,
        payload: typeof body.payload === "object" && body.payload !== null ? body.payload : undefined,
      });
      if (run.mode === "auto-apply" && !run.dryRun) {
        const executed = await executeRemediationRun(run.id, body.userId ? String(body.userId) : null);
        return NextResponse.json({ run: executed }, { status: 201 });
      }
      return NextResponse.json({ run }, { status: 201 });
    }

    if (resource === "scheduling/signals") {
      await requireNativeProjectAccess(request, projectId, "project:write", "editor");
      const signal = await recordSchedulingSignal({
        projectId,
        signalType: String(body.signalType || "carbon_intensity"),
        source: String(body.source || "manual"),
        region: body.region ? String(body.region) : null,
        value: Number(body.value || 0),
        unit: body.unit ? String(body.unit) : null,
        metadata: typeof body.metadata === "object" ? body.metadata : null,
      });
      return NextResponse.json({ signal }, { status: 201 });
    }

    if (resource === "scheduling/policy") {
      await requireNativeProjectAccess(request, projectId, "project:write", "editor");
      const policy = await upsertSchedulingPolicy({
        projectId,
        enabled: Boolean(body.enabled),
        mode: body.mode ? String(body.mode) : undefined,
        costProvider: body.costProvider ? String(body.costProvider) : null,
        carbonProvider: body.carbonProvider ? String(body.carbonProvider) : null,
        defaultWorkloadClass: body.defaultWorkloadClass ? String(body.defaultWorkloadClass) : undefined,
        deferrableWindowStart: body.deferrableWindowStart ? String(body.deferrableWindowStart) : null,
        deferrableWindowEnd: body.deferrableWindowEnd ? String(body.deferrableWindowEnd) : null,
        maxCarbonIntensity: Number.isFinite(Number(body.maxCarbonIntensity)) ? Number(body.maxCarbonIntensity) : null,
        maxCostScore: Number.isFinite(Number(body.maxCostScore)) ? Number(body.maxCostScore) : null,
      });
      return NextResponse.json({ policy });
    }

    if (resource === "security/identities") {
      await requireNativeProjectAccess(request, projectId, "project:write", "editor");
      const identity = await upsertServiceIdentity({
        projectId,
        serviceName: String(body.serviceName || ""),
        role: body.role ? String(body.role) : undefined,
        scopes: Array.isArray(body.scopes) ? body.scopes.map(String) : [],
        mtlsMode: body.mtlsMode ? String(body.mtlsMode) as "disabled" | "optional" | "required" : "optional",
        status: body.status ? String(body.status) : undefined,
        sharedSecret: body.sharedSecret ? String(body.sharedSecret) : null,
        certificateFingerprint: body.certificateFingerprint ? String(body.certificateFingerprint) : null,
        metadata: typeof body.metadata === "object" ? body.metadata : null,
      });
      return NextResponse.json({ identity }, { status: 201 });
    }

    if (resource === "security/trust") {
      await requireNativeProjectAccess(request, projectId, "project:write", "editor");
      const policy = await upsertTrustPolicy({
        projectId,
        sourceService: String(body.sourceService || ""),
        targetService: String(body.targetService || ""),
        allowedScopes: Array.isArray(body.allowedScopes) ? body.allowedScopes.map(String) : [],
        enforceMtls: Boolean(body.enforceMtls),
        allowSharedKeyFallback: body.allowSharedKeyFallback !== false,
        status: body.status ? String(body.status) : undefined,
        metadata: typeof body.metadata === "object" ? body.metadata : null,
      });
      return NextResponse.json({ policy }, { status: 201 });
    }

    if (resource === "security/telemetry") {
      await requireNativeProjectAccess(request, projectId, "project:write", "editor");
      const envelope = await ingestTelemetryEnvelope({
        projectId,
        serviceName: body.serviceName ? String(body.serviceName) : null,
        kind: String(body.kind || "aggregate_metric"),
        encryptionMode: body.encryptionMode ? String(body.encryptionMode) : undefined,
        aggregateKey: body.aggregateKey ? String(body.aggregateKey) : null,
        redactedSummary: typeof body.redactedSummary === "object" ? body.redactedSummary : null,
        metadata: typeof body.metadata === "object" ? body.metadata : null,
        rawPayload: body.payload,
      });
      return NextResponse.json({ envelope }, { status: 201 });
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
