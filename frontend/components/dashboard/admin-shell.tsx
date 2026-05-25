import Link from "next/link";
import {
  Bell,
  HelpCircle,
  LayoutDashboard,
  ListTodo,
  MessagesSquare,
  Package,
  Settings,
  Users,
} from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { switchOrganizationAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { WorkspaceContext } from "@/lib/server/workspace";

type AdminShellProps = {
  user: {
    email: string | null;
    fullName: string | null;
    provider: string;
  };
  workspace: WorkspaceContext;
  children: React.ReactNode;
};

const navGroups = [
  {
    title: "General",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
      { title: "Apps", href: "/dashboard/apps", icon: Package },
      { title: "Chats", href: "/dashboard/chats", icon: MessagesSquare },
      { title: "Users", href: "/dashboard/users", icon: Users },
    ],
  },
  {
    title: "Other",
    items: [
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
      { title: "Help Center", href: "/dashboard/help-center", icon: HelpCircle },
    ],
  },
];

export function AdminShell({ user, workspace, children }: AdminShellProps) {
  const displayName = user.fullName || user.email || "Dashboard user";

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-background lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b px-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard data-icon="inline-start" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">Shadcn Admin</p>
            <p className="truncate text-xs text-muted-foreground">SSR workspace</p>
          </div>
        </div>

        <div className="border-b p-3">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-md border bg-card px-3 py-2 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {workspace.activeOrganization?.name ?? "No organization"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {workspace.activeOrganization?.type ?? "workspace"}
                </span>
              </span>
              <Badge variant="outline">{workspace.organizations.length}</Badge>
            </summary>
            <div className="mt-2 flex flex-col gap-2">
              {workspace.organizations.map((organization) => (
                <form action={switchOrganizationAction} key={organization.id}>
                  <input type="hidden" name="organizationId" value={organization.id} />
                  <input type="hidden" name="returnTo" value="/dashboard" />
                  <Button
                    className="w-full justify-start"
                    type="submit"
                    variant={
                      workspace.activeOrganization?.id === organization.id
                        ? "secondary"
                        : "ghost"
                    }
                  >
                    {organization.name}
                  </Button>
                </form>
              ))}
            </div>
          </details>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-3">
          {navGroups.map((group) => (
            <div className="flex flex-col gap-2" key={group.title}>
              <p className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {group.title}
              </p>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <Button
                    asChild
                    className="justify-start"
                    key={item.href}
                    variant="ghost"
                  >
                    <Link href={item.href}>
                      <item.icon data-icon="inline-start" />
                      {item.title}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-md bg-muted/60 p-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-background font-semibold">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{user.provider}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground lg:hidden">
                <LayoutDashboard data-icon="inline-start" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {workspace.activeOrganization?.name ?? "Dashboard"}
                </p>
                <h1 className="text-lg font-semibold">{displayName}</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <form action="/dashboard" className="flex min-w-56 flex-1 gap-2" method="get">
                <input
                  aria-label="Search dashboard"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  name="q"
                  placeholder="Search projects..."
                  type="search"
                />
                <Button type="submit" variant="outline">Search</Button>
              </form>
              <Button asChild size="icon" variant="ghost">
                <Link href="/dashboard/settings/notifications" aria-label="Notifications">
                  <Bell data-icon="inline-start" />
                </Link>
              </Button>
              <form action={logoutAction}>
                <Button type="submit" variant="outline">Sign out</Button>
              </form>
            </div>
          </div>
          <Separator />
          <nav className="flex gap-1 overflow-x-auto px-4 py-2 lg:hidden">
            {navGroups.flatMap((group) =>
              group.items.map((item) => (
                <Button asChild key={item.href} size="sm" variant="ghost">
                  <Link href={item.href}>{item.title}</Link>
                </Button>
              ))
            )}
          </nav>
        </header>
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}

