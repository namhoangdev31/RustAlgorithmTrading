import type { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/server/prisma";

export async function searchLepoShipMarketplace(input: {
  query?: string;
  category?: string;
  locale?: string;
  region?: string;
  limit?: number;
  offset?: number;
}) {
  const query = input.query?.trim().slice(0, 100) || "";
  const limit = Math.min(50, Math.max(1, input.limit || 20));
  const offset = Math.max(0, input.offset || 0);
  const locale = input.locale?.toLowerCase().replaceAll("_", "-");
  const language = locale?.split("-")[0];
  const localeChain = [...new Set([locale, language, "en"].filter((value): value is string => Boolean(value)))];
  const region = input.region?.trim().toUpperCase().slice(0, 10);
  const where: Prisma.BundlesWhereInput = {
    status: "published",
    deletedAt: null,
    ...(input.category ? { category: input.category } : {}),
    ...(query ? {
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { shortDescription: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
        { searchKeywords: { some: { keyword: { contains: query, mode: "insensitive" as const } } } },
        { tags: { some: { tag: { contains: query, mode: "insensitive" as const } } } },
        { localizations: { some: { ...(input.locale ? { languageCode: input.locale } : {}), OR: [
          { localizedName: { contains: query, mode: "insensitive" as const } },
          { localizedDescription: { contains: query, mode: "insensitive" as const } },
        ] } } },
      ],
    } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.bundles.findMany({
      where,
      select: {
        id: true, slug: true, name: true, iconUrl: true, bannerUrl: true, shortDescription: true,
        category: true, price: true, currency: true, isFree: true, publishedAt: true,
        rankingScores: { select: { overallScore: true, qualityScore: true } },
        reviews: { select: { rating: true } },
        localizations: { where: { languageCode: { in: localeChain } }, take: 3 },
        featuredSlots: { where: { isActive: true, startsAt: { lte: new Date() }, AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] }, { OR: [{ region: null }, ...(region ? [{ region }] : [])] }] }, take: 1 },
      },
      orderBy: [{ rankingScores: { overallScore: "desc" } }, { publishedAt: "desc" }],
      skip: offset,
      take: limit,
    }),
    prisma.bundles.count({ where }),
  ]);
  return {
    total,
    offset,
    limit,
    items: items.map((item) => {
      const localization = localeChain.map((code) => item.localizations.find((candidate) => candidate.languageCode.toLowerCase() === code)).find(Boolean);
      return ({
      ...item,
      displayName: localization?.localizedName || item.name,
      displayDescription: localization?.localizedShortDesc || item.shortDescription,
      rating: item.reviews.length ? item.reviews.reduce((sum, review) => sum + review.rating, 0) / item.reviews.length : null,
      reviewCount: item.reviews.length,
      featured: item.featuredSlots.length > 0,
      reviews: undefined,
      localizations: undefined,
      featuredSlots: undefined,
    });}),
  };
}
