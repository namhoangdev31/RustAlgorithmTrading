"use client";

import React, { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { docsNavigation } from "@/lib/docs";
import { cn } from "@/lib/utils";
import { TableOfContents } from "@/components/docs/table-of-contents";
import { SearchDialog } from "@/components/docs/search-dialog";
import {
  BookOpen,
  Cpu,
  Layers,
  Database,
  Shield,
  Activity,
  TrendingUp,
  Milestone,
  Menu,
  ChevronRight,
  Search,
  Settings,
  Terminal,
  Compass,
  Rocket,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  "Mandatory Reading": BookOpen,
  "Setup & Installation": Settings,
  "Runtime & Operations": Cpu,
  "Architecture & Interfaces": Layers,
  "APIs & Protocols": Terminal,
  "Observability & Data Plane": Database,
  "Security & Optimization": Shield,
  "Testing & Quality Assurance": Activity,
  "Deployment": Rocket,
  "Machine Learning": Cpu,
  "Strategy & Guides": Compass,
  "Roadmaps & Reports": Milestone,
  "Developer Section": Settings,
  "Research & Case Studies": BookOpen,
};

export default function DocLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Extract slug from pathname (e.g. /en/docs/architecture/SYSTEM_ARCHITECTURE -> architecture/SYSTEM_ARCHITECTURE)
    const match = pathname.match(/\/docs\/(.+)$/);
    if (match && match[1]) {
      setActiveSlug(decodeURIComponent(match[1]));
    }
  }, [pathname]);

  // When activeSlug changes, auto-expand the group containing it
  useEffect(() => {
    if (activeSlug) {
      const activeGroup = docsNavigation.find((group) =>
        group.items.some((item) => item.slug === activeSlug)
      );
      if (activeGroup) {
        setExpandedGroups((prev) => ({
          ...prev,
          [activeGroup.title]: true,
        }));
      }
    }
  }, [activeSlug]);

  // Close sidebar on navigate
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-background/20 backdrop-blur-sm p-6 overflow-y-auto select-none">
      {/* Search Input Trigger */}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex items-center justify-between w-full bg-muted/30 hover:bg-muted/80 border border-border hover:border-border/80 rounded-sm py-2 pl-3 pr-2 text-sm text-muted-foreground hover:text-foreground transition-all mb-6 group cursor-pointer focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <Search className="size-4 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors" />
          <span>Search docs...</span>
        </div>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded-xs border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Navigation Groups */}
      <nav className="space-y-6 flex-1">
        {docsNavigation.map((group) => {
          const Icon = iconMap[group.title] || BookOpen;
          return (
            <div key={group.title} className="space-y-2">
              <button
                onClick={() => toggleGroup(group.title)}
                className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1 hover:text-foreground transition-colors cursor-pointer focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-3.5 text-primary/80" />
                  <span>{group.title}</span>
                </div>
                <ChevronRight
                  className={cn(
                    "size-3.5 transition-transform duration-200",
                    expandedGroups[group.title] ? "rotate-90 text-primary" : "text-muted-foreground/60"
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-200 ease-in-out",
                  expandedGroups[group.title] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 overflow-hidden"
                )}
              >
                <div className="overflow-hidden">
                  <ul className="space-y-1 border-l border-border/40 ml-3.5 pl-3 mt-1 pb-1">
                    {group.items.map((item) => {
                      const isActive = activeSlug === item.slug;
                      return (
                        <li key={item.slug}>
                          <Link
                            href={`/docs/${item.slug}`}
                            className={cn(
                              "group flex items-center justify-between px-3 py-1.5 text-sm rounded-md transition-all relative",
                              isActive
                                ? "text-primary font-medium bg-primary/5 border-l-2 border-primary -ml-[14px] pl-[12px] shadow-[0_0_15px_rgba(62,207,142,0.02)]"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                            )}
                          >
                            <span>{item.title}</span>
                            <ChevronRight
                              className={cn(
                                "size-3 opacity-0 group-hover:opacity-100 transition-all",
                                isActive ? "opacity-100 text-primary" : "text-muted-foreground/60"
                              )}
                            />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="flex min-h-screen text-foreground relative bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px]">

      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[350px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Desktop Sidebar (sticky) */}
      <aside className="hidden md:block w-72 shrink-0 h-[calc(100vh-5rem)] sticky top-20 border-r border-border/40 bg-background/20 backdrop-blur-sm z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (visible on mobile menu click) */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-50 transition-all duration-300",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
        {/* Drawer Content */}
        <div
          className={cn(
            "absolute top-0 bottom-0 left-0 w-80 max-w-[85vw] transition-transform duration-300 transform shadow-2xl z-50 border-r border-border/60 bg-background",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </div>
      </div>

      {/* Mobile Sticky Sub-Header with Hamburger */}
      <div className="md:hidden fixed top-20 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/60 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Menu className="size-5 text-primary" />
          <span>Menu</span>
        </button>
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
          Documentation
        </span>
      </div>

      {/* Content Container */}
      <div className="flex-1 min-w-0 flex gap-10 max-w-6xl mx-auto px-4 py-8 md:px-8 md:py-10">

        {/* Main Document Content */}
        <main className="flex-1 min-w-0 mt-12 md:mt-0 select-text">
          {children}
        </main>

        {/* Right Sidebar - Table of Contents (hidden on desktop under 1024px) */}
        <aside className="hidden lg:block w-60 shrink-0 h-[calc(100vh-8rem)] sticky top-28 overflow-y-auto pr-2">
          <TableOfContents />
        </aside>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
