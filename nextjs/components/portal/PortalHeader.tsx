"use client";

import * as React from "react";
import { usePathname } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { resolveBreadcrumbs } from "@/lib/portal/breadcrumbs";
import { ProfileDropdown } from "@/components/dashboard/profile-dropdown";
import { Search } from "@/components/dashboard/search";
import { ThemeSwitch } from "@/components/dashboard/theme-switch";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Link } from "@/i18n/navigation";

type PortalHeaderProps = {
  user: {
    email: string | null;
    fullName: string | null;
    provider: string;
    photoUrl: string | null;
  };
};

export function PortalHeader({ user }: PortalHeaderProps) {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const projectId = params?.projectId as string;

  const breadcrumbs = resolveBreadcrumbs(pathname, { locale, projectId });

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
      <SidebarTrigger className="-ms-1" />
      <Separator className="me-2 h-4" orientation="vertical" />

      {/* Dynamic Breadcrumbs */}
      <Breadcrumb className="hidden md:inline-block">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.path}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="font-medium text-foreground">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.path}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <span className="md:hidden text-sm font-semibold text-foreground">
        {breadcrumbs[breadcrumbs.length - 1]?.label || "Portal"}
      </span>

      <div className="ms-auto flex items-center gap-2">
        <Search className="h-9 w-9 justify-start px-0 sm:w-40 sm:px-3 lg:w-64" />
        <ThemeSwitch />
        <ProfileDropdown user={user} />
      </div>
    </header>
  );
}
