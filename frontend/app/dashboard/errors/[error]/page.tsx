import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const messages: Record<string, { title: string; description: string }> = {
  unauthorized: {
    title: "Unauthorized",
    description: "Your session cannot access this dashboard area.",
  },
  forbidden: {
    title: "Forbidden",
    description: "The requested organization or bundle is outside your account.",
  },
  "not-found": {
    title: "Not found",
    description: "The requested dashboard resource does not exist.",
  },
  "internal-server-error": {
    title: "Internal server error",
    description: "The server could not complete this dashboard request.",
  },
  maintenance: {
    title: "Maintenance",
    description: "This dashboard area is temporarily unavailable.",
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
    <>
      <PageHeader
        description="Server-rendered error surface for dashboard routes."
        title={message.title}
      />
      <Card>
        <CardHeader>
          <CardTitle>{message.title}</CardTitle>
          <CardDescription>{message.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

