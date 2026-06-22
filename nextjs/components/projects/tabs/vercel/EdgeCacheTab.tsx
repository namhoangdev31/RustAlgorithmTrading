"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { purgeEdgeCacheAction } from "@/app/actions/vercel";

interface EdgeCacheTabProps {
  project: any;
  returnTo: string;
}

export function EdgeCacheTab({ project, returnTo }: EdgeCacheTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="bg-canvas border border-hairline rounded-lg p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base font-bold text-ink">Edge Cache CDN Control</CardTitle>
          <CardDescription className="text-xs text-ink-mute">
            Manually invalidate CDN Edge Cache by tag parameters to push instant updates to end-users globally.
          </CardDescription>
        </CardHeader>
        <Separator className="bg-hairline my-4" />
        <CardContent className="px-0">
          <form action={purgeEdgeCacheAction} className="space-y-4">
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="returnTo" value={returnTo} />

            <div className="space-y-1.5">
              <Label htmlFor="cacheTagsInput" className="text-xs font-bold text-ink-secondary">Project Name or ID</Label>
              <Input
                id="cacheTagsInput"
                name="projectIdOrName"
                placeholder="e.g. my-cool-project"
                defaultValue={project.vercelProjectId || project.name}
                required
                className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
              />
            </div>

            <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
              Purge CDN Edge Cache
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
