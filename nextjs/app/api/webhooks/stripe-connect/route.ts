import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { constructConnectWebhookEvent, isStripeSimulated } from "@/lib/server/stripe-connect";

// GET handler acts as the "refresh" URL when onboarding fails or needs refresh
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");
  const orgId = searchParams.get("orgId");

  console.log(`[Stripe Webhook Refresh] Refreshing onboarding for account ${accountId}, org ${orgId}`);

  // Redirect back to billing dashboard page (we can append error/refresh status)
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUrl = new URL("/dashboard/marketplace/developer/billing", baseUrl);
  redirectUrl.searchParams.set("stripe_onboarding", "refreshed");
  if (orgId) redirectUrl.searchParams.set("orgId", orgId);

  return NextResponse.redirect(redirectUrl.toString());
}

// POST handler processes Stripe events
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature") || "";
    const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET || "";

    let event: any;

    if (isStripeSimulated()) {
      // Offline/Simulation Mode: parse JSON directly
      console.log("[Stripe Webhook Web] Running in simulated mode. Constructing mock event.");
      try {
        event = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: "Invalid JSON body for mock event" }, { status: 400 });
      }
    } else {
      if (!signature || !webhookSecret) {
        return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
      }
      try {
        event = constructConnectWebhookEvent(rawBody, signature, webhookSecret);
      } catch (err: any) {
        console.error(`[Stripe Webhook] Verification failed: ${err.message}`);
        return NextResponse.json({ error: `Verification failed: ${err.message}` }, { status: 400 });
      }
    }

    console.log(`[Stripe Webhook] Received event type: ${event.type}`);

    switch (event.type) {
      case "account.updated": {
        const account = event.data.object;
        const stripeAccountId = account.id;
        // In Stripe, details_submitted indicates onboarding complete
        const active = account.details_submitted || account.charges_enabled || isStripeSimulated();

        const partnerAccount = await prisma.marketplacePartnerAccount.findFirst({
          where: { stripeAccountId },
        });

        if (partnerAccount) {
          await prisma.marketplacePartnerAccount.update({
            where: { id: partnerAccount.id },
            data: {
              status: active ? "active" : "pending",
              updatedAt: new Date(),
            },
          });
          console.log(`[Stripe Webhook] Updated partner account ${partnerAccount.id} status to: ${active ? "active" : "pending"}`);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const piId = paymentIntent.id;

        const transaction = await prisma.marketplaceTransaction.findFirst({
          where: { stripePaymentIntentId: piId },
        });

        if (transaction) {
          await prisma.marketplaceTransaction.update({
            where: { id: transaction.id },
            data: {
              status: "completed",
              updatedAt: new Date(),
            },
          });

          // Record a marketplace install event
          await prisma.marketplaceInstallEvent.create({
            data: {
              bundleId: transaction.bundleId,
              userId: transaction.buyerUserId,
              eventType: "install",
              metadata: { source: "purchase_webhook", amount: transaction.amount },
            },
          });

          console.log(`[Stripe Webhook] Completed transaction ${transaction.id} for bundle ${transaction.bundleId}`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const piId = paymentIntent.id;

        const transaction = await prisma.marketplaceTransaction.findFirst({
          where: { stripePaymentIntentId: piId },
        });

        if (transaction) {
          await prisma.marketplaceTransaction.update({
            where: { id: transaction.id },
            data: {
              status: "failed",
              updatedAt: new Date(),
            },
          });
          console.log(`[Stripe Webhook] Transaction failed: ${transaction.id}`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Stripe Webhook] Exception occurred:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
