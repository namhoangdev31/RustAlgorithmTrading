"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type PortalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
};

/** Shared accessible shell for locally controlled Portal workflows. */
export function PortalDialog({ open, onOpenChange, children, title = "Dialog", className }: PortalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("gap-0 overflow-hidden p-0", className)}>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
