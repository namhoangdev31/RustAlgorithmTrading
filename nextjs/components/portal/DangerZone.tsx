"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type DangerZoneProps = {
  title: string;
  description: string;
  actionLabel: string;
  dialogTitle?: string;
  dialogDescription?: string;
  onConfirm: () => void;
  loading?: boolean;
  className?: string;
};

export function DangerZone({
  title,
  description,
  actionLabel,
  dialogTitle = "Are you absolutely sure?",
  dialogDescription = "This action cannot be undone. This will permanently delete the resource and all associated data.",
  onConfirm,
  loading,
  className,
}: DangerZoneProps) {
  return (
    <div
      className={cn(
        "grid gap-6 md:grid-cols-3 border border-red-500/20 rounded-md bg-red-500/5 p-6",
        className
      )}
    >
      <div className="space-y-1">
        <h2 className="text-heading-md font-semibold text-red-600 dark:text-red-400">
          {title}
        </h2>
        <p className="text-xs text-red-700/80 dark:text-red-400/80 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="md:col-span-2 flex items-center justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={loading}>
              {actionLabel}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {dialogDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
