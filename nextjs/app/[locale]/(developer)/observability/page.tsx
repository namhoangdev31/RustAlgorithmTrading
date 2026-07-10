import SpeedInsightsPage from "../dashboard/speed-insights/page";

type PageProps = {
  searchParams: Promise<{ projectId?: string }>;
};

export default function ObservabilityPage({ searchParams }: PageProps) {
  return <SpeedInsightsPage searchParams={searchParams} />;
}
