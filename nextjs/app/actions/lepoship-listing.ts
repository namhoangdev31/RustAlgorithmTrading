"use server";

import { revalidatePath } from "next/cache";
import { localizedHref, redirect } from "@/i18n/navigation";
import { unstable_rethrow } from "next/navigation";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function withQueryParam(href: string, key: string, value: string) {
  return `${href}${href.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

async function requireEditableBundle(userId: string, projectId: string) {
  const access = await requireProjectRole(userId, projectId, "editor");
  const bundle = access.project.bundle;
  if (!bundle) throw new Error("LepoShip bundle not found.");
  return bundle;
}

/** Validates HTTPS or root-relative URLs */
function isValidPreviewUrl(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Upsert Store Listing + Localization
// ---------------------------------------------------------------------------

const listingSchema = z.object({
  locale: z.string().min(2).max(10),
  name: z.string().max(255).optional(),
  shortDescription: z.string().max(255).optional(),
  description: z.string().optional(),
  localizedChangelog: z.string().optional(),
});

export async function upsertStoreListingAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = readFormValue(formData, "returnTo") || `/lepoship/${projectId}/store-listing`;

  if (!projectId) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "listing", "missing_project"));
  }

  let bundle: Awaited<ReturnType<typeof requireEditableBundle>>;
  try {
    bundle = await requireEditableBundle(user.id, projectId);
  } catch {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "listing", "access_denied"));
  }

  const parsed = listingSchema.safeParse({
    locale: readFormValue(formData, "locale"),
    name: readFormValue(formData, "name") || undefined,
    shortDescription: readFormValue(formData, "shortDescription") || undefined,
    description: readFormValue(formData, "description") || undefined,
    localizedChangelog: readFormValue(formData, "localizedChangelog") || undefined,
  });

  if (!parsed.success) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "listing", "validation_error"));
  }

  const { locale, name, shortDescription, description, localizedChangelog } = parsed.data;
  const now = new Date();

  try {
    await prisma.$transaction([
      // Upsert BundleStoreListings (region = BCP-47 locale)
      prisma.bundleStoreListings.upsert({
        where: {
          bundleId_region: { bundleId: bundle.id, region: locale },
        },
        create: {
          id: crypto.randomUUID(),
          bundleId: bundle.id,
          region: locale,
          name: name || null,
          shortDescription: shortDescription || null,
          description: description || null,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        update: {
          name: name || null,
          shortDescription: shortDescription || null,
          description: description || null,
          updatedAt: now,
        },
      }),
      // Upsert BundleLocalizations (languageCode = BCP-47 locale)
      prisma.bundleLocalizations.upsert({
        where: {
          bundleId_languageCode: { bundleId: bundle.id, languageCode: locale },
        },
        create: {
          id: crypto.randomUUID(),
          bundleId: bundle.id,
          languageCode: locale,
          localizedName: name || null,
          localizedShortDesc: shortDescription || null,
          localizedDescription: description || null,
          localizedChangelog: localizedChangelog || null,
          createdAt: now,
          updatedAt: now,
        },
        update: {
          localizedName: name || null,
          localizedShortDesc: shortDescription || null,
          localizedDescription: description || null,
          localizedChangelog: localizedChangelog || null,
          updatedAt: now,
        },
      }),
    ]);

    revalidatePath(`/lepoship/${projectId}/store-listing`);
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "listing", "saved"));
  } catch (error: any) {
    unstable_rethrow(error);
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "listing", error.message || "save_failed"));
  }
}

// ---------------------------------------------------------------------------
// Replace Screenshots (ordered)
// ---------------------------------------------------------------------------

export async function replaceScreenshotsAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = readFormValue(formData, "returnTo") || `/lepoship/${projectId}/store-listing`;

  if (!projectId) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "listing", "missing_project"));
  }

  let bundle: Awaited<ReturnType<typeof requireEditableBundle>>;
  try {
    bundle = await requireEditableBundle(user.id, projectId);
  } catch {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "listing", "access_denied"));
  }

  // Parse screenshots JSON: [{ url, caption?, deviceType? }]
  const screenshotsRaw = readFormValue(formData, "screenshots");
  let screenshots: { url: string; caption?: string; deviceType?: string }[] = [];
  try {
    screenshots = JSON.parse(screenshotsRaw || "[]");
  } catch {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "listing", "invalid_screenshots"));
  }

  // Validate URLs
  for (const s of screenshots) {
    if (!isValidPreviewUrl(s.url)) {
      const target = await localizedHref(returnTo);
      redirect(withQueryParam(target, "listing", "invalid_url"));
    }
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.bundleScreenshots.deleteMany({ where: { bundleId: bundle.id } }),
    ...screenshots.map((s, idx) =>
      prisma.bundleScreenshots.create({
        data: {
          id: crypto.randomUUID(),
          bundleId: bundle.id,
          url: s.url,
          caption: s.caption || null,
          deviceType: s.deviceType || null,
          sortOrder: idx,
          createdAt: now,
        },
      }),
    ),
  ]);

  revalidatePath(`/lepoship/${projectId}/store-listing`);
  const target = await localizedHref(returnTo);
  redirect(withQueryParam(target, "listing", "screenshots_saved"));
}

// ---------------------------------------------------------------------------
// Replace Keywords (per locale)
// ---------------------------------------------------------------------------

export async function replaceKeywordsAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const locale = readFormValue(formData, "locale") || "en";
  const returnTo = readFormValue(formData, "returnTo") || `/lepoship/${projectId}/store-listing`;

  if (!projectId) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "listing", "missing_project"));
  }

  let bundle: Awaited<ReturnType<typeof requireEditableBundle>>;
  try {
    bundle = await requireEditableBundle(user.id, projectId);
  } catch {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "listing", "access_denied"));
  }

  const keywordsRaw = readFormValue(formData, "keywords");
  // Normalize: split by comma/newline, lowercase, trim, deduplicate
  const keywords = [
    ...new Set(
      keywordsRaw
        .split(/[,\n]/)
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  await prisma.$transaction([
    prisma.bundleSearchKeywords.deleteMany({ where: { bundleId: bundle.id, locale } }),
    ...keywords.map((keyword, idx) =>
      prisma.bundleSearchKeywords.create({
        data: {
          id: crypto.randomUUID(),
          bundleId: bundle.id,
          keyword,
          locale,
          weight: keywords.length - idx, // Higher weight for first keywords
        },
      }),
    ),
  ]);

  revalidatePath(`/lepoship/${projectId}/store-listing`);
  const target = await localizedHref(returnTo);
  redirect(withQueryParam(target, "listing", "keywords_saved"));
}

// ---------------------------------------------------------------------------
// Replace Tags (global)
// ---------------------------------------------------------------------------

export async function replaceTagsAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = readFormValue(formData, "returnTo") || `/lepoship/${projectId}/store-listing`;

  if (!projectId) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "listing", "missing_project"));
  }

  let bundle: Awaited<ReturnType<typeof requireEditableBundle>>;
  try {
    bundle = await requireEditableBundle(user.id, projectId);
  } catch {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "listing", "access_denied"));
  }

  const tagsRaw = readFormValue(formData, "tags");
  const tags = [
    ...new Set(
      tagsRaw
        .split(/[,\n]/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  await prisma.$transaction([
    prisma.bundleTags.deleteMany({ where: { bundleId: bundle.id } }),
    ...tags.map((tag) =>
      prisma.bundleTags.create({
        data: {
          id: crypto.randomUUID(),
          bundleId: bundle.id,
          tag,
        },
      }),
    ),
  ]);

  revalidatePath(`/lepoship/${projectId}/store-listing`);
  const target = await localizedHref(returnTo);
  redirect(withQueryParam(target, "listing", "tags_saved"));
}

// ---------------------------------------------------------------------------
// Upsert Privacy Declaration
// ---------------------------------------------------------------------------

export async function upsertPrivacyDeclarationAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = readFormValue(formData, "projectId");
  const returnTo = readFormValue(formData, "returnTo") || `/lepoship/${projectId}/store-listing`;

  if (!projectId) {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "listing", "missing_project"));
  }

  let bundle: Awaited<ReturnType<typeof requireEditableBundle>>;
  try {
    bundle = await requireEditableBundle(user.id, projectId);
  } catch {
    const target = await localizedHref(returnTo);
    redirect(withQueryParam(target, "listing", "access_denied"));
  }

  const collectsPersonalData = readFormValue(formData, "collectsPersonalData") === "on";
  const thirdPartySharing = readFormValue(formData, "thirdPartySharing") === "on";
  const dataTypes = readFormValue(formData, "dataTypes") || null;
  const purposeOfCollection = readFormValue(formData, "purposeOfCollection") || null;
  const thirdParties = readFormValue(formData, "thirdParties") || null;
  const dataRetentionDaysRaw = readFormValue(formData, "dataRetentionDays");
  const dataRetentionDays = dataRetentionDaysRaw ? Number(dataRetentionDaysRaw) : null;
  const privacyContactEmail = readFormValue(formData, "privacyContactEmail") || null;

  const now = new Date();

  await prisma.bundlePrivacyDeclarations.upsert({
    where: { bundleId: bundle.id },
    create: {
      id: crypto.randomUUID(),
      bundleId: bundle.id,
      collectsPersonalData,
      dataTypes,
      purposeOfCollection,
      thirdPartySharing,
      thirdParties,
      dataRetentionDays,
      privacyContactEmail,
      declarationStatus: "submitted",
      createdAt: now,
      updatedAt: now,
    },
    update: {
      collectsPersonalData,
      dataTypes,
      purposeOfCollection,
      thirdPartySharing,
      thirdParties,
      dataRetentionDays,
      privacyContactEmail,
      declarationStatus: "submitted",
      revision: { increment: 1 },
      reviewedAt: null,
      updatedAt: now,
    },
  });

  revalidatePath(`/lepoship/${projectId}/store-listing`);
  const target = await localizedHref(returnTo);
  redirect(withQueryParam(target, "listing", "privacy_saved"));
}
