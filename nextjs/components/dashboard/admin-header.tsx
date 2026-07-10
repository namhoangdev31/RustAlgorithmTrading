"use client";

import { ProfileDropdown } from "@/components/dashboard/profile-dropdown";
import { Search } from "@/components/dashboard/search";
import { ThemeSwitch } from "@/components/dashboard/theme-switch";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

type AdminHeaderProps = {
  user: {
    email: string | null;
    fullName: string | null;
    provider: string;
    photoUrl: string | null;
  };
};

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
      <SidebarTrigger className="-ms-1" />
      <Separator className="me-2 h-4" orientation="vertical" />
      <span className="hidden text-sm font-medium text-foreground sm:inline">Developer Portal</span>

      <div className="ms-auto flex items-center gap-2">
        <Search className="h-9 w-9 justify-start px-0 sm:w-40 sm:px-3 lg:w-64" />
        <ThemeSwitch />
        {/* <ConfigDrawer /> */}
        <ProfileDropdown user={user} />
      </div>
    </header>
  );
}
