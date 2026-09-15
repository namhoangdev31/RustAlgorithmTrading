import { prisma } from "@/lib/server/prisma";

export async function getRankedBundles(options?: {
  category?: string;
  take?: number;
  skip?: number;
}) {
  const { category, take = 20, skip = 0 } = options || {};

  const bundles = await prisma.bundles.findMany({
    where: {
      status: "published",
      deletedAt: null,
      ...(category ? { category } : {}),
    },
    include: {
      rankingScores: true,
      stats: true,
    },
    orderBy: [
      {
        rankingScores: {
          overallScore: "desc",
        },
      },
      {
        publishedAt: "desc",
      },
    ],
    take,
    skip,
  });

  return bundles;
}
