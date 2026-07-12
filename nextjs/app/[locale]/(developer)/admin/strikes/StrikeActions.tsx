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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { issueStrikeAction, revokeStrikeAction, triageReportAction } from "@/app/actions/lepoship-strikes";
import { Shield, ShieldAlert, ShieldAlert as RevokeIcon, Check, Trash } from "lucide-react";

interface StrikeActionsProps {
  developers: { id: string; fullName: string | null; email: string | null }[];
  bundles: { id: string; name: string }[];
}


export function StrikeActions({ developers, bundles }: StrikeActionsProps) {
  const [issueOpen, setIssueOpen] = React.useState(false);
  const [revokeOpen, setRevokeOpen] = React.useState(false);
  const [triageOpen, setTriageOpen] = React.useState(false);

  // Issue Strike Form State
  const [devId, setDevId] = React.useState("");
  const [bundleId, setBundleId] = React.useState("none");
  const [strikeType, setStrikeType] = React.useState("malware");
  const [severity, setSeverity] = React.useState<"minor" | "major" | "critical">("minor");
  const [desc, setDesc] = React.useState("");
  const [expiry, setExpiry] = React.useState("");

  // Revoke Strike State
  const [targetStrikeId, setTargetStrikeId] = React.useState("");
  const [revokeReason, setRevokeReason] = React.useState("");

  // Triage Report State
  const [targetReportId, setTargetReportId] = React.useState("");
  const [triageStatus, setTriageStatus] = React.useState<"resolved" | "dismissed">("resolved");
  const [resolution, setResolution] = React.useState("");

  const [pending, setPending] = React.useState(false);

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devId) return;
    setPending(true);
    try {
      await issueStrikeAction({
        developerId: devId,
        bundleId: bundleId === "none" ? undefined : bundleId,
        strikeType,
        severity,
        description: desc,
        expiresAt: expiry || undefined,
      });
      setIssueOpen(false);
      // Reset form
      setDevId("");
      setBundleId("none");
      setDesc("");
      setExpiry("");
    } catch (err: any) {
      alert(err.message || "Failed to issue strike");
    } finally {
      setPending(false);
    }
  };

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStrikeId || !revokeReason.trim()) return;
    setPending(true);
    try {
      await revokeStrikeAction(targetStrikeId, revokeReason);
      setRevokeOpen(false);
      setRevokeReason("");
    } catch (err: any) {
      alert(err.message || "Failed to revoke strike");
    } finally {
      setPending(false);
    }
  };

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetReportId || !resolution.trim()) return;
    setPending(true);
    try {
      await triageReportAction(targetReportId, triageStatus, resolution);
      setTriageOpen(false);
      setResolution("");
    } catch (err: any) {
      alert(err.message || "Failed to triage report");
    } finally {
      setPending(false);
    }
  };

  React.useImperativeHandle(globalActionsRef, () => ({
    openRevoke: (strikeId: string) => {
      setTargetStrikeId(strikeId);
      setRevokeOpen(true);
    },
    openTriage: (reportId: string) => {
      setTargetReportId(reportId);
      setTriageOpen(true);
    },
  }));

  return (
    <div className="flex items-center gap-2">
      {/* 1. Issue Strike Trigger */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white gap-1 cursor-pointer">
            <ShieldAlert className="size-3.5" />
            Issue Strike
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Issue Developer Strike</DialogTitle>
            <DialogDescription className="text-xs">
              Directly record a compliance strike against a developer. Accumulated strikes prompt auto-suspension.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleIssueSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Developer</label>
              <Select value={devId} onValueChange={setDevId} required>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select a developer..." />
                </SelectTrigger>
                <SelectContent>
                  {developers.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-xs">
                      {d.fullName || "Unnamed"} ({d.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Bundle (Optional)</label>
              <Select value={bundleId} onValueChange={setBundleId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select affected bundle (if any)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">None / Account-wide</SelectItem>
                  {bundles.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Strike Type</label>
                <Select value={strikeType} onValueChange={setStrikeType}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="malware" className="text-xs">Malware / Security</SelectItem>
                    <SelectItem value="spam" className="text-xs">Spam / Abuse</SelectItem>
                    <SelectItem value="copyright" className="text-xs">Copyright / DMCA</SelectItem>
                    <SelectItem value="misleading" className="text-xs">Misleading Claims</SelectItem>
                    <SelectItem value="other" className="text-xs">Other Violation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Severity</label>
                <Select value={severity} onValueChange={(val: any) => setSeverity(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor" className="text-xs">Minor</SelectItem>
                    <SelectItem value="major" className="text-xs">Major</SelectItem>
                    <SelectItem value="critical" className="text-xs">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Expiration Date (Optional)</label>
              <Input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Description / Violation Details</label>
              <Textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Details of the violation..."
                className="text-xs min-h-[70px]"
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIssueOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-700 text-white" disabled={pending}>
                Issue Strike
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Revoke Dialog (Triggered dynamically from page tables) */}
      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Revoke Strike</DialogTitle>
            <DialogDescription className="text-xs">
              Confirm strike revocation. Auditing details must be provided.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRevokeSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Revocation Reason</label>
              <Textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Reason for revoking this strike..."
                className="text-xs min-h-[85px]"
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setRevokeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={pending}>
                Confirm Revocation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Triage Report Dialog */}
      <Dialog open={triageOpen} onOpenChange={setTriageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Triage User Report</DialogTitle>
            <DialogDescription className="text-xs">
              Record reviewed status and write the resolution note.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTriageSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Status</label>
              <Select value={triageStatus} onValueChange={(val: any) => setTriageStatus(val)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved" className="text-xs">Resolved (Action Taken)</SelectItem>
                  <SelectItem value="dismissed" className="text-xs">Dismissed (No Action)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Resolution Summary</label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe resolution steps or justification..."
                className="text-xs min-h-[85px]"
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setTriageOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={pending}>
                Submit Triage
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// Global reference hook setup
export const globalActionsRef = React.createRef<{
  openRevoke: (strikeId: string) => void;
  openTriage: (reportId: string) => void;
}>();
