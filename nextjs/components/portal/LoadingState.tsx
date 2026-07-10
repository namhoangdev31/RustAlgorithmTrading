import * as React from "react";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  className?: string;
  rows?: number;
};

export function LoadingState({ className, rows = 3 }: LoadingStateProps) {
  return (
    <div className={cn("space-y-6 w-full max-w-7xl mx-auto animate-pulse", className)}>
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-1/4 bg-muted rounded-md" />
        <div className="h-4 w-1/3 bg-muted rounded-md" />
      </div>
      
      {/* Cards/Content skeleton */}
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="h-32 border border-hairline bg-secondary/50 rounded-md p-6 space-y-3">
            <div className="h-3.5 w-1/3 bg-muted rounded-md" />
            <div className="h-8 w-1/2 bg-muted rounded-md" />
          </div>
        ))}
      </div>
      
      {/* Table skeleton */}
      <div className="border border-hairline rounded-md p-4 space-y-4">
        <div className="h-6 w-1/6 bg-muted rounded-md" />
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 border-b border-hairline last:border-0">
              <div className="h-4 w-1/4 bg-muted rounded-md" />
              <div className="h-4 w-1/12 bg-muted rounded-md" />
              <div className="h-4 w-1/6 bg-muted rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
