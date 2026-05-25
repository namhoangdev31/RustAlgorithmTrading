import {
  inviteCollaboratorAction,
  removeCollaboratorAction,
  updateCollaboratorRoleAction,
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
import { getUsersData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";

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
      <PageHeader
        description="Collaborator management uses existing User and BundleCollaborators records."
        title="Users"
      />

      <section className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
        <Card>
          <CardHeader>
            <CardTitle>Invite collaborator</CardTitle>
            <CardDescription>Invite requires an existing user email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={inviteCollaboratorAction} className="flex flex-col gap-4">
              <input type="hidden" name="returnTo" value="/dashboard/users" />
              <label className="grid gap-2 text-sm">
                Bundle
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  name="bundleId"
                  required
                >
                  {data.bundles.map((bundle) => (
                    <option key={bundle.id} value={bundle.id}>
                      {bundle.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                User email
                <Input name="email" placeholder="person@example.com" required />
              </label>
              <label className="grid gap-2 text-sm">
                Role
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  name="role"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <Button type="submit">Invite</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collaborators</CardTitle>
            <CardDescription>Roles are scoped to bundles.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/dashboard/users" className="mb-4 flex gap-2" method="get">
              <Input name="q" placeholder="Search collaborators" />
              <Button type="submit" variant="outline">Search</Button>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Bundle</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Accepted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.collaborators.length ? (
                  data.collaborators.map((collaborator) => (
                    <TableRow key={collaborator.id}>
                      <TableCell>
                        <div className="font-medium">
                          {collaborator.user.fullName ?? "Unnamed"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {collaborator.user.email}
                        </div>
                      </TableCell>
                      <TableCell>{collaborator.bundle.name}</TableCell>
                      <TableCell><Badge variant="secondary">{collaborator.role}</Badge></TableCell>
                      <TableCell>
                        {collaborator.acceptedAt
                          ? collaborator.acceptedAt.toLocaleDateString()
                          : "Pending"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <form action={updateCollaboratorRoleAction} className="flex gap-2">
                            <input
                              type="hidden"
                              name="collaboratorId"
                              value={collaborator.id}
                            />
                            <input
                              type="hidden"
                              name="returnTo"
                              value="/dashboard/users"
                            />
                            <select
                              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                              defaultValue={collaborator.role}
                              name="role"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="editor">Editor</option>
                              <option value="admin">Admin</option>
                            </select>
                            <Button size="sm" type="submit" variant="outline">
                              Save
                            </Button>
                          </form>
                          <form action={removeCollaboratorAction}>
                            <input
                              type="hidden"
                              name="collaboratorId"
                              value={collaborator.id}
                            />
                            <input
                              type="hidden"
                              name="returnTo"
                              value="/dashboard/users"
                            />
                            <Button size="sm" type="submit" variant="ghost">Remove</Button>
                          </form>
                        </div>
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
          </CardContent>
        </Card>
      </section>
    </>
  );
}

