import {
  inviteWorkspaceMemberAction,
  removeWorkspaceMemberAction,
  updateWorkspaceMemberRoleAction,
} from "@/app/actions/workspace";
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
  const returnTo = "/settings/members";
  const organizationId = data.organizationId;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t("description")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="h-8 text-xs">
            <a href="#invite-user">
              {t("invite_user_btn") || "Invite"}
              <MailPlus className="size-3.5 ml-1.5" />
            </a>
          </Button>
          <Button asChild className="h-8 text-xs">
            <a href="#invite-user">
              {t("add_user_btn") || "Add User"}
              <UserPlus className="size-3.5 ml-1.5" />
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <form action={returnTo} className="flex flex-wrap items-center gap-2" method="get">
          <Input className="h-9 text-xs w-[150px] lg:w-[250px]" name="q" placeholder={t("filter_placeholder")} />
          <Select name="status" defaultValue="all">
            <SelectTrigger className="h-9 text-xs w-[150px]">
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
            <SelectTrigger className="h-9 text-xs w-[150px]">
              <SelectValue placeholder={t("role")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("role_all")}</SelectItem>
              <SelectItem value="admin">{t("role_admin")}</SelectItem>
              <SelectItem value="editor">{t("role_editor")}</SelectItem>
              <SelectItem value="viewer">{t("role_viewer")}</SelectItem>
            </SelectContent>
          </Select>
          <Button className="h-9 text-xs" type="submit" variant="outline">{t("reset")}</Button>
        </form>

        <div className="overflow-hidden rounded-md border border-hairline bg-card">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="group/row">
                <TableHead className="w-10 bg-secondary/30">
                  <Checkbox aria-label={t("table.select_all")} />
                </TableHead>
                <TableHead className="bg-secondary/30">{t("table.username")}</TableHead>
                <TableHead className="bg-secondary/30">{t("table.name")}</TableHead>
                <TableHead className="bg-secondary/30">{t("table.email")}</TableHead>
                <TableHead className="bg-secondary/30">{t("table.status")}</TableHead>
                <TableHead className="bg-secondary/30">{t("table.role")}</TableHead>
                <TableHead className="bg-secondary/30">{t("table.bundle")}</TableHead>
                <TableHead className="w-10 bg-secondary/30" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.collaborators.length ? (
                data.collaborators.map((collaborator) => (
                  <TableRow className="hover:bg-secondary/20" key={collaborator.id}>
                    <TableCell>
                      <Checkbox aria-label={t("table.select_row")} />
                    </TableCell>
                    <TableCell className="font-semibold">
                      {collaborator.user.email?.split("@")[0] ?? "user"}
                    </TableCell>
                    <TableCell>
                      {collaborator.user.fullName ?? "Unnamed"}
                    </TableCell>
                    <TableCell>
                      <div className="text-nowrap">{collaborator.user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {collaborator.acceptedAt ? t("table.active") : t("table.invited")}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {t(`roles.${collaborator.role.toLowerCase()}` as any) || collaborator.role}
                    </TableCell>
                    <TableCell>{collaborator.bundle.name}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">{t("table.open_menu")}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 p-2">
                          <form action={updateWorkspaceMemberRoleAction} className="flex gap-2">
                            <input
                              type="hidden"
                              name="memberId"
                              value={collaborator.user.id}
                            />
                            <input type="hidden" name="organizationId" value={organizationId ?? ""} />
                            <input
                              type="hidden"
                              name="returnTo"
                              value={returnTo}
                            />
                            <Select
                              defaultValue={collaborator.role}
                              name="role"
                            >
                              <SelectTrigger className="h-8 flex-1 text-xs">
                                <SelectValue placeholder={t("table.select_role_placeholder")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer" className="text-xs">{t("table.role_viewer")}</SelectItem>
                                <SelectItem value="editor" className="text-xs">{t("table.role_editor")}</SelectItem>
                                <SelectItem value="admin" className="text-xs">{t("table.role_admin")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" type="submit" variant="outline" className="h-8 text-xs">
                              {t("table.save")}
                            </Button>
                          </form>
                          <form action={removeWorkspaceMemberAction} className="mt-2 border-t pt-2 border-hairline">
                            <input
                              type="hidden"
                              name="memberId"
                              value={collaborator.user.id}
                            />
                            <input type="hidden" name="organizationId" value={organizationId ?? ""} />
                            <input
                              type="hidden"
                              name="returnTo"
                              value={returnTo}
                            />
                            <Button className="w-full justify-start text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-8" size="sm" type="submit" variant="ghost">
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
                  <TableCell className="text-muted-foreground text-center py-6" colSpan={8}>
                    {t("table.no_results")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Card id="invite-user" className="bg-card border border-hairline">
        <CardHeader>
          <CardTitle className="text-base font-bold">{t("invite_card.title")}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">{t("invite_card.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={inviteWorkspaceMemberAction} className="grid gap-4 md:grid-cols-3 text-xs">
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="organizationId" value={organizationId ?? ""} />
            <Label className="grid gap-2 text-xs font-semibold">
              {t("invite_card.user_email")}
              <Input name="email" placeholder={t("invite_card.email_placeholder")} required className="h-9 text-xs" />
            </Label>
            <Label className="grid gap-2 text-xs font-semibold">
              {t("invite_card.role")}
              <Select
                name="role"
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t("invite_card.select_role_placeholder")} />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="viewer" className="text-xs">{t("invite_card.role_viewer")}</SelectItem>
                  <SelectItem value="editor" className="text-xs">{t("invite_card.role_editor")}</SelectItem>
                  <SelectItem value="admin" className="text-xs">{t("invite_card.role_admin")}</SelectItem>
                </SelectContent>
              </Select>
            </Label>
            <div className="flex items-end">
              <Button type="submit" size="sm" className="h-9 w-full text-xs">{t("invite_card.invite_btn")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
