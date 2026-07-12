"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { getStripe } from "@/lib/server/stripe-connect";

async function requireAdmin() {
  const user = await requireCurrentUser();
  if (user.userType !== "admin") {
    throw new Error("Forbidden: admin access required.");
  }
  return user;
}

export async function initiatePayoutAction(payoutId: string) {
  const admin = await requireAdmin();
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe integration is not configured.");

  const payout = await prisma.bundlePayouts.findUnique({
    where: { id: payoutId },
    include: { developer: true },
  });

  if (!payout) throw new Error("Payout record not found.");
  if (payout.status !== "pending") throw new Error("Payout is not in pending status.");

  // Get connected partner account ID
  const partnerAccount = await prisma.marketplacePartnerAccount.findFirst({
    where: { workspaceId: payout.workspaceId || "" },
  });

  if (!partnerAccount || !partnerAccount.stripeAccountId) {
    throw new Error("Partner does not have a configured Stripe Connect account.");
  }

  // Create Stripe Transfer to connected account
  // This payout model allocates earnings to the partner
  const transfer = await stripe.transfers.create({
    amount: Math.round(payout.amount), // VND or other zero-decimal or minor values
    currency: payout.currency.toLowerCase(),
    destination: partnerAccount.stripeAccountId,
    description: `Payout reference ${payout.id} reconciled by admin ${admin.fullName || admin.email}`,
  });

  const updated = await prisma.bundlePayouts.update({
    where: { id: payoutId },
    data: {
      status: "completed",
      transactionRef: transfer.id,
      stripeAccountId: partnerAccount.stripeAccountId,
      stripePayoutId: transfer.id,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/admin/finance");
  return updated;
}

export async function approveRefundAction(refundRequestId: string, reviewNote: string) {
  const admin = await requireAdmin();
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe integration is not configured.");

  const refundRequest = await prisma.bundleRefundRequests.findUnique({
    where: { id: refundRequestId },
    include: { order: true },
  });

  if (!refundRequest) throw new Error("Refund request not found.");
  if (refundRequest.status !== "pending") throw new Error("Refund request is not pending.");

  const order = refundRequest.order;
  if (!order) throw new Error("Order not found.");

  // Find the marketplace transaction linked to this session/intent
  const transaction = await prisma.marketplaceTransaction.findFirst({
    where: {
      stripeCheckoutSessionId: order.transactionRef || undefined,
    },
  });

  const paymentIntentId = transaction?.stripePaymentIntentId || order.transactionRef;
  if (!paymentIntentId) {
    throw new Error("Payment transaction intent reference not found.");
  }

  // Trigger Stripe refund reversing destination charge and platform application fee
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    reverse_transfer: true,
    refund_application_fee: true,
  });

  const now = new Date();

  // Atomically update transaction records and revoke entitlements
  await prisma.$transaction([
    // Update Refund request
    prisma.bundleRefundRequests.update({
      where: { id: refundRequestId },
      data: {
        status: "approved",
        reviewNote,
        reviewedBy: admin.id,
        stripeRefundId: refund.id,
        stripePaymentIntentId: paymentIntentId,
        updatedAt: now,
      },
    }),
    // Update Order
    prisma.bundleOrders.update({
      where: { id: order.id },
      data: {
        status: "refunded",
        updatedAt: now,
      },
    }),
    // Update Marketplace Transaction
    prisma.marketplaceTransaction.updateMany({
      where: {
        OR: [
          { stripeCheckoutSessionId: order.transactionRef || undefined },
          { stripePaymentIntentId: paymentIntentId },
        ],
      },
      data: {
        status: "refunded",
        updatedAt: now,
      },
    }),
    // Revoke entitlement matching this purchase
    prisma.bundleUserEntitlements.updateMany({
      where: {
        userId: refundRequest.userId,
        bundleId: order.bundleId,
        orderId: order.id,
      },
      data: {
        isActive: false,
        updatedAt: now,
      },
    }),
  ]);

  revalidatePath("/admin/finance");
  return { success: true, refundId: refund.id };
}
