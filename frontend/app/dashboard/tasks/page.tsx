import Link from "next/link";
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

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">
            Here&apos;s a list of your tasks for this month!
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            Import
            <Upload data-icon="inline-end" />
          </Button>
          <Button asChild>
            <Link href="/dashboard/tasks?dialog=create">
              Add Task
              <ListPlus data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4">
          <form action="/dashboard/tasks" className="flex flex-wrap items-center gap-2" method="get">
            <Input className="h-8 w-[150px] lg:w-[250px]" name="q" placeholder="Filter by title or ID..." />
            <Select name="status" defaultValue={params.status || "all"}>
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status (All)</SelectItem>
                <SelectItem value="backlog">Backlog</SelectItem>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
              </SelectContent>
            </Select>
            <Select name="priority" defaultValue={params.priority || "all"}>
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Priority (All)</SelectItem>
                <SelectItem value="1">Low</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="3">High</SelectItem>
                <SelectItem value="4">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Button className="h-8" type="submit" variant="outline">Reset</Button>
          </form>

        <div className="overflow-hidden rounded-md border">
          <Table className="min-w-xl">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox aria-label="Select all" />
                </TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.tasks.length ? (
                data.tasks.map((task, index) => {
                  const status = mapTaskStatus(task.status);
                  const priority = mapTaskPriority(task.priority);
                  const StatusIcon = status.icon;
                  const PriorityIcon = priority.icon;

                  return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Checkbox aria-label="Select row" />
                    </TableCell>
                    <TableCell>
                      <div className="w-20">TASK-{String(index + 1).padStart(3, "0")}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge variant="outline">{task.bundle.status === "published" ? "Feature" : "Bug"}</Badge>
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
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/tasks?dialog=edit&id=${task.id}`}>
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <form action={deleteReviewTaskAction} className="w-full">
                              <input type="hidden" name="taskId" value={task.id} />
                              <input type="hidden" name="returnTo" value="/dashboard/tasks" />
                              <Button className="w-full justify-start" size="sm" type="submit" variant="ghost">Remove</Button>
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
                    No results.
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
          title="Create review task"
        />
      ) : null}

      {params.dialog === "edit" && selectedTask ? (
        <TaskForm
          action={updateReviewTaskAction}
          bundles={data.bundles}
          returnTo="/dashboard/tasks"
          task={selectedTask}
          title="Edit review task"
        />
      ) : null}
    </>
  );
}

function mapTaskStatus(status: string) {
  if (status === "approved" || status === "done") {
    return { label: "Done", icon: CheckCircle };
  }
  if (status === "in_review" || status === "in progress") {
    return { label: "In Progress", icon: Timer };
  }
  if (status === "rejected" || status === "canceled") {
    return { label: "Canceled", icon: CircleOff };
  }
  if (status === "backlog") {
    return { label: "Backlog", icon: HelpCircle };
  }
  return { label: "Todo", icon: Circle };
}

function mapTaskPriority(priority: number) {
  if (priority >= 4) {
    return { label: "Critical", icon: AlertCircle };
  }
  if (priority >= 3) {
    return { label: "High", icon: ArrowUp };
  }
  if (priority >= 2) {
    return { label: "Medium", icon: ArrowRight };
  }
  return { label: "Low", icon: ArrowDown };
}

function TaskForm({
  action,
  bundles,
  returnTo,
  task,
  title,
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
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Tasks are stored as bundle review queue records.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          {task ? <input type="hidden" name="taskId" value={task.id} /> : null}
          <input type="hidden" name="returnTo" value={returnTo} />
          <Label className="grid gap-2 text-sm">
            Bundle
            <Select
              defaultValue={task?.bundle.id}
              name="bundleId"
              required
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select bundle..." />
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
            Status
            <Select
              defaultValue={task?.status ?? "pending"}
              name="status"
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </Label>
          <Label className="grid gap-2 text-sm">
            Priority
            <Input
              defaultValue={task?.priority ?? 0}
              min={0}
              name="priority"
              type="number"
            />
          </Label>
          <Label className="grid gap-2 text-sm">
            Assign to me
            <Select
              defaultValue={task?.reviewer ? "true" : "false"}
              name="assignToMe"
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
              </SelectContent>
            </Select>
          </Label>
          <Label className="grid gap-2 text-sm md:col-span-2">
            Notes
            <Input defaultValue={task?.notes ?? ""} name="notes" />
          </Label>
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit">{task ? "Save task" : "Create task"}</Button>
            <Button asChild variant="outline">
              <Link href={returnTo}>Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
