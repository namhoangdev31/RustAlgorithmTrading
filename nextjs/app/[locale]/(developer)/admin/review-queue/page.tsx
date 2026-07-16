import { prisma } from "@/lib/server/prisma";
import { PageHeader } from "@/components/portal/PageHeader";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReviewQueueActions } from "./ReviewQueueActions";
import { getTranslations } from "next-intl/server";

export default async function ReviewQueuePage() {
  const t = await getTranslations("LepoShip.moderation");
  const queueItems = await prisma.bundleReviewQueue.findMany({
    where: {
      status: "pending",
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: 50,
    include: {
      bundle: {
        select: {
          id: true,
          name: true,
          version: true,
          buildNumber: true,
          status: true,
          slug: true,
        },
      },
      submittedVersion: {
        select: {
          id: true,
          version: true,
          buildNumber: true,
        },
      },
      release: {
        select: { id: true, version: true, buildNumber: true, status: true, verificationRuns: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, status: true, decision: true, overallScore: true, confidence: true } } },
      },
      reviewer: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });

  // Fetch recent security scan results for the queued bundles
  const bundleIds = [...new Set(queueItems.map((q) => q.bundleId))];
  const securityScans = bundleIds.length
    ? await prisma.bundleSecurityScanResults.findMany({
        where: { bundleId: { in: bundleIds } },
        orderBy: { scannedAt: "desc" },
        take: 100,
      })
    : [];

  const scansByBundle = new Map<string, typeof securityScans>();
  for (const scan of securityScans) {
    const arr = scansByBundle.get(scan.bundleId) || [];
    arr.push(scan);
    scansByBundle.set(scan.bundleId, arr);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description="Pending bundle submissions awaiting moderation."
      />

      {queueItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No pending reviews. All caught up!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {queueItems.map((item) => {
            const scans = scansByBundle.get(item.bundleId) || [];
            const latestScan = scans[0];
            const verification = item.release?.verificationRuns[0];

            return (
              <Card key={item.id} className="border-hairline">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm font-medium truncate">
                        {item.bundle.name}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <span>
                          v{item.release?.version ?? item.submittedVersion?.version ?? item.bundle.version}
                          {" · "}
                          Build #{item.release?.buildNumber ?? item.submittedVersion?.buildNumber ?? item.bundle.buildNumber}
                        </span>
                        {item.bundle.slug && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {item.bundle.slug}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 bg-amber-500/5 text-amber-500 border-amber-500/20"
                        >
                          Priority {item.priority}
                        </Badge>
                      </div>
                    </div>
                    <StatusBadge status="pending" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Queue notes */}
                  {item.notes && (
                    <div className="rounded-md border border-hairline bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      {item.notes}
                    </div>
                  )}

                  {/* Security scan summary */}
                  {item.release && <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Verification:</span>
                    <Badge variant={verification?.decision === "reject" ? "destructive" : "outline"}>
                      {verification ? `${verification.status}${verification.decision ? ` · ${verification.decision}` : ""}${verification.overallScore == null ? "" : ` · score ${verification.overallScore.toFixed(0)}`}${verification.confidence == null ? "" : ` · confidence ${verification.confidence.toFixed(0)}%`}` : "waiting"}
                    </Badge>
                  </div>}
                  {latestScan && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Security:</span>
                      <Badge
                        variant="outline"
                        className={
                          latestScan.result === "pass"
                            ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20"
                            : latestScan.result === "fail"
                              ? "bg-red-500/5 text-red-500 border-red-500/20"
                              : "bg-yellow-500/5 text-yellow-500 border-yellow-500/20"
                        }
                      >
                        {latestScan.scanType}: {latestScan.result}
                        {latestScan.severity && ` (${latestScan.severity})`}
                      </Badge>
                      <span className="text-muted-foreground text-[10px]">
                        {latestScan.scannedAt.toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <ReviewQueueActions
                    queueItemId={item.id}
                    bundleName={item.bundle.name}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
