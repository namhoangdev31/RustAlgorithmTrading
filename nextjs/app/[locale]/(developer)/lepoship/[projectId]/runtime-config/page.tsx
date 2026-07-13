import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";

export default async function RuntimeConfigPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const user = await requireCurrentUser();
  const access = await requireProjectRole(user.id, projectId, "viewer");
  const bundleId = access.project.bundle?.id;
  const entries = bundleId ? await prisma.bundleRuntimeConfigEntries.findMany({ where: { bundleId }, orderBy: [{ track: "asc" }, { configKey: "asc" }] }) : [];
  return <Card><CardHeader><CardTitle>Versioned runtime configuration</CardTitle></CardHeader><CardContent className="space-y-2">{entries.length === 0 ? <p className="text-sm text-muted-foreground">No runtime configuration entries.</p> : entries.map((entry) => <div key={entry.id} className="grid gap-2 rounded-md border border-hairline p-3 text-sm md:grid-cols-[180px_1fr_auto]"><Badge variant="outline">{entry.track}</Badge><div><strong>{entry.configKey}</strong><pre className="mt-1 overflow-x-auto text-xs text-muted-foreground">{JSON.stringify(entry.value)}</pre></div><Badge variant="secondary">r{entry.revision}</Badge></div>)}</CardContent></Card>;
}
