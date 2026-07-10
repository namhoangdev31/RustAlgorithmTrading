import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  icon?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 border border-dashed border-hairline rounded-md bg-canvas/30 min-h-[300px]",
        className
      )}
    >
      <div className="flex items-center justify-center size-12 rounded-full bg-secondary text-muted-foreground mb-4">
        {icon || <FolderOpen className="size-6" />}
      </div>
      <h3 className="text-heading-md font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-body-sm text-muted-foreground max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <Button asChild className="mt-4" size="sm"><Link href={actionHref}>{actionLabel}</Link></Button>
      ) : actionLabel && onAction ? (
        <Button onClick={onAction} className="mt-4" size="sm">{actionLabel}</Button>
      ) : null}
    </div>
  );
}
