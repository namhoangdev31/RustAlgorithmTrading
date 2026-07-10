"use client";

import * as React from "react";
import { SearchProvider } from "@/components/dashboard/search-provider";
import { PortalHeader } from "./PortalHeader";
import { PortalSidebar } from "./PortalSidebar";
import {
  LayoutPreferencesProvider,
  useLayoutPreferences,
} from "@/components/dashboard/layout-preferences";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type PortalShellProps = {
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
  defaultOpen: boolean;
  children: React.ReactNode;
};

export function PortalShell({
  user,
  organizations,
  activeOrganizationId,
  defaultOpen,
  children,
}: PortalShellProps) {
  return (
    <LayoutPreferencesProvider>
      <SearchProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <PortalShellContent
            activeOrganizationId={activeOrganizationId}
            organizations={organizations}
            user={user}
          >
            {children}
          </PortalShellContent>
        </SidebarProvider>
      </SearchProvider>
    </LayoutPreferencesProvider>
  );
}

function PortalShellContent({
  user,
  organizations,
  activeOrganizationId,
  children,
}: Omit<PortalShellProps, "defaultOpen">) {
  const { collapsible, variant } = useLayoutPreferences();

  return (
    <>
      <PortalSidebar
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
        <PortalHeader user={user} />
        <main className="flex flex-1 flex-col gap-6 p-4 pt-6 lg:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
