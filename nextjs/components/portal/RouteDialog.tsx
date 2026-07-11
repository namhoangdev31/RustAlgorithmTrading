"use client";

import * as React from "react";
import { useRouter } from "@/i18n/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type RouteDialogProps = {
  open: boolean;
  returnTo: string;
  children: React.ReactNode;
  title?: string;
  className?: string;
};

/** Keeps URL-driven dialogs accessible while returning to the canonical route on close. */
export function RouteDialog({ open, returnTo, children, title = "Dialog", className }: RouteDialogProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && router.replace(returnTo)}>
      <DialogContent
        className={cn(
          "flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-xl border-hairline bg-canvas p-0 shadow-dark sm:max-h-[calc(100dvh-4rem)] sm:rounded-xl",
          className,
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
