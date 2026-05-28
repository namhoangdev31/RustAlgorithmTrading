"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  Info,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

// --- CALLOUT COMPONENT ---
interface CalloutProps {
  type?: "info" | "warning" | "danger" | "success";
  children: React.ReactNode;
  title?: string;
}

const calloutConfigs = {
  info: {
    icon: Info,
    styles: "border-accent-indigo/20 bg-accent-indigo/5 text-accent-indigo dark:text-accent-indigo/90",
    iconColor: "text-accent-indigo",
    glow: "shadow-[0_0_20px_rgba(5,76,255,0.02)]",
  },
  warning: {
    icon: AlertTriangle,
    styles: "border-accent-yellow/20 bg-accent-yellow/5 text-accent-yellow dark:text-accent-yellow/90",
    iconColor: "text-accent-yellow",
    glow: "shadow-[0_0_20px_rgba(255,219,19,0.02)]",
  },
  danger: {
    icon: AlertOctagon,
    styles: "border-destructive/20 bg-destructive/5 text-destructive dark:text-destructive/90",
    iconColor: "text-destructive",
    glow: "shadow-[0_0_20px_rgba(255,34,1,0.02)]",
  },
  success: {
    icon: CheckCircle2,
    styles: "border-primary/20 bg-primary/5 text-primary dark:text-primary/90",
    iconColor: "text-primary",
    glow: "shadow-[0_0_20px_rgba(62,207,142,0.02)]",
  },
};

export function Callout({ type = "info", children, title }: CalloutProps) {
  const config = calloutConfigs[type] || calloutConfigs.info;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "my-6 flex items-start gap-4 rounded-md border p-4 backdrop-blur-sm transition-all duration-300",
        config.styles,
        config.glow
      )}
    >
      <div className={cn("mt-0.5 p-1 rounded-sm bg-muted border border-border", config.iconColor)}>
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-bold text-foreground mb-1">{title}</h5>}
        <div className="text-sm leading-relaxed prose prose-zinc dark:prose-invert max-w-none text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- STEPS COMPONENT ---
interface StepsProps {
  children: React.ReactNode;
}

export function Steps({ children }: StepsProps) {
  return (
    <div className="steps-container my-10 pl-6 border-l border-border relative space-y-8">
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        // Treat H3 elements or other headings as step headings
        const isHeading = ["h3", "h4"].includes(typeof child.type === "string" ? child.type : "");

        return (
          <div key={index} className={cn("relative step-item", isHeading ? "mt-0" : "")}>
            <span className="absolute -left-[35px] top-0 flex items-center justify-center size-5 rounded-full bg-muted border border-border text-[10px] font-bold text-muted-foreground shadow-inner">
              {index + 1}
            </span>
            {child}
          </div>
        );
      })}
    </div>
  );
}

// --- CARD & CARD GROUP COMPONENTS ---
interface CardProps {
  title: string;
  description: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function Card({ title, description, href, icon: Icon }: CardProps) {
  const isExternal = href.startsWith("http");
  const LinkComponent = isExternal ? "a" : Link;
  const linkProps = isExternal
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : { href };

  return (
    <LinkComponent
      {...(linkProps as any)}
      className="group block rounded-lg border border-border bg-card/40 p-5 hover:border-border/80 hover:bg-muted/30 transition-all duration-300 shadow-sm hover:shadow-md"
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          {Icon && (
            <div className="inline-flex p-2 rounded-sm bg-muted border border-border text-primary mb-4 group-hover:scale-105 transition-transform duration-300">
              <Icon className="size-4" />
            </div>
          )}
          <h4 className="font-bold text-foreground text-base mb-1.5 flex items-center gap-1.5 group-hover:text-primary transition-colors">
            {title}
            <ArrowRight className="size-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </h4>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </LinkComponent>
  );
}

interface CardGroupProps {
  cols?: 1 | 2 | 3;
  children: React.ReactNode;
}

export function CardGroup({ cols = 2, children }: CardGroupProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <div className={cn("grid gap-4 my-6", gridCols[cols])}>
      {children}
    </div>
  );
}
