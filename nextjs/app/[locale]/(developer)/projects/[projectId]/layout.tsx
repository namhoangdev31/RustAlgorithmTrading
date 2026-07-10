import * as React from "react";
import { getProjectBundleData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getProjectNav } from "@/lib/portal/navigation-registry";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Compass, Globe } from "lucide-react";
import { PortalPage } from "@/components/portal/PortalPage";
import { ClientTabActive } from "./ClientTabActive";

type ProjectLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { locale, projectId } = await params;
  const user = await requireCurrentUser();
  const data = await getProjectBundleData(user.id, {});
  const project = data.projects.find((p) => p.id === projectId);

  if (!project) {
    redirect(`/${locale}/projects`);
  }

  const navItems = getProjectNav(locale, projectId);

  return (
    <PortalPage
      title={project.name}
      description={
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mt-1">
          <span>{project.description || "No project description."}</span>
          {project.vercelProjectName && (
            <span className="flex items-center gap-1">
              <Globe className="size-3 text-ink-mute" />
              <span>{project.vercelProjectName}</span>
            </span>
          )}
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/projects"
            className="inline-flex items-center justify-center h-8 px-3 rounded-md border border-hairline text-xs font-medium hover:bg-secondary transition-colors"
          >
            <Compass className="size-3.5 mr-1.5" />
            <span>All Projects</span>
          </Link>
        </div>
      }
    >
      {/* Dynamic Sub-Navigation Tabs */}
      <div className="border-b border-hairline w-full overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1.5 -mb-px">
          {navItems.map((item) => {
            // We use simple path matching for highlighting
            return (
              <ProjectTabLink
                key={item.path}
                href={item.path}
                label={item.label}
              />
            );
          })}
        </nav>
      </div>

      <div className="pt-2">{children}</div>
    </PortalPage>
  );
}


function ProjectTabLink({ href, label }: { href: string; label: string }) {
  return (
    <ClientTabActive href={href}>
      {label}
    </ClientTabActive>
  );
}
