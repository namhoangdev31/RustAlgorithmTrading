import { prisma } from "@/lib/server/prisma";

export interface StagingServiceConfig {
  frontendUrl: string;
  apiUrl: string;
  databaseUrl: string;
  providerId: string;
}

function stagingAdapter() {
  const endpoint = process.env.LEPOS_STAGING_ADAPTER_ENDPOINT;
  if (!endpoint) throw new Error("Ephemeral staging is unavailable because LEPOS_STAGING_ADAPTER_ENDPOINT is not configured.");
  return { endpoint, token: process.env.LEPOS_STAGING_ADAPTER_TOKEN };
}

export async function provisionStagingServices(projectId: string, deploymentId: string): Promise<StagingServiceConfig> {
  const adapter = stagingAdapter();
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    include: { bundle: true },
  });
  if (!project?.bundle) throw new Error("Project bundle not found for staging provisioning.");

  const response = await fetch(adapter.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(adapter.token ? { authorization: `Bearer ${adapter.token}` } : {}),
    },
    body: JSON.stringify({ action: "provision", projectId, deploymentId }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Staging provider returned HTTP ${response.status}.`);

  const config: StagingServiceConfig = {
    frontendUrl: String(payload?.frontendUrl || ""),
    apiUrl: String(payload?.apiUrl || ""),
    databaseUrl: String(payload?.databaseUrl || ""),
    providerId: String(payload?.providerId || ""),
  };
  if (!config.frontendUrl || !config.apiUrl || !config.databaseUrl || !config.providerId) {
    throw new Error("Staging provider response is missing required service evidence.");
  }

  const integrationType = `staging-${deploymentId}`;
  await prisma.bundleExternalIntegrations.upsert({
    where: { bundleId_integrationType: { bundleId: project.bundle.id, integrationType } },
    create: {
      id: crypto.randomUUID(),
      bundleId: project.bundle.id,
      integrationType,
      displayName: `Staging environment ${deploymentId}`,
      config: JSON.stringify(config),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    update: { config: JSON.stringify(config), isActive: true, updatedAt: new Date() },
  });
  return config;
}

export async function deprovisionStagingServices(projectId: string, deploymentId: string): Promise<void> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    include: { bundle: true },
  });
  const integration = project?.bundle
    ? await prisma.bundleExternalIntegrations.findUnique({
        where: { bundleId_integrationType: { bundleId: project.bundle.id, integrationType: `staging-${deploymentId}` } },
      })
    : null;

  if (integration) {
    const config = JSON.parse(integration.config) as Partial<StagingServiceConfig>;
    const adapter = stagingAdapter();
    const response = await fetch(adapter.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(adapter.token ? { authorization: `Bearer ${adapter.token}` } : {}),
      },
      body: JSON.stringify({ action: "deprovision", projectId, deploymentId, providerId: config.providerId }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Staging provider deprovision returned HTTP ${response.status}.`);
    await prisma.bundleExternalIntegrations.delete({ where: { id: integration.id } });
  }
}
