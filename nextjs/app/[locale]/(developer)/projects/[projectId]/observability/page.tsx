import * as React from "react";
import { requireCurrentUser } from "@/lib/server/current-user";
import { notFound } from "next/navigation";
import { loadSpeedInsightsData } from "@/lib/server/speed-insights";
import { SpeedInsightsClient } from "@/components/dashboard/speed-insights-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { prisma } from "@/lib/server/prisma";
import { requireProjectRole } from "@/lib/server/permissions";

type PageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function ProjectObservabilityPage({ params }: PageProps) {
  const { projectId } = await params;
  const user = await requireCurrentUser();
  await requireProjectRole(user.id, projectId, "viewer");
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!project) {
    notFound();
  }

  const speedData = await loadSpeedInsightsData(user.id, project.id);

  return (
    <div className="space-y-4">
      {speedData.error && (
        <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
          <AlertCircle className="size-4" />
          <AlertTitle className="font-bold text-xs uppercase tracking-wider">Error Loading Observability Data</AlertTitle>
          <AlertDescription className="text-xs font-semibold mt-1">{speedData.error}</AlertDescription>
        </Alert>
      )}

      {speedData.success && (
        <SpeedInsightsClient
          projects={[{ id: project.id, name: project.name }]}
          selectedProjectId={project.id}
          speedData={speedData as any}
        />
      )}
    </div>
  );
}
