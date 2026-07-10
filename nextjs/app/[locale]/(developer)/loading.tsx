import { Skeleton } from "@/components/ui/skeleton";

export default function DeveloperPortalLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading developer portal">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => <Skeleton className="h-32" key={item} />)}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
