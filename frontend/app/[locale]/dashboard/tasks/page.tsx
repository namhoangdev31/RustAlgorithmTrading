import { Link } from "@/i18n/navigation";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle,
  Circle,
  CircleOff,
  HelpCircle,
  ListPlus,
  MoreHorizontal,
  Timer,
  Upload,
} from "lucide-react";

import {
  createReviewTaskAction,
  deleteReviewTaskAction,
  updateReviewTaskAction,
} from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { getTasksData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTranslations } from "next-intl/server";

type TasksPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    dialog?: string;
    id?: string;
  }>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const user = await requireCurrentUser();
  const data = await getTasksData(user.id, params);
  const selectedTask = data.tasks.find((task) => task.id === params.id);
  const t = await getTranslations("Tasks");

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            {t("import")}
            <Upload data-icon="inline-end" />
          </Button>
          <Button asChild>
            <Link href="/dashboard/tasks?dialog=create">
              {t("add_task")}
              <ListPlus data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <form action="/dashboard/tasks" className="flex flex-wrap items-center gap-2" method="get">
          <Input className="h-8 w-[150px] lg:w-[250px]" name="q" placeholder={t("filter_placeholder")} />
          <Select name="status" defaultValue={params.status || "all"}>
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder={t("status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("status_all")}</SelectItem>
              <SelectItem value="backlog">{t("status_backlog")}</SelectItem>
              <SelectItem value="todo">{t("status_todo")}</SelectItem>
              <SelectItem value="in progress">{t("status_in_progress")}</SelectItem>
              <SelectItem value="done">{t("status_done")}</SelectItem>
              <SelectItem value="canceled">{t("status_canceled")}</SelectItem>
              <SelectItem value="pending">{t("status_pending")}</SelectItem>
              <SelectItem value="in_review">{t("status_in_review")}</SelectItem>
            </SelectContent>
          </Select>
          <Select name="priority" defaultValue={params.priority || "all"}>
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder={t("priority")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("priority_all")}</SelectItem>
              <SelectItem value="1">{t("priority_low")}</SelectItem>
              <SelectItem value="2">{t("priority_medium")}</SelectItem>
              <SelectItem value="3">{t("priority_high")}</SelectItem>
              <SelectItem value="4">{t("priority_critical")}</SelectItem>
            </SelectContent>
          </Select>
          <Button className="h-8" type="submit" variant="outline">{t("reset")}</Button>
        </form>

        <div className="overflow-hidden rounded-md border">
          <Table className="min-w-xl">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox aria-label={t("table.select_all")} />
                </TableHead>
                <TableHead>{t("table.task")}</TableHead>
                <TableHead>{t("table.title")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead>{t("table.priority")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.tasks.length ? (
                data.tasks.map((task, index) => {
                  const status = mapTaskStatus(task.status, t);
                  const priority = mapTaskPriority(task.priority, t);
                  const StatusIcon = status.icon;
                  const PriorityIcon = priority.icon;

                  return (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Checkbox aria-label={t("table.select_row")} />
                      </TableCell>
                      <TableCell>
                        <div className="w-20">TASK-{String(index + 1).padStart(3, "0")}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant="outline">{task.bundle.status === "published" ? t("table.feature") : t("table.bug")}</Badge>
                          <span className="truncate font-medium">
                            {task.notes || task.bundle.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex w-28 items-center gap-2">
                          <StatusIcon className="size-4 text-muted-foreground" />
                          <span>{status.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PriorityIcon className="size-4 text-muted-foreground" />
                          <span>{priority.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal data-icon="inline-start" />
                              <span className="sr-only">{t("table.open_menu")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/tasks?dialog=edit&id=${task.id}`}>
                                {t("table.edit")}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <form action={deleteReviewTaskAction} className="w-full">
                                <Input type="hidden" name="taskId" value={task.id} />
                                <Input type="hidden" name="returnTo" value="/dashboard/tasks" />
                                <Button className="w-full justify-start" size="sm" type="submit" variant="ghost">{t("table.remove")}</Button>
                              </form>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={5}>
                    {t("table.no_results")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {params.dialog === "create" ? (
        <TaskForm
          action={createReviewTaskAction}
          bundles={data.bundles}
          returnTo="/dashboard/tasks"
          title={t("form.create_title")}
          t={t}
        />
      ) : null}

      {params.dialog === "edit" && selectedTask ? (
        <TaskForm
          action={updateReviewTaskAction}
          bundles={data.bundles}
          returnTo="/dashboard/tasks"
          task={selectedTask}
          title={t("form.edit_title")}
          t={t}
        />
      ) : null}
    </>
  );
}

function mapTaskStatus(status: string, t: any) {
  if (status === "approved" || status === "done") {
    return { label: t("status_done"), icon: CheckCircle };
  }
  if (status === "in_review" || status === "in progress") {
    return { label: t("status_in_progress"), icon: Timer };
  }
  if (status === "rejected" || status === "canceled") {
    return { label: t("status_canceled"), icon: CircleOff };
  }
  if (status === "backlog") {
    return { label: t("status_backlog"), icon: HelpCircle };
  }
  return { label: t("status_todo"), icon: Circle };
}

function mapTaskPriority(priority: number, t: any) {
  if (priority >= 4) {
    return { label: t("priority_critical"), icon: AlertCircle };
  }
  if (priority >= 3) {
    return { label: t("priority_high"), icon: ArrowUp };
  }
  if (priority >= 2) {
    return { label: t("priority_medium"), icon: ArrowRight };
  }
  return { label: t("priority_low"), icon: ArrowDown };
}

function TaskForm({
  action,
  bundles,
  returnTo,
  task,
  title,
  t,
}: {
  action: (formData: FormData) => Promise<void>;
  bundles: { id: string; name: string; projectName: string }[];
  returnTo: string;
  task?: {
    id: string;
    status: string;
    priority: number;
    notes: string | null;
    bundle: { id: string };
    reviewer: { email: string | null; fullName: string | null } | null;
  };
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
          {task ? <Input type="hidden" name="taskId" value={task.id} /> : null}
          <Input type="hidden" name="returnTo" value={returnTo} />
          <Label className="grid gap-2 text-sm">
            {t("form.bundle")}
            <Select
              defaultValue={task?.bundle.id}
              name="bundleId"
              required
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t("form.select_bundle_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {bundles.map((bundle) => (
                  <SelectItem key={bundle.id} value={bundle.id}>
                    {bundle.name} ({bundle.projectName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Label>
          <Label className="grid gap-2 text-sm">
            {t("form.status")}
            <Select
              defaultValue={task?.status ?? "pending"}
              name="status"
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t("form.select_status_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t("form.pending")}</SelectItem>
                <SelectItem value="in_review">{t("form.in_review")}</SelectItem>
                <SelectItem value="approved">{t("form.approved")}</SelectItem>
                <SelectItem value="rejected">{t("form.rejected")}</SelectItem>
              </SelectContent>
            </Select>
          </Label>
          <Label className="grid gap-2 text-sm">
            {t("form.priority")}
            <Input
              defaultValue={task?.priority ?? 0}
              min={0}
              name="priority"
              type="number"
            />
          </Label>
          <Label className="grid gap-2 text-sm">
            {t("form.assign_to_me")}
            <Select
              defaultValue={task?.reviewer ? "true" : "false"}
              name="assignToMe"
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t("form.select_assign_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">{t("form.no")}</SelectItem>
                <SelectItem value="true">{t("form.yes")}</SelectItem>
              </SelectContent>
            </Select>
          </Label>
          <Label className="grid gap-2 text-sm md:col-span-2">
            {t("form.notes")}
            <Input defaultValue={task?.notes ?? ""} name="notes" />
          </Label>
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit">{task ? t("form.save_task") : t("form.create_task")}</Button>
            <Button asChild variant="outline">
              <Link href={returnTo}>{t("form.cancel")}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
