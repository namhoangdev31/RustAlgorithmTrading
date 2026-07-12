import { prisma } from "@/lib/server/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { PageHeader } from "@/components/portal/PageHeader";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { startAbTestAction, deleteAbTestAction, endAbTestAction } from "@/app/actions/lepoship-ab";
import { AbTestActions } from "./AbTestActions";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function AbTestsPage({ params }: Props) {
  const { projectId } = await params;
  const t = await getTranslations("LepoShip.ab_testing");
  const user = await requireCurrentUser();
  const access = await requireProjectRole(user.id, projectId, "viewer");
  const bundle = access.project.bundle;

  if (!bundle) {
    return (
      <div className="space-y-6">
        <PageHeader title="A/B Tests" description="No LepoShip bundle linked to this project." />
      </div>
    );
  }

  const tests = await prisma.bundleAbTests.findMany({
    where: { bundleId: bundle.id },
    orderBy: { createdAt: "desc" },
  });

  // Fetch available release tracks for the create form
  const tracks = await prisma.bundleReleaseTracks.findMany({
    where: { bundleId: bundle.id, status: "active", storagePath: { not: "" } },
    orderBy: { buildNumber: "desc" },
    select: { id: true, track: true, version: true, buildNumber: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description="Run OTA experiments to test different bundle versions on a subset of devices."
      />

      {/* Create form */}
      <AbTestActions projectId={projectId} tracks={tracks} tests={tests} />

      {/* Test list */}
      {tests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No A/B tests yet. Create one above to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => {
            let targetBuild: number | null = null;
            try {
              const config = JSON.parse(test.variantBConfig);
              targetBuild = config.targetBuildNumber ?? null;
            } catch { }

            return (
              <Card key={test.id} className="border-hairline">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm font-medium truncate">
                        {test.testName}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <span>Metric: {test.metric}</span>
                        <span>·</span>
                        <span>Traffic split: {test.trafficSplit}%</span>
                        {targetBuild !== null && (
                          <>
                            <span>·</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              Target build #{targetBuild}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <StatusBadge
                      status={test.status}
                      label={test.status === "running" ? "Running" : test.status === "ended" ? "Ended" : "Draft"}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {test.hypothesis && (
                    <p className="text-xs text-muted-foreground">{test.hypothesis}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {test.startedAt && <span>Started: {test.startedAt.toLocaleDateString()}</span>}
                    {test.endedAt && <span>· Ended: {test.endedAt.toLocaleDateString()}</span>}
                    {test.winnerVariant && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-emerald-500/5 text-emerald-500 border-emerald-500/20"
                      >
                        Winner: Variant {test.winnerVariant}
                      </Badge>
                    )}
                  </div>

                  {/* Action buttons based on status */}
                  <div className="flex items-center gap-2 pt-1">
                    {test.status === "draft" && (
                      <>
                        <form action={startAbTestAction}>
                          <input type="hidden" name="projectId" value={projectId} />
                          <input type="hidden" name="testId" value={test.id} />
                          <Button
                            type="submit"
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                          >
                            Start
                          </Button>
                        </form>
                        <form action={deleteAbTestAction}>
                          <input type="hidden" name="projectId" value={projectId} />
                          <input type="hidden" name="testId" value={test.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                          >
                            Delete
                          </Button>
                        </form>
                      </>
                    )}
                    {test.status === "running" && (
                      <form action={endAbTestAction}>
                        <input type="hidden" name="projectId" value={projectId} />
                        <input type="hidden" name="testId" value={test.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                        >
                          End Test
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
