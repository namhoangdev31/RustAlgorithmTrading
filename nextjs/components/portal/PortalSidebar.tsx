"use client";

import * as React from "react";
import { usePathname, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ChevronsUpDown,
  Plus,
  LogOut,
  Sparkles,
  BadgeCheck,
  CreditCard,
  Bell,
  Compass
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { switchOrganizationAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import {
  getWorkspaceNav,
  getProjectNav,
  getLepoShipNav,
  getMarketplaceNav,
  getSettingsNav,
  NavItem
} from "@/lib/portal/navigation-registry";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type PortalSidebarProps = {
  user: {
    email: string | null;
    fullName: string | null;
    provider: string;
    photoUrl: string | null;
    userType?: string;
  };
  organizations: {
    id: string;
    name: string;
    type: string;
    projects: any[];
  }[];
  activeOrganizationId?: string;
  collapsible?: "icon" | "offcanvas";
  variant?: "inset" | "floating" | "sidebar";
};

export function PortalSidebar({
  user,
  organizations,
  activeOrganizationId,
  collapsible = "icon",
  variant = "sidebar",
}: PortalSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const t = useTranslations("Dashboard.shell");
  const locale = (params?.locale as string) || "en";
  const projectId = params?.projectId as string;

  // Determine current active navigation context
  let navItems: NavItem[] = [];
  let groupTitle = "Workspace";

  if (pathname.includes("/lepoship/") && projectId) {
    navItems = getLepoShipNav(locale, projectId);
    groupTitle = `LepoShip: ${projectId.slice(0, 8)}`;
  } else if (pathname.includes("/projects/") && projectId) {
    navItems = getProjectNav(locale, projectId);
    groupTitle = `Project: ${projectId.slice(0, 8)}`;
  } else if (pathname.includes("/settings/")) {
    navItems = getSettingsNav(locale);
    groupTitle = "Settings";
  } else if (pathname.includes("/marketplace")) {
    navItems = getMarketplaceNav(locale);
    groupTitle = "Marketplace";
  } else {
    navItems = getWorkspaceNav(locale);
    groupTitle = "Workspace";
  }

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher
          activeOrganizationId={activeOrganizationId}
          organizations={organizations}
        />
      </SidebarHeader>
      
      <SidebarContent>
        {/* Context Switching Banner if in Project or LepoShip scope */}
        {projectId && (
          <div className="px-3 py-2">
            <Link
              href="/projects"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Compass className="size-3.5" />
              <span>Back to Projects</span>
            </Link>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-wider uppercase font-mono">{groupTitle}</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
              
              if (item.requiredRole === "admin" && user.userType !== "admin") {
                return null;
              }

              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                    <Link href={item.path}>
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function TeamSwitcher({
  organizations,
  activeOrganizationId,
}: Pick<PortalSidebarProps, "organizations" | "activeOrganizationId">) {
  const { isMobile } = useSidebar();
  const t = useTranslations("Dashboard.shell");
  const pathname = usePathname();
  const activeOrganization =
    organizations.find((organization) => organization.id === activeOrganizationId) ??
    organizations[0];

  const logoImg = "/logo_nonbg.png";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Image
                  src={logoImg}
                  alt="Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeOrganization?.name ?? t("brand_name")}
                </span>
                <span className="truncate text-xs">
                  {activeOrganization?.type ?? t("brand_subtitle")}
                </span>
              </div>
              <ChevronsUpDown className="ms-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {organizations.map((organization, index) => (
                <DropdownMenuItem asChild className="gap-2 p-2" key={organization.id}>
                  <form action={switchOrganizationAction}>
                    <input
                      type="hidden"
                      name="organizationId"
                      value={organization.id}
                    />
                    <input type="hidden" name="returnTo" value={pathname} />
                    <Button className="flex h-auto w-full items-center gap-2 p-0" variant="ghost" type="submit">
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <Compass className="size-3.5" />
                      </div>
                      <span className="flex-1 text-start">{organization.name}</span>
                      <span className="text-xs text-muted-foreground">⌘{index + 1}</span>
                    </Button>
                  </form>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-3.5" />
              </div>
              <div className="font-medium text-muted-foreground">Create Workspace</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function NavUser({ user }: Pick<PortalSidebarProps, "user">) {
  const { isMobile } = useSidebar();
  const t = useTranslations("Dashboard.shell");
  const displayName = user.fullName ?? user.email ?? "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ms-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles className="size-4 mr-2" />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/settings/workspace">
                  <BadgeCheck className="size-4 mr-2" />
                  Workspace Info
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/profile">
                  <CreditCard className="size-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/notifications">
                  <Bell className="size-4 mr-2" />
                  Notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={logoutAction}>
                <Button className="flex h-auto w-full items-center gap-2 p-0 text-destructive hover:text-destructive" variant="ghost" type="submit">
                  <LogOut className="size-4" />
                  Sign Out
                  <DropdownMenuShortcut>Status</DropdownMenuShortcut>
                </Button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
