import * as React from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string | React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5 border-hairline",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-heading-lg font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <div className="text-body-md text-muted-foreground leading-normal">{description}</div>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
