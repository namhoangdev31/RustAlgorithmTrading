import {
  inviteCollaboratorAction,
  removeCollaboratorAction,
  updateCollaboratorRoleAction,
} from "@/app/actions/admin";
import { MailPlus, MoreHorizontal, UserPlus } from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getUsersData } from "@/lib/server/admin-data";
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

type UsersPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const user = await requireCurrentUser();
  const data = await getUsersData(user.id, params);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User List</h2>
          <p className="text-muted-foreground">
            Manage your users and their roles here.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href="#invite-user">
              Invite User
              <MailPlus data-icon="inline-end" />
            </a>
          </Button>
          <Button asChild>
            <a href="#invite-user">
              Add User
              <UserPlus data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <form action="/dashboard/users" className="flex flex-wrap items-center gap-2" method="get">
          <Input className="h-8 w-[150px] lg:w-[250px]" name="q" placeholder="Filter users..." />
          <Select name="status" defaultValue="all">
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status (All)</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select name="role" defaultValue="all">
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Role (All)</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button className="h-8" type="submit" variant="outline">Reset</Button>
        </form>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="group/row">
                <TableHead className="w-10 bg-background group-hover/row:bg-muted">
                  <Checkbox aria-label="Select all" />
                </TableHead>
                <TableHead className="bg-background group-hover/row:bg-muted">Username</TableHead>
                <TableHead className="bg-background group-hover/row:bg-muted">Name</TableHead>
                <TableHead className="bg-background group-hover/row:bg-muted">Email</TableHead>
                <TableHead className="bg-background group-hover/row:bg-muted">Status</TableHead>
                <TableHead className="bg-background group-hover/row:bg-muted">Role</TableHead>
                <TableHead>Bundle</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.collaborators.length ? (
                data.collaborators.map((collaborator) => (
                  <TableRow className="group/row" key={collaborator.id}>
                    <TableCell className="bg-background group-hover/row:bg-muted">
                      <Checkbox aria-label="Select row" />
                    </TableCell>
                    <TableCell className="bg-background font-medium group-hover/row:bg-muted">
                      {collaborator.user.email?.split("@")[0] ?? "user"}
                    </TableCell>
                    <TableCell className="bg-background group-hover/row:bg-muted">
                      {collaborator.user.fullName ?? "Unnamed"}
                    </TableCell>
                    <TableCell className="bg-background group-hover/row:bg-muted">
                      <div className="text-nowrap">{collaborator.user.email}</div>
                    </TableCell>
                    <TableCell className="bg-background group-hover/row:bg-muted">
                      <Badge variant="outline" className="capitalize">
                        {collaborator.acceptedAt ? "active" : "invited"}
                      </Badge>
                    </TableCell>
                    <TableCell className="bg-background capitalize group-hover/row:bg-muted">
                      {collaborator.role}
                    </TableCell>
                    <TableCell>{collaborator.bundle.name}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal data-icon="inline-start" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 p-2">
                          <form action={updateCollaboratorRoleAction} className="flex gap-2">
                            <Input
                              type="hidden"
                              name="collaboratorId"
                              value={collaborator.id}
                            />
                            <Input
                              type="hidden"
                              name="returnTo"
                              value="/dashboard/users"
                            />
                            <Select
                              defaultValue={collaborator.role}
                              name="role"
                            >
                              <SelectTrigger className="h-9 flex-1">
                                <SelectValue placeholder="Select role..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" type="submit" variant="outline">
                              Save
                            </Button>
                          </form>
                          <form action={removeCollaboratorAction} className="mt-2">
                            <Input
                              type="hidden"
                              name="collaboratorId"
                              value={collaborator.id}
                            />
                            <Input
                              type="hidden"
                              name="returnTo"
                              value="/dashboard/users"
                            />
                            <Button className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" size="sm" type="submit" variant="ghost">Remove</Button>
                          </form>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={5}>
                    No collaborators found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Card id="invite-user">
        <CardHeader>
          <CardTitle>Invite User</CardTitle>
          <CardDescription>Invite requires an existing user email.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={inviteCollaboratorAction} className="grid gap-4 md:grid-cols-4">
            <Input type="hidden" name="returnTo" value="/dashboard/users" />
            <Label className="grid gap-2 text-sm">
              Bundle
              <Select
                name="bundleId"
                required
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select bundle..." />
                </SelectTrigger>
                <SelectContent>
                  {data.bundles.map((bundle) => (
                    <SelectItem key={bundle.id} value={bundle.id}>
                      {bundle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Label>
            <Label className="grid gap-2 text-sm">
              User email
              <Input name="email" placeholder="person@example.com" required />
            </Label>
            <Label className="grid gap-2 text-sm">
              Role
              <Select
                name="role"
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </Label>
            <div className="flex items-end">
              <Button type="submit">Invite</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
