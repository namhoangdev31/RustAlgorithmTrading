import { MoveRight, UserPlus, X } from "lucide-react";

import {
  inviteWorkspaceMemberAction,
  removeWorkspaceMemberAction,
  transferWorkspaceOwnershipAction,
  updateWorkspaceMemberRoleAction,
} from "@/app/actions/workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type WorkspaceMember = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: "viewer" | "editor" | "admin" | "owner";
  projectCount: number;
};

type WorkspaceGovernanceCardProps = {
  organizationId: string;
  members: WorkspaceMember[];
  usage: {
    plan: string;
    limits: {
      projects: number;
      members: number;
      releases: number;
    };
    usage: {
      projects: number;
      bundles: number;
      members: number;
      releases: number;
    };
  } | null;
};

function RoleSelect({ defaultValue }: { defaultValue: WorkspaceMember["role"] }) {
  return (
    <NativeSelect name="role" defaultValue={defaultValue} size="sm">
      <NativeSelectOption value="viewer">Viewer</NativeSelectOption>
      <NativeSelectOption value="editor">Editor</NativeSelectOption>
      <NativeSelectOption value="admin">Admin</NativeSelectOption>
    </NativeSelect>
  );
}

export function WorkspaceGovernanceCard({
  organizationId,
  members,
  usage,
}: WorkspaceGovernanceCardProps) {
  const usageRows = usage
    ? [
        {
          label: "Projects",
          current: usage.usage.projects,
          limit: usage.limits.projects,
        },
        {
          label: "Members",
          current: usage.usage.members,
          limit: usage.limits.members,
        },
        {
          label: "Releases",
          current: usage.usage.releases,
          limit: usage.limits.releases,
        },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace governance</CardTitle>
        <CardDescription>Members, roles, ownership, and audit events</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {usage ? (
          <div className="grid gap-3 md:grid-cols-3">
            {usageRows.map((item) => {
              const value = Math.min(100, Math.round((item.current / item.limit) * 100));

              return (
                <div key={item.label} className="flex flex-col gap-2 rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{item.label}</span>
                    <Badge variant="secondary">
                      {item.current}/{item.limit}
                    </Badge>
                  </div>
                  <Progress value={value} />
                </div>
              );
            })}
          </div>
        ) : null}

        <form action={inviteWorkspaceMemberAction}>
          <input type="hidden" name="organizationId" value={organizationId} />
          <input type="hidden" name="returnTo" value="/dashboard/settings/account" />
          <FieldGroup className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <Field>
              <FieldLabel htmlFor="workspace-member-email">Member email</FieldLabel>
              <Input
                id="workspace-member-email"
                name="email"
                type="email"
                placeholder="teammate@example.com"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="workspace-member-role">Role</FieldLabel>
              <RoleSelect defaultValue="editor" />
            </Field>
            <Field className="justify-end">
              <FieldLabel className="sr-only">Invite</FieldLabel>
              <Button type="submit">
                <UserPlus data-icon="inline-start" />
                Invite
              </Button>
            </Field>
          </FieldGroup>
        </form>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {member.fullName || member.email || "Unnamed member"}
                      </span>
                      {member.email ? (
                        <span className="text-sm text-muted-foreground">{member.email}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{member.role === "owner" ? "All" : member.projectCount}</TableCell>
                  <TableCell>
                    {member.role === "owner" ? (
                      <div className="flex justify-end">
                        <Badge variant="outline">
                          Owner
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <form action={updateWorkspaceMemberRoleAction} className="flex gap-2">
                          <input type="hidden" name="organizationId" value={organizationId} />
                          <input type="hidden" name="memberId" value={member.id} />
                          <input
                            type="hidden"
                            name="returnTo"
                            value="/dashboard/settings/account"
                          />
                          <RoleSelect defaultValue={member.role} />
                          <Button type="submit" variant="outline" size="sm">
                            Save
                          </Button>
                        </form>
                        <form action={removeWorkspaceMemberAction}>
                          <input type="hidden" name="organizationId" value={organizationId} />
                          <input type="hidden" name="memberId" value={member.id} />
                          <input
                            type="hidden"
                            name="returnTo"
                            value="/dashboard/settings/account"
                          />
                          <Button type="submit" variant="ghost" size="sm">
                            <X data-icon="inline-start" />
                            Remove
                          </Button>
                        </form>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <form action={transferWorkspaceOwnershipAction}>
          <input type="hidden" name="organizationId" value={organizationId} />
          <input type="hidden" name="returnTo" value="/dashboard/settings/account" />
          <FieldGroup className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Field>
              <FieldLabel htmlFor="workspace-transfer-email">New owner email</FieldLabel>
              <Input
                id="workspace-transfer-email"
                name="email"
                type="email"
                placeholder="owner@example.com"
                required
              />
              <FieldDescription>
                The current owner becomes an admin collaborator on existing projects.
              </FieldDescription>
            </Field>
            <Field className="justify-end">
              <FieldLabel className="sr-only">Transfer ownership</FieldLabel>
              <Button type="submit" variant="outline">
                <MoveRight data-icon="inline-start" />
                Transfer
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
