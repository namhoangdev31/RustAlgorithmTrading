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
import { getTranslations } from "next-intl/server";

type UsersPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const user = await requireCurrentUser();
  const data = await getUsersData(user.id, params);
  const t = await getTranslations("Users");

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
          <Button asChild variant="outline">
            <a href="#invite-user">
              {t("invite_user_btn")}
              <MailPlus data-icon="inline-end" />
            </a>
          </Button>
          <Button asChild>
            <a href="#invite-user">
              {t("add_user_btn")}
              <UserPlus data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <form action="/dashboard/users" className="flex flex-wrap items-center gap-2" method="get">
          <Input className="h-8 w-[150px] lg:w-[250px]" name="q" placeholder={t("filter_placeholder")} />
          <Select name="status" defaultValue="all">
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder={t("status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("status_all")}</SelectItem>
              <SelectItem value="active">{t("status_active")}</SelectItem>
              <SelectItem value="invited">{t("status_invited")}</SelectItem>
              <SelectItem value="inactive">{t("status_inactive")}</SelectItem>
              <SelectItem value="suspended">{t("status_suspended")}</SelectItem>
            </SelectContent>
          </Select>
          <Select name="role" defaultValue="all">
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder={t("role")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("role_all")}</SelectItem>
              <SelectItem value="admin">{t("role_admin")}</SelectItem>
              <SelectItem value="editor">{t("role_editor")}</SelectItem>
              <SelectItem value="viewer">{t("role_viewer")}</SelectItem>
            </SelectContent>
          </Select>
          <Button className="h-8" type="submit" variant="outline">{t("reset")}</Button>
        </form>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="group/row">
                <TableHead className="w-10 bg-background group-hover/row:bg-muted">
                  <Checkbox aria-label={t("table.select_all")} />
                </TableHead>
                <TableHead className="bg-background group-hover/row:bg-muted">{t("table.username")}</TableHead>
                <TableHead className="bg-background group-hover/row:bg-muted">{t("table.name")}</TableHead>
                <TableHead className="bg-background group-hover/row:bg-muted">{t("table.email")}</TableHead>
                <TableHead className="bg-background group-hover/row:bg-muted">{t("table.status")}</TableHead>
                <TableHead className="bg-background group-hover/row:bg-muted">{t("table.role")}</TableHead>
                <TableHead>{t("table.bundle")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.collaborators.length ? (
                data.collaborators.map((collaborator) => (
                  <TableRow className="group/row" key={collaborator.id}>
                    <TableCell className="bg-background group-hover/row:bg-muted">
                      <Checkbox aria-label={t("table.select_row")} />
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
                        {collaborator.acceptedAt ? t("table.active") : t("table.invited")}
                      </Badge>
                    </TableCell>
                    <TableCell className="bg-background capitalize group-hover/row:bg-muted">
                      {t(`roles.${collaborator.role.toLowerCase()}` as any)}
                    </TableCell>
                    <TableCell>{collaborator.bundle.name}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal data-icon="inline-start" />
                            <span className="sr-only">{t("table.open_menu")}</span>
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
                                <SelectValue placeholder={t("table.select_role_placeholder")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">{t("table.role_viewer")}</SelectItem>
                                <SelectItem value="editor">{t("table.role_editor")}</SelectItem>
                                <SelectItem value="admin">{t("table.role_admin")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" type="submit" variant="outline">
                              {t("table.save")}
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
                            <Button className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" size="sm" type="submit" variant="ghost">
                              {t("table.remove")}
                            </Button>
                          </form>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={8}>
                    {t("table.no_results")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Card id="invite-user">
        <CardHeader>
          <CardTitle>{t("invite_card.title")}</CardTitle>
          <CardDescription>{t("invite_card.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={inviteCollaboratorAction} className="grid gap-4 md:grid-cols-4">
            <Input type="hidden" name="returnTo" value="/dashboard/users" />
            <Label className="grid gap-2 text-sm">
              {t("invite_card.bundle")}
              <Select
                name="bundleId"
                required
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t("invite_card.select_bundle_placeholder")} />
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
              {t("invite_card.user_email")}
              <Input name="email" placeholder={t("invite_card.email_placeholder")} required />
            </Label>
            <Label className="grid gap-2 text-sm">
              {t("invite_card.role")}
              <Select
                name="role"
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t("invite_card.select_role_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">{t("invite_card.role_viewer")}</SelectItem>
                  <SelectItem value="editor">{t("invite_card.role_editor")}</SelectItem>
                  <SelectItem value="admin">{t("invite_card.role_admin")}</SelectItem>
                </SelectContent>
              </Select>
            </Label>
            <div className="flex items-end">
              <Button type="submit">{t("invite_card.invite_btn")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
