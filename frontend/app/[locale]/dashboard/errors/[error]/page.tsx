import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  params: Promise<{
    error: string;
  }>;
};

const VALID_ERRORS = [
  "unauthorized",
  "forbidden",
  "not-found",
  "internal-server-error",
  "maintenance-error",
];

export default async function DashboardErrorPage({ params }: ErrorPageProps) {
  const { error } = await params;
  const errorKey = VALID_ERRORS.includes(error) ? error : "internal-server-error";
  const t = await getTranslations("Errors");

  const code = t(`${errorKey}.code`);
  const title = t(`${errorKey}.title`);
  const description = t.rich(`${errorKey}.description`, {
    br: () => <br />,
  });

  const actions = errorKey === "maintenance-error" ? "maintenance" : "home";

  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] font-bold leading-tight">{code}</h1>
        <span className="font-medium">{title}</span>
        <p className="text-center text-muted-foreground">{description}</p>
        <div className="mt-6 flex gap-4">
          {actions === "maintenance" ? (
            <Button asChild variant="outline">
              <Link href="/dashboard/help-center">{t("actions.learn_more")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link href="/dashboard">{t("actions.go_back")}</Link>
              </Button>
              <Button asChild>
                <Link href="/">{t("actions.back_to_home")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
