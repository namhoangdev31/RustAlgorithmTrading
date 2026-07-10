import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, Info, RefreshCw } from "lucide-react";

export type StatusType =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "pending"
  | "active"
  | "inactive";

type StatusBadgeProps = {
  status: StatusType | string;
  label?: string;
  className?: string;
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const normStatus = status.toLowerCase() as StatusType;
  let bgClass = "bg-secondary text-foreground border-hairline";
  let icon = <Info className="size-3.5" />;

  switch (normStatus) {
    case "success":
    case "active":
      bgClass = "bg-green-500/10 text-green-500 border-green-500/20";
      icon = <CheckCircle2 className="size-3.5" />;
      break;
    case "warning":
      bgClass = "bg-warning-soft text-warning-deep border-warning-deep/20";
      icon = <AlertTriangle className="size-3.5" />;
      break;
    case "error":
    case "inactive":
      bgClass = "bg-red-500/10 text-red-600 border-red-500/20";
      icon = <XCircle className="size-3.5" />;
      break;
    case "pending":
      bgClass = "bg-amber-500/10 text-amber-600 border-amber-500/20";
      icon = <RefreshCw className="size-3.5 animate-spin" />;
      break;
    case "info":
      bgClass = "bg-blue-500/10 text-blue-600 border-blue-500/20";
      icon = <Info className="size-3.5" />;
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        bgClass,
        className
      )}
    >
      {icon}
      <span>{label || status}</span>
    </span>
  );
}
