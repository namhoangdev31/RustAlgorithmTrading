import dotenv from "dotenv";
import path from "path";

// Load environment variables before importing Prisma
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing for tests.");
}

const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });
export const runId = randomUUID().slice(0, 8);
export const testNamespace = `portal-test-${runId}`;

export async function createTestUser() {
  const uuid = randomUUID();
  return prisma.user.create({
    data: {
      id: uuid,
      email: `${testNamespace}-${uuid}@example.com`,
      fullName: `Test User ${uuid}`,
      provider: "email",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function createTestOrganization(userId: string) {
  const uuid = randomUUID();
  return prisma.organization.create({
    data: {
      id: uuid,
      name: `${testNamespace}-org-${uuid}`,
      type: "personal",
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function createTestProject(organizationId: string) {
  const uuid = randomUUID();
  return prisma.project.create({
    data: {
      id: uuid,
      name: `${testNamespace}-project-${uuid}`,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function cleanupTestData() {
  // Delete in order of constraint relationships
  await prisma.marketplaceCompatibilityRun.deleteMany({
    where: { integrationId: { startsWith: testNamespace } },
  });

  await prisma.workspaceAuditEvent.deleteMany({
    where: { actorEmail: { startsWith: testNamespace } },
  });

  await prisma.lepoShipBuild.deleteMany({
    where: { project: { name: { startsWith: testNamespace } } },
  });

  await prisma.projectProviderBinding.deleteMany({
    where: { project: { name: { startsWith: testNamespace } } },
  });

  await prisma.workspaceProviderConnection.deleteMany({
    where: { organization: { name: { startsWith: testNamespace } } },
  });

  await prisma.form.deleteMany({
    where: { project: { name: { startsWith: testNamespace } } },
  });

  await prisma.projectMembership.deleteMany({
    where: {
      user: {
        email: {
          startsWith: testNamespace,
        },
      },
    },
  });

  await prisma.organizationMembership.deleteMany({
    where: {
      user: {
        email: {
          startsWith: testNamespace,
        },
      },
    },
  });

  await prisma.project.deleteMany({
    where: {
      name: {
        startsWith: testNamespace,
      },
    },
  });

  await prisma.organization.deleteMany({
    where: {
      name: {
        startsWith: testNamespace,
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: testNamespace,
      },
    },
  });
}
