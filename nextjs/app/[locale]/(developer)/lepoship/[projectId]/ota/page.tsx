import LepoShipProjectDetailPage from "../page";

type PageProps = { params: Promise<{ locale: string; projectId: string }>; searchParams: Promise<{ buildTriggered?: string }>; };

export default function LepoShipOtaPage({ params, searchParams }: PageProps) {
  return <LepoShipProjectDetailPage params={params} searchParams={searchParams} />;
}
