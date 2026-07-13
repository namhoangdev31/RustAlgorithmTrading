import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";

export default async function ReviewsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const user = await requireCurrentUser();
  const access = await requireProjectRole(user.id, projectId, "viewer");
  const bundleId = access.project.bundle?.id;
  const reviews = bundleId ? await prisma.bundleReviews.findMany({
    where: { bundleId }, include: { user: { select: { fullName: true, email: true } }, _count: { select: { reviewReports: true } } },
    orderBy: { createdAt: "desc" }, take: 100,
  }) : [];
  return <Card><CardHeader><CardTitle>Verified reviews and replies</CardTitle></CardHeader><CardContent className="space-y-2">
    {reviews.length === 0 ? <p className="text-sm text-muted-foreground">No marketplace reviews.</p> : reviews.map((review) => <div key={review.id} className="rounded-md border border-hairline p-3 text-sm">
      <div className="flex justify-between gap-3"><strong>{review.title || `${review.rating}/5`}</strong><div className="flex gap-1"><Badge variant="outline">{review.rating}/5</Badge>{review.isVerified && <Badge>Verified</Badge>}</div></div>
      <p className="mt-1 text-muted-foreground">{review.body || "No written review."}</p>
      <p className="mt-2 text-xs text-muted-foreground">{review.user.fullName || review.user.email || "User"} · reports {review._count.reviewReports} · reply {review.developerReply ? "published" : "pending"}</p>
    </div>)}
  </CardContent></Card>;
}
