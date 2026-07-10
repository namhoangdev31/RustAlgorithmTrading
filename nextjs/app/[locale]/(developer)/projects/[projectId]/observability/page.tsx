import SpeedInsightsPage from "../../../dashboard/speed-insights/page";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectObservabilityPage({ params }: PageProps) {
  const { projectId } = await params;
  return <SpeedInsightsPage searchParams={Promise.resolve({ projectId })} />;
}
