import { Prisma } from "@/prisma/generated/client";

import { prisma } from "@/lib/server/prisma";

export async function reconcileLepoShipFinance() {
  const imbalances = await prisma.$queryRaw<Array<{ transaction_id: string; debit: string; credit: string }>>(Prisma.sql`
    SELECT transaction_id,
      COALESCE(SUM(amount) FILTER (WHERE direction = 'debit'), 0)::text AS debit,
      COALESCE(SUM(amount) FILTER (WHERE direction = 'credit'), 0)::text AS credit
    FROM bundle_ledger_entries
    GROUP BY transaction_id
    HAVING COALESCE(SUM(amount) FILTER (WHERE direction = 'debit'), 0)
      <> COALESCE(SUM(amount) FILTER (WHERE direction = 'credit'), 0)
  `);
  const failedStripeEvents = await prisma.bundleStripeWebhookEvents.count({ where: { status: "failed" } });
  return { balanced: imbalances.length === 0, imbalances, failedStripeEvents, checkedAt: new Date().toISOString() };
}
