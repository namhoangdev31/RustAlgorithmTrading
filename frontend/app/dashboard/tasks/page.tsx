import Link from "next/link";

import {
  createReviewTaskAction,
  deleteReviewTaskAction,
  updateReviewTaskAction,
} from "@/app/actions/admin";
import { PageHeader } from "@/components/dashboard/page-header";
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
import { getTasksData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";

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
      <PageHeader
        actionHref="/dashboard/tasks?dialog=create"
        actionLabel="New task"
        description="Review workflow tasks backed by BundleReviewQueue."
        title="Tasks"
      />

      <Card>
        <CardHeader>
          <CardTitle>Review queue</CardTitle>
          <CardDescription>Filter, create, assign, and close bundle tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/dashboard/tasks" className="mb-4 flex flex-wrap gap-2" method="get">
            <Input className="max-w-xs" name="q" placeholder="Search tasks" />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              name="status"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in_review">In review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <Button type="submit" variant="outline">Filter</Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bundle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.tasks.length ? (
                data.tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="font-medium">{task.bundle.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {task.notes || task.bundle.project?.name || "No notes"}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{task.status}</Badge></TableCell>
                    <TableCell>{task.priority}</TableCell>
                    <TableCell>
                      {task.reviewer?.fullName ?? task.reviewer?.email ?? "Unassigned"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/tasks?dialog=edit&id=${task.id}`}>
                            Edit
                          </Link>
                        </Button>
                        <form action={deleteReviewTaskAction}>
                          <input type="hidden" name="taskId" value={task.id} />
                          <input type="hidden" name="returnTo" value="/dashboard/tasks" />
                          <Button size="sm" type="submit" variant="ghost">Remove</Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={5}>
                    No tasks found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
          <label className="grid gap-2 text-sm">
            Bundle
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={task?.bundle.id}
              name="bundleId"
              required
            >
              {bundles.map((bundle) => (
                <option key={bundle.id} value={bundle.id}>
                  {bundle.name} ({bundle.projectName})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Status
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={task?.status ?? "pending"}
              name="status"
            >
              <option value="pending">Pending</option>
              <option value="in_review">In review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Priority
            <Input
              defaultValue={task?.priority ?? 0}
              min={0}
              name="priority"
              type="number"
            />
          </label>
          <label className="grid gap-2 text-sm">
            Assign to me
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={task?.reviewer ? "true" : "false"}
              name="assignToMe"
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm md:col-span-2">
            Notes
            <Input defaultValue={task?.notes ?? ""} name="notes" />
          </label>
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

