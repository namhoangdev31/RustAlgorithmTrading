import Link from "next/link";
import {
  Activity,
  Boxes,
  CircleDollarSign,
  FolderKanban,
  PackageCheck,
  Users,
} from "lucide-react";

import {
  createProjectWithBundleAction,
  deleteProjectAction,
  updateProjectBundleAction,
} from "@/app/actions/admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboardOverview, getProjectBundleData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";

type DashboardPageProps = {
  searchParams: Promise<{
    q?: string;
    dialog?: string;
    id?: string;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const user = await requireCurrentUser();
  const [overview, projectData] = await Promise.all([
    getDashboardOverview(user.id),
    getProjectBundleData(user.id, params),
  ]);
  const dialog = params.dialog;
  const selectedProject = projectData.projects.find((project) => project.id === params.id);

  return (
    <>
      <PageHeader
        actionHref="/dashboard?dialog=create"
        actionLabel="New project"
        description="Manage organizations, projects, and one bundle per project through SSR Prisma actions."
        title="Dashboard"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description={`${overview.metrics.bundleCount} bundles attached`}
          icon={FolderKanban}
          title="Projects"
          value={overview.metrics.projectCount}
        />
        <StatCard
          description={`${overview.metrics.publishedBundleCount} published`}
          icon={PackageCheck}
          title="Bundles"
          value={overview.metrics.bundleCount}
        />
        <StatCard
          description={`${overview.metrics.orderCount} bundle orders`}
          icon={CircleDollarSign}
          title="Revenue"
          value={formatCurrency(overview.metrics.totalRevenue)}
        />
        <StatCard
          description={`${overview.metrics.collaboratorCount} collaborators`}
          icon={Users}
          title="Team"
          value={overview.metrics.unreadChatCount}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Bundle activity for the active organization.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {[
                ["Downloads", overview.metrics.totalDownloads],
                ["Review tasks", overview.metrics.reviewTaskCount],
                ["Integrations", overview.metrics.integrationCount],
                ["Unread chats", overview.metrics.unreadChatCount],
              ].map(([label, value]) => {
                const width = Math.max(8, Math.min(100, Number(value) * 8));
                return (
                  <div className="flex flex-col gap-2" key={label}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent tasks</CardTitle>
            <CardDescription>Mapped from bundle review queue.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {overview.recentTasks.length ? (
              overview.recentTasks.map((task) => (
                <div className="rounded-md border p-3" key={task.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{task.bundle.name}</p>
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {task.notes || `Priority ${task.priority}`}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No review tasks yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Projects and bundles</CardTitle>
          <CardDescription>
            Each project is maintained with exactly one draft or published bundle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/dashboard" className="mb-4 flex max-w-md gap-2" method="get">
            <Input name="q" placeholder="Search project or bundle" />
            <Button type="submit" variant="outline">Filter</Button>
          </form>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Bundle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectData.projects.length ? (
                projectData.projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {project.description || "No description"}
                      </div>
                    </TableCell>
                    <TableCell>{project.bundle?.name ?? "Missing bundle"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{project.bundle?.status ?? "missing"}</Badge>
                    </TableCell>
                    <TableCell>{project.updatedAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard?dialog=edit&id=${project.id}`}>
                            Edit
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="destructive">
                          <Link href={`/dashboard?dialog=delete&id=${project.id}`}>
                            Delete
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={5}>
                    No projects found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {dialog === "create" ? (
        <ProjectForm
          action={createProjectWithBundleAction}
          organizations={overview.workspace.organizations}
          returnTo="/dashboard"
          title="Create project"
        />
      ) : null}

      {dialog === "edit" && selectedProject ? (
        <ProjectForm
          action={updateProjectBundleAction}
          organizations={overview.workspace.organizations}
          project={selectedProject}
          returnTo="/dashboard"
          title="Edit project"
        />
      ) : null}

      {dialog === "delete" && selectedProject ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle>Delete {selectedProject.name}</CardTitle>
            <CardDescription>
              This uses the existing project-to-bundle cascade relation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <form action={deleteProjectAction}>
              <input type="hidden" name="projectId" value={selectedProject.id} />
              <input type="hidden" name="returnTo" value="/dashboard" />
              <Button type="submit" variant="destructive">Delete project</Button>
            </form>
            <Button asChild variant="outline">
              <Link href="/dashboard">Cancel</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function ProjectForm({
  action,
  organizations,
  project,
  returnTo,
  title,
}: {
  action: (formData: FormData) => Promise<void>;
  organizations: { id: string; name: string }[];
  project?: {
    id: string;
    name: string;
    description: string | null;
    organizationId: string;
    bundle: {
      name: string;
      status: string;
      category: string | null;
      shortDescription: string | null;
    } | null;
  };
  returnTo: string;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Project and bundle are written together in one action.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          {project ? <input type="hidden" name="projectId" value={project.id} /> : null}
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="grid gap-2 text-sm">
            Project name
            <Input name="projectName" defaultValue={project?.name} required />
          </label>
          <label className="grid gap-2 text-sm">
            Organization
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={project?.organizationId}
              name="organizationId"
            >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Bundle name
            <Input name="bundleName" defaultValue={project?.bundle?.name ?? project?.name} />
          </label>
          <label className="grid gap-2 text-sm">
            Status
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={project?.bundle?.status ?? "draft"}
              name="status"
            >
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Category
            <Input name="category" defaultValue={project?.bundle?.category ?? ""} />
          </label>
          <label className="grid gap-2 text-sm">
            Project description
            <Input name="description" defaultValue={project?.description ?? ""} />
          </label>
          <label className="grid gap-2 text-sm md:col-span-2">
            Bundle summary
            <Input
              name="shortDescription"
              defaultValue={project?.bundle?.shortDescription ?? ""}
            />
          </label>
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit">{project ? "Save changes" : "Create project"}</Button>
            <Button asChild variant="outline">
              <Link href={returnTo}>Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

