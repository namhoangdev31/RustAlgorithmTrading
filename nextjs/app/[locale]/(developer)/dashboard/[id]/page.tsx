import { requireCurrentUser } from "@/lib/server/current-user";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DashboardIDPage({ params }: PageProps) {
  await requireCurrentUser();
  const { id } = await params;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard Details</h1>
      <p className="text-lg">
        ID: <span className="font-mono bg-muted px-2 py-1 rounded">{id}</span>
      </p>
    </div>
  );
}
