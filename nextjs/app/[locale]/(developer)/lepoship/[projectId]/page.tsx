import { getTranslations } from "next-intl/server";
import { FolderGit, ArrowLeft, Settings, Cpu, GitBranch, Terminal, Play, Download, Clock, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getLepoShipProjectDetail } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { saveLepoShipConfigAction, triggerMobileBuildAction } from "@/app/actions/admin";
import { redirect } from "@/i18n/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LepoShipTerminal } from "@/components/projects/lepoship-terminal";
import { LepoShipOtaControls } from "@/components/projects/lepoship-ota-controls";

type LepoShipProjectDetailPageProps = {
  params: Promise<{
    projectId: string;
    locale: string;
  }>;
  searchParams: Promise<{
    buildTriggered?: string;
  }>;
};

export default async function LepoShipProjectDetailPage({ params, searchParams }: LepoShipProjectDetailPageProps) {
  const user = await requireCurrentUser();
  const { projectId, locale } = await params;
  const { buildTriggered } = await searchParams;
  const data = await getLepoShipProjectDetail(user.id, projectId);

  if (!data.project) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <AlertTriangle className="size-12 mx-auto text-amber-500" />
        <h3 className="text-lg font-bold text-ink">Project Not Found</h3>
        <p className="text-sm text-ink-mute">
          This project does not exist or you do not have permission to view it.
        </p>
        <Button asChild variant="outline">
          <Link href="/lepoship">Back to LepoShip</Link>
        </Button>
      </div>
    );
  }

  const project = data.project;
  const bundle = project.bundle;
  const hasLepoShipConfig = bundle?.externalIntegrations && bundle.externalIntegrations.length > 0;
  
  let configData: any = {};
  if (hasLepoShipConfig) {
    try {
      configData = JSON.parse(bundle.externalIntegrations[0].config);
    } catch (e) {}
  }

  const platform = configData.platform || "expo";
  const gitRepoUrl = configData.gitRepoUrl || "";
  const gitBranch = configData.gitBranch || "main";
  const expoSdkVersion = configData.expoSdkVersion || "51.0.0";
  const expoBuildProfile = configData.expoBuildProfile || "production";
  const flutterTargetPlatform = configData.flutterTargetPlatform || "web";
  const flutterFlavor = configData.flutterFlavor || "";
  const flutterBuildMode = configData.flutterBuildMode || "release";



  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 w-full pb-20">
      <div className="flex items-center gap-2">
        <Button asChild size="icon" variant="ghost" className="rounded-full cursor-pointer">
          <Link href="/lepoship">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <span className="text-xs font-semibold text-ink-mute uppercase tracking-wider">Back to projects</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            {project.name}
            {platform && (
              <Badge variant="outline" className="capitalize bg-emerald-500/5 text-emerald-400 border-emerald-500/20 px-2.5 py-0.5 text-xs">
                {platform}
              </Badge>
            )}
          </h2>
          <p className="text-sm text-ink-mute">{project.description || "No description provided."}</p>
        </div>

        {hasLepoShipConfig && (
          <form action={triggerMobileBuildAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="returnTo" value={`/lepoship/${project.id}?buildTriggered=true`} />
            <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground font-semibold px-6 rounded-sm shadow-light text-xs flex items-center gap-1.5 cursor-pointer">
              <Play className="size-4 fill-current" />
              Trigger Build
            </Button>
          </form>
        )}
      </div>

      {buildTriggered === "true" && (
        <LepoShipTerminal projectId={project.id} buildNumber={bundle?.buildNumber || 0} />
      )}

      <Tabs defaultValue="builds" className="space-y-6">
        <TabsList className="bg-canvas-soft border border-hairline p-0.5 rounded-sm">
          <TabsTrigger value="builds" className="text-xs font-semibold px-4 py-1.5 cursor-pointer">
            Builds & History
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs font-semibold px-4 py-1.5 cursor-pointer">
            Build Settings
          </TabsTrigger>
          <TabsTrigger value="ota" className="text-xs font-semibold px-4 py-1.5 cursor-pointer">
            OTA Integration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builds" className="space-y-6">
          <Card className="bg-canvas border border-hairline rounded-lg p-5">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-base font-bold text-ink flex items-center gap-2">
                <Clock className="size-4 text-emerald-400" />
                Build History
              </CardTitle>
              <CardDescription className="text-xs text-ink-mute">
                List of compiled WebView bundles deployed to this project.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-2">
              {!bundle?.releaseTracks || bundle.releaseTracks.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-hairline rounded-md">
                  <p className="text-xs text-ink-mute">No builds created yet. Setup build settings and trigger your first build.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded border border-hairline">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-canvas-soft/30 border-b border-hairline select-none">
                        <th className="p-3 font-semibold text-ink-mute">Build</th>
                        <th className="p-3 font-semibold text-ink-mute">Version</th>
                        <th className="p-3 font-semibold text-ink-mute">Release Notes</th>
                        <th className="p-3 font-semibold text-ink-mute">Date</th>
                        <th className="p-3 font-semibold text-ink-mute">Status</th>
                        <th className="p-3 font-semibold text-ink-mute text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bundle.releaseTracks.map((track) => (
                        <tr key={track.id} className="border-b border-hairline last:border-0 hover:bg-canvas-soft/10">
                          <td className="p-3 font-mono font-bold text-ink">#{track.buildNumber}</td>
                          <td className="p-3 font-mono text-ink-mute">{track.version}</td>
                          <td className="p-3 text-ink max-w-xs truncate">{track.releaseNotes}</td>
                          <td className="p-3 text-ink-mute">{new Date(track.createdAt).toLocaleString()}</td>
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
        </TabsContent>

        <TabsContent value="settings">
          <Card className="bg-canvas border border-hairline rounded-lg p-5">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-base font-bold text-ink flex items-center gap-2">
                <Settings className="size-4 text-emerald-400" />
                Build Configuration
              </CardTitle>
              <CardDescription className="text-xs text-ink-mute">
                Configure Expo or Flutter repository credentials and compiling parameters.
              </CardDescription>
            </CardHeader>
            <Separator className="bg-hairline my-4" />
            <CardContent className="px-0 pb-0">
              <form action={saveLepoShipConfigAction} className="space-y-6 max-w-2xl">
                <input type="hidden" name="projectId" value={project.id} />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform" className="text-xs font-semibold text-ink-mute">Platform</Label>
                    <select
                      id="platform"
                      name="platform"
                      defaultValue={platform}
                      className="w-full h-10 px-3 bg-canvas border border-hairline rounded text-xs text-ink focus:outline-none focus:border-primary"
                    >
                      <option value="expo">Expo (React Native)</option>
                      <option value="flutter">Flutter</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gitBranch" className="text-xs font-semibold text-ink-mute">Git Branch</Label>
                    <Input id="gitBranch" name="gitBranch" defaultValue={gitBranch} placeholder="e.g. main" className="h-10 text-xs bg-canvas" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gitRepoUrl" className="text-xs font-semibold text-ink-mute">Git Repository URL</Label>
                  <Input id="gitRepoUrl" name="gitRepoUrl" defaultValue={gitRepoUrl} placeholder="https://github.com/username/repo.git" className="h-10 text-xs bg-canvas" required />
                </div>

                <div className="border-t border-hairline pt-4 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-mute">Expo SDK Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expoSdkVersion" className="text-xs font-semibold text-ink-mute">Expo SDK Version</Label>
                      <Input id="expoSdkVersion" name="expoSdkVersion" defaultValue={expoSdkVersion} placeholder="e.g. 51.0.0" className="h-10 text-xs bg-canvas" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expoBuildProfile" className="text-xs font-semibold text-ink-mute">EAS Build Profile</Label>
                      <Input id="expoBuildProfile" name="expoBuildProfile" defaultValue={expoBuildProfile} placeholder="e.g. production" className="h-10 text-xs bg-canvas" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-hairline pt-4 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-mute">Flutter Settings</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="flutterTargetPlatform" className="text-xs font-semibold text-ink-mute">Target Platform</Label>
                      <select
                        id="flutterTargetPlatform"
                        name="flutterTargetPlatform"
                        defaultValue={flutterTargetPlatform}
                        className="w-full h-10 px-3 bg-canvas border border-hairline rounded text-xs text-ink focus:outline-none focus:border-primary"
                      >
                        <option value="web">Web Bundle (WebView)</option>
                        <option value="apk">Android APK</option>
                        <option value="ipa">iOS IPA</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="flutterFlavor" className="text-xs font-semibold text-ink-mute">Build Flavor</Label>
                      <Input id="flutterFlavor" name="flutterFlavor" defaultValue={flutterFlavor} placeholder="e.g. dev / prod" className="h-10 text-xs bg-canvas" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="flutterBuildMode" className="text-xs font-semibold text-ink-mute">Build Mode</Label>
                      <select
                        id="flutterBuildMode"
                        name="flutterBuildMode"
                        defaultValue={flutterBuildMode}
                        className="w-full h-10 px-3 bg-canvas border border-hairline rounded text-xs text-ink focus:outline-none focus:border-primary"
                      >
                        <option value="release">Release</option>
                        <option value="debug">Debug</option>
                        <option value="profile">Profile</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground font-semibold px-6 h-10 text-xs rounded-sm shadow-light cursor-pointer">
                    Save Config
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ota">
          <Card className="bg-canvas border border-hairline rounded-lg p-5">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-base font-bold text-ink flex items-center gap-2">
                <HelpCircle className="size-4 text-emerald-400" />
                Over-the-Air Update Integration
              </CardTitle>
              <CardDescription className="text-xs text-ink-mute">
                Connect your mobile application's WebView runner to download latest package bundles.
              </CardDescription>
            </CardHeader>
            <Separator className="bg-hairline my-4" />
            <CardContent className="px-0 pb-0 space-y-6 text-xs text-ink leading-relaxed">
              <LepoShipOtaControls
                projectId={project.id}
                runtimeConfig={bundle?.runtimeConfig ?? null}
                releaseTracks={bundle?.releaseTracks ?? []}
                updatePhases={bundle?.updatePhases ?? []}
              />

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-ink-strong">1. Check for updates endpoint</h4>
                <p className="text-ink-mute">
                  Make a GET request to verify if a new bundle version is available for compilation download.
                </p>
                <div className="rounded bg-canvas-soft border border-hairline p-3 font-mono text-[10px] text-ink overflow-x-auto select-all shadow-inner">
                  GET /api/bundles/check?projectId={project.id}&currentBuildNumber={bundle?.buildNumber || 0}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-ink-strong">2. Expected JSON Response</h4>
                <p className="text-ink-mute">
                  The API returns details on whether an update is available and the direct download URL.
                </p>
                <div className="rounded bg-canvas-soft border border-hairline p-3 font-mono text-[10px] text-ink overflow-x-auto select-all shadow-inner">
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
                <h4 className="font-bold text-sm text-ink-strong">3. Embedded WebView Runner setup</h4>
                <p className="text-ink-mute">
                  In your React Native (Expo) or Flutter project, use a filesystem downloader to download the zip bundle from `downloadUrl`, extract it to the local cache storage directory, and load the static `index.html` file into the mobile application's WebView package.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
