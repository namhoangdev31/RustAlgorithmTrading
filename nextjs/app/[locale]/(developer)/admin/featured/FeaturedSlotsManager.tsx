"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Trash2, Calendar, LayoutGrid, AlertCircle } from "lucide-react";
import { upsertFeaturedSlotAction, removeFeaturedSlotAction } from "@/app/actions/lepoship-featured";
import { Separator } from "@/components/ui/separator";


interface FeaturedSlotItem {
  id: string;
  bundleId: string;
  slotType: string;
  title: string | null;
  subtitle: string | null;
  bannerUrl: string | null;
  ctaLabel: string | null;
  region: string | null;
  sortOrder: number;
  startsAt: Date;
  endsAt: Date | null;
  isActive: boolean;
  bundle: { name: string };
}

interface ManagerProps {
  initialSlots: FeaturedSlotItem[];
  bundles: { id: string; name: string }[];
}

export function FeaturedSlotsManager({ initialSlots, bundles }: ManagerProps) {
  const [slots, setSlots] = React.useState<FeaturedSlotItem[]>(initialSlots);
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  // Edit / Form state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [bundleId, setBundleId] = React.useState("");
  const [slotType, setSlotType] = React.useState("carousel");
  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [bannerUrl, setBannerUrl] = React.useState("");
  const [ctaLabel, setCtaLabel] = React.useState("");
  const [region, setRegion] = React.useState("global");
  const [sortOrder, setSortOrder] = React.useState("0");
  const [startsAt, setStartsAt] = React.useState("");
  const [endsAt, setEndsAt] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  const resetForm = () => {
    setEditingId(null);
    setBundleId(bundles[0]?.id || "");
    setSlotType("carousel");
    setTitle("");
    setSubtitle("");
    setBannerUrl("");
    setCtaLabel("");
    setRegion("global");
    setSortOrder("0");
    setStartsAt(new Date().toISOString().split("T")[0]);
    setEndsAt("");
    setIsActive(true);
    setError(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setOpen(true);
  };

  const handleEdit = (s: FeaturedSlotItem) => {
    setEditingId(s.id);
    setBundleId(s.bundleId);
    setSlotType(s.slotType);
    setTitle(s.title || "");
    setSubtitle(s.subtitle || "");
    setBannerUrl(s.bannerUrl || "");
    setCtaLabel(s.ctaLabel || "");
    setRegion(s.region || "global");
    setSortOrder(String(s.sortOrder));
    setStartsAt(new Date(s.startsAt).toISOString().split("T")[0]);
    setEndsAt(s.endsAt ? new Date(s.endsAt).toISOString().split("T")[0] : "");
    setIsActive(s.isActive);
    setError(null);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundleId) return;
    setPending(true);
    setError(null);

    try {
      const saved = await upsertFeaturedSlotAction({
        id: editingId || undefined,
        bundleId,
        slotType,
        title,
        subtitle,
        bannerUrl,
        ctaLabel,
        region: region === "global" ? undefined : region,
        sortOrder: Number(sortOrder) || 0,
        startsAt,
        endsAt: endsAt || undefined,
        isActive,
      });

      const updatedItem: FeaturedSlotItem = {
        ...saved,
        bundle: bundles.find((b) => b.id === bundleId)!,
      };

      if (editingId) {
        setSlots((prev) => prev.map((item) => (item.id === editingId ? updatedItem : item)));
      } else {
        setSlots((prev) => [...prev, updatedItem]);
      }
      setOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to save slot.");
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this featured slot?")) return;
    try {
      await removeFeaturedSlotAction(id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to remove slot.");
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex justify-end">
        <Button onClick={handleCreateNew} size="sm" className="bg-primary text-primary-foreground gap-1.5 cursor-pointer shadow-light">
          <Plus className="size-3.5" />
          Add Featured Slot
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {editingId ? "Edit Featured Placement" : "Create Featured Placement"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Overlapping active slots with the same order, region, and type will trigger errors.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-start gap-2 text-xs">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Target Bundle</Label>
              <Select value={bundleId} onValueChange={setBundleId} required>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Select bundle to feature..." />
                </SelectTrigger>
                <SelectContent>
                  {bundles.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Slot Type</Label>
                <Select value={slotType} onValueChange={setSlotType}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carousel" className="text-xs">Main Hero Carousel</SelectItem>
                    <SelectItem value="editorial" className="text-xs">Editorial Recommendation Card</SelectItem>
                    <SelectItem value="trending" className="text-xs">Trending / Spotlight Grid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sortOrder" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Order Index</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="text-xs h-9 bg-canvas"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="region" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Target Region</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global" className="text-xs">Global / Worldwide</SelectItem>
                    <SelectItem value="VN" className="text-xs">Vietnam (VN)</SelectItem>
                    <SelectItem value="US" className="text-xs">United States (US)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center pt-5">
                <Checkbox
                  id="isActiveForm"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked === true)}
                />
                <Label htmlFor="isActiveForm" className="text-xs font-semibold text-foreground cursor-pointer select-none ml-2">
                  Active (visible)
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="startsAt" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Start Date</Label>
                <Input
                  id="startsAt"
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="text-xs h-9 bg-canvas"
                  required
                />
              </div>

              <div>
                <Label htmlFor="endsAt" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">End Date (Optional)</Label>
                <Input
                  id="endsAt"
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="text-xs h-9 bg-canvas"
                />
              </div>
            </div>

            <Separator className="border-hairline" />

            <div className="space-y-2">
              <div>
                <Label htmlFor="title" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Display Title (e.g. Featured Spotlight)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Creative title..."
                  className="text-xs h-9 bg-canvas"
                />
              </div>

              <div>
                <Label htmlFor="subtitle" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Display Subtitle</Label>
                <Input
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Catchy tagline description..."
                  className="text-xs h-9 bg-canvas"
                />
              </div>

              <div>
                <Label htmlFor="bannerUrl" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Banner Image URL</Label>
                <Input
                  id="bannerUrl"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://..."
                  className="text-xs h-9 bg-canvas"
                />
              </div>

              <div>
                <Label htmlFor="ctaLabel" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">CTA Button Label</Label>
                <Input
                  id="ctaLabel"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder="e.g. Try Now, Get Started"
                  className="text-xs h-9 bg-canvas"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-primary-foreground" disabled={pending}>
                {pending ? "Saving..." : "Save Configuration"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Grid of active placements */}
      {slots.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
          No featured placements configured. Click &ldquo;Add Featured Slot&rdquo; above to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slots.map((s) => (
            <div key={s.id} className="p-4 border border-hairline rounded-lg bg-card text-xs flex flex-col justify-between gap-3 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{s.title || s.bundle.name}</h4>
                    {s.subtitle && <p className="text-[10px] text-muted-foreground">{s.subtitle}</p>}
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    s.isActive
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-transparent"
                  }`}>
                    {s.isActive ? "Active" : "Disabled"}
                  </span>
                </div>

                <div className="text-[10px] text-muted-foreground space-y-1 bg-secondary/15 p-2.5 rounded border border-hairline">
                  <p><span className="font-medium text-foreground">Type:</span> {s.slotType} (Order: {s.sortOrder})</p>
                  <p><span className="font-medium text-foreground">Target:</span> {s.bundle.name}</p>
                  <p><span className="font-medium text-foreground">Region:</span> {s.region || "Global"}</p>
                  <p className="flex items-center gap-1"><Calendar className="size-3 text-muted-foreground" /> {new Date(s.startsAt).toLocaleDateString()} to {s.endsAt ? new Date(s.endsAt).toLocaleDateString() : "forever"}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-hairline pt-3 mt-1.5">
                <Button variant="outline" size="sm" onClick={() => handleEdit(s)} className="h-7 text-[10px] gap-1 cursor-pointer">
                  <Edit2 className="size-3" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="h-7 text-[10px] gap-1 text-red-500 hover:text-red-600 hover:bg-red-50/50 cursor-pointer">
                  <Trash2 className="size-3" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
