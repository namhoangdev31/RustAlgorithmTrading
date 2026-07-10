import * as React from "react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

type UnavailableStateProps = {
  title: string;
  description: string;
  providerName: string;
  setupUrl?: string;
  className?: string;
};

export function UnavailableState({
  title,
  description,
  providerName,
  setupUrl,
  className,
}: UnavailableStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 border border-hairline rounded-md bg-secondary/50 min-h-[300px]",
        className
      )}
    >
      <div className="flex items-center justify-center size-12 rounded-full bg-amber-500/10 text-amber-600 mb-4 border border-amber-500/20">
        <ShieldAlert className="size-6" />
      </div>
      <h3 className="text-heading-md font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-body-sm text-muted-foreground max-w-md leading-relaxed">
        {description}
      </p>
      <div className="mt-4 p-4 border border-amber-500/10 rounded-md bg-amber-500/5 text-start text-xs text-amber-800 dark:text-amber-300 max-w-md">
        <strong>Required Connection:</strong> This feature requires a valid{" "}
        {providerName} integration connection. Please configure credentials under workspace settings to proceed.
      </div>
      {setupUrl && (
        <Button asChild className="mt-5" size="sm" variant="outline">
          <Link href={setupUrl}>Configure Credentials</Link>
        </Button>
      )}
    </div>
  );
}
