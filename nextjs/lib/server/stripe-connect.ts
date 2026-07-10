import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2022-11-15" as any }) : null;

export const isStripeAvailable = () => Boolean(stripe);

/**
 * Create a Stripe Connect Express account for a partner workspace.
 */
export async function createConnectAccount(workspaceId: string, email: string) {
  if (!stripe) {
    throw new Error("Stripe Connect is unavailable because STRIPE_SECRET_KEY is not configured.");
  }

  try {
    const account = await stripe.accounts.create({
      type: "express",
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { workspaceId },
    });
    return { stripeAccountId: account.id };
  } catch (error) {
    console.error("Error creating Stripe Connect account:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create Connect account");
  }
}

/**
 * Generate Stripe Express onboarding link.
 */
export async function generateOnboardingLink(stripeAccountId: string, returnUrl: string, refreshUrl: string) {
  if (!stripe) {
    throw new Error("Stripe Connect onboarding is unavailable because STRIPE_SECRET_KEY is not configured.");
  }

  try {
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });
    return { url: accountLink.url };
  } catch (error) {
    console.error("Error generating onboarding link:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to generate onboarding link");
  }
}

/**
 * Create a PaymentIntent with a revenue split.
 * 30% platform fee, 70% goes to the partner.
 */
export async function createPaymentWithSplit(params: {
  amount: number;
  currency: string;
  partnerStripeAccountId: string;
  buyerEmail: string;
  metadata?: Record<string, string>;
}) {
  const { amount, currency, partnerStripeAccountId, buyerEmail, metadata } = params;

  // Revenue split: 30% platform fee, 70% to partner
  const platformFeeAmount = Math.round(amount * 0.3);
  const transferAmount = amount - platformFeeAmount;

  if (!stripe) {
    throw new Error("Stripe payments are unavailable because STRIPE_SECRET_KEY is not configured.");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      receipt_email: buyerEmail,
      transfer_data: {
        destination: partnerStripeAccountId,
      },
      application_fee_amount: platformFeeAmount,
      metadata: {
        ...metadata,
        transferAmount: String(transferAmount),
        platformFeeAmount: String(platformFeeAmount),
      },
    });

    return {
      clientSecret: paymentIntent.client_secret || "",
      paymentIntentId: paymentIntent.id,
      transferAmount,
      platformFeeAmount,
    };
  } catch (error) {
    console.error("Error creating payment intent with split:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create payment split");
  }
}

/**
 * Fetch Connected Account Balance.
 */
export async function getPartnerBalance(stripeAccountId: string) {
  if (!stripe) throw new Error("Stripe balance is unavailable because STRIPE_SECRET_KEY is not configured.");

  try {
    const balance = await stripe.balance.retrieve({}, {
      stripeAccount: stripeAccountId,
    });
    return {
      available: balance.available,
      pending: balance.pending,
    };
  } catch (error) {
    console.error("Error retrieving Stripe balance:", error);
    return {
      available: [{ amount: 0, currency: "vnd" }],
      pending: [{ amount: 0, currency: "vnd" }],
    };
  }
}

/**
 * Fetch Connected Account Payout History.
 */
export async function getPartnerPayouts(stripeAccountId: string) {
  if (!stripe) throw new Error("Stripe payouts are unavailable because STRIPE_SECRET_KEY is not configured.");

  try {
    const payouts = await stripe.payouts.list(
      { limit: 10 },
      { stripeAccount: stripeAccountId }
    );
    return payouts.data.map((po) => ({
      id: po.id,
      amount: po.amount,
      currency: po.currency,
      status: po.status,
      arrivalDate: new Date(po.arrival_date * 1000).toISOString(),
      bankName: (po as any).bank_account || po.destination ? "Connected Bank Account" : "Express Debit Card",
    }));
  } catch (error) {
    console.error("Error retrieving Stripe payouts:", error);
    return [];
  }
}

/**
 * Construct Stripe Connect Webhook Event.
 */
export function constructConnectWebhookEvent(body: string, signature: string, secret: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }
  return stripe.webhooks.constructEvent(body, signature, secret);
}
