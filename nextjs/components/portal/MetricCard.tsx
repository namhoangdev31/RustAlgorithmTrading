import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  title: string;
  value: string | number;
  trend?: number; // percentage
  trendLabel?: string;
  className?: string;
  icon?: LucideIcon;
};

export function MetricCard({
  title,
  value,
  trend,
  trendLabel,
  className,
  icon: Icon,
}: MetricCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div
      className={cn(
        "rounded-md border border-hairline bg-card p-6 transition-all duration-200 hover:shadow-whisper",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground font-medium">{title}</p>
        {Icon ? <Icon className="size-4 text-muted-foreground" aria-hidden="true" /> : null}
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <h3 className="text-heading-lg font-bold tracking-tight text-foreground">
          {value}
        </h3>
        {trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-md border",
              isPositive
                ? "bg-green-500/10 text-green-500 border-green-500/20"
                : "bg-red-500/10 text-red-500 border-red-500/20"
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="size-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="size-3 mr-0.5" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {trendLabel && (
        <p className="mt-1 text-xs text-muted-foreground">{trendLabel}</p>
      )}
    </div>
  );
}
