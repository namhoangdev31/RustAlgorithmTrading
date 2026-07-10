"use server";

import { revalidatePath } from "next/cache";
import { localizedHref, redirect } from "@/i18n/navigation";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import crypto from "crypto";

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function withQueryParam(href: string, key: string, value: string) {
  return `${href}${href.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

/**
 * Register a partner profile for the current user.
 */
export async function registerDeveloperProfileAction(formData: FormData) {
  const user = await requireCurrentUser();
  const companyName = readFormValue(formData, "companyName");
  const developerEmail = readFormValue(formData, "developerEmail") || user.email || "";
  const websiteUrl = readFormValue(formData, "websiteUrl");
  const returnTo = readFormValue(formData, "returnTo") || "/marketplace";

  try {
    if (!companyName) {
      throw new Error("Company Name is required.");
    }

    // Keep the current partner profile fields until the dedicated profile model is introduced.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: companyName,
        userType: "partner_developer",
        registerType: websiteUrl,
        updatedAt: new Date(),
      },
    });

    revalidatePath(returnTo);
    redirect(withQueryParam(await localizedHref(returnTo), "dev_portal", "profile_registered"));
  } catch (error: any) {
    redirect(withQueryParam(await localizedHref(returnTo), "dev_portal", error.message || "profile_failed"));
  }
}

/**
 * Register a new partner integration (Marketplace Listing candidate).
 */
export async function registerIntegrationAction(formData: FormData) {
  const user = await requireCurrentUser();
  const integrationKey = readFormValue(formData, "integrationKey").toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const displayName = readFormValue(formData, "displayName");
  const description = readFormValue(formData, "description");
  const mode = readFormValue(formData, "mode") || "live";
  const webhookUrl = readFormValue(formData, "webhookUrl");
  const returnTo = readFormValue(formData, "returnTo") || "/marketplace";

  try {
    if (!integrationKey || !displayName) {
      throw new Error("Key and Display Name are required.");
    }

    const bundle = await prisma.bundles.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { developerId: user.id },
          { collaborators: { some: { userId: user.id } } },
          { project: { members: { some: { userId: user.id, inviteStatus: "accepted" } } } },
        ],
      },
      select: { id: true },
    });

    if (!bundle) {
      throw new Error("You must belong to at least one project bundle to register an integration.");
    }

    const now = new Date();
    await prisma.bundleExternalIntegrations.create({
      data: {
        id: crypto.randomUUID(),
        bundleId: bundle.id,
        integrationType: integrationKey,
        displayName: displayName,
        config: JSON.stringify({
          mode,
          description,
          webhookUrl,
          partnerId: user.id,
          status: "sandbox",
          complianceScore: 0,
        }),
        isActive: false, // Inactive until verified/published
        createdAt: now,
        updatedAt: now,
      },
    });

    revalidatePath(returnTo);
    redirect(withQueryParam(await localizedHref(returnTo), "dev_portal", "integration_registered"));
  } catch (error: any) {
    redirect(withQueryParam(await localizedHref(returnTo), "dev_portal", error.message || "integration_failed"));
  }
}

/**
 * Executes a persisted compatibility check against the registered endpoint.
 */
export async function runCompatibilityTestAction(formData: FormData) {
  const user = await requireCurrentUser();
  const integrationId = readFormValue(formData, "integrationId");
  const webhookUrl = readFormValue(formData, "webhookUrl");
  const returnTo = readFormValue(formData, "returnTo") || "/marketplace";

  try {
    if (!integrationId || !webhookUrl) {
      throw new Error("Integration and webhook URL are required for testing.");
    }

    const endpoint = new URL(webhookUrl);
    if (!['http:', 'https:'].includes(endpoint.protocol)) {
      throw new Error("Webhook URL must use HTTP or HTTPS.");
    }

    const integration = await prisma.bundleExternalIntegrations.findFirst({
      where: {
        id: integrationId,
        bundle: {
          collaborators: {
            some: { userId: user.id },
          },
        },
      },
    });

    if (!integration) {
      throw new Error("Integration not found or access denied.");
    }

    const startTime = Date.now();
    let status200 = false;
    let schemaValid = false;
    let signatureHeaderValid = false;
    let latencyMs = 0;
    let responseStatus: number | null = null;
    let failureMessage: string | null = null;

    try {
      const payload = {
        event: "compatibility.test",
        timestamp: new Date().toISOString(),
        sandbox: true,
        nonce: crypto.randomBytes(8).toString("hex"),
      };

      const testSignature = crypto
        .createHmac("sha256", "lepos-test-secret")
        .update(JSON.stringify(payload))
        .digest("hex");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-LepoS-Signature": testSignature,
          "User-Agent": "LepoS-Compatibility-Runner/1.0",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      latencyMs = Date.now() - startTime;
      responseStatus = response.status;
      status200 = response.ok;
      const responseBody = await response.json().catch(() => null);
      schemaValid = Boolean(responseBody && typeof responseBody === "object" && !Array.isArray(responseBody));
      signatureHeaderValid =
        response.headers.get("x-lepos-signature-verified") === "true" ||
        (schemaValid && (responseBody as Record<string, unknown>).signatureVerified === true);
    } catch (error) {
      latencyMs = Date.now() - startTime;
      failureMessage = error instanceof Error ? error.message : "Compatibility request failed.";
    }

    const score = [status200, schemaValid, signatureHeaderValid, latencyMs < 500].filter(Boolean).length * 25;
    const checkResults = {
      score,
      latencyMs,
      responseStatus,
      status200,
      schemaValid,
      signatureHeaderValid,
      failureMessage,
    };
    const currentConfig = JSON.parse(integration.config);

    await prisma.$transaction([
      prisma.marketplaceCompatibilityRun.create({
        data: {
          integrationId,
          endpoint: webhookUrl,
          checkResults,
          logs: failureMessage || `Endpoint responded with HTTP ${responseStatus}.`,
        },
      }),
      prisma.bundleExternalIntegrations.update({
        where: { id: integrationId },
        data: {
          config: JSON.stringify({
            ...currentConfig,
            webhookUrl,
            complianceScore: score,
            status: score === 100 ? "verified" : "sandbox",
            lastTestRun: {
              timestamp: new Date().toISOString(),
              ...checkResults,
            },
          }),
          updatedAt: new Date(),
        },
      }),
    ]);

    revalidatePath(returnTo);
    const resultHref = new URL(await localizedHref(returnTo), "https://portal.local");
    resultHref.searchParams.set("dev_portal", "test_completed");
    resultHref.searchParams.set("score", String(score));
    resultHref.searchParams.set("latency", String(latencyMs));
    redirect(`${resultHref.pathname}${resultHref.search}`);
  } catch (error: any) {
    redirect(withQueryParam(await localizedHref(returnTo), "dev_portal", error.message || "test_failed"));
  }
}

/**
 * Publish the partner integration listing directly to the Marketplace catalog.
 */
export async function publishMarketplaceIntegrationAction(formData: FormData) {
  const user = await requireCurrentUser();
  const integrationId = readFormValue(formData, "integrationId");
  const returnTo = readFormValue(formData, "returnTo") || "/marketplace";

  try {
    if (!integrationId) {
      throw new Error("Integration ID is required.");
    }

    const integration = await prisma.bundleExternalIntegrations.findFirst({
      where: {
        id: integrationId,
        bundle: {
          OR: [
            { developerId: user.id },
            { collaborators: { some: { userId: user.id } } },
            { project: { members: { some: { userId: user.id, inviteStatus: "accepted" } } } },
          ],
        },
      },
    });

    if (!integration) {
      throw new Error("Integration not found.");
    }

    const config = JSON.parse(integration.config);
    if (config.complianceScore !== 100) {
      throw new Error("Your integration must achieve 100% compliance in sandbox testing before publishing.");
    }

    // Mark active in database
    await prisma.bundleExternalIntegrations.update({
      where: { id: integrationId },
      data: {
        isActive: true,
        config: JSON.stringify({
          ...config,
          status: "published",
          publishedAt: new Date().toISOString(),
        }),
        updatedAt: new Date(),
      },
    });

    revalidatePath(returnTo);
    redirect(withQueryParam(await localizedHref(returnTo), "dev_portal", "integration_published"));
  } catch (error: any) {
    redirect(withQueryParam(await localizedHref(returnTo), "dev_portal", error.message || "publish_failed"));
  }
}

export async function updateIntegrationReleaseAction(formData: FormData) {
  const user = await requireCurrentUser();
  const integrationId = readFormValue(formData, "integrationId");
  const version = readFormValue(formData, "version") || "0.1.0";
  const releaseNotes = readFormValue(formData, "releaseNotes");
  const returnTo = readFormValue(formData, "returnTo") || "/marketplace";

  try {
    if (!integrationId) {
      throw new Error("Integration ID is required.");
    }

    const integration = await prisma.bundleExternalIntegrations.findFirst({
      where: {
        id: integrationId,
        bundle: {
          OR: [
            { developerId: user.id },
            { collaborators: { some: { userId: user.id } } },
            { project: { members: { some: { userId: user.id, inviteStatus: "accepted" } } } },
          ],
        },
      },
    });

    if (!integration) {
      throw new Error("Integration not found.");
    }

    let config: Record<string, any> = {};
    try {
      config = JSON.parse(integration.config);
    } catch {
      config = {};
    }

    const history = Array.isArray(config.releaseHistory) ? config.releaseHistory : [];
    history.unshift({
      version,
      releaseNotes,
      updatedAt: new Date().toISOString(),
    });

    await prisma.bundleExternalIntegrations.update({
      where: { id: integrationId },
      data: {
        config: JSON.stringify({
          ...config,
          version,
          releaseNotes,
          releaseHistory: history.slice(0, 10),
        }),
        updatedAt: new Date(),
      },
    });

    revalidatePath(returnTo);
    redirect(withQueryParam(await localizedHref(returnTo), "dev_portal", "release_updated"));
  } catch (error: any) {
    redirect(withQueryParam(await localizedHref(returnTo), "dev_portal", error.message || "release_update_failed"));
  }
}
