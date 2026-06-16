import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/server/prisma";

export interface StagingServiceConfig {
  frontendUrl: string;
  apiUrl: string;
  databaseUrl: string;
  mockDbPath: string;
}

/**
 * Provision an ephemeral multi-service environment including a mock SQLite/JSON database.
 */
export async function provisionStagingServices(
  projectId: string,
  deploymentId: string
): Promise<StagingServiceConfig> {
  const dbDir = path.join(process.cwd(), "public", "bundles", "staging-dbs");
  const mockDbPath = path.join(dbDir, `${projectId}-${deploymentId}.json`);

  // 1. Create staging-dbs directory if it does not exist
  await fs.mkdir(dbDir, { recursive: true });

  // 2. Generate and seed mock database JSON file
  const seedData = {
    users: [
      { id: "u-1", name: "Alice Developer", role: "admin" },
      { id: "u-2", name: "Bob Tester", role: "qa" },
    ],
    settings: {
      theme: "dark",
      debugMode: true,
      enableFeatureX: false,
    },
    mockTransactions: [
      { id: "tx-1", amount: 120000, status: "completed" },
    ],
    createdAt: new Date().toISOString(),
  };

  await fs.writeFile(mockDbPath, JSON.stringify(seedData, null, 2), "utf8");
  console.log(`[Staging Staging] Provisioned mock database at: ${mockDbPath}`);

  // 3. Construct service URLs
  const frontendUrl = `https://staging-${deploymentId}.preview.lepos.dev`;
  const apiUrl = `https://api-staging-${deploymentId}.preview.lepos.dev`;
  const databaseUrl = `file://${mockDbPath}`;

  const serviceConfig: StagingServiceConfig = {
    frontendUrl,
    apiUrl,
    databaseUrl,
    mockDbPath,
  };

  // 4. Register multi-services staging in DB integrations
  // Find project's bundle
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    include: { bundle: true },
  });

  if (project?.bundle) {
    // Upsert external integration record representing the staging environment
    const integrationType = `staging-${deploymentId}`;
    await prisma.bundleExternalIntegrations.upsert({
      where: {
        bundleId_integrationType: {
          bundleId: project.bundle.id,
          integrationType,
        },
      },
      create: {
        id: crypto.randomUUID(),
        bundleId: project.bundle.id,
        integrationType,
        displayName: `Staging Multi-services Environment #${deploymentId}`,
        config: JSON.stringify(serviceConfig),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        config: JSON.stringify(serviceConfig),
        isActive: true,
        updatedAt: new Date(),
      },
    });
    console.log(`[Staging Staging] Registered staging services integration for bundle ${project.bundle.id}`);
  }

  return serviceConfig;
}

/**
 * Remove ephemeral database and integration configs for a staging environment.
 */
export async function deprovisionStagingServices(
  projectId: string,
  deploymentId: string
): Promise<void> {
  const dbDir = path.join(process.cwd(), "public", "bundles", "staging-dbs");
  const mockDbPath = path.join(dbDir, `${projectId}-${deploymentId}.json`);

  // Delete file
  try {
    await fs.unlink(mockDbPath);
    console.log(`[Staging Staging] Removed staging mock database: ${mockDbPath}`);
  } catch (err: any) {
    // Ignore if not exists
    if (err.code !== "ENOENT") {
      console.error(`[Staging Staging] Failed to delete staging database: ${err.message}`);
    }
  }

  // Remove integration record
  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      include: { bundle: true },
    });

    if (project?.bundle) {
      await prisma.bundleExternalIntegrations.deleteMany({
        where: {
          bundleId: project.bundle.id,
          integrationType: `staging-${deploymentId}`,
        },
      });
      console.log(`[Staging Staging] Deprovisioned staging database and registry configurations for ${deploymentId}`);
    }
  } catch (err: any) {
    console.error(`[Staging Staging] Failed to deprovision DB entries: ${err.message}`);
  }
}
