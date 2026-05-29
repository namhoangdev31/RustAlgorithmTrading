import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ProjectTabData } from "./types";

export function IntegrationsTab({ data }: { data: ProjectTabData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {data.projects.map((project) => {
        const bundle = project.bundle;
        const projectSlug = bundle?.slug || project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const isConnected = bundle?.status === "published";
        return (
          <Card key={`${project.id}-integration`} className="border border-hairline transition-colors hover:border-primary/40">
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>{bundle?.name || "Project Integration Bundle"}</CardDescription>
              </div>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Not Connected"}
              </Badge>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-2 pt-4">
              <div className="flex gap-4 items-start justify-start text-xs">
                <span className="text-ink-mute">Domain</span>
                <span className="text-ink font-mono">{`${projectSlug}.rustalgorithm.net`}</span>
              </div>
              <div className="flex gap-4 items-start justify-start text-xs">
                <span className="text-ink-mute">Category</span>
                <span className="text-ink capitalize">{bundle?.category || "web"}</span>
              </div>
              <div className="flex gap-4 items-center justify-start text-xs">
                <span className="text-ink-mute">Status</span>
                <span className="text-ink capitalize">{bundle?.status || "draft"}</span>
              </div>
            </CardContent>
            <CardFooter className="gap-2 bg-transparent p-4">
              <Button variant="outline" className="h-9 rounded-sm border-hairline-strong text-xs">Configure</Button>
              <Button className="h-9 rounded-sm text-xs bg-primary hover:bg-primary-deep text-primary-foreground">
                {isConnected ? "Manage" : "Connect"}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
