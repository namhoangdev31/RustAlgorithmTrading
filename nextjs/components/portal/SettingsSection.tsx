import * as React from "react";
import { cn } from "@/lib/utils";

type SettingsSectionProps = {
  title: string;
  description?: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function SettingsSection({
  title,
  description,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-3 border-b pb-8 border-hairline last:border-0 last:pb-0", className)}>
      <div className="space-y-1">
        <h2 className="text-heading-md font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="md:col-span-2 border border-hairline rounded-md bg-card p-6 shadow-light">
        {children}
      </div>
    </div>
  );
}
