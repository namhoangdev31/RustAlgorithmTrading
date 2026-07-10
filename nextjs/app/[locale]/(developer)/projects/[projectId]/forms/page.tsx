import FormsDashboardPage from "../../../dashboard/forms/page";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectFormsPage({ params }: PageProps) {
  const { projectId } = await params;
  return <FormsDashboardPage searchParams={Promise.resolve({ projectId })} />;
}
