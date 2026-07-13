import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { requireProjectRole } from "@/lib/server/permissions";

export async function POST(request: NextRequest, context: { params: Promise<{ reviewId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { reviewId } = await context.params;
  const review = await prisma.bundleReviews.findUnique({ where: { id: reviewId }, select: { bundle: { select: { projectId: true } } } });
  if (!review?.bundle.projectId) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  await requireProjectRole(session.user.id, review.bundle.projectId, "editor");
  const body = await request.json();
  const reply = String(body.reply || "").trim().slice(0, 3000);
  if (!reply) return NextResponse.json({ error: "reply is required" }, { status: 400 });
  const updated = await prisma.bundleReviews.update({ where: { id: reviewId }, data: { developerReply: reply, updatedAt: new Date() } });
  return NextResponse.json({ review: updated });
}
