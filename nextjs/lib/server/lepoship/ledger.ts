import { Prisma, type LedgerEntryDirection } from "@/prisma/generated/client";

type Tx = Prisma.TransactionClient;

export type LedgerPosting = {
  accountCode: string;
  accountType: "asset" | "liability" | "revenue" | "expense";
  direction: LedgerEntryDirection;
  amountMinor: bigint;
};

export async function postLedgerTransaction(tx: Tx, input: {
  bundleId: string;
  orderId?: string;
  transactionType: string;
  providerRef?: string;
  idempotencyKey: string;
  currency: string;
  postings: LedgerPosting[];
  metadata?: Prisma.InputJsonValue;
}) {
  const debit = input.postings.filter((item) => item.direction === "debit").reduce((sum, item) => sum + item.amountMinor, BigInt(0));
  const credit = input.postings.filter((item) => item.direction === "credit").reduce((sum, item) => sum + item.amountMinor, BigInt(0));
  if (debit <= BigInt(0) || debit !== credit) throw new Error("UNBALANCED_LEDGER_TRANSACTION");
  const existing = await tx.bundleLedgerTransactions.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return existing;
  const transaction = await tx.bundleLedgerTransactions.create({
    data: {
      id: crypto.randomUUID(), bundleId: input.bundleId, orderId: input.orderId,
      transactionType: input.transactionType, status: "posted", providerRef: input.providerRef,
      idempotencyKey: input.idempotencyKey, currency: input.currency.toUpperCase(),
      metadata: input.metadata, createdAt: new Date(),
    },
  });
  for (const posting of input.postings) {
    const account = await tx.bundleLedgerAccounts.upsert({
      where: { bundleId_code_currency: { bundleId: input.bundleId, code: posting.accountCode, currency: input.currency.toUpperCase() } },
      create: {
        id: crypto.randomUUID(), bundleId: input.bundleId, code: posting.accountCode,
        accountType: posting.accountType, currency: input.currency.toUpperCase(), createdAt: new Date(),
      },
      update: {},
    });
    await tx.bundleLedgerEntries.create({
      data: {
        id: crypto.randomUUID(), transactionId: transaction.id, accountId: account.id,
        direction: posting.direction, amount: posting.amountMinor.toString(),
        currency: input.currency.toUpperCase(), createdAt: new Date(),
      },
    });
  }
  return transaction;
}
