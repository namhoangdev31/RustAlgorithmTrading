import ProjectsPage from "../projects/page";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export default function ActivityPage({ params, searchParams }: PageProps) {
  return <ProjectsPage params={params} searchParams={searchParams.then((search) => ({ ...search, tab: "activity" }))} />;
}
