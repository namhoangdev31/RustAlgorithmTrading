"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Helper to slugify text
    const slugify = (text: string) => {
      return text
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove Vietnamese diacritics
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
    };

    // Query headings inside the article
    const updateHeadings = () => {
      const headingElements = document.querySelectorAll("article h2, article h3");
      const items: TocItem[] = [];

      headingElements.forEach((el) => {
        const text = el.textContent || "";
        if (!el.id) {
          el.id = slugify(text);
        }
        items.push({
          id: el.id,
          text,
          level: el.tagName === "H2" ? 2 : 3,
        });
      });

      setHeadings(items);
    };

    // Run initial update
    updateHeadings();

    // Re-run if DOM changes (e.g. MDX content loads asynchronously)
    const observer = new MutationObserver(updateHeadings);
    const article = document.querySelector("article");
    if (article) {
      observer.observe(article, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -60% 0px", threshold: 0.1 }
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90; // account for fixed header
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveId(id);
      window.history.pushState(null, "", `#${id}`);
    }
  };

  if (headings.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        <List className="size-3 text-primary" />
        <span>On this page</span>
      </div>
      <ul className="relative border-l border-zinc-800/60 pl-4 space-y-2.5 text-sm">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <li
              key={heading.id}
              className={cn(
                "transition-all duration-200",
                heading.level === 3 ? "pl-4" : ""
              )}
            >
              <a
                href={`#${heading.id}`}
                onClick={(e) => handleClick(e, heading.id)}
                className={cn(
                  "block hover:text-zinc-200 transition-colors relative py-0.5",
                  isActive
                    ? "text-primary font-medium pl-1"
                    : "text-zinc-500 font-normal"
                )}
              >
                {isActive && (
                  <span className="absolute -left-[17px] top-[9px] size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                )}
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
