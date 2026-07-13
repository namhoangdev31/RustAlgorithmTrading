import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export async function POST(request: NextRequest, context: { params: Promise<{ reviewId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { reviewId } = await context.params;
  const body = await request.json();
  const reason = String(body.reason || "").trim().slice(0, 100);
  if (!reason) return NextResponse.json({ error: "reason is required" }, { status: 400 });
  const report = await prisma.$transaction(async (tx) => {
    const existing = await tx.bundleReviewReports.findUnique({ where: { reviewId_reportedBy: { reviewId, reportedBy: session.user.id } }, select: { id: true } });
    const item = await tx.bundleReviewReports.upsert({
      where: { reviewId_reportedBy: { reviewId, reportedBy: session.user.id } },
      create: { id: crypto.randomUUID(), reviewId, reportedBy: session.user.id, reason, description: String(body.description || "").slice(0, 2000) || null, createdAt: new Date(), updatedAt: new Date() },
      update: { reason, description: String(body.description || "").slice(0, 2000) || null, status: "pending", updatedAt: new Date() },
    });
    if (!existing) await tx.bundleReviews.update({ where: { id: reviewId }, data: { reportCount: { increment: 1 }, updatedAt: new Date() } });
    return item;
  });
  return NextResponse.json({ report }, { status: 201 });
}
