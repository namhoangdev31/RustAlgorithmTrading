import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GithubOverviewData } from "@/lib/server/github";
import { GithubIcon } from "@/components/ui/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { connectGithubAction, disconnectGithubAction } from "@/app/actions/admin";

type SettingsTabProps = {
  github: GithubOverviewData;
};

export function SettingsTab({ github }: SettingsTabProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 animate-in fade-in duration-200">
      <Card className="xl:col-span-2 bg-canvas border border-hairline rounded-lg p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Project Settings</CardTitle>
          <CardDescription>Default behavior applied to newly created projects and bundles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-0 pb-0">
          <div className="rounded-md border border-hairline p-4 bg-canvas-soft/40">
            <p className="text-sm font-semibold text-ink">Visibility</p>
            <p className="text-xs text-ink-mute mt-1">Control who can access project metadata in this workspace.</p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="h-8 rounded-sm text-xs border-primary/35 bg-primary/10 text-ink">Team only</Button>
              <Button variant="outline" className="h-8 rounded-sm text-xs border-hairline-strong text-ink-mute">Private</Button>
            </div>
          </div>
          <div className="rounded-md border border-hairline p-4 bg-canvas-soft/40">
            <p className="text-sm font-semibold text-ink">Deployment policy</p>
            <p className="text-xs text-ink-mute mt-1">Define default branch and auto deployment rule.</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] font-semibold text-ink-mute uppercase tracking-wider">Default Branch</Label>
                <Input className="mt-1 h-9 rounded-sm border-hairline" defaultValue="main" />
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-ink-mute uppercase tracking-wider">Auto Deploy</Label>
                <Select defaultValue="enabled">
                  <SelectTrigger className="mt-1 h-9 rounded-sm border-hairline"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        {/* GitHub Connection Card */}
        <Card className="bg-canvas border border-hairline rounded-lg p-5">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <GithubIcon className="size-4 text-ink-secondary" />
              GitHub Integration
            </CardTitle>
            <CardDescription className="text-xs">
              Manage your connection to GitHub for repository syncing.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="mt-4 px-0 pb-0 space-y-4">
            {github.connected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-md border border-hairline bg-canvas-soft/40">
                  <Avatar className="size-8">
                    <AvatarImage src={github.avatarUrl} alt={github.login} />
                    <AvatarFallback className="text-[10px]">{(github.login || "GH").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink truncate">
                      Connected as
                    </p>
                    <p className="text-[10px] text-ink-mute truncate">
                      @{github.login}
                    </p>
                  </div>
                  <span className="size-2 rounded-full bg-primary animate-pulse shrink-0" />
                </div>

                <div className="flex flex-col gap-2">
                  <form action={disconnectGithubAction}>
                    <input type="hidden" name="returnTo" value="/projects?tab=settings" />
                    <Button type="submit" variant="outline" className="w-full h-8 rounded-sm text-xs border-destructive/35 text-destructive hover:bg-destructive/10 cursor-pointer">
                      Disconnect GitHub
                    </Button>
                  </form>
                  <form action={connectGithubAction}>
                    <input type="hidden" name="returnTo" value="/projects?tab=settings" />
                    <Button type="submit" variant="outline" className="w-full h-8 rounded-sm text-xs border-hairline-strong text-ink cursor-pointer">
                      Connect another account
                    </Button>
                  </form>
                  <p className="text-[10px] text-ink-mute leading-relaxed">
                    Tip: To switch to a different GitHub account, make sure you sign out of GitHub.com in this browser first.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-ink-mute">
                  Your account is not connected to GitHub. Connect now to search and import repositories.
                </p>
                <form action={connectGithubAction}>
                  <input type="hidden" name="returnTo" value="/projects?tab=settings" />
                  <Button type="submit" className="w-full h-8 rounded-sm text-xs bg-primary hover:bg-primary-deep text-primary-foreground font-semibold cursor-pointer">
                    Connect GitHub
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-canvas border border-hairline rounded-lg p-5">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>Critical actions for workspace projects.</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="mt-4 space-y-3 px-0 pb-0">
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm font-semibold text-ink">Archive inactive projects</p>
              <p className="text-xs text-ink-mute mt-1">Move projects to archived status after 30 days without deployment.</p>
              <Button variant="outline" className="mt-3 h-8 rounded-sm text-xs border-destructive/35 text-destructive hover:bg-destructive/10">Archive rule</Button>
            </div>
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm font-semibold text-ink">Delete workspace projects</p>
              <p className="text-xs text-ink-mute mt-1">Permanently remove all projects and bundles in this organization.</p>
              <Button variant="destructive" className="mt-3 h-8 rounded-sm text-xs">Delete All Projects</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
