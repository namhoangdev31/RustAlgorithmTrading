import { requireCurrentUser } from "@/lib/server/current-user";
import { getLepoShipProjectDetail } from "@/lib/server/admin-data";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { LepoShipOtaControls } from "@/components/projects/lepoship-ota-controls";

type PageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function LepoShipOtaPage({ params }: PageProps) {
  const { locale, projectId } = await params;
  const user = await requireCurrentUser();
  const data = await getLepoShipProjectDetail(user.id, projectId);

  if (!data.project) {
    redirect(`/${locale}/lepoship`);
  }

  const project = data.project;
  const bundle = project.bundle;

  return (
    <Card className="bg-card border border-hairline rounded-lg p-5">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <HelpCircle className="size-4 text-emerald-400" />
          Over-the-Air Update Integration
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          Connect your mobile application's WebView runner to download latest package bundles.
        </CardDescription>
      </CardHeader>
      <Separator className="bg-hairline my-4 border-hairline" />
      <CardContent className="px-0 pb-0 space-y-6 text-xs text-foreground leading-relaxed">
        <LepoShipOtaControls
          projectId={project.id}
          runtimeConfig={bundle?.runtimeConfig ?? null}
          releaseTracks={bundle?.releaseTracks ?? []}
          updatePhases={bundle?.updatePhases ?? []}
        />

        <div className="space-y-2">
          <h4 className="font-bold text-sm text-foreground">1. Check for updates endpoint</h4>
          <p className="text-muted-foreground">
            Make a GET request to verify if a new bundle version is available for compilation download.
          </p>
          <div className="rounded bg-secondary/50 border border-hairline p-3 font-mono text-[10px] text-foreground overflow-x-auto select-all shadow-inner">
            GET /api/bundles/check?projectId={project.id}&currentBuildNumber={bundle?.buildNumber || 0}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-sm text-foreground">2. Expected JSON Response</h4>
          <p className="text-muted-foreground">
            The API returns details on whether an update is available and the direct download URL.
          </p>
          <div className="rounded bg-secondary/50 border border-hairline p-3 font-mono text-[10px] text-foreground overflow-x-auto select-all shadow-inner">
{`{
  "updateAvailable": true,
  "latestRelease": {
    "version": "${bundle?.version || "1.0.0"}",
    "buildNumber": ${bundle?.buildNumber || 0},
    "track": "production",
    "downloadUrl": "http://localhost:3000${bundle?.storagePath || "/bundles/..."}",
    "releaseNotes": "Bug fixes and performance updates."
  }
}`}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-sm text-foreground">3. Embedded WebView Runner setup</h4>
          <p className="text-muted-foreground">
            In your React Native (Expo) or Flutter project, use a filesystem downloader to download the zip bundle from `downloadUrl`, extract it to the local cache storage directory, and load the static `index.html` file into the mobile application's WebView package.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
