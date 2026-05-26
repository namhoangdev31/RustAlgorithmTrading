"use client";

import { SearchProvider } from "@/components/dashboard/search-provider";
import { AdminHeader } from "@/components/dashboard/admin-header";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import {
  LayoutPreferencesProvider,
  useLayoutPreferences,
} from "@/components/dashboard/layout-preferences";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type AdminClientShellProps = {
  user: {
    email: string | null;
    fullName: string | null;
    provider: string;
  };
  organizations: {
    id: string;
    name: string;
    type: string;
    projects: {
      id: string;
      name: string;
      bundle: {
        id: string;
        name: string;
        status: string;
      } | null;
    }[];
  }[];
  activeOrganizationId?: string;
  defaultOpen: boolean;
  children: React.ReactNode;
};

export function AdminClientShell({
  user,
  organizations,
  activeOrganizationId,
  defaultOpen,
  children,
}: AdminClientShellProps) {
  return (
    <LayoutPreferencesProvider>
      <SearchProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AdminClientShellContent
            activeOrganizationId={activeOrganizationId}
            organizations={organizations}
            user={user}
          >
            {children}
          </AdminClientShellContent>
        </SidebarProvider>
      </SearchProvider>
    </LayoutPreferencesProvider>
  );
}

function AdminClientShellContent({
  user,
  organizations,
  activeOrganizationId,
  children,
}: Omit<AdminClientShellProps, "defaultOpen">) {
  const { collapsible, variant } = useLayoutPreferences();

  return (
    <>
      <AppSidebar
        activeOrganizationId={activeOrganizationId}
        collapsible={collapsible}
        organizations={organizations}
        user={user}
        variant={variant}
      />
      <SidebarInset
        className={cn(
          "@container/content",
          "has-data-[layout=fixed]:h-svh",
          "peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]"
        )}
      >
        <AdminHeader user={user} />
        <main className="flex flex-1 flex-col gap-6 p-4 pt-6 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
