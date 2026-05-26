import Link from "next/link";

import { Button } from "@/components/ui/button";

const messages: Record<
  string,
  {
    code: string;
    title: string;
    description: React.ReactNode;
    actions: "home" | "maintenance";
  }
> = {
  unauthorized: {
    code: "401",
    title: "Unauthorized Access",
    description: (
      <>
        Please log in with the appropriate credentials <br /> to access this
        resource.
      </>
    ),
    actions: "home",
  },
  forbidden: {
    code: "403",
    title: "Access Forbidden",
    description: (
      <>
        You don&apos;t have necessary permission <br />
        to view this resource.
      </>
    ),
    actions: "home",
  },
  "not-found": {
    code: "404",
    title: "Oops! Page Not Found!",
    description: (
      <>
        It seems like the page you&apos;re looking for <br />
        does not exist or might have been removed.
      </>
    ),
    actions: "home",
  },
  "internal-server-error": {
    code: "500",
    title: "Oops! Something went wrong {`:')`}",
    description: (
      <>
        We apologize for the inconvenience. <br /> Please try again later.
      </>
    ),
    actions: "home",
  },
  "maintenance-error": {
    code: "503",
    title: "Website is under maintenance!",
    description: (
      <>
        The site is not available at the moment. <br />
        We&apos;ll be back online shortly.
      </>
    ),
    actions: "maintenance",
  },
};

type ErrorPageProps = {
  params: Promise<{
    error: string;
  }>;
};

export default async function DashboardErrorPage({ params }: ErrorPageProps) {
  const { error } = await params;
  const message = messages[error] ?? messages["internal-server-error"];

  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] font-bold leading-tight">{message.code}</h1>
        <span className="font-medium">{message.title}</span>
        <p className="text-center text-muted-foreground">{message.description}</p>
        <div className="mt-6 flex gap-4">
          {message.actions === "maintenance" ? (
            <Button asChild variant="outline">
              <Link href="/dashboard/help-center">Learn more</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link href="/dashboard">Go Back</Link>
              </Button>
              <Button asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
