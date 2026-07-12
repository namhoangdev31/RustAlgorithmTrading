"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DollarSign, RefreshCw, Check, ArrowRight } from "lucide-react";
import { initiatePayoutAction, approveRefundAction } from "@/app/actions/lepoship-finance";


interface PayoutItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  bankAccount: string | null;
  transactionRef: string | null;
  createdAt: Date;
  developer: { fullName: string | null; email: string | null };
}

interface RefundItem {
  id: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: Date;
  user: { fullName: string | null; email: string | null };
  order: { id: string; totalAmount: number; currency: string; transactionRef: string | null };
}


interface ManagerProps {
  initialPayouts: PayoutItem[];
  initialRefunds: RefundItem[];
}

export function FinanceManager({ initialPayouts, initialRefunds }: ManagerProps) {
  const [payouts, setPayouts] = React.useState<PayoutItem[]>(initialPayouts);
  const [refunds, setRefunds] = React.useState<RefundItem[]>(initialRefunds);
  const [pending, setPending] = React.useState(false);

  // Refund Approval form modal state
  const [selectedRefundId, setSelectedRefundId] = React.useState<string | null>(null);
  const [refundNote, setRefundNote] = React.useState("");

  const handlePayout = async (payoutId: string) => {
    if (!confirm("Confirm payouts dispatch? This initiates a real transfer on Stripe Connected Account.")) return;
    setPending(true);
    try {
      const updated = await initiatePayoutAction(payoutId);
      // Map return type to item
      setPayouts((prev) =>
        prev.map((p) => (p.id === payoutId ? { ...p, status: "completed", transactionRef: updated.transactionRef } : p))
      );
    } catch (err: any) {
      alert(err.message || "Failed to trigger payout.");
    } finally {
      setPending(false);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefundId || !refundNote.trim()) return;
    setPending(true);
    try {
      await approveRefundAction(selectedRefundId, refundNote);
      setRefunds((prev) =>
        prev.map((r) => (r.id === selectedRefundId ? { ...r, status: "approved" } : r))
      );
      setSelectedRefundId(null);
      setRefundNote("");
    } catch (err: any) {
      alert(err.message || "Failed to issue Stripe Connect refund.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-8 text-xs">
      {/* 1. Refunds Review Queue */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <RefreshCw className="size-4 text-amber-500 animate-spin-slow" />
          Pending Refund Requests ({refunds.filter((r) => r.status === "pending").length})
        </h3>

        {refunds.filter((r) => r.status === "pending").length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
            No pending refund requests.
          </div>
        ) : (
          <div className="border border-hairline rounded-lg overflow-hidden divide-y divide-hairline">
            {refunds
              .filter((r) => r.status === "pending")
              .map((r) => (
                <div key={r.id} className="p-4 bg-secondary/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {r.user.fullName || "Buyer"} ({r.user.email})
                      </span>
                      <ArrowRight className="size-3.5 text-muted-foreground" />
                      <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] font-bold">
                        {r.amount.toLocaleString()} {r.order.currency}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Reason: &ldquo;{r.reason}&rdquo; · Ordered ref: {r.order.transactionRef || "N/A"}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      Requested on {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <Button
                    onClick={() => setSelectedRefundId(r.id)}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white cursor-pointer self-start md:self-auto"
                    disabled={pending}
                  >
                    Review Refund
                  </Button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 2. Payouts Reconciliation */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="size-4 text-emerald-500" />
          Partner Payout Registry
        </h3>

        {payouts.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
            No payouts registered on the system.
          </div>
        ) : (
          <div className="border border-hairline rounded-lg overflow-hidden divide-y divide-hairline">
            {payouts.map((p) => (
              <div key={p.id} className="p-4 bg-secondary/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {p.developer.fullName || "Developer"} ({p.developer.email})
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      (Ref: {p.id.slice(0, 8)}...)
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                    <span>
                      Allocated Amount: <span className="font-bold text-foreground">{p.amount.toLocaleString()} {p.currency}</span>
                    </span>
                    {p.transactionRef && (
                      <span>
                        Stripe Ref: <span className="font-mono">{p.transactionRef}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-muted-foreground">
                    Initiated on {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {p.status === "pending" ? (
                    <Button
                      onClick={() => handlePayout(p.id)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      disabled={pending}
                    >
                      Disburse Payout
                    </Button>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold py-1">
                      Disbursed
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Refund Dialog */}
      <Dialog open={selectedRefundId !== null} onOpenChange={(open) => !open && setSelectedRefundId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Approve Stripe Refund</DialogTitle>
            <DialogDescription className="text-xs">
              Confirming will trigger Stripe API destination-charge refunds. Entitlements will be revoked.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRefundSubmit} className="space-y-3.5">
            <div>
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Internal Note / Justification</Label>
              <Textarea
                value={refundNote}
                onChange={(e) => setRefundNote(e.target.value)}
                placeholder="Details or reason for approving this refund request..."
                className="text-xs min-h-[85px]"
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedRefundId(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-700 text-white" disabled={pending}>
                Confirm Full Refund
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
