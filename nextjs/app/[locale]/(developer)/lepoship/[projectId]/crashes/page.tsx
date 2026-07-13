import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";

export default async function CrashesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const user = await requireCurrentUser();
  const access = await requireProjectRole(user.id, projectId, "viewer");
  const bundleId = access.project.bundle?.id;
  const crashes = bundleId ? await prisma.bundleCrashEvents.findMany({
    where: { bundleId }, include: { release: { select: { version: true, buildNumber: true } } },
    orderBy: { occurredAt: "desc" }, take: 100,
  }) : [];
  return <Card><CardHeader><CardTitle>Crash diagnostics</CardTitle></CardHeader><CardContent className="space-y-2">
    {crashes.length === 0 ? <p className="text-sm text-muted-foreground">No authenticated crash events.</p> : crashes.map((crash) => <div key={crash.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hairline p-3 text-sm">
      <div><p className="font-mono text-xs">{crash.stackTraceHash}</p><p className="text-xs text-muted-foreground">{crash.release ? `v${crash.release.version} #${crash.release.buildNumber}` : "Unattributed release"} · {crash.occurredAt.toLocaleString()}</p></div>
      <div className="flex gap-1"><Badge variant="outline">{crash.platform || "unknown"}</Badge>{crash.abVariant && <Badge variant="secondary">A/B {crash.abVariant}</Badge>}</div>
    </div>)}
  </CardContent></Card>;
}
