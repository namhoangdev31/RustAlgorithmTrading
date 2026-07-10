import { requireCurrentUser } from "@/lib/server/current-user";
import { getLepoShipProjectDetail } from "@/lib/server/admin-data";
import { saveLepoShipConfigAction } from "@/app/actions/admin";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type PageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function LepoShipSettingsPage({ params }: PageProps) {
  const { locale, projectId } = await params;
  const user = await requireCurrentUser();
  const data = await getLepoShipProjectDetail(user.id, projectId);

  if (!data.project) {
    redirect(`/${locale}/lepoship`);
  }

  const project = data.project;
  const bundle = project.bundle;
  const hasConfig = bundle?.externalIntegrations && bundle.externalIntegrations.length > 0;
  
  let configData: any = {};
  if (hasConfig) {
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
    <Card className="bg-card border border-hairline rounded-lg p-5">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          Build Configuration
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          Configure Expo or Flutter repository credentials and compiling parameters.
        </CardDescription>
      </CardHeader>
      <Separator className="my-4 border-hairline" />
      <CardContent className="px-0 pb-0">
        <form action={saveLepoShipConfigAction} className="space-y-6 max-w-2xl text-xs">
          <input type="hidden" name="projectId" value={project.id} />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform" className="text-xs font-semibold text-muted-foreground">Platform</Label>
              <select
                id="platform"
                name="platform"
                defaultValue={platform}
                className="w-full h-10 px-3 bg-secondary/35 border border-hairline rounded text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="expo">Expo (React Native)</option>
                <option value="flutter">Flutter</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gitBranch" className="text-xs font-semibold text-muted-foreground">Git Branch</Label>
              <Input id="gitBranch" name="gitBranch" defaultValue={gitBranch} placeholder="e.g. main" className="h-10 text-xs bg-canvas" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gitRepoUrl" className="text-xs font-semibold text-muted-foreground">Git Repository URL</Label>
            <Input id="gitRepoUrl" name="gitRepoUrl" defaultValue={gitRepoUrl} placeholder="https://github.com/username/repo.git" className="h-10 text-xs bg-canvas" required />
          </div>

          <div className="border-t border-hairline pt-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expo SDK Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expoSdkVersion" className="text-xs font-semibold text-muted-foreground">Expo SDK Version</Label>
                <Input id="expoSdkVersion" name="expoSdkVersion" defaultValue={expoSdkVersion} placeholder="e.g. 51.0.0" className="h-10 text-xs bg-canvas" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expoBuildProfile" className="text-xs font-semibold text-muted-foreground">EAS Build Profile</Label>
                <Input id="expoBuildProfile" name="expoBuildProfile" defaultValue={expoBuildProfile} placeholder="e.g. production" className="h-10 text-xs bg-canvas" />
              </div>
            </div>
          </div>

          <div className="border-t border-hairline pt-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Flutter Settings</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flutterTargetPlatform" className="text-xs font-semibold text-muted-foreground">Target Platform</Label>
                <select
                  id="flutterTargetPlatform"
                  name="flutterTargetPlatform"
                  defaultValue={flutterTargetPlatform}
                  className="w-full h-10 px-3 bg-secondary/35 border border-hairline rounded text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="web">Web Bundle (WebView)</option>
                  <option value="apk">Android APK</option>
                  <option value="ipa">iOS IPA</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="flutterFlavor" className="text-xs font-semibold text-muted-foreground">Build Flavor</Label>
                <Input id="flutterFlavor" name="flutterFlavor" defaultValue={flutterFlavor} placeholder="e.g. dev / prod" className="h-10 text-xs bg-canvas" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flutterBuildMode" className="text-xs font-semibold text-muted-foreground">Build Mode</Label>
                <select
                  id="flutterBuildMode"
                  name="flutterBuildMode"
                  defaultValue={flutterBuildMode}
                  className="w-full h-10 px-3 bg-secondary/35 border border-hairline rounded text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="release">Release</option>
                  <option value="debug">Debug</option>
                  <option value="profile">Profile</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-6 h-10 text-xs rounded-sm shadow-light cursor-pointer">
              Save Config
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
