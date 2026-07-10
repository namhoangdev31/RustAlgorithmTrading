import type { ReactNode } from "react";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type PortalBreadcrumb = {
  href?: string;
  label: string;
};

type PageHeaderProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  breadcrumbs?: PortalBreadcrumb[];
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
};

export function PageHeader({
  title,
  description,
  actionHref,
  actionLabel,
  breadcrumbs,
  primaryAction,
  secondaryActions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {breadcrumbs?.length ? (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <BreadcrumbItem key={`${breadcrumb.label}-${index}`}>
                {index > 0 ? <BreadcrumbSeparator /> : null}
                {breadcrumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
        <div className="flex flex-wrap items-center gap-2">
          {secondaryActions}
          {primaryAction ?? (actionHref && actionLabel ? (
            <Button asChild>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : null)}
        </div>
      </div>
    </div>
  );
}
