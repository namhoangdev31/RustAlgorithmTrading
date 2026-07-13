import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";

export default async function TrustPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const user = await requireCurrentUser();
  const access = await requireProjectRole(user.id, projectId, "viewer");
  const bundleId = access.project.bundle?.id;
  const [privacy, releases] = bundleId ? await Promise.all([
    prisma.bundlePrivacyDeclarations.findUnique({ where: { bundleId } }),
    prisma.bundleReleases.findMany({ where: { bundleId }, include: { approvals: true, artifacts: { select: { kind: true, checksumSha256: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]) : [null, []];
  return <div className="space-y-4"><Card><CardHeader><CardTitle>Privacy declaration</CardTitle></CardHeader><CardContent><Badge variant="outline">{privacy?.declarationStatus || "missing"}</Badge></CardContent></Card>
    <Card><CardHeader><CardTitle>Release evidence</CardTitle></CardHeader><CardContent className="space-y-2">{releases.length === 0 ? <p className="text-sm text-muted-foreground">No release evidence.</p> : releases.map((release) => <div key={release.id} className="rounded-md border border-hairline p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>v{release.version} #{release.buildNumber}</strong><Badge>{release.status}</Badge></div><div className="mt-2 flex flex-wrap gap-1">{release.approvals.map((approval) => <Badge key={approval.kind} variant="outline">{approval.kind}: {approval.status}</Badge>)}{release.artifacts.map((artifact) => <Badge key={`${artifact.kind}-${artifact.checksumSha256}`} variant="secondary">{artifact.kind} {artifact.checksumSha256.slice(0, 8)}</Badge>)}</div></div>)}</CardContent></Card>
  </div>;
}
