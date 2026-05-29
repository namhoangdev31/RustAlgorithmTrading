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

export function SettingsTab() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
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
  );
}
