"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";

async function requireAdmin() {
  const user = await requireCurrentUser();
  if (user.userType !== "admin") {
    throw new Error("Forbidden: admin access required.");
  }
  return user;
}

export async function issueStrikeAction(data: {
  developerId: string;
  bundleId?: string;
  strikeType: string;
  severity: "minor" | "major" | "critical";
  description: string;
  expiresAt?: string;
}) {
  const admin = await requireAdmin();
  const now = new Date();
  const expires = data.expiresAt ? new Date(data.expiresAt) : null;

  return await prisma.$transaction(async (tx) => {
    // 1. Create the strike
    const strike = await tx.bundleDeveloperStrikes.create({
      data: {
        id: crypto.randomUUID(),
        developerId: data.developerId,
        bundleId: data.bundleId || null,
        strikeType: data.strikeType,
        severity: data.severity,
        description: data.description,
        issuedBy: admin.id,
        expiresAt: expires,
        isActive: true,
        createdAt: now,
      },
    });

    // 2. Count active, non-expired strikes for this developer
    const activeStrikesCount = await tx.bundleDeveloperStrikes.count({
      where: {
        developerId: data.developerId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
    });

    // 3. If >= 3 active strikes, suspend all their bundles
    let suspendedCount = 0;
    if (activeStrikesCount >= 3) {
      // Find developer's bundles that are published or under_review
      const developerBundles = await tx.bundles.findMany({
        where: {
          developerId: data.developerId,
          status: { in: ["published", "under_review"] },
        },
        select: { id: true, status: true },
      });

      for (const bundle of developerBundles) {
        await tx.bundles.update({
          where: { id: bundle.id },
          data: { status: "suspended", updatedAt: now },
        });

        await tx.bundleStateTransitions.create({
          data: {
            id: crypto.randomUUID(),
            bundleId: bundle.id,
            fromState: bundle.status,
            toState: "suspended",
            trigger: "automatic_strike_suspension",
            metadata: JSON.stringify({ activeStrikesCount }),
            triggeredBy: admin.id,
            createdAt: now,
          },
        });
        suspendedCount++;
      }
    }

    revalidatePath("/admin/strikes");
    return { strike, activeStrikesCount, suspendedCount };
  });
}

export async function revokeStrikeAction(strikeId: string, reason: string) {
  const admin = await requireAdmin();
  const now = new Date();

  const updated = await prisma.bundleDeveloperStrikes.update({
    where: { id: strikeId },
    data: {
      isActive: false,
      revokedAt: now,
      revokedBy: admin.id,
      revokeReason: reason,
    },
  });

  revalidatePath("/admin/strikes");
  return updated;
}

export async function triageReportAction(reportId: string, status: "resolved" | "dismissed", resolution: string) {
  const admin = await requireAdmin();
  const now = new Date();

  const updated = await prisma.bundleUserReports.update({
    where: { id: reportId },
    data: {
      status,
      resolution,
      reviewedBy: admin.id,
      updatedAt: now,
    },
  });

  revalidatePath("/admin/strikes");
  return updated;
}
