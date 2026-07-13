import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { getLepoShipProjectDetail } from "@/lib/server/admin-data";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function LepoShipBuildsPage({ params }: PageProps) {
  const { locale, projectId } = await params;
  const user = await requireCurrentUser();
  const data = await getLepoShipProjectDetail(user.id, projectId);

  if (!data.project) {
    redirect(`/${locale}/lepoship`);
  }

  const project = data.project;
  const bundle = project.bundle;
  const builds = bundle ? await prisma.bundleBuildJobs.findMany({
    where: { bundleId: bundle.id },
    include: {
      release: {
        include: {
          artifacts: { where: { kind: "full" }, take: 1 },
          approvals: { select: { kind: true, status: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  }) : [];
  const publicBase = process.env.LEPOS_ARTIFACT_PUBLIC_BASE_URL?.replace(/\/$/, "");

  return (
    <Card className="bg-card border border-hairline p-5">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Clock className="size-4 text-emerald-400" />
          Build History
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          List of compiled WebView bundles deployed to this project.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-2">
        {builds.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-hairline rounded-md">
            <p className="text-xs text-muted-foreground">No builds created yet. Setup build settings and trigger your first build.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-hairline">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-secondary/30 border-b border-hairline select-none">
                  <th className="p-3 font-semibold text-muted-foreground">Build</th>
                  <th className="p-3 font-semibold text-muted-foreground">Version</th>
                  <th className="p-3 font-semibold text-muted-foreground">Release Notes</th>
                  <th className="p-3 font-semibold text-muted-foreground">Date</th>
                  <th className="p-3 font-semibold text-muted-foreground">Status</th>
                  <th className="p-3 font-semibold text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {builds.map((build) => {
                  const artifact = build.release.artifacts[0];
                  const artifactUrl = artifact && publicBase ? `${publicBase}/${artifact.storageKey.split("/").map(encodeURIComponent).join("/")}` : null;
                  return (
                  <tr key={build.id} className="border-b border-hairline last:border-0 hover:bg-secondary/20">
                    <td className="p-3 font-mono font-bold text-foreground">#{build.release.buildNumber}</td>
                    <td className="p-3 font-mono text-muted-foreground">{build.release.version}</td>
                    <td className="p-3 text-foreground max-w-xs truncate">{build.release.releaseNotes || "—"}</td>
                    <td className="p-3 text-muted-foreground">{build.createdAt.toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={build.status === "failed" ? "destructive" : build.status === "succeeded" ? "default" : "secondary"}>{build.status}</Badge>
                        <Badge variant="outline">release: {build.release.status}</Badge>
                        {build.release.approvals.map((approval) => <Badge key={approval.kind} variant="outline">{approval.kind}: {approval.status}</Badge>)}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      {artifactUrl ? <Button asChild size="icon" variant="ghost" className="h-7 w-7 rounded cursor-pointer" title="Download Bundle">
                        <a href={artifactUrl}>
                          <Download className="size-3.5" />
                        </a>
                      </Button> : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
