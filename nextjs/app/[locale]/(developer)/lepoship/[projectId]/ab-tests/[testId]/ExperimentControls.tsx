"use client";

import { endAbTestAction, pauseAbTestAction } from "@/app/actions/lepoship-ab";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  projectId: string;
  testId: string;
  status: string;
  canPromoteB: boolean;
};

export function ExperimentControls({ projectId, testId, status, canPromoteB }: Props) {
  if (!["running", "paused_guardrail"].includes(status)) return null;
  const hidden = <><input type="hidden" name="projectId" value={projectId} /><input type="hidden" name="testId" value={testId} /></>;
  return (
    <div className="flex flex-wrap gap-2">
      {status === "running" && (
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="outline">Pause experiment</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Pause and restore control?</AlertDialogTitle>
              <AlertDialogDescription>New treatment assignments stop immediately and exposed B devices receive a forced rollback when supported.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <form action={pauseAbTestAction}>{hidden}<Button type="submit" variant="destructive">Pause experiment</Button></form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild><Button variant="outline">End with control A</Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End and keep Variant A?</AlertDialogTitle>
            <AlertDialogDescription>The frozen control becomes primary and treatment devices are rolled back.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <form action={endAbTestAction}>{hidden}<input type="hidden" name="winnerVariant" value="A" /><Button type="submit">Confirm A</Button></form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild><Button disabled={!canPromoteB}>Promote Variant B</Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote the treatment build?</AlertDialogTitle>
            <AlertDialogDescription>Variant B becomes the canonical primary production release. This is allowed only after a conclusive B result.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <form action={endAbTestAction}>{hidden}<input type="hidden" name="winnerVariant" value="B" /><Button type="submit">Promote B</Button></form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
