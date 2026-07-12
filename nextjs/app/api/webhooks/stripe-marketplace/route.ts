import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { constructMarketplaceWebhookEvent, isStripeAvailable } from "@/lib/server/stripe-connect";
import { queueWebhookEvent } from "@/lib/server/webhook-dispatcher";

function fromStripeAmount(amountInMinor: number, currency: string): number {
  const zeroDecimal = ["bif", "djf", "gnf", "jpy", "kmf", "lrd", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"];
  if (zeroDecimal.includes(currency.toLowerCase())) {
    return amountInMinor;
  }
  return amountInMinor / 100;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature") || "";
    const webhookSecret = process.env.STRIPE_MARKETPLACE_WEBHOOK_SECRET || "";

    if (!isStripeAvailable()) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }
    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
    }

    let event: any;
    try {
      event = constructMarketplaceWebhookEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error(`[Stripe Marketplace Webhook] Verification failed: ${err.message}`);
      return NextResponse.json({ error: `Verification failed: ${err.message}` }, { status: 400 });
    }

    console.log(`[Stripe Marketplace Webhook] Received event type: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        const sessionId = session.id;
        const metadata = session.metadata || {};
        const mode = session.mode;

        const buyerUserId = metadata.buyerUserId;
        const bundleId = metadata.bundleId;

        if (!buyerUserId || !bundleId) {
          console.warn("[Stripe Marketplace Webhook] Missing buyerUserId or bundleId in metadata", metadata);
          break;
        }

        const now = new Date();

        if (mode === "payment") {
          // --- ONE-TIME PURCHASE FULFILLMENT ---
          let fulfilled = false;
          const totalAmount = fromStripeAmount(session.amount_total || 0, session.currency || "VND");
          const currency = (session.currency || "VND").toUpperCase();
          const feePercent = Number(metadata.platformFeePercent ?? 30);
          const platformFee = totalAmount * Math.max(0, Math.min(100, feePercent)) / 100;
          const partnerPayout = totalAmount - platformFee;

          await prisma.$transaction(async (tx) => {
            // Check if transaction/order already exists
            const existingTx = await tx.marketplaceTransaction.findFirst({
              where: { stripeCheckoutSessionId: sessionId },
            });

            if (existingTx) {
              console.log(`[Stripe Marketplace Webhook] Transaction already handled for session ${sessionId}`);
              return;
            }

            // Create Marketplace Transaction
            await tx.marketplaceTransaction.create({
              data: {
                stripePaymentIntentId: session.payment_intent as string || sessionId,
                stripeCheckoutSessionId: sessionId,
                bundleId,
                buyerUserId,
                amount: totalAmount,
                currency,
                platformFee,
                partnerPayout,
                status: "completed",
                createdAt: now,
                updatedAt: now,
              },
            });

            // Create Order
            const orderId = crypto.randomUUID();
            await tx.bundleOrders.create({
              data: {
                id: orderId,
                bundleId,
                userId: buyerUserId,
                totalAmount,
                currency,
                status: "completed",
                paymentProvider: "stripe",
                transactionRef: sessionId,
                createdAt: now,
                updatedAt: now,
              },
            });

            // Create Order Item
            await tx.bundleOrderItems.create({
              data: {
                id: crypto.randomUUID(),
                orderId,
                productType: "one_time",
                productId: bundleId,
                productName: metadata.bundleName || "Bundle Purchase",
                price: totalAmount,
                currency,
                quantity: 1,
              },
            });

            // Upsert User Entitlement
            await tx.bundleUserEntitlements.upsert({
              where: {
                userId_bundleId_entitlementType: {
                  userId: buyerUserId,
                  bundleId,
                  entitlementType: "one_time",
                },
              },
              create: {
                id: crypto.randomUUID(),
                userId: buyerUserId,
                bundleId,
                orderId,
                entitlementType: "one_time",
                isActive: true,
                createdAt: now,
                updatedAt: now,
              },
              update: {
                orderId,
                isActive: true,
                updatedAt: now,
              },
            });
            fulfilled = true;
          });

          // Record install event
          if (fulfilled) {
            await prisma.marketplaceInstallEvent.create({
              data: {
                bundleId,
                userId: buyerUserId,
                eventType: "install",
                metadata: { source: "marketplace_checkout_payment", sessionId },
                createdAt: now,
              },
            });

            // Dispatch order completed webhook
            await queueWebhookEvent(
              bundleId,
              "order:completed",
              `wh_evt_order_completed_${sessionId}`,
              {
                sessionId,
                buyerUserId,
                amount: totalAmount,
                currency,
              }
            ).catch((err) => console.error("[Webhook Dispatch Error]", err.message));
          }

          console.log(`[Stripe Marketplace Webhook] Fulfilled one-time order for bundle ${bundleId}`);
        } else if (mode === "subscription") {
          // --- SUBSCRIPTION PURCHASE FULFILLMENT ---
          let fulfilled = false;
          const subscriptionId = session.subscription as string;
          const planId = metadata.planId;

          if (!planId || !subscriptionId) {
            console.warn("[Stripe Marketplace Webhook] Missing subscription or planId in metadata", metadata);
            break;
          }

          await prisma.$transaction(async (tx) => {
            // Check if subscription already created in history
            const existingSub = await tx.bundleSubscriptionHistory.findUnique({
              where: { stripeSubscriptionId: subscriptionId },
            });

            if (existingSub) {
              console.log(`[Stripe Marketplace Webhook] Subscription history already exists for ${subscriptionId}`);
              return;
            }

            // Create Subscription History
            await tx.bundleSubscriptionHistory.create({
              data: {
                id: crypto.randomUUID(),
                userId: buyerUserId,
                planId,
                bundleId,
                startAt: now,
                status: "active",
                stripeSubscriptionId: subscriptionId,
                stripeCustomerId: session.customer as string,
                createdAt: now,
                updatedAt: now,
              },
            });

            // Create Entitlement
            await tx.bundleUserEntitlements.upsert({
              where: {
                userId_bundleId_entitlementType: {
                  userId: buyerUserId,
                  bundleId,
                  entitlementType: "subscription",
                },
              },
              create: {
                id: crypto.randomUUID(),
                userId: buyerUserId,
                bundleId,
                entitlementType: "subscription",
                isActive: true,
                createdAt: now,
                updatedAt: now,
              },
              update: {
                isActive: true,
                updatedAt: now,
              },
            });
            fulfilled = true;
          });

          // Record install event
          if (fulfilled) {
            await prisma.marketplaceInstallEvent.create({
              data: {
                bundleId,
                userId: buyerUserId,
                eventType: "install",
                metadata: { source: "marketplace_checkout_subscription", subscriptionId },
                createdAt: now,
              },
            });
          }

          console.log(`[Stripe Marketplace Webhook] Fulfilled subscription start for plan ${planId}`);
        }
        break;
      }

      case "invoice.paid": {
        // --- SUBSCRIPTION RENEWAL/INVOICE PAID ---
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;
        const invoiceId = invoice.id;

        if (!subscriptionId) {
          console.warn("[Stripe Marketplace Webhook] invoice.paid missing subscription ID");
          break;
        }

        const subHistory = await prisma.bundleSubscriptionHistory.findUnique({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (!subHistory) {
          console.warn(`[Stripe Marketplace Webhook] Subscription history not found for stripeSubscriptionId: ${subscriptionId}`);
          break;
        }

        const periodEnd = invoice.lines?.data?.[0]?.period?.end
          ? new Date(invoice.lines.data[0].period.end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // fallback +30 days

        const totalAmount = fromStripeAmount(invoice.amount_paid || 0, invoice.currency || "VND");
        const currency = (invoice.currency || "VND").toUpperCase();
        const platformFee = totalAmount * 0.3;
        const partnerPayout = totalAmount - platformFee;

        const now = new Date();

        await prisma.$transaction(async (tx) => {
          // Check if invoice already processed
          const existingTx = await tx.marketplaceTransaction.findFirst({
            where: { stripeInvoiceId: invoiceId },
          });

          if (existingTx) {
            console.log(`[Stripe Marketplace Webhook] Invoice transaction already handled: ${invoiceId}`);
            return;
          }

          // Create transaction for payout tracking
          await tx.marketplaceTransaction.create({
            data: {
              stripePaymentIntentId: invoice.payment_intent as string || invoiceId,
              stripeInvoiceId: invoiceId,
              bundleId: subHistory.bundleId,
              buyerUserId: subHistory.userId,
              amount: totalAmount,
              currency,
              platformFee,
              partnerPayout,
              status: "completed",
              createdAt: now,
              updatedAt: now,
            },
          });

          // Extend subscription history currentPeriodEnd
          await tx.bundleSubscriptionHistory.update({
            where: { id: subHistory.id },
            data: {
              status: "active",
              currentPeriodEnd: periodEnd,
              latestInvoiceId: invoiceId,
              updatedAt: now,
            },
          });

          // Re-activate entitlement just in case
          await tx.bundleUserEntitlements.upsert({
            where: {
              userId_bundleId_entitlementType: {
                userId: subHistory.userId,
                bundleId: subHistory.bundleId,
                entitlementType: "subscription",
              },
            },
            create: {
              id: crypto.randomUUID(),
              userId: subHistory.userId,
              bundleId: subHistory.bundleId,
              entitlementType: "subscription",
              isActive: true,
              createdAt: now,
              updatedAt: now,
            },
            update: {
              isActive: true,
              updatedAt: now,
            },
          });
        });

        console.log(`[Stripe Marketplace Webhook] Subscription renewal processed for ${subscriptionId}`);
        break;
      }

      case "invoice.payment_failed": {
        // --- SUBSCRIPTION PAYMENT FAILED ---
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          await prisma.bundleSubscriptionHistory.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
              status: "past_due",
              updatedAt: new Date(),
            },
          });
          console.log(`[Stripe Marketplace Webhook] Subscription set to past_due: ${subscriptionId}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        // --- GENERAL SUBSCRIPTION UPDATE ---
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        const status = subscription.status; // active, trialing, past_due, canceled, unpaid
        const periodEnd = new Date(subscription.current_period_end * 1000);

        const entitlementActive = status === "active" || status === "trialing";
        await prisma.$transaction(async (tx) => {
          const history = await tx.bundleSubscriptionHistory.findUnique({
            where: { stripeSubscriptionId: subscriptionId },
            select: { userId: true, bundleId: true },
          });
          await tx.bundleSubscriptionHistory.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
              status: status === "active" ? "active" : status,
              currentPeriodEnd: periodEnd,
              updatedAt: new Date(),
            },
          });
          if (history) {
            await tx.bundleUserEntitlements.updateMany({
              where: {
                userId: history.userId,
                bundleId: history.bundleId,
                entitlementType: "subscription",
              },
              data: { isActive: entitlementActive, updatedAt: new Date() },
            });
          }
        });
        console.log(`[Stripe Marketplace Webhook] Subscription ${subscriptionId} status updated to ${status}`);
        break;
      }

      case "customer.subscription.deleted": {
        // --- SUBSCRIPTION CANCELED ---
        const subscription = event.data.object;
        const subscriptionId = subscription.id;

        const subHistory = await prisma.bundleSubscriptionHistory.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
          select: { id: true, bundleId: true, userId: true },
        });

        if (subHistory) {
          const now = new Date();
          await prisma.$transaction(async (tx) => {
            // Update subscription history status
            await tx.bundleSubscriptionHistory.update({
              where: { id: subHistory.id },
              data: {
                status: "canceled",
                endAt: now,
                updatedAt: now,
              },
            });

            // Deactivate subscription entitlement
            await tx.bundleUserEntitlements.updateMany({
              where: {
                userId: subHistory.userId,
                bundleId: subHistory.bundleId,
                entitlementType: "subscription",
              },
              data: {
                isActive: false,
                updatedAt: now,
              },
            });
          });

          // Record uninstall / revoke event
          await prisma.marketplaceInstallEvent.create({
            data: {
              bundleId: subHistory.bundleId,
              userId: subHistory.userId,
              eventType: "uninstall",
              metadata: { source: "marketplace_subscription_deleted", subscriptionId },
              createdAt: now,
            },
          });

          console.log(`[Stripe Marketplace Webhook] Canceled subscription access for ${subscriptionId}`);
        }
        break;
      }

      default:
        console.log(`[Stripe Marketplace Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Stripe Marketplace Webhook] Exception occurred:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
