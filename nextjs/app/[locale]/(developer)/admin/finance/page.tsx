import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { PageHeader } from "@/components/portal/PageHeader";
import { getTranslations } from "next-intl/server";
import { FinanceManager } from "./FinanceManager";
import { redirect } from "next/navigation";

export default async function AdminFinancePage() {
  const t = await getTranslations("LepoShip.finance");
  const user = await requireCurrentUser();

  if (user.userType !== "admin") {
    redirect("/overview");
  }

  // Fetch all payout logs
  const payouts = await prisma.bundlePayouts.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      developer: { select: { fullName: true, email: true } },
    },
  });

  // Fetch all pending and resolved refund requests
  const refunds = await prisma.bundleRefundRequests.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { fullName: true, email: true } },
      order: {
        select: {
          id: true,
          totalAmount: true,
          currency: true,
          transactionRef: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description="Reconcile connected partner accounts payouts and process marketplace charge refund requests."
      />
      <FinanceManager initialPayouts={payouts} initialRefunds={refunds} />
    </div>
  );
}
