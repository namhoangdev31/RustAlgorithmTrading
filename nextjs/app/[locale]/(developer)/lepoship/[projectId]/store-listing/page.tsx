import { prisma } from "@/lib/server/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { PageHeader } from "@/components/portal/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StoreListingEditor } from "./StoreListingEditor";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function StoreListingPage({ params }: Props) {
  const { projectId } = await params;
  const t = await getTranslations("LepoShip.store_listing");
  const user = await requireCurrentUser();
  const access = await requireProjectRole(user.id, projectId, "viewer");
  const bundle = access.project.bundle;

  if (!bundle) {
    return (
      <div className="space-y-6">
        <PageHeader title="Store Listing" description="No LepoShip bundle linked to this project." />
      </div>
    );
  }

  // Fetch existing data
  const [listings, localizations, screenshots, keywords, tags, privacy] = await Promise.all([
    prisma.bundleStoreListings.findMany({
      where: { bundleId: bundle.id },
      orderBy: { region: "asc" },
    }),
    prisma.bundleLocalizations.findMany({
      where: { bundleId: bundle.id },
      orderBy: { languageCode: "asc" },
    }),
    prisma.bundleScreenshots.findMany({
      where: { bundleId: bundle.id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.bundleSearchKeywords.findMany({
      where: { bundleId: bundle.id },
      orderBy: { weight: "desc" },
    }),
    prisma.bundleTags.findMany({
      where: { bundleId: bundle.id },
      orderBy: { tag: "asc" },
    }),
    prisma.bundlePrivacyDeclarations.findFirst({
      where: { bundleId: bundle.id },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description="Manage localized listings, media, keywords, and privacy for your bundle."
      />

      <StoreListingEditor
        projectId={projectId}
        listings={listings.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
          updatedAt: l.updatedAt.toISOString(),
        }))}
        localizations={localizations.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
          updatedAt: l.updatedAt.toISOString(),
        }))}
        screenshots={screenshots.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
        }))}
        keywords={keywords}
        tags={tags}
        privacy={privacy ? {
          ...privacy,
          createdAt: privacy.createdAt.toISOString(),
          updatedAt: privacy.updatedAt.toISOString(),
        } : null}
      />
    </div>
  );
}
