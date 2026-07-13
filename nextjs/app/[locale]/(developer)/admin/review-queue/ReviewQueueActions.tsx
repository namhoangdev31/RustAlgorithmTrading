"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { approveReviewQueueAction, createEmergencyReleaseOverrideAction, rejectReviewQueueAction } from "@/app/actions/lepoship-review";
import { AlertTriangle, Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  queueItemId: string;
  bundleName: string;
}

export function ReviewQueueActions({ queueItemId, bundleName }: Props) {
  const t = useTranslations("LepoShip.moderation");
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [overrideOpen, setOverrideOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [pending, setPending] = React.useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Approve */}
      <form
        action={approveReviewQueueAction}
        onSubmit={() => setPending(true)}
      >
        <input type="hidden" name="queueItemId" value={queueItemId} />
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
        >
          <Check className="size-3" />
          {t("approve")}
        </Button>
      </form>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            className="h-7 text-xs gap-1 border-red-500/30 text-red-500 hover:bg-red-500/10 cursor-pointer"
          >
            <X className="size-3" />
            {t("reject")}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Reject &ldquo;{bundleName}&rdquo;</DialogTitle>
            <DialogDescription className="text-xs">
              Please provide a reason for rejection. The developer will see this.
            </DialogDescription>
          </DialogHeader>

          <form
            action={rejectReviewQueueAction}
            onSubmit={() => {
              setPending(true);
              setRejectOpen(false);
            }}
          >
            <input type="hidden" name="queueItemId" value={queueItemId} />
            <Textarea
              name="rejectionReason"
              placeholder="Describe the reason for rejection…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px] text-xs"
              required
            />
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRejectOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!reason.trim() || pending}
                className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
              {t("reject")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogTrigger asChild>
          <Button type="button" size="sm" variant="outline" disabled={pending} className="h-7 text-xs gap-1 border-amber-500/30 text-amber-500">
            <AlertTriangle className="size-3" /> Emergency override
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Emergency release override</DialogTitle><DialogDescription>Bypasses release gates for one hour. The action is permanently audited.</DialogDescription></DialogHeader>
          <form action={createEmergencyReleaseOverrideAction} onSubmit={() => setPending(true)}>
            <input type="hidden" name="queueItemId" value={queueItemId} />
            <Textarea name="overrideReason" minLength={10} required placeholder="Operational reason and incident reference…" />
            <DialogFooter className="mt-4"><Button type="submit" variant="destructive" disabled={pending}>Create one-hour override</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
