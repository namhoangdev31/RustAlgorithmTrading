import { prisma } from "@/lib/server/prisma";

export async function getDashboardData(userId: string) {
  const [
    currentUser,
    orderCount,
    riskEventCount,
    publishedBundleCount,
    recentOrders,
    recentRiskEvents,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        provider: true,
        userType: true,
        createdAt: true,
      },
    }),
    prisma.order.count(),
    prisma.riskEvent.count(),
    prisma.bundles.count({
      where: {
        deletedAt: null,
        status: "published",
      },
    }),
    prisma.order.findMany({
      orderBy: { submittedAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderId: true,
        symbol: true,
        side: true,
        quantity: true,
        status: true,
        submittedAt: true,
      },
    }),
    prisma.riskEvent.findMany({
      orderBy: { occurredAt: "desc" },
      take: 5,
      select: {
        id: true,
        eventType: true,
        severity: true,
        message: true,
        occurredAt: true,
      },
    }),
  ]);

  return {
    currentUser,
    orderCount,
    riskEventCount,
    publishedBundleCount,
    recentOrders,
    recentRiskEvents,
  };
}
