import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    locale: string;
    projectId: string;
  }>;
};

export default async function LepoShipProjectDetailPage({ params }: PageProps) {
  const { locale, projectId } = await params;
  redirect(`/${locale}/lepoship/${projectId}/overview`);
}
