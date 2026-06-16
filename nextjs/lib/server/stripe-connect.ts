import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2022-11-15" as any }) : null;

// Helper to determine if we are running in simulated/mock mode
export const isStripeSimulated = () => !stripe;

/**
 * Create a Stripe Connect Express account for a partner workspace.
 */
export async function createConnectAccount(workspaceId: string, email: string) {
  if (!stripe) {
    console.log(`[Stripe Connect Simulation] Creating Connect Account for workspace: ${workspaceId}`);
    return {
      stripeAccountId: `acct_sim_${Math.random().toString(36).substring(2, 12)}`,
    };
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
    console.log(`[Stripe Connect Simulation] Generating onboarding link for account: ${stripeAccountId}`);
    return {
      url: `${returnUrl}?stripe_status=success&simulated_acct=${stripeAccountId}`,
    };
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
    console.log(`[Stripe Connect Simulation] Creating payment with split for partner: ${partnerStripeAccountId}, amount: ${amount}`);
    const simulatedPaymentIntentId = `pi_sim_${Math.random().toString(36).substring(2, 12)}`;
    return {
      clientSecret: `${simulatedPaymentIntentId}_secret_${Math.random().toString(36).substring(2, 10)}`,
      paymentIntentId: simulatedPaymentIntentId,
      transferAmount,
      platformFeeAmount,
    };
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
  if (!stripe || stripeAccountId.startsWith("acct_sim_")) {
    return {
      available: [{ amount: 15420000, currency: "vnd" }],
      pending: [{ amount: 4890000, currency: "vnd" }],
    };
  }

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
  if (!stripe || stripeAccountId.startsWith("acct_sim_")) {
    return [
      {
        id: "po_sim_1",
        amount: 8500000,
        currency: "vnd",
        status: "paid",
        arrivalDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        bankName: "Joint Stock Commercial Bank for Foreign Trade of Vietnam (Vietcombank)",
      },
      {
        id: "po_sim_2",
        amount: 6200000,
        currency: "vnd",
        status: "paid",
        arrivalDate: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
        bankName: "Joint Stock Commercial Bank for Foreign Trade of Vietnam (Vietcombank)",
      },
    ];
  }

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
