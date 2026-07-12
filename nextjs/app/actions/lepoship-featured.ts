"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";

async function requireAdmin() {
  const user = await requireCurrentUser();
  if (user.userType !== "admin") {
    throw new Error("Forbidden: admin access required.");
  }
}

export async function listFeaturedSlotsAction() {
  await requireAdmin();
  return await prisma.bundleFeaturedSlots.findMany({
    orderBy: [{ slotType: "asc" }, { sortOrder: "asc" }],
    include: {
      bundle: { select: { name: true } },
    },
  });
}

export async function upsertFeaturedSlotAction(data: {
  id?: string;
  bundleId: string;
  slotType: string; // e.g. carousel, grid
  title?: string;
  subtitle?: string;
  bannerUrl?: string;
  ctaLabel?: string;
  region?: string; // e.g. VN, US
  sortOrder: number;
  startsAt: string; // ISO date string
  endsAt?: string;  // ISO date string
  isActive: boolean;
}) {
  await requireAdmin();
  const now = new Date();
  const start = new Date(data.startsAt);
  const end = data.endsAt ? new Date(data.endsAt) : null;

  if (end && start >= end) {
    throw new Error("Start date must be before end date.");
  }

  const id = data.id || crypto.randomUUID();

  // overlap checks: search for active slots with same slotType, region, sortOrder
  // overlapping dates
  if (data.isActive) {
    const overlaps = await prisma.bundleFeaturedSlots.findMany({
      where: {
        id: { not: id },
        isActive: true,
        slotType: data.slotType,
        region: data.region || null,
        sortOrder: data.sortOrder,
      },
    });

    for (const row of overlaps) {
      const existingStart = row.startsAt;
      const existingEnd = row.endsAt;

      // Overlap condition:
      // Start is before existing end AND (end is null OR end is after existing start)
      const overlapsStart = start < (existingEnd || new Date(8640000000000000));
      const overlapsEnd = !end || end > existingStart;

      if (overlapsStart && overlapsEnd) {
        throw new Error(
          `Overlapping slot conflict. "${row.title || "Slot"}" occupies slot order ${data.sortOrder} from ${row.startsAt.toLocaleDateString()} to ${row.endsAt ? row.endsAt.toLocaleDateString() : "forever"}.`
        );
      }
    }
  }

  const result = await prisma.bundleFeaturedSlots.upsert({
    where: { id },
    create: {
      id,
      bundleId: data.bundleId,
      slotType: data.slotType,
      title: data.title || null,
      subtitle: data.subtitle || null,
      bannerUrl: data.bannerUrl || null,
      ctaLabel: data.ctaLabel || null,
      region: data.region || null,
      sortOrder: data.sortOrder,
      startsAt: start,
      endsAt: end,
      isActive: data.isActive,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      bundleId: data.bundleId,
      slotType: data.slotType,
      title: data.title || null,
      subtitle: data.subtitle || null,
      bannerUrl: data.bannerUrl || null,
      ctaLabel: data.ctaLabel || null,
      region: data.region || null,
      sortOrder: data.sortOrder,
      startsAt: start,
      endsAt: end,
      isActive: data.isActive,
      updatedAt: now,
    },
  });

  // Revalidate admin & store pages
  revalidatePath("/admin/featured");
  revalidatePath("/marketplace");

  return result;
}

export async function removeFeaturedSlotAction(id: string) {
  await requireAdmin();
  const deleted = await prisma.bundleFeaturedSlots.delete({ where: { id } });
  revalidatePath("/admin/featured");
  revalidatePath("/marketplace");
  return deleted;
}
