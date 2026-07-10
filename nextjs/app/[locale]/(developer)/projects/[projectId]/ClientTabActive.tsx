"use client";

import * as React from "react";
import { usePathname, Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type ClientTabActiveProps = {
  href: string;
  children: React.ReactNode;
};

export function ClientTabActive({ href, children }: ClientTabActiveProps) {
  const pathname = usePathname();
  
  // Simple check for paths
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-2 text-xs font-semibold border-b-2 transition-all duration-150 shrink-0 whitespace-nowrap",
        isActive
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-hairline-strong"
      )}
    >
      {children}
    </Link>
  );
}
