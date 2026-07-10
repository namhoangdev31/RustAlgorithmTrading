import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

type ErrorStateProps = {
  title?: string;
  error?: Error | string;
  reset?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  error,
  reset,
  className,
}: ErrorStateProps) {
  const errMsg = error instanceof Error ? error.message : error || "An unexpected error occurred.";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 border border-red-500/20 rounded-md bg-red-500/5 min-h-[300px]",
        className
      )}
    >
      <div className="flex items-center justify-center size-12 rounded-full bg-red-500/10 text-red-600 mb-4 border border-red-500/20">
        <AlertCircle className="size-6" />
      </div>
      <h3 className="text-heading-md font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-xs text-red-600 dark:text-red-400 max-w-md font-mono p-3 bg-red-500/10 border border-red-500/20 rounded-md select-text text-start break-all">
        {errMsg}
      </p>
      {reset && (
        <Button onClick={reset} className="mt-5" size="sm" variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
}
