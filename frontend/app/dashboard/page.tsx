import Link from "next/link";
import {
  Activity,
  CreditCard,
  DollarSign,
  Download,
  Users,
} from "lucide-react";

import {
  createProjectWithBundleAction,
  deleteProjectAction,
  updateProjectBundleAction,
} from "@/app/actions/admin";
import {
  AnalyticsChart,
  OverviewChart,
} from "@/components/dashboard/dashboard-charts";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDashboardOverview, getProjectBundleData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type DashboardPageProps = {
  searchParams: Promise<{
    q?: string;
    dialog?: string;
    id?: string;
  }>;
};

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
      <div className="mb-2 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Button>
          <Download data-icon="inline-start" />
          Download
        </Button>
      </div>

      <Tabs className="flex flex-col gap-4" defaultValue="overview" orientation="vertical">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger disabled value="reports">
              Reports
            </TabsTrigger>
            <TabsTrigger disabled value="notifications">
              Notifications
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent className="mt-0 flex flex-col gap-4" value="overview">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardMetricCard
              description="+20.1% from last month"
              icon={DollarSign}
              title="Total Revenue"
              value="$45,231.89"
            />
            <DashboardMetricCard
              description="+180.1% from last month"
              icon={Users}
              title="Subscriptions"
              value="+2350"
            />
            <DashboardMetricCard
              description="+19% from last month"
              icon={CreditCard}
              title="Sales"
              value="+12,234"
            />
            <DashboardMetricCard
              description="+201 since last hour"
              icon={Activity}
              title="Active Now"
              value="+573"
            />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="ps-2">
                <OverviewChart />
              </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>You made 265 sales this month.</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSales />
              </CardContent>
            </Card>
          </section>
        </TabsContent>
        <TabsContent className="mt-0" value="analytics">
          <AnalyticsSection />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>Projects and bundles</CardTitle>
            <CardDescription>
              Each project is maintained with exactly one draft or published bundle.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard?dialog=create">New project</Link>
          </Button>
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
          <Label className="grid gap-2 text-sm">
            Project name
            <Input name="projectName" defaultValue={project?.name} required />
          </Label>
          <Label className="grid gap-2 text-sm">
            Organization
            <Select
              defaultValue={project?.organizationId}
              name="organizationId"
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select organization..." />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((organization) => (
                  <SelectItem key={organization.id} value={organization.id}>
                    {organization.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Label>
          <Label className="grid gap-2 text-sm">
            Bundle name
            <Input name="bundleName" defaultValue={project?.bundle?.name ?? project?.name} />
          </Label>
          <Label className="grid gap-2 text-sm">
            Status
            <Select
              defaultValue={project?.bundle?.status ?? "draft"}
              name="status"
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </Label>
          <Label className="grid gap-2 text-sm">
            Category
            <Input name="category" defaultValue={project?.bundle?.category ?? ""} />
          </Label>
          <Label className="grid gap-2 text-sm">
            Project description
            <Input name="description" defaultValue={project?.description ?? ""} />
          </Label>
          <Label className="grid gap-2 text-sm md:col-span-2">
            Bundle summary
            <Input
              name="shortDescription"
              defaultValue={project?.bundle?.shortDescription ?? ""}
            />
          </Label>
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

function DashboardMetricCard({
  description,
  icon: Icon,
  title,
  value,
}: {
  description: string;
  icon: typeof DollarSign;
  title: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="text-muted-foreground" data-icon="inline-start" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function RecentSales() {
  const sales = [
    ["Olivia Martin", "olivia.martin@email.com", "+$1,999.00", "OM"],
    ["Jackson Lee", "jackson.lee@email.com", "+$39.00", "JL"],
    ["Isabella Nguyen", "isabella.nguyen@email.com", "+$299.00", "IN"],
    ["William Kim", "will@email.com", "+$99.00", "WK"],
    ["Sofia Davis", "sofia.davis@email.com", "+$39.00", "SD"],
  ];

  return (
    <div className="flex flex-col gap-8">
      {sales.map(([name, email, amount, initials]) => (
        <div className="flex items-center gap-4" key={email}>
          <Avatar className="size-9">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-wrap items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium leading-none">{name}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
            <div className="font-medium">{amount}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsSection() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Traffic Overview</CardTitle>
          <CardDescription>Weekly clicks and unique visitors</CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <AnalyticsChart />
        </CardContent>
      </Card>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          description="+12.4% vs last week"
          icon={Activity}
          title="Total Clicks"
          value="1,248"
        />
        <DashboardMetricCard
          description="+5.8% vs last week"
          icon={Users}
          title="Unique Visitors"
          value="832"
        />
        <DashboardMetricCard
          description="-3.2% vs last week"
          icon={Activity}
          title="Bounce Rate"
          value="42%"
        />
        <DashboardMetricCard
          description="+18s vs last week"
          icon={Activity}
          title="Avg. Session"
          value="3m 24s"
        />
      </section>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Referrers</CardTitle>
            <CardDescription>Top sources driving traffic</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={[
                { name: "Direct", value: 512 },
                { name: "Product Hunt", value: 238 },
                { name: "Twitter", value: 174 },
                { name: "Blog", value: 104 },
              ]}
              valueFormatter={(value) => `${value}`}
            />
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Devices</CardTitle>
            <CardDescription>How users access your app</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={[
                { name: "Desktop", value: 74 },
                { name: "Mobile", value: 22 },
                { name: "Tablet", value: 4 },
              ]}
              muted
              valueFormatter={(value) => `${value}%`}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function SimpleBarList({
  items,
  muted,
  valueFormatter,
}: {
  items: { name: string; value: number }[];
  muted?: boolean;
  valueFormatter: (value: number) => string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const width = `${Math.round((item.value / max) * 100)}%`;

        return (
          <li className="flex items-center justify-between gap-3" key={item.name}>
            <div className="min-w-0 flex-1">
              <div className="mb-1 truncate text-xs text-muted-foreground">
                {item.name}
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted">
                <div
                  className={muted ? "h-2.5 rounded-full bg-muted-foreground" : "h-2.5 rounded-full bg-primary"}
                  style={{ width }}
                />
              </div>
            </div>
            <div className="ps-2 text-xs font-medium tabular-nums">
              {valueFormatter(item.value)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
