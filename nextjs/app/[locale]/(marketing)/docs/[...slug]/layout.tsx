"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsNavigation } from "@/lib/docs";
import { cn } from "@/lib/utils";
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
  X,
  ChevronRight,
  Search,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  "Mandatory Reading": BookOpen,
  "Runtime & Operations": Cpu,
  "Architecture & Interfaces": Layers,
  "Observability & Data Plane": Database,
  "Security & Optimization": Shield,
  Testing: Activity,
  "ML & Strategies": TrendingUp,
  "Roadmap & Reports": Milestone,
};

export default function DocLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSlug, setActiveSlug] = useState("");

  useEffect(() => {
    // Extract slug from pathname (e.g. /en/docs/architecture/SYSTEM_ARCHITECTURE -> architecture/SYSTEM_ARCHITECTURE)
    const match = pathname.match(/\/docs\/(.+)$/);
    if (match && match[1]) {
      setActiveSlug(decodeURIComponent(match[1]));
    }
  }, [pathname]);

  // Close sidebar on navigate
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Filter navigation items based on search query
  const filteredNav = docsNavigation.map((group) => {
    const matchedItems = group.items.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      ...group,
      items: matchedItems,
    };
  }).filter((group) => group.items.length > 0);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-zinc-950/80 backdrop-blur-md border-r border-zinc-800/60 p-6 overflow-y-auto">
      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-2.5 size-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search docs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/60 border border-zinc-800 rounded-md py-2 pl-9 pr-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-primary/50 transition-all focus:ring-1 focus:ring-primary/20"
        />
      </div>

      {/* Navigation Groups */}
      <nav className="space-y-6 flex-1">
        {filteredNav.map((group) => {
          const Icon = iconMap[group.title] || BookOpen;
          return (
            <div key={group.title} className="space-y-2">
              <h4 className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider px-2">
                <Icon className="size-3.5 text-primary/80" />
                <span>{group.title}</span>
              </h4>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeSlug === item.slug;
                  const itemPath = pathname.startsWith("/vi")
                    ? `/vi/docs/${item.slug}`
                    : `/en/docs/${item.slug}`;

                  return (
                    <li key={item.slug}>
                      <Link
                        href={itemPath}
                        className={cn(
                          "group flex items-center justify-between px-3 py-2 text-sm rounded-md transition-all",
                          isActive
                            ? "bg-primary/10 text-primary font-medium border-l-2 border-primary pl-2.5 shadow-[0_0_15px_rgba(52,211,153,0.05)]"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
                        )}
                      >
                        <span>{item.title}</span>
                        <ChevronRight
                          className={cn(
                            "size-3 opacity-0 group-hover:opacity-100 transition-all",
                            isActive ? "opacity-100 text-primary" : "text-zinc-600"
                          )}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 pt-20">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:block w-72 shrink-0 h-[calc(100vh-5rem)] sticky top-20">
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
            "absolute top-0 bottom-0 left-0 w-80 max-w-[85vw] transition-transform duration-300 transform shadow-2xl",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </div>
      </div>

      {/* Mobile Sticky Sub-Header with Hamburger */}
      <div className="md:hidden fixed top-20 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"
        >
          <Menu className="size-5 text-primary" />
          <span>Menu</span>
        </button>
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
          Documentation
        </span>
      </div>

      {/* Main Document Content */}
      <main className="flex-1 min-w-0 px-4 py-8 md:px-12 md:py-12 max-w-4xl mx-auto mt-12 md:mt-0">
        {children}
      </main>
    </div>
  );
}
