"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function DeveloperPortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex min-h-80 max-w-lg flex-col items-start justify-center gap-4" role="alert">
      <div>
        <p className="text-sm font-medium text-destructive">Developer Portal unavailable</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight">We could not load this resource.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again. If the problem remains, use the activity log or contact workspace support.</p>
      </div>
      <Button onClick={reset} type="button">Try again</Button>
    </section>
  );
}
