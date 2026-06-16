import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { getFormsAction } from "@/app/actions/forms";
import { FormBuilderClient } from "@/components/dashboard/form-builder-client";
import { Link } from "@/i18n/navigation";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <FolderPlus className="size-16 text-slate-700 animate-pulse" />
        <h2 className="text-xl font-bold text-slate-100">No Projects Found</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          You need to create at least one project before you can view static forms.
        </p>
        <Button asChild>
          <Link href="/dashboard?dialog=create">Create Project</Link>
        </Button>
      </div>
    );
  }

  const selectedProjectId = params.projectId || projects[0].id;
  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const formsData = await getFormsAction(activeProject.id);

  // High-fidelity seed data if no forms are configured
  let forms = formsData.forms;
  if (forms.length === 0) {
    forms = [
      {
        id: "mock-form-1",
        name: "Customer Contact Form",
        projectId: activeProject.id,
        googleSheetsSync: true,
        salesforceSync: false,
        webhookUrl: null,
        webhookSecret: null,
        createdAt: new Date().toISOString(),
        submissions: [
          {
            id: "sub-1",
            data: { name: "David Chen", email: "david@example.com", message: "Love the speed of LepoS WebView!" },
            ipAddress: "203.0.113.195",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            createdAt: new Date(Date.now() - 1200000).toISOString()
          },
          {
            id: "sub-2",
            data: { name: "Sarah Connor", email: "sarah@cyberdyne.com", message: "Inquiry regarding Enterprise SSO setups." },
            ipAddress: "198.51.100.2",
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
            createdAt: new Date(Date.now() - 3600000).toISOString()
          }
        ],
        webhookDeliveries: []
      }
    ] as any;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Forms Management</h1>
      </div>

      {/* Form Builder Client Wrapper */}
      <FormBuilderClient
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        selectedProjectId={activeProject.id}
        initialForms={forms as any}
      />
    </div>
  );
}
