import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function DeveloperPortalNotFound() {
  return (
    <section className="flex min-h-80 max-w-lg flex-col items-start justify-center gap-4">
      <div>
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight">Resource not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The project or workspace resource may have been removed, or you may not have access to it.</p>
      </div>
      <Button asChild variant="outline"><Link href="/overview">Return to overview</Link></Button>
    </section>
  );
}
