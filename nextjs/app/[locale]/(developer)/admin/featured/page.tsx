import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { PageHeader } from "@/components/portal/PageHeader";
import { getTranslations } from "next-intl/server";
import { FeaturedSlotsManager } from "./FeaturedSlotsManager";
import { redirect } from "next/navigation";

export default async function AdminFeaturedPage() {
  const t = await getTranslations("LepoShip.featured");
  const user = await requireCurrentUser();

  if (user.userType !== "admin") {
    redirect("/overview");
  }

  // Retrieve current featured slots
  const slots = await prisma.bundleFeaturedSlots.findMany({
    orderBy: [{ slotType: "asc" }, { sortOrder: "asc" }],
    include: {
      bundle: { select: { name: true } },
    },
  });

  // Retrieve published bundles to configure targets
  const bundles = await prisma.bundles.findMany({
    where: { status: "published" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description="Configure featured carousels, regional spotlights, and sorting order indices in the store."
      />
      <FeaturedSlotsManager initialSlots={slots} bundles={bundles} />
    </div>
  );
}
