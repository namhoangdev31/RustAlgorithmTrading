"use server";

import { revalidatePath } from "next/cache";
import { localizedHref, redirect } from "@/i18n/navigation";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import {
  createConnectAccount,
  generateOnboardingLink,
  getPartnerBalance,
  getPartnerPayouts,
  isStripeAvailable,
} from "@/lib/server/stripe-connect";
import { requireWorkspaceRole } from "@/lib/server/permissions";

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function withQueryParam(href: string, key: string, value: string) {
  return `${href}${href.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

/**
 * Onboards the partner organization with Stripe Connect.
 */
export async function onboardPartnerAction(formData: FormData) {
  const user = await requireCurrentUser();
  const organizationId = readFormValue(formData, "organizationId");
  const returnTo = readFormValue(formData, "returnTo") || "/marketplace/billing";

  if (!organizationId) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "error", "missing_organization"));
  }
  await requireWorkspaceRole(user.id, organizationId, "admin");

  try {
    // Check if partner account already exists
    let partnerAccount = await prisma.marketplacePartnerAccount.findFirst({
      where: { workspaceId: organizationId },
    });

    let stripeAccountId = partnerAccount?.stripeAccountId;

    if (!stripeAccountId) {
      // Create new Connect Express account
      const email = user.email || "partner@lepos.dev";
      const accountRes = await createConnectAccount(organizationId, email);
      stripeAccountId = accountRes.stripeAccountId;

      // Create model entry
      partnerAccount = await prisma.marketplacePartnerAccount.create({
        data: {
          workspaceId: organizationId,
          stripeAccountId: stripeAccountId,
          status: "pending",
          revenueSharePercent: 70.0,
        },
      });
    }

    // Generate onboarding link
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const refreshUrl = `${baseUrl}/api/webhooks/stripe-connect/refresh?accountId=${stripeAccountId}&orgId=${organizationId}`;
    const returnUrl = `${baseUrl}${await localizedHref(returnTo)}`;

    const linkRes = await generateOnboardingLink(stripeAccountId, returnUrl, refreshUrl);

    revalidatePath(returnTo);
    redirect(linkRes.url);
  } catch (error: any) {
    console.error("Partner onboarding failed:", error);
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "error", error.message || "onboarding_failed"));
  }
}

/**
 * Get dashboard payout, balance, and transaction data for a workspace.
 */
export async function getPartnerBillingDashboardData(organizationId: string) {
  const user = await requireCurrentUser();
  await requireWorkspaceRole(user.id, organizationId, "viewer");

  // Find partner account
  const partnerAccount = await prisma.marketplacePartnerAccount.findFirst({
    where: { workspaceId: organizationId },
  });

  if (!partnerAccount) {
    return {
      connected: false,
      providerUnavailable: !isStripeAvailable(),
      partnerAccount: null,
      balance: { available: [{ amount: 0, currency: "vnd" }], pending: [{ amount: 0, currency: "vnd" }] },
      payouts: [],
      transactions: [],
    };
  }

  // Get balance & payouts from Stripe Connect engine
  let balance = { available: [] as Array<{ amount: number; currency: string }>, pending: [] as Array<{ amount: number; currency: string }> };
  let payouts: Awaited<ReturnType<typeof getPartnerPayouts>> = [];
  let providerUnavailable = false;
  try {
    [balance, payouts] = await Promise.all([
      getPartnerBalance(partnerAccount.stripeAccountId),
      getPartnerPayouts(partnerAccount.stripeAccountId),
    ]);
  } catch {
    providerUnavailable = true;
  }

  // Find related projects/bundles
  const projects = await prisma.project.findMany({
    where: { organizationId, deletedAt: null },
    select: { bundle: { select: { id: true } } },
  });

  const bundleIds = projects.flatMap((p) => p.bundle?.id || []);

  // Fetch transactions from DB
  const transactions = await prisma.marketplaceTransaction.findMany({
    where: { bundleId: { in: bundleIds } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const installEvents = await prisma.marketplaceInstallEvent.findMany({
    where: { bundleId: { in: bundleIds } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return {
    connected: partnerAccount.status === "active",
    providerUnavailable,
    partnerAccount,
    balance,
    payouts,
    transactions,
    installMetrics: {
      installs: installEvents.filter((event) => event.eventType === "install").length,
      uninstalls: installEvents.filter((event) => event.eventType === "uninstall").length,
      errors: installEvents.filter((event) => event.eventType === "error").length,
    },
  };
}
