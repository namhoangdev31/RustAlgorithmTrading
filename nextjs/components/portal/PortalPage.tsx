import * as React from "react";
import { PageHeader } from "./PageHeader";
import { cn } from "@/lib/utils";

type PortalPageProps = {
  title?: string;
  description?: string | React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function PortalPage({
  title,
  description,
  actions,
  loading,
  className,
  children,
}: PortalPageProps) {
  return (
    <div className={cn("space-y-6 w-full max-w-7xl mx-auto", className)}>
      {title && (
        <PageHeader
          title={title}
          description={description}
          actions={actions}
        />
      )}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-10 w-1/3 bg-muted rounded-md" />
          <div className="h-40 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
