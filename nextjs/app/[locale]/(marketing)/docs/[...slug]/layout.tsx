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
  const [searchOpen, setSearchOpen] = useState(false);
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

  const sidebarContent = (
    <div className="flex flex-col h-full bg-zinc-950/20 backdrop-blur-sm p-6 overflow-y-auto">
      {/* Search Input Trigger */}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex items-center justify-between w-full bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 rounded-lg py-2 pl-3 pr-2 text-sm text-zinc-400 hover:text-zinc-300 transition-all mb-6 group cursor-pointer focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <Search className="size-4 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
          <span>Search docs...</span>
        </div>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-zinc-850 bg-zinc-900 px-1.5 font-mono text-[10px] font-medium text-zinc-500 group-hover:text-zinc-400 transition-colors">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Navigation Groups */}
      <nav className="space-y-6 flex-1">
        {docsNavigation.map((group) => {
          const Icon = iconMap[group.title] || BookOpen;
          return (
            <div key={group.title} className="space-y-2">
              <h4 className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider px-2">
                <Icon className="size-3.5 text-primary/80" />
                <span>{group.title}</span>
              </h4>
              <ul className="space-y-1 border-l border-zinc-900/60 ml-3.5 pl-3">
                {group.items.map((item) => {
                  const isActive = activeSlug === item.slug;
                  return (
                    <li key={item.slug}>
                      <Link
                        href={`/docs/${item.slug}`}
                        className={cn(
                          "group flex items-center justify-between px-3 py-1.5 text-sm rounded-md transition-all relative",
                          isActive
                            ? "text-primary font-medium bg-primary/5 border-l-2 border-primary -ml-[14px] pl-[12px] shadow-[0_0_15px_rgba(52,211,153,0.02)]"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
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
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 pt-20 relative bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px]">
      
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[350px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Desktop Sidebar (sticky) */}
      <aside className="hidden md:block w-72 shrink-0 h-[calc(100vh-5rem)] sticky top-20 border-r border-zinc-800/40 bg-zinc-950/20 backdrop-blur-sm z-30">
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
            "absolute top-0 bottom-0 left-0 w-80 max-w-[85vw] transition-transform duration-300 transform shadow-2xl z-50 border-r border-zinc-800/60 bg-zinc-950",
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
