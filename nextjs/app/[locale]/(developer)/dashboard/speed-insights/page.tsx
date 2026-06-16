import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { getSpeedInsightsDataAction } from "@/app/actions/vitals";
import { SpeedInsightsClient } from "@/components/dashboard/speed-insights-client";
import { Link } from "@/i18n/navigation";
import { AlertCircle, FolderPlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <FolderPlus className="size-16 text-slate-700 animate-pulse" />
        <h2 className="text-xl font-bold text-slate-100">No Projects Found</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          You need to create at least one project before you can view speed insights and observability metrics.
        </p>
        <Button asChild>
          <Link href="/dashboard?dialog=create">Create Project</Link>
        </Button>
      </div>
    );
  }

  const selectedProjectId = params.projectId || projects[0].id;
  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const speedData = await getSpeedInsightsDataAction(activeProject.id);

  return (
    <div className="flex flex-col gap-4">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Speed Insights</h1>
      </div>

      {speedData.error && (
        <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive rounded-xl animate-in slide-in-from-top-2">
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
