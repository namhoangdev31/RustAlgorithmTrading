import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function PageHeader({
  title,
  description,
  actionHref,
  actionLabel,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actionHref && actionLabel ? (
        <Button asChild>
          <a href={actionHref}>{actionLabel}</a>
        </Button>
      ) : null}
    </div>
  );
}

