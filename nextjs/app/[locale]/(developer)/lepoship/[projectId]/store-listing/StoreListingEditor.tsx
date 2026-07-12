"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  upsertStoreListingAction,
  replaceScreenshotsAction,
  replaceKeywordsAction,
  replaceTagsAction,
  upsertPrivacyDeclarationAction
} from "@/app/actions/lepoship-listing";
import { ArrowUp, ArrowDown, Trash2, Plus, Globe, Image, Key, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

interface Listing {
  id: string;
  bundleId: string;
  region: string;
  name: string | null;
  shortDescription: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Localization {
  id: string;
  bundleId: string;
  languageCode: string;
  localizedName: string | null;
  localizedShortDesc: string | null;
  localizedDescription: string | null;
  localizedChangelog: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Screenshot {
  id: string;
  bundleId: string;
  url: string;
  caption: string | null;
  deviceType: string | null;
  sortOrder: number;
  createdAt: string;
}

interface Keyword {
  id: string;
  bundleId: string;
  keyword: string;
  locale: string;
  weight: number;
}

interface Tag {
  id: string;
  bundleId: string;
  tag: string;
}

interface Privacy {
  id: string;
  bundleId: string;
  collectsPersonalData: boolean;
  dataTypes: string | null;
  purposeOfCollection: string | null;
  thirdPartySharing: boolean;
  thirdParties: string | null;
  dataRetentionDays: number | null;
  privacyContactEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StoreListingEditorProps {
  projectId: string;
  listings: Listing[];
  localizations: Localization[];
  screenshots: Screenshot[];
  keywords: Keyword[];
  tags: Tag[];
  privacy: Privacy | null;
}

export function StoreListingEditor({
  projectId,
  listings,
  localizations,
  screenshots: initialScreenshots,
  keywords,
  tags: initialTags,
  privacy: initialPrivacy
}: StoreListingEditorProps) {
  const t = useTranslations("LepoShip.store_listing");
  // --- Tab State ---
  const [activeTab, setActiveTab] = React.useState("locales");

  // --- Locales Tab State ---
  const [selectedLocale, setSelectedLocale] = React.useState<string>("en");
  const [newLocale, setNewLocale] = React.useState("");

  // Get active listing & localization data
  const currentListing = listings.find((l) => l.region === selectedLocale);
  const currentLoc = localizations.find((l) => l.languageCode === selectedLocale);

  const [name, setName] = React.useState("");
  const [shortDesc, setShortDesc] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [changelog, setChangelog] = React.useState("");

  React.useEffect(() => {
    setName(currentListing?.name || "");
    setShortDesc(currentListing?.shortDescription || "");
    setDesc(currentListing?.description || "");
    setChangelog(currentLoc?.localizedChangelog || "");
  }, [selectedLocale, currentListing, currentLoc]);

  // All distinct locales available
  const allLocales = Array.from(
    new Set(["en", "vi", ...listings.map((l) => l.region), ...localizations.map((l) => l.languageCode)])
  );

  const handleAddLocale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocale) return;
    const clean = newLocale.trim().toLowerCase();
    if (clean && !allLocales.includes(clean)) {
      setSelectedLocale(clean);
      setNewLocale("");
    }
  };

  // --- Screenshots (Media) State ---
  const [mediaList, setMediaList] = React.useState<Omit<Screenshot, "id" | "bundleId" | "createdAt">[]>(
    initialScreenshots.map((s) => ({
      url: s.url,
      caption: s.caption,
      deviceType: s.deviceType,
      sortOrder: s.sortOrder
    }))
  );
  const [newMediaUrl, setNewMediaUrl] = React.useState("");
  const [newMediaCaption, setNewMediaCaption] = React.useState("");
  const [newMediaDevice, setNewMediaDevice] = React.useState("phone");

  const addMedia = () => {
    if (!newMediaUrl) return;
    setMediaList((prev) => [
      ...prev,
      {
        url: newMediaUrl,
        caption: newMediaCaption || null,
        deviceType: newMediaDevice || null,
        sortOrder: prev.length
      }
    ]);
    setNewMediaUrl("");
    setNewMediaCaption("");
  };

  const removeMedia = (index: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index).map((m, idx) => ({ ...m, sortOrder: idx })));
  };

  const moveMedia = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === mediaList.length - 1) return;

    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const nextList = [...mediaList];
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;

    setMediaList(nextList.map((m, idx) => ({ ...m, sortOrder: idx })));
  };

  // --- Keywords & Tags State ---
  const localeKeywords = keywords.filter((k) => k.locale === selectedLocale).map((k) => k.keyword).join(", ");
  const globalTags = initialTags.map((t) => t.tag).join(", ");

  // --- Privacy State ---
  const [collectsPersonal, setCollectsPersonal] = React.useState(initialPrivacy?.collectsPersonalData || false);
  const [sharingThirdParty, setSharingThirdParty] = React.useState(initialPrivacy?.thirdPartySharing || false);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-4 w-full max-w-2xl mb-6 bg-muted/50 border border-hairline p-1 rounded-md">
        <TabsTrigger value="locales" className="text-xs py-1.5 flex items-center gap-1.5 cursor-pointer">
          <Globe className="size-3.5" />
          {t("locales")}
        </TabsTrigger>
        <TabsTrigger value="media" className="text-xs py-1.5 flex items-center gap-1.5 cursor-pointer">
          <Image className="size-3.5" />
          {t("media")}
        </TabsTrigger>
        <TabsTrigger value="keywords" className="text-xs py-1.5 flex items-center gap-1.5 cursor-pointer">
          <Key className="size-3.5" />
          {t("keywords")}
        </TabsTrigger>
        <TabsTrigger value="privacy" className="text-xs py-1.5 flex items-center gap-1.5 cursor-pointer">
          <Shield className="size-3.5" />
          {t("privacy")}
        </TabsTrigger>
      </TabsList>

      {/* --- LOCALES TAB --- */}
      <TabsContent value="locales" className="space-y-4 outline-none">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left panel: locale selector */}
          <div className="space-y-4">
            <Card className="border-hairline">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold">Active Locales</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                <div className="flex flex-col gap-1">
                  {allLocales.map((loc) => (
                    <Button
                      key={loc}
                      variant={selectedLocale === loc ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedLocale(loc)}
                      className="justify-start text-xs font-medium cursor-pointer"
                    >
                      <Globe className="size-3.5 mr-2 text-muted-foreground" />
                      {loc.toUpperCase()}
                      {loc === "en" && " (English)"}
                      {loc === "vi" && " (Tiếng Việt)"}
                    </Button>
                  ))}
                </div>

                <form onSubmit={handleAddLocale} className="flex gap-1.5 pt-3 border-t border-hairline mt-3">
                  <Input
                    placeholder="Locale (e.g. ja)"
                    value={newLocale}
                    onChange={(e) => setNewLocale(e.target.value)}
                    className="h-8 text-xs max-w-[120px]"
                  />
                  <Button type="submit" size="sm" className="h-8 text-xs cursor-pointer">
                    Add
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right panel: editor */}
          <div className="md:col-span-3">
            <Card className="border-hairline">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-sm font-semibold">
                  Listing Fields — {selectedLocale.toUpperCase()}
                </CardTitle>
                <CardDescription className="text-xs">
                  Provide localized product description fields. Upserts listing details atomically.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <form action={upsertStoreListingAction} className="space-y-4">
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="locale" value={selectedLocale} />

                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs">Localized Bundle Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. LepoShip Pro"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="shortDescription" className="text-xs">Short Description (max 255 chars)</Label>
                    <Input
                      id="shortDescription"
                      name="shortDescription"
                      value={shortDesc}
                      onChange={(e) => setShortDesc(e.target.value)}
                      placeholder="Catchy summary of what the app does"
                      maxLength={255}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-xs">Full Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="Write a compelling, detailed description of your product..."
                      className="min-h-[120px] text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="localizedChangelog" className="text-xs">What&apos;s New (Changelog)</Label>
                    <Textarea
                      id="localizedChangelog"
                      name="localizedChangelog"
                      value={changelog}
                      onChange={(e) => setChangelog(e.target.value)}
                      placeholder="Describe what has changed in this release"
                      className="min-h-[80px] text-xs"
                    />
                  </div>

                  <div className="pt-2">
                    <Button type="submit" size="sm" className="text-xs cursor-pointer">
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      {/* --- MEDIA TAB --- */}
      <TabsContent value="media" className="space-y-4 outline-none">
        <Card className="border-hairline">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-semibold">Screenshots & Assets</CardTitle>
            <CardDescription className="text-xs">
              Manage product screenshots. Reorder using arrow keys. Only HTTPS or root-relative paths are accepted.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-6">
            {/* Screenshot List */}
            <div className="space-y-2 max-w-3xl">
              {mediaList.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-hairline rounded-md">
                  No screenshots uploaded yet. Add one below.
                </div>
              ) : (
                mediaList.map((media, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2.5 rounded-md border border-hairline bg-muted/20 text-xs"
                  >
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moveMedia(idx, "up")}
                        disabled={idx === 0}
                        className="h-6 w-6 cursor-pointer"
                      >
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moveMedia(idx, "down")}
                        disabled={idx === mediaList.length - 1}
                        className="h-6 w-6 cursor-pointer"
                      >
                        <ArrowDown className="size-3.5" />
                      </Button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{media.url}</p>
                      {media.caption && <p className="text-[10px] text-muted-foreground mt-0.5">{media.caption}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      {media.deviceType && (
                        <span className="capitalize text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          {media.deviceType}
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMedia(idx)}
                        className="h-6 w-6 text-red-500 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add New media form (Client-side stack) */}
            <div className="space-y-4 pt-4 border-t border-hairline max-w-xl">
              <h3 className="text-xs font-semibold">Add Screenshot URL</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="mediaUrl" className="text-xs">Screenshot URL</Label>
                  <Input
                    id="mediaUrl"
                    placeholder="https://example.com/screenshot1.png or /previews/ss1.png"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="mediaCaption" className="text-xs">Caption (optional)</Label>
                    <Input
                      id="mediaCaption"
                      placeholder="e.g. Beautiful home page"
                      value={newMediaCaption}
                      onChange={(e) => setNewMediaCaption(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="mediaDevice" className="text-xs">Device Target</Label>
                    <select
                      id="mediaDevice"
                      value={newMediaDevice}
                      onChange={(e) => setNewMediaDevice(e.target.value)}
                      className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="phone">Phone</option>
                      <option value="tablet">Tablet</option>
                      <option value="desktop">Desktop</option>
                    </select>
                  </div>
                </div>

                <div className="pt-1">
                  <Button type="button" size="sm" onClick={addMedia} className="text-xs h-8 cursor-pointer">
                    <Plus className="size-3.5 mr-1" /> Add to List
                  </Button>
                </div>
              </div>
            </div>

            {/* Save Entire Media list Action */}
            <form action={replaceScreenshotsAction} className="pt-6 border-t border-hairline">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="screenshots" value={JSON.stringify(mediaList)} />
              <Button type="submit" size="sm" className="text-xs cursor-pointer">
                Commit Screenshots Order
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* --- KEYWORDS TAB --- */}
      <TabsContent value="keywords" className="space-y-4 outline-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Localized keywords */}
          <Card className="border-hairline">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-semibold">Localized Keywords</CardTitle>
              <CardDescription className="text-xs">
                Provide comma-separated keywords for {selectedLocale.toUpperCase()}. We normalize keys: lowercase, trim, and deduplicate.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <form action={replaceKeywordsAction} className="space-y-4">
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="locale" value={selectedLocale} />
                <div className="space-y-1.5">
                  <Label htmlFor="keywords" className="text-xs">Keywords</Label>
                  <Textarea
                    id="keywords"
                    name="keywords"
                    defaultValue={localeKeywords}
                    placeholder="e.g. trading, algorithms, safety, portfolio"
                    className="min-h-[100px] text-xs"
                  />
                </div>
                <Button type="submit" size="sm" className="text-xs cursor-pointer">
                  Save Keywords ({selectedLocale.toUpperCase()})
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Global tags */}
          <Card className="border-hairline">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-semibold">Global Tags</CardTitle>
              <CardDescription className="text-xs">
                Global labels categorized for discovery on the marketplace. Normalized to lowercase.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <form action={replaceTagsAction} className="space-y-4">
                <input type="hidden" name="projectId" value={projectId} />
                <div className="space-y-1.5">
                  <Label htmlFor="tags" className="text-xs">Tags</Label>
                  <Textarea
                    id="tags"
                    name="tags"
                    defaultValue={globalTags}
                    placeholder="e.g. finance, tool, extension"
                    className="min-h-[100px] text-xs"
                  />
                </div>
                <Button type="submit" size="sm" className="text-xs cursor-pointer">
                  Save Global Tags
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- PRIVACY TAB --- */}
      <TabsContent value="privacy" className="space-y-4 outline-none">
        <Card className="border-hairline">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-semibold">Privacy Declaration</CardTitle>
            <CardDescription className="text-xs">
              Certify the data types collected by your bundle and third-party sharing details.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <form action={upsertPrivacyDeclarationAction} className="space-y-5 max-w-2xl">
              <input type="hidden" name="projectId" value={projectId} />

              <div className="flex items-center justify-between p-3 rounded-md border border-hairline bg-muted/10">
                <div className="space-y-0.5">
                  <Label htmlFor="collectsPersonalData" className="text-xs font-semibold">Collects Personal Data</Label>
                  <p className="text-[10px] text-muted-foreground">Does this bundle collect user identity, contacts, or location?</p>
                </div>
                <Switch
                  id="collectsPersonalData"
                  name="collectsPersonalData"
                  checked={collectsPersonal}
                  onCheckedChange={setCollectsPersonal}
                  className="cursor-pointer"
                />
              </div>

              {collectsPersonal && (
                <div className="space-y-4 pl-4 border-l border-hairline ml-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="dataTypes" className="text-xs">Types of Data Collected</Label>
                    <Input
                      id="dataTypes"
                      name="dataTypes"
                      defaultValue={initialPrivacy?.dataTypes || ""}
                      placeholder="e.g. Email, Full Name, Device Identifiers"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="purposeOfCollection" className="text-xs">Purpose of Collection</Label>
                    <Input
                      id="purposeOfCollection"
                      name="purposeOfCollection"
                      defaultValue={initialPrivacy?.purposeOfCollection || ""}
                      placeholder="e.g. Account setup, Analytics optimization"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dataRetentionDays" className="text-xs">Data Retention Period (Days)</Label>
                    <Input
                      id="dataRetentionDays"
                      name="dataRetentionDays"
                      type="number"
                      defaultValue={initialPrivacy?.dataRetentionDays ?? ""}
                      placeholder="e.g. 30 (blank for indefinite)"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-md border border-hairline bg-muted/10">
                <div className="space-y-0.5">
                  <Label htmlFor="thirdPartySharing" className="text-xs font-semibold">Third-Party Sharing</Label>
                  <p className="text-[10px] text-muted-foreground">Is user data sent to external trackers, advertising networks, or APIs?</p>
                </div>
                <Switch
                  id="thirdPartySharing"
                  name="thirdPartySharing"
                  checked={sharingThirdParty}
                  onCheckedChange={setSharingThirdParty}
                  className="cursor-pointer"
                />
              </div>

              {sharingThirdParty && (
                <div className="space-y-4 pl-4 border-l border-hairline ml-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="thirdParties" className="text-xs">Third Parties Involved</Label>
                    <Input
                      id="thirdParties"
                      name="thirdParties"
                      defaultValue={initialPrivacy?.thirdParties || ""}
                      placeholder="e.g. Stripe, Google Analytics"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 pt-2 border-t border-hairline">
                <Label htmlFor="privacyContactEmail" className="text-xs">Privacy Contact Email</Label>
                <Input
                  id="privacyContactEmail"
                  name="privacyContactEmail"
                  type="email"
                  defaultValue={initialPrivacy?.privacyContactEmail || ""}
                  placeholder="privacy@yourcompany.com"
                  className="h-8 text-xs animate-none"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" size="sm" className="text-xs cursor-pointer">
                  Save Privacy Declaration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
