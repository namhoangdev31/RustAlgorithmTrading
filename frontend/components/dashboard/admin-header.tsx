"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { ConfigDrawer } from "@/components/dashboard/config-drawer";
import { ProfileDropdown } from "@/components/dashboard/profile-dropdown";
import { Search } from "@/components/dashboard/search";
import { ThemeSwitch } from "@/components/dashboard/theme-switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type AdminHeaderProps = {
  user: {
    email: string | null;
    fullName: string | null;
    provider: string;
  };
};

export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();
  const t = useTranslations("Dashboard.shell");

  const topNav = [
    { title: t("header.overview"), href: "/dashboard" },
    { title: t("header.customers"), href: "/dashboard/users" },
    { title: t("header.products"), href: "/dashboard/apps" },
    { title: t("header.settings"), href: "/dashboard/settings" },
  ];

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ms-1" />
      <Separator className="me-2 h-4" orientation="vertical" />

      <nav className="hidden items-center gap-1 md:flex">
        {topNav.map((item) => (
          <Button
            asChild
            className={cn(
              "text-muted-foreground",
              pathname === item.href && "bg-muted text-foreground"
            )}
            key={item.href}
            size="sm"
            variant="ghost"
          >
            <Link href={item.href}>{item.title}</Link>
          </Button>
        ))}
      </nav>

      <div className="ms-auto flex items-center gap-2">
        <Search className="h-9 w-9 justify-start px-0 sm:w-40 sm:px-3 lg:w-64" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown user={user} />
      </div>
    </header>
  );
}
