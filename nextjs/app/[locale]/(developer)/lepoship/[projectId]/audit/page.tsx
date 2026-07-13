import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";

export default async function AuditPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const user = await requireCurrentUser();
  const access = await requireProjectRole(user.id, projectId, "viewer");
  const bundleId = access.project.bundle?.id;
  const events = bundleId ? await prisma.bundleAuditLog.findMany({ where: { bundleId }, include: { user: { select: { email: true, fullName: true } } }, orderBy: { createdAt: "desc" }, take: 200 }) : [];
  return <Card><CardHeader><CardTitle>Immutable operational timeline</CardTitle></CardHeader><CardContent className="space-y-2">{events.length === 0 ? <p className="text-sm text-muted-foreground">No audit events.</p> : events.map((event) => <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hairline p-3 text-sm"><div><strong>{event.action}</strong><p className="text-xs text-muted-foreground">{event.user?.fullName || event.user?.email || "system"} · {event.createdAt.toLocaleString()}</p></div><Badge variant="outline">{event.fieldName || "bundle"}</Badge></div>)}</CardContent></Card>;
}
