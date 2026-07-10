import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { getFormsAction } from "@/app/actions/forms";
import { FormBuilderClient } from "@/components/dashboard/form-builder-client";
import { Link } from "@/i18n/navigation";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

type PageProps = {
  searchParams: Promise<{
    projectId?: string;
  }>;
};

export default async function FormsDashboardPage({ searchParams }: PageProps) {
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
          <EmptyDescription>Create a project before configuring forms and webhook delivery.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent><Button asChild><Link href="/overview?dialog=create">Create project</Link></Button></EmptyContent>
      </Empty>
    );
  }

  const selectedProjectId = params.projectId || projects[0].id;
  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const formsData = await getFormsAction(activeProject.id);

  return (
    <div className="flex flex-col gap-4">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium tracking-tight">Forms</h1>
      </div>

      {/* Form Builder Client Wrapper */}
      <FormBuilderClient
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        selectedProjectId={activeProject.id}
        initialForms={formsData.forms as any}
      />
    </div>
  );
}
