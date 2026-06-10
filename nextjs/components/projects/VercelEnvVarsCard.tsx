"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Shield, 
  Globe, 
  Info, 
  X,
  AlertCircle,
  CheckCircle2,
  Lock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  createProjectEnvAction, 
  removeProjectEnvAction, 
  editProjectEnvAction 
} from "@/app/actions/vercel";

interface VercelEnvVarsCardProps {
  vercelProjectEnvVars: any[];
  vercelProjectId: string;
  projectId: string;
  locale: string;
  returnTo: string;
}

export function VercelEnvVarsCard({
  vercelProjectEnvVars,
  vercelProjectId,
  projectId,
  locale,
  returnTo,
}: VercelEnvVarsCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<any | null>(null);
  
  // Form states
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [comment, setComment] = useState("");
  const [targetProduction, setTargetProduction] = useState(true);
  const [targetPreview, setTargetPreview] = useState(true);
  const [targetDevelopment, setTargetDevelopment] = useState(true);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  const handleOpenAdd = () => {
    setEditingVar(null);
    setKey("");
    setValue("");
    setComment("");
    setTargetProduction(true);
    setTargetPreview(true);
    setTargetDevelopment(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (envVar: any) => {
    setEditingVar(envVar);
    setKey(envVar.key);
    setValue(""); // Always clear value since it's sensitive and not returned as plain text
    setComment(envVar.comment || "");
    setTargetProduction(envVar.target?.includes("production") ?? false);
    setTargetPreview(envVar.target?.includes("preview") ?? false);
    setTargetDevelopment(envVar.target?.includes("development") ?? false);
    setIsFormOpen(true);
  };

  const toggleValueVisibility = (id: string) => {
    setShowValues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Card className="bg-canvas border border-hairline rounded-lg p-5">
      <CardHeader className="px-0 pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-base font-bold text-ink">Environment Variables</CardTitle>
          <CardDescription className="text-xs text-ink-mute">
            Configure system configurations and credentials for Vercel deployment targets.
          </CardDescription>
        </div>
        {!isFormOpen && (
          <Button
            onClick={handleOpenAdd}
            className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-8 rounded-sm px-3 flex items-center gap-1.5 cursor-pointer shadow-light"
          >
            <Plus className="size-3.5" />
            Add Variable
          </Button>
        )}
      </CardHeader>
      
      <Separator className="bg-hairline my-4" />

      <CardContent className="px-0 pb-0 space-y-6">
        {/* Form Container (Add/Edit) */}
        {isFormOpen && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              formData.append("projectId", vercelProjectId);
              formData.append("returnTo", returnTo);
              formData.append("target_production", String(targetProduction));
              formData.append("target_preview", String(targetPreview));
              formData.append("target_development", String(targetDevelopment));
              
              if (editingVar) {
                formData.append("envId", editingVar.id);
                startTransition(async () => {
                  await editProjectEnvAction(formData);
                  setIsFormOpen(false);
                });
              } else {
                startTransition(async () => {
                  await createProjectEnvAction(formData);
                  setIsFormOpen(false);
                });
              }
            }}
            className="bg-canvas-soft/40 p-4 border border-hairline rounded-md space-y-4 animate-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                {editingVar ? "Edit Environment Variable" : "New Environment Variable"}
              </h4>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-ink-mute hover:text-ink transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Key */}
              <div className="space-y-1.5">
                <Label htmlFor="env_key" className="text-xs font-semibold text-ink-secondary">Name (Key)</Label>
                <Input
                  id="env_key"
                  name="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                  placeholder="MY_API_URL"
                  required
                  disabled={isPending}
                  className="bg-canvas border-hairline focus:border-primary text-xs font-mono uppercase h-9 rounded-sm"
                />
              </div>

              {/* Comment */}
              <div className="space-y-1.5">
                <Label htmlFor="env_comment" className="text-xs font-semibold text-ink-secondary">Comment (Optional)</Label>
                <Input
                  id="env_comment"
                  name="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Connection URL for DB"
                  disabled={isPending}
                  className="bg-canvas border-hairline focus:border-primary text-xs h-9 rounded-sm"
                />
              </div>

              {/* Value */}
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="env_value" className="text-xs font-semibold text-ink-secondary">
                  Value {editingVar && <span className="text-[10px] text-ink-mute font-normal">(Leave blank to keep current value)</span>}
                </Label>
                <Input
                  id="env_value"
                  name="value"
                  type="password"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={editingVar ? "••••••••••••••••" : "enter secret value"}
                  required={!editingVar}
                  disabled={isPending}
                  className="bg-canvas border-hairline focus:border-primary text-xs font-mono h-9 rounded-sm"
                />
              </div>

              {/* Targets */}
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs font-semibold text-ink-secondary">Environments</Label>
                <div className="flex flex-wrap gap-6 pt-1 select-none">
                  <label className="flex items-center gap-2 text-xs text-ink cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={targetProduction}
                      onChange={(e) => setTargetProduction(e.target.checked)}
                      disabled={isPending}
                      className="size-3.5 rounded border-hairline accent-primary cursor-pointer"
                    />
                    Production
                  </label>
                  <label className="flex items-center gap-2 text-xs text-ink cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={targetPreview}
                      onChange={(e) => setTargetPreview(e.target.checked)}
                      disabled={isPending}
                      className="size-3.5 rounded border-hairline accent-primary cursor-pointer"
                    />
                    Preview
                  </label>
                  <label className="flex items-center gap-2 text-xs text-ink cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={targetDevelopment}
                      onChange={(e) => setTargetDevelopment(e.target.checked)}
                      disabled={isPending}
                      className="size-3.5 rounded border-hairline accent-primary cursor-pointer"
                    />
                    Development
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
                disabled={isPending}
                className="h-8 text-xs font-semibold text-ink-mute hover:text-ink hover:bg-canvas-soft rounded-sm px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-8 rounded-sm px-4 cursor-pointer shadow-light"
              >
                {isPending ? "Saving..." : editingVar ? "Update Variable" : "Add Variable"}
              </Button>
            </div>
          </form>
        )}

        {/* List of Variables */}
        <div className="rounded-md border border-hairline overflow-hidden">
          {vercelProjectEnvVars.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-mute bg-canvas-soft/10">
              <Shield className="size-6 mx-auto mb-2 text-ink-faint" />
              No environment variables configured for this project.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                  <TableHead className="px-5 py-2.5 text-[10px] uppercase font-bold text-ink-mute">Key</TableHead>
                  <TableHead className="px-5 py-2.5 text-[10px] uppercase font-bold text-ink-mute">Value</TableHead>
                  <TableHead className="px-5 py-2.5 text-[10px] uppercase font-bold text-ink-mute">Targets</TableHead>
                  <TableHead className="px-5 py-2.5 text-[10px] uppercase font-bold text-ink-mute w-1/4">Comment</TableHead>
                  <TableHead className="px-5 py-2.5 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vercelProjectEnvVars.map((env) => (
                  <TableRow key={env.id} className="border-b border-hairline hover:bg-canvas-soft/10 transition-colors">
                    {/* Key */}
                    <TableCell className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-ink">
                        <Lock className="size-3 text-ink-mute shrink-0" />
                        {env.key}
                      </div>
                    </TableCell>
                    
                    {/* Value */}
                    <TableCell className="px-5 py-3.5">
                      <div className="flex items-center gap-2 font-mono text-xs text-ink-mute select-none">
                        <span>{showValues[env.id] ? (env.value || "•••••••• (encrypted)") : "••••••••"}</span>
                        {env.value && (
                          <button
                            onClick={() => toggleValueVisibility(env.id)}
                            className="text-ink-mute hover:text-ink cursor-pointer"
                            type="button"
                          >
                            {showValues[env.id] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </button>
                        )}
                      </div>
                    </TableCell>

                    {/* Targets */}
                    <TableCell className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {env.target?.map((t: string) => (
                          <span
                            key={t}
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                              t === "production"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                : t === "preview"
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
                            }`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </TableCell>

                    {/* Comment */}
                    <TableCell className="px-5 py-3.5 text-xs text-ink-secondary">
                      {env.comment || "—"}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          onClick={() => handleOpenEdit(env)}
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          className="h-7 text-ink-secondary hover:text-ink hover:bg-canvas-soft px-2 rounded-sm text-xs cursor-pointer"
                        >
                          <Edit3 className="size-3.5" />
                        </Button>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (confirm("Are you sure you want to delete this environment variable?")) {
                              const formData = new FormData();
                              formData.append("projectId", vercelProjectId);
                              formData.append("envId", env.id);
                              formData.append("returnTo", returnTo);
                              startTransition(async () => {
                                await removeProjectEnvAction(formData);
                              });
                            }
                          }}
                        >
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 px-2 rounded-sm text-xs cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
