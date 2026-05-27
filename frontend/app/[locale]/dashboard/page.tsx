import { Link } from "@/i18n/navigation";
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
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("Dashboard");

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <Button>
          <Download data-icon="inline-start" />
          {t("download")}
        </Button>
      </div>

      <Tabs className="flex flex-col gap-4" defaultValue="overview" orientation="vertical">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList>
            <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
            <TabsTrigger value="analytics">{t("tabs.analytics")}</TabsTrigger>
            <TabsTrigger disabled value="reports">
              {t("tabs.reports")}
            </TabsTrigger>
            <TabsTrigger disabled value="notifications">
              {t("tabs.notifications")}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent className="mt-0 flex flex-col gap-4" value="overview">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardMetricCard
              description={t("metrics.vs_last_month", { value: "+20.1%" })}
              icon={DollarSign}
              title={t("metrics.total_revenue")}
              value="$45,231.89"
            />
            <DashboardMetricCard
              description={t("metrics.vs_last_month", { value: "+180.1%" })}
              icon={Users}
              title={t("metrics.subscriptions")}
              value="+2350"
            />
            <DashboardMetricCard
              description={t("metrics.vs_last_month", { value: "+19%" })}
              icon={CreditCard}
              title={t("metrics.sales")}
              value="+12,234"
            />
            <DashboardMetricCard
              description={t("metrics.since_last_hour", { value: "+201" })}
              icon={Activity}
              title={t("metrics.active_now")}
              value="+573"
            />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4">
              <CardHeader>
                <CardTitle>{t("overview_chart")}</CardTitle>
              </CardHeader>
              <CardContent className="ps-2">
                <OverviewChart />
              </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-3">
              <CardHeader>
                <CardTitle>{t("recent_sales.title")}</CardTitle>
                <CardDescription>{t("recent_sales.description", { count: 265 })}</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSales />
              </CardContent>
            </Card>
          </section>
        </TabsContent>
        <TabsContent className="mt-0" value="analytics">
          <AnalyticsSection t={t} />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>{t("projects_and_bundles.title")}</CardTitle>
            <CardDescription>
              {t("projects_and_bundles.description")}
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard?dialog=create">{t("projects_and_bundles.new_project")}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <form action="/dashboard" className="mb-4 flex max-w-md gap-2" method="get">
            <Input name="q" placeholder={t("projects_and_bundles.search_placeholder")} />
            <Button type="submit" variant="outline">{t("projects_and_bundles.filter")}</Button>
          </form>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.project")}</TableHead>
                <TableHead>{t("table.bundle")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead>{t("table.updated")}</TableHead>
                <TableHead className="text-right">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectData.projects.length ? (
                projectData.projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {project.description || t("projects_and_bundles.no_description")}
                      </div>
                    </TableCell>
                    <TableCell>{project.bundle?.name ?? t("projects_and_bundles.missing_bundle")}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {project.bundle?.status ? (
                          t(`form.status_options.${project.bundle.status as 'draft' | 'review' | 'published' | 'archived'}`)
                        ) : (
                          t("projects_and_bundles.missing_bundle")
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{project.updatedAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard?dialog=edit&id=${project.id}`}>
                            {t("table.edit")}
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="destructive">
                          <Link href={`/dashboard?dialog=delete&id=${project.id}`}>
                            {t("table.delete")}
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={5}>
                    {t("projects_and_bundles.no_projects")}
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
          title={t("form.create_title")}
          t={t}
        />
      ) : null}

      {dialog === "edit" && selectedProject ? (
        <ProjectForm
          action={updateProjectBundleAction}
          organizations={overview.workspace.organizations}
          project={selectedProject}
          returnTo="/dashboard"
          title={t("form.edit_title")}
          t={t}
        />
      ) : null}

      {dialog === "delete" && selectedProject ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle>{t("delete_dialog.title", { name: selectedProject.name })}</CardTitle>
            <CardDescription>
              {t("delete_dialog.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <form action={deleteProjectAction}>
              <Input type="hidden" name="projectId" value={selectedProject.id} />
              <Input type="hidden" name="returnTo" value="/dashboard" />
              <Button type="submit" variant="destructive">{t("delete_dialog.delete_project")}</Button>
            </form>
            <Button asChild variant="outline">
              <Link href="/dashboard">{t("delete_dialog.cancel")}</Link>
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
  t,
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
  t: any;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{t("form.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          {project ? <Input type="hidden" name="projectId" value={project.id} /> : null}
          <Input type="hidden" name="returnTo" value={returnTo} />
          <Label className="grid gap-2 text-sm">
            {t("form.project_name")}
            <Input name="projectName" defaultValue={project?.name} required />
          </Label>
          <Label className="grid gap-2 text-sm">
            {t("form.organization")}
            <Select
              defaultValue={project?.organizationId}
              name="organizationId"
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t("form.select_organization")} />
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
            {t("form.bundle_name")}
            <Input name="bundleName" defaultValue={project?.bundle?.name ?? project?.name} />
          </Label>
          <Label className="grid gap-2 text-sm">
            {t("form.status")}
            <Select
              defaultValue={project?.bundle?.status ?? "draft"}
              name="status"
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t("form.select_status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t("form.status_options.draft")}</SelectItem>
                <SelectItem value="review">{t("form.status_options.review")}</SelectItem>
                <SelectItem value="published">{t("form.status_options.published")}</SelectItem>
                <SelectItem value="archived">{t("form.status_options.archived")}</SelectItem>
              </SelectContent>
            </Select>
          </Label>
          <Label className="grid gap-2 text-sm">
            {t("form.category")}
            <Input name="category" defaultValue={project?.bundle?.category ?? ""} />
          </Label>
          <Label className="grid gap-2 text-sm">
            {t("form.project_description")}
            <Input name="description" defaultValue={project?.description ?? ""} />
          </Label>
          <Label className="grid gap-2 text-sm md:col-span-2">
            {t("form.bundle_summary")}
            <Input
              name="shortDescription"
              defaultValue={project?.bundle?.shortDescription ?? ""}
            />
          </Label>
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit">{project ? t("form.save_changes") : t("form.create_project")}</Button>
            <Button asChild variant="outline">
              <Link href={returnTo}>{t("form.cancel")}</Link>
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

function AnalyticsSection({ t }: { t: any }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.traffic_overview")}</CardTitle>
          <CardDescription>{t("analytics.traffic_description")}</CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <AnalyticsChart />
        </CardContent>
      </Card>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          description={t("metrics.vs_last_week", { value: "+12.4%" })}
          icon={Activity}
          title={t("metrics.total_clicks")}
          value="1,248"
        />
        <DashboardMetricCard
          description={t("metrics.vs_last_week", { value: "+5.8%" })}
          icon={Users}
          title={t("metrics.unique_visitors")}
          value="832"
        />
        <DashboardMetricCard
          description={t("metrics.vs_last_week", { value: "-3.2%" })}
          icon={Activity}
          title={t("metrics.bounce_rate")}
          value="42%"
        />
        <DashboardMetricCard
          description={t("metrics.vs_last_week", { value: "+18s" })}
          icon={Activity}
          title={t("metrics.avg_session")}
          value="3m 24s"
        />
      </section>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>{t("analytics.referrers")}</CardTitle>
            <CardDescription>{t("analytics.referrers_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={[
                { name: t("analytics.sources.Direct"), value: 512 },
                { name: t("analytics.sources.Product Hunt"), value: 238 },
                { name: t("analytics.sources.Twitter"), value: 174 },
                { name: t("analytics.sources.Blog"), value: 104 },
              ]}
              valueFormatter={(value) => `${value}`}
            />
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>{t("analytics.devices")}</CardTitle>
            <CardDescription>{t("analytics.devices_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={[
                { name: t("analytics.device_types.Desktop"), value: 74 },
                { name: t("analytics.device_types.Mobile"), value: 22 },
                { name: t("analytics.device_types.Tablet"), value: 4 },
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
