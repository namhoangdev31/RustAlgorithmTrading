"use client";

import * as React from "react";
import {
  AudioWaveform,
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  Command,
  GalleryVerticalEnd,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Monitor,
  Palette,
  Settings,
  UserCog,
  Wrench,
  CreditCard,
  Plus,
  type LucideIcon,
  FolderGit,
  Sparkles,
} from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

import { logoutAction } from "@/app/actions/auth";
import { switchOrganizationAction } from "@/app/actions/admin";
import { Link } from "@/i18n/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";

function useStablePathname() {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? pathname : "";
}

type AppSidebarProps = {
  user: {
    email: string | null;
    fullName: string | null;
    provider: string;
    photoUrl: string | null;
  };
  organizations: {
    id: string;
    name: string;
    type: string;
    projects: unknown[];
  }[];
  activeOrganizationId?: string;
  variant?: "inset" | "floating" | "sidebar";
  collapsible?: "icon" | "offcanvas";
};

type NavSubItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
};

type NavItem = {
  title: string;
  url?: string;
  icon: LucideIcon;
  badge?: string;
  items?: NavSubItem[];
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

export function AppSidebar({
  user,
  organizations,
  activeOrganizationId,
  collapsible = "icon",
  variant = "sidebar",
}: AppSidebarProps) {
  const t = useTranslations("Dashboard.shell");

  const navGroups: NavGroup[] = [
    {
      title: t("nav.general"),
      items: [
        { title: t("nav.dashboard"), url: "/dashboard", icon: LayoutDashboard },
        { title: t("nav.projects"), url: "/projects", icon: FolderGit },
      ],
    },
    {
      title: t("nav.other"),
      items: [
        {
          title: t("nav.settings"),
          icon: Settings,
          items: [
            { title: t("nav.profile"), url: "/dashboard/settings", icon: UserCog },
            { title: t("nav.account"), url: "/dashboard/settings/account", icon: Wrench },
            { title: t("nav.appearance"), url: "/dashboard/settings/appearance", icon: Palette },
            { title: t("nav.notifications"), url: "/dashboard/settings/notifications", icon: Bell },
            { title: t("nav.display"), url: "/dashboard/settings/display", icon: Monitor },
          ],
        },
        { title: t("nav.help_center"), url: "/dashboard/help-center", icon: HelpCircle },
      ],
    },
  ];

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher
          activeOrganizationId={activeOrganizationId}
          organizations={organizations}
        />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <NavGroup group={group} key={group.title} />
        ))}
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
}: Pick<AppSidebarProps, "organizations" | "activeOrganizationId">) {
  const { isMobile } = useSidebar();
  const t = useTranslations("Dashboard.shell");
  const pathname = useStablePathname(); // Avoid SSR/client pathname drift during hydration.
  const teamIcons = [Command, GalleryVerticalEnd, AudioWaveform];
  const activeOrganization =
    organizations.find((organization) => organization.id === activeOrganizationId) ??
    organizations[0];
  const ActiveIcon =
    teamIcons[
    Math.max(
      0,
      organizations.findIndex(
        (organization) => organization.id === activeOrganization?.id
      )
    ) % teamIcons.length
    ];

  const logoImg = '/logo_nonbg.png';

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
              {t("teams.label")}
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
                    <button className="flex w-full items-center gap-2" type="submit">
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        {(() => {
                          const TeamIcon = teamIcons[index % teamIcons.length];
                          return <TeamIcon data-icon="inline-start" />;
                        })()}
                      </div>
                      <span className="flex-1 text-start">{organization.name}</span>
                      <span className="text-xs text-muted-foreground">⌘{index + 1}</span>
                    </button>
                  </form>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus data-icon="inline-start" />
              </div>
              <div className="font-medium text-muted-foreground">{t("teams.add_team")}</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function NavGroup({
  group,
}: {
  group: NavGroup;
}) {
  const pathname = useStablePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
      <SidebarMenu>
        {group.items.map((item) => {
          const Icon = item.icon;
          const isActive = Boolean(item.url && pathname === item.url);

          if (item.items?.length) {
            const hasActiveChild = item.items.some(
              (subItem) => pathname === subItem.url.split("?")[0]
            );

            return (
              <Collapsible
                asChild
                className="group/collapsible"
                defaultOpen={hasActiveChild}
                key={item.title}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      <Icon data-icon="inline-start" />
                      <span>{item.title}</span>
                      <ChevronsUpDown className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => {
                        const SubIcon = subItem.icon;

                        return (
                          <SidebarMenuSubItem key={subItem.url}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url.split("?")[0]}
                            >
                              <Link href={subItem.url}>
                                {SubIcon ? <SubIcon data-icon="inline-start" /> : null}
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          if (!item.url) {
            return null;
          }

          return (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                <Link href={item.url}>
                  <Icon data-icon="inline-start" />
                  <span>{item.title}</span>
                  {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavUser({ user }: Pick<AppSidebarProps, "user">) {
  const { isMobile } = useSidebar();
  const t = useTranslations("Dashboard.shell");
  const displayName = user.fullName ?? user.email ?? "satnaing";
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
                <Sparkles data-icon="inline-start" />
                {t("user_menu.upgrade")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings/account">
                  <BadgeCheck data-icon="inline-start" />
                  {t("user_menu.account")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <CreditCard data-icon="inline-start" />
                  {t("user_menu.billing")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings/notifications">
                  <Bell data-icon="inline-start" />
                  {t("user_menu.notifications")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={logoutAction}>
                <button className="flex w-full items-center gap-2 text-destructive" type="submit">
                  <LogOut data-icon="inline-start" />
                  {t("user_menu.sign_out")}
                  <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
