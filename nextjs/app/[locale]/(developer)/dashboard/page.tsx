import { Link } from "@/i18n/navigation";
import {
  Activity,
  BriefcaseBusiness,
  CreditCard,
  DollarSign,
  Download,
  FolderPlus,
  PackageOpen,
  ShieldCheck,
  Users,
  AlertCircle,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  createOrganizationOnboardingAction,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { getTranslations } from "next-intl/server";
import { ProjectForm } from "@/components/projects/dialogs/ProjectForm";
import { hasVercelApiKey } from "@/lib/server/vercel";

type DashboardPageProps = {
  searchParams: Promise<{
    q?: string;
    dialog?: string;
    id?: string;
    error?: string;
    message?: string;
    name?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const user = await requireCurrentUser();
  const [overview, projectData, vercelConnected] = await Promise.all([
    getDashboardOverview(user.id),
    getProjectBundleData(user.id, params),
    hasVercelApiKey(user.id),
  ]);
  const dialog = params.dialog;
  const selectedProject = projectData.projects.find((project) => project.id === params.id);
  const t = await getTranslations("Dashboard");
  const hasOrganization = overview.workspace.organizations.length > 0;
  const hasProjects = projectData.projects.length > 0;
  const hasRevenueData = overview.charts.monthlyRevenue.some((point) => point.total > 0);
  const hasAnalyticsData = overview.charts.analyticsSeries.some(
    (point) => point.clicks > 0 || point.uniques > 0
  );
  const revenueFormatter = new Intl.NumberFormat("en", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  });

  if (!hasOrganization) {
    return <OrganizationOnboarding t={t} />;
  }

  return (
    <>
      {params.error && (
        <Alert variant="destructive" className="mb-4 bg-destructive/5 border-destructive/20 text-destructive rounded-lg animate-in slide-in-from-top-2 duration-300">
          <AlertCircle className="size-4" />
          <AlertTitle className="font-bold text-xs uppercase tracking-wider">Error Creating Project</AlertTitle>
          <AlertDescription className="text-xs font-semibold mt-1">
            {params.error === "missing_vercel_key" && "Vercel deployment is enabled, but your Vercel API key is not configured. Please connect your Vercel account under Settings > Integrations."}
            {params.error === "invalid_vercel_name" && `The Vercel project name "${params.name || ""}" is invalid. It must match Vercel subdomain requirements (only lowercase, numbers, and hyphens; start/end with alpha-numeric).`}
            {params.error === "vercel_api_error" && `Vercel API Error: ${params.message || "An unknown error occurred during Vercel project creation."}`}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-2 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
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
              description={t("metrics.total_revenue_desc")}
              icon={DollarSign}
              title={t("metrics.total_revenue")}
              value={revenueFormatter.format(overview.metrics.totalRevenue)}
            />
            <DashboardMetricCard
              description={t("metrics.projects_desc")}
              icon={Users}
              title={t("metrics.projects")}
              value={`${overview.metrics.projectCount}`}
            />
            <DashboardMetricCard
              description={t("metrics.orders_desc")}
              icon={CreditCard}
              title={t("metrics.orders")}
              value={`${overview.metrics.orderCount}`}
            />
            <DashboardMetricCard
              description={t("metrics.active_installs_desc")}
              icon={Activity}
              title={t("metrics.active_installs")}
              value={`${overview.metrics.activeInstalls}`}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4">
              <CardHeader>
                <CardTitle>{t("overview_chart")}</CardTitle>
              </CardHeader>
              <CardContent className="ps-2">
                {hasRevenueData ? (
                  <OverviewChart data={overview.charts.monthlyRevenue} />
                ) : (
                  <DashboardEmptyState
                    description={t("empty.revenue_description")}
                    icon={PackageOpen}
                    title={t("empty.revenue_title")}
                  />
                )}
              </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-3">
              <CardHeader>
                <CardTitle>{t("recent_activity.title")}</CardTitle>
                <CardDescription>
                  {t("recent_activity.description", {
                    count: overview.recentChats.length + overview.recentTasks.length,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivity
                  chats={overview.recentChats}
                  tasks={overview.recentTasks}
                  t={t}
                />
              </CardContent>
            </Card>
          </section>
        </TabsContent>
        <TabsContent className="mt-0" value="analytics">
          <AnalyticsSection
            analyticsData={overview.charts.analyticsSeries}
            hasAnalyticsData={hasAnalyticsData}
            metrics={overview.metrics}
            t={t}
          />
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
          {hasProjects ? (
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
                {projectData.projects.map((project) => (
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
                ))}
              </TableBody>
            </Table>
          ) : (
            <DashboardEmptyState
              action={
                <Button asChild>
                  <Link href="/dashboard?dialog=create">
                    <FolderPlus data-icon="inline-start" />
                    {t("projects_and_bundles.new_project")}
                  </Link>
                </Button>
              }
              description={t("empty.projects_description")}
              icon={FolderPlus}
              title={t("empty.projects_title")}
            />
          )}
        </CardContent>
      </Card>

      <Dialog defaultOpen={dialog === "create" || !hasProjects}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl bg-canvas border border-hairline shadow-dark">
          <DialogHeader>
            <DialogTitle>{t("form.create_title")}</DialogTitle>
            <DialogDescription>{t("form.description")}</DialogDescription>
          </DialogHeader>
          <ProjectForm
            action={createProjectWithBundleAction}
            organizations={overview.workspace.organizations}
            returnTo="/dashboard"
            vercelConnected={vercelConnected}
          />
        </DialogContent>
      </Dialog>

      {dialog === "edit" && selectedProject ? (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in flex justify-center items-start p-4 md:py-12">
          <Link href="/dashboard" className="fixed inset-0 cursor-default" aria-hidden="true" />
          <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 relative z-10">
            <ProjectForm
              action={updateProjectBundleAction}
              project={selectedProject}
              organizations={overview.workspace.organizations}
              returnTo="/dashboard"
              title={t("form.edit_title")}
              vercelConnected={vercelConnected}
            />
          </div>
        </div>
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

function OrganizationOnboarding({ t }: { t: any }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("onboarding.title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("onboarding.description")}
        </p>
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        <OnboardingFormCard
          accountType="developer"
          icon={ShieldCheck}
          submitLabel={t("onboarding.create_developer")}
          title={t("onboarding.developer_title")}
          t={t}
        />
        <OnboardingFormCard
          accountType="corporate"
          icon={BriefcaseBusiness}
          submitLabel={t("onboarding.create_corporate")}
          title={t("onboarding.corporate_title")}
          t={t}
        />
      </section>
    </div>
  );
}

function OnboardingFormCard({
  accountType,
  icon: Icon,
  submitLabel,
  title,
  t,
}: {
  accountType: "developer" | "corporate";
  icon: typeof ShieldCheck;
  submitLabel: string;
  title: string;
  t: any;
}) {
  const isCorporate = accountType === "corporate";

  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted">
          <Icon data-icon="inline-start" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {isCorporate
            ? t("onboarding.corporate_description")
            : t("onboarding.developer_description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createOrganizationOnboardingAction} className="grid gap-4">
          <Input type="hidden" name="accountType" value={isCorporate ? "corporate" : "developer"} />
          <Input type="hidden" name="returnTo" value="/dashboard" />
          <Label className="grid gap-2 text-sm">
            {t("onboarding.organization_name")}
            <Input name="organizationName" required />
          </Label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label className="grid gap-2 text-sm">
              {t("onboarding.full_name")}
              <Input name="fullName" required />
            </Label>
            <Label className="grid gap-2 text-sm">
              {t("onboarding.age")}
              <Input min={13} name="age" type="number" />
            </Label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label className="grid gap-2 text-sm">
              {t("onboarding.phone")}
              <Input name="phone" required type="tel" />
            </Label>
            <Label className="grid gap-2 text-sm">
              {t("onboarding.verification_email")}
              <Input name="verificationEmail" type="email" />
            </Label>
          </div>
          {isCorporate ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Label className="grid gap-2 text-sm">
                {t("onboarding.industry")}
                <Input name="industry" required />
              </Label>
              <Label className="grid gap-2 text-sm">
                {t("onboarding.tax_code")}
                <Input name="taxCode" />
              </Label>
            </div>
          ) : (
            <Label className="grid gap-2 text-sm">
              {t("onboarding.developer_role")}
              <Input name="developerRole" required />
            </Label>
          )}
          <Button type="submit">{submitLabel}</Button>
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

function DashboardEmptyState({
  action,
  description,
  icon: Icon,
  title,
}: {
  action?: React.ReactNode;
  description: string;
  icon: typeof PackageOpen;
  title: string;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon data-icon="inline-start" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

function RecentActivity({
  chats,
  tasks,
  t,
}: {
  chats: {
    id: string;
    title: string;
    body: string | null;
    isRead: boolean;
    createdAt: Date;
    actor: {
      fullName: string | null;
      email: string | null;
    } | null;
  }[];
  tasks: {
    id: string;
    status: string;
    priority: number;
    notes: string | null;
    createdAt: Date;
    bundle: {
      name: string;
      status: string;
    };
  }[];
  t: any;
}) {
  const activities = [
    ...tasks.map((task) => ({
      id: task.id,
      initials: task.bundle.name.slice(0, 2).toUpperCase(),
      meta: t("recent_activity.task_meta", { status: task.status }),
      title: task.bundle.name,
      value: t("recent_activity.priority", { priority: task.priority }),
    })),
    ...chats.map((chat) => ({
      id: chat.id,
      initials: (chat.actor?.fullName ?? chat.actor?.email ?? "CH").slice(0, 2).toUpperCase(),
      meta: chat.body ?? t("recent_activity.chat_meta"),
      title: chat.title,
      value: chat.isRead ? t("recent_activity.read") : t("recent_activity.unread"),
    })),
  ].slice(0, 5);

  if (!activities.length) {
    return (
      <DashboardEmptyState
        description={t("empty.activity_description")}
        icon={Activity}
        title={t("empty.activity_title")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {activities.map((activity) => (
        <div className="flex items-center gap-4" key={activity.id}>
          <Avatar className="size-9">
            <AvatarFallback>{activity.initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-wrap items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium leading-none">{activity.title}</p>
              <p className="text-sm text-muted-foreground">{activity.meta}</p>
            </div>
            <div className="font-medium">{activity.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsSection({
  analyticsData,
  hasAnalyticsData,
  metrics,
  t,
}: {
  analyticsData: { name: string; clicks: number; uniques: number }[];
  hasAnalyticsData: boolean;
  metrics: {
    totalClicks: number;
    uniqueVisitors: number;
    totalDownloads: number;
    activeInstalls: number;
  };
  t: any;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.traffic_overview")}</CardTitle>
          <CardDescription>{t("analytics.traffic_description")}</CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          {hasAnalyticsData ? (
            <AnalyticsChart data={analyticsData} />
          ) : (
            <DashboardEmptyState
              description={t("empty.analytics_description")}
              icon={Activity}
              title={t("empty.analytics_title")}
            />
          )}
        </CardContent>
      </Card>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          description={t("metrics.total_clicks_desc")}
          icon={Activity}
          title={t("metrics.total_clicks")}
          value={`${metrics.totalClicks}`}
        />
        <DashboardMetricCard
          description={t("metrics.unique_visitors_desc")}
          icon={Users}
          title={t("metrics.unique_visitors")}
          value={`${metrics.uniqueVisitors}`}
        />
        <DashboardMetricCard
          description={t("metrics.downloads_desc")}
          icon={Download}
          title={t("metrics.downloads")}
          value={`${metrics.totalDownloads}`}
        />
        <DashboardMetricCard
          description={t("metrics.active_installs_desc")}
          icon={Activity}
          title={t("metrics.active_installs")}
          value={`${metrics.activeInstalls}`}
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
              items={analyticsData.map((item) => ({
                name: item.name,
                value: item.clicks,
              }))}
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
              items={analyticsData.map((item) => ({
                name: item.name,
                value: item.uniques,
              }))}
              muted
              valueFormatter={(value) => `${value}`}
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
