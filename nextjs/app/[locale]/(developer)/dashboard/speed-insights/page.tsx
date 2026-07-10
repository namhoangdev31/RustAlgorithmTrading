import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { getSpeedInsightsDataAction } from "@/app/actions/vitals";
import { SpeedInsightsClient } from "@/components/dashboard/speed-insights-client";
import { Link } from "@/i18n/navigation";
import { AlertCircle, FolderPlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

type PageProps = {
  searchParams: Promise<{
    projectId?: string;
  }>;
};

export default async function SpeedInsightsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await requireCurrentUser();

  // Fetch all projects for the current user's organizations
  const organizations = await prisma.organization.findMany({
    where: { userId: user.id },
    include: {
      projects: true,
    },
  });

  const projects = organizations.flatMap((org) => org.projects);

  if (projects.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><FolderPlus /></EmptyMedia>
          <EmptyTitle>No projects found</EmptyTitle>
          <EmptyDescription>Create a project before viewing performance and observability data.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent><Button asChild><Link href="/overview?dialog=create">Create project</Link></Button></EmptyContent>
      </Empty>
    );
  }

  const selectedProjectId = params.projectId || projects[0].id;
  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const speedData = await getSpeedInsightsDataAction(activeProject.id);

  return (
    <div className="flex flex-col gap-4">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium tracking-tight">Observability</h1>
      </div>

      {speedData.error && (
        <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
          <AlertCircle className="size-4" />
          <AlertTitle className="font-bold text-xs uppercase tracking-wider">Error Loading Observability Data</AlertTitle>
          <AlertDescription className="text-xs font-semibold mt-1">{speedData.error}</AlertDescription>
        </Alert>
      )}

      {/* Speed Insights Client Workspace */}
      {speedData.success && (
        <SpeedInsightsClient
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          selectedProjectId={activeProject.id}
          speedData={speedData as any}
        />
      )}
    </div>
  );
}
