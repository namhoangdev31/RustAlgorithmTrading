import * as React from "react";
import { getLepoShipProjectDetail } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getLepoShipNav } from "@/lib/portal/navigation-registry";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PortalPage } from "@/components/portal/PortalPage";
import { triggerMobileBuildAction } from "@/app/actions/admin";
import { ClientTabActive } from "../../projects/[projectId]/ClientTabActive";

type LepoShipLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function LepoShipLayout({
  children,
  params,
}: LepoShipLayoutProps) {
  const { locale, projectId } = await params;
  const user = await requireCurrentUser();
  const data = await getLepoShipProjectDetail(user.id, projectId);

  if (!data.project) {
    redirect(`/${locale}/lepoship`);
  }

  const project = data.project;
  const bundle = project.bundle;
  const navItems = getLepoShipNav(locale, projectId);

  const hasLepoShipConfig = bundle?.externalIntegrations && bundle.externalIntegrations.length > 0;
  let configData: any = {};
  if (hasLepoShipConfig) {
    try {
      configData = JSON.parse(bundle.externalIntegrations[0].config);
    } catch (e) { }
  }
  const platform = configData.platform || null;

  return (
    <PortalPage
      title={project.name}
      description={
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mt-1">
          <span>{project.description || "No mobile project description."}</span>
          {platform && (
            <Badge variant="outline" className="capitalize bg-emerald-500/5 text-emerald-400 border-emerald-500/20 px-2 py-0.5 text-[10px]">
              {platform}
            </Badge>
          )}
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button asChild size="icon" variant="ghost" className="rounded-full cursor-pointer h-8 w-8">
            <Link href="/lepoship">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          {hasLepoShipConfig && (
            <form action={triggerMobileBuildAction}>
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="returnTo" value={`/lepoship/${project.id}/builds?buildTriggered=true`} />
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 h-8 text-xs flex items-center gap-1.5 cursor-pointer shadow-light">
                <Play className="size-3.5 fill-current" />
                Trigger Build
              </Button>
            </form>
          )}
        </div>
      }
    >
      {/* Dynamic Sub-Navigation Tabs */}
      <div className="border-b border-hairline w-full overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1.5 -mb-px">
          {navItems.map((item) => (
            <LepoShipTabLink
              key={item.path}
              href={item.path}
              label={item.label}
            />
          ))}
        </nav>
      </div>

      <div className="pt-2">{children}</div>
    </PortalPage>
  );
}


function LepoShipTabLink({ href, label }: { href: string; label: string }) {
  return (
    <ClientTabActive href={href}>
      {label}
    </ClientTabActive>
  );
}
