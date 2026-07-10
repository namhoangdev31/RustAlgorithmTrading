import ProjectDetailsPage from "../../[id]/page";

type PageProps = {
  params: Promise<{ locale: string; projectId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export default function ProjectOverviewPage({ params, searchParams }: PageProps) {
  return <ProjectDetailsPage params={params.then(({ locale, projectId }) => ({ locale, id: projectId }))} searchParams={searchParams.then((search) => ({ ...search, tab: "overview" }))} />;
}
