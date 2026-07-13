import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export async function GET(_: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const reviews = await prisma.bundleReviews.findMany({
    where: { bundle: { slug, status: "published" } },
    select: { id: true, rating: true, title: true, body: true, isVerified: true, developerReply: true, helpfulCount: true, createdAt: true },
    orderBy: [{ helpfulCount: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  return NextResponse.json({ reviews });
}

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await context.params;
  const body = await request.json();
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "rating must be between 1 and 5" }, { status: 400 });
  const bundle = await prisma.bundles.findUnique({ where: { slug }, select: { id: true } });
  if (!bundle) return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  const eligible = await prisma.$transaction(async (tx) => {
    const [entitlement, install] = await Promise.all([
      tx.bundleUserEntitlements.findFirst({ where: { bundleId: bundle.id, userId: session.user.id, isActive: true, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } }),
      tx.bundleInstallEvents.findFirst({ where: { bundleId: bundle.id, userId: session.user.id, eventType: { in: ["install", "completed"] } } }),
    ]);
    if (!entitlement && !install) return null;
    return tx.bundleReviews.upsert({
      where: { bundleId_userId: { bundleId: bundle.id, userId: session.user.id } },
      create: { id: crypto.randomUUID(), bundleId: bundle.id, userId: session.user.id, rating, title: String(body.title || "").slice(0, 255) || null, body: String(body.body || "").slice(0, 5000) || null, isVerified: true, createdAt: new Date(), updatedAt: new Date() },
      update: { rating, title: String(body.title || "").slice(0, 255) || null, body: String(body.body || "").slice(0, 5000) || null, isVerified: true, updatedAt: new Date() },
    });
  });
  return eligible ? NextResponse.json({ review: eligible }, { status: 201 }) : NextResponse.json({ error: "A verified install or active entitlement is required" }, { status: 403 });
}
