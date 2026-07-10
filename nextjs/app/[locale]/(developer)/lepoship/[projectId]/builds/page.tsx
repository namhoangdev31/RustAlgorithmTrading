import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { getLepoShipProjectDetail } from "@/lib/server/admin-data";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, Download } from "lucide-react";
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
        {!bundle?.releaseTracks || bundle.releaseTracks.length === 0 ? (
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
                {bundle.releaseTracks.map((track) => (
                  <tr key={track.id} className="border-b border-hairline last:border-0 hover:bg-secondary/20">
                    <td className="p-3 font-mono font-bold text-foreground">#{track.buildNumber}</td>
                    <td className="p-3 font-mono text-muted-foreground">{track.version}</td>
                    <td className="p-3 text-foreground max-w-xs truncate">{track.releaseNotes}</td>
                    <td className="p-3 text-muted-foreground">{new Date(track.createdAt).toLocaleString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1 w-fit">
                        <CheckCircle2 className="size-3" />
                        Success
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button asChild size="icon" variant="ghost" className="h-7 w-7 rounded cursor-pointer" title="Download Bundle">
                        <a href={track.storagePath} download>
                          <Download className="size-3.5" />
                        </a>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
