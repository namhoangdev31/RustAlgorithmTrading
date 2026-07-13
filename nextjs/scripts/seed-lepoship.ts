import "dotenv/config";

import { prisma } from "@/lib/server/prisma";

async function main() {
  const projectId = process.env.LEPOSHIP_SEED_PROJECT_ID;
  const actorId = process.env.LEPOSHIP_SEED_USER_ID;
  if (!projectId || !actorId) throw new Error("LEPOSHIP_SEED_PROJECT_ID and LEPOSHIP_SEED_USER_ID are required.");
  const now = new Date("2026-01-01T00:00:00.000Z");
  await prisma.$transaction(async (tx) => {
    const bundle = await tx.bundles.upsert({
      where: { projectId },
      create: {
        id: "10000000-0000-4000-8000-000000000001", projectId,
        name: "LepoShip Seed Bundle", slug: `lepoship-seed-${projectId.slice(0, 8)}`,
        storagePath: "canonical-only", bucket: "canonical-only", status: "draft",
        developerId: actorId, createdAt: now, updatedAt: now,
      },
      update: {},
    });
    await tx.bundleChannels.upsert({
      where: { bundleId_name: { bundleId: bundle.id, name: "production" } },
      create: { id: "10000000-0000-4000-8000-000000000002", bundleId: bundle.id, name: "production", createdAt: now, updatedAt: now },
      update: {},
    });
  });
  console.info("Deterministic LepoShip draft seed created without publishing a release.");
}

main().finally(() => prisma.$disconnect());
