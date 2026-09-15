import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2022-11-15" as any }) : null;

export const isStripeAvailable = () => Boolean(stripe);

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

export async function createPaymentWithSplit(params: {
  amount: number;
  currency: string;
  partnerStripeAccountId: string;
  buyerEmail: string;
  metadata?: Record<string, string>;
}) {
  const { amount, currency, partnerStripeAccountId, buyerEmail, metadata } = params;

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

export function toStripeAmount(amount: number, currency: string): number {
  const zeroDecimal = ["bif", "djf", "gnf", "jpy", "kmf", "lrd", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"];
  if (zeroDecimal.includes(currency.toLowerCase())) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

export function getStripeInstance() {
  return stripe;
}

export async function createMarketplaceCheckoutSession(params: {
  mode: "payment" | "subscription";
  priceAmount: number;
  currency: string;
  sellerStripeAccountId: string;
  buyerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
  platformFeePercent?: number;
  subscriptionPlanId?: string;
  billingPeriod?: string;
}) {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const {
    mode,
    priceAmount,
    currency,
    sellerStripeAccountId,
    buyerEmail,
    successUrl,
    cancelUrl,
    metadata,
  } = params;

  const stripeAmount = toStripeAmount(priceAmount, currency);
  const platformFeePercent = Math.max(0, Math.min(100, params.platformFeePercent ?? 30));
  const interval = normalizeBillingInterval(params.billingPeriod);

  if (mode === "payment") {
    
    const platformFeeAmount = Math.round(stripeAmount * (platformFeePercent / 100));

    return stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: buyerEmail,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: metadata.bundleName || "Marketplace Bundle Purchase",
            },
            unit_amount: stripeAmount,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: sellerStripeAccountId,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });
  } else {

    return stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: buyerEmail,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: metadata.planName || "Marketplace Subscription Plan",
            },
            unit_amount: stripeAmount,
            recurring: {
              interval,
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        application_fee_percent: platformFeePercent,
        transfer_data: {
          destination: sellerStripeAccountId,
        },
        metadata,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });
  }
}

function normalizeBillingInterval(period?: string): "day" | "week" | "month" | "year" {
  switch ((period || "month").trim().toLowerCase()) {
    case "day":
    case "daily":
      return "day";
    case "week":
    case "weekly":
      return "week";
    case "year":
    case "yearly":
    case "annual":
      return "year";
    case "month":
    case "monthly":
      return "month";
    default:
      throw new Error("Unsupported subscription billing period.");
  }
}

export function constructConnectWebhookEvent(body: string, signature: string, secret: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }
  return stripe.webhooks.constructEvent(body, signature, secret);
}

export function constructMarketplaceWebhookEvent(body: string, signature: string, secret: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }
  return stripe.webhooks.constructEvent(body, signature, secret);
}

export const getStripe = () => stripe;

