"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Database, 
  Sparkles, 
  Settings, 
  Table, 
  Save, 
  FileText,
  ShieldCheck,
  Smartphone,
  Monitor
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFormAction, deleteFormAction, updateFormSettingsAction } from "@/app/actions/forms";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Project {
  id: string;
  name: string;
}

interface FormField {
  id: string;
  type: "text" | "email" | "textarea" | "checkbox";
  label: string;
  placeholder: string;
  required: boolean;
}

interface FormSubmission {
  id: string;
  data: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  url: string;
  status: string;
  attempts: number;
  lastError: string | null;
  nextRetryAt: string | null;
  createdAt: string;
}

interface FormItem {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
  googleSheetsSync: boolean;
  salesforceSync: boolean;
  webhookUrl: string | null;
  webhookSecret: string | null;
  submissions: FormSubmission[];
  webhookDeliveries: WebhookDelivery[];
}

interface FormBuilderClientProps {
  projects: Project[];
  selectedProjectId: string;
  initialForms: FormItem[];
}

export function FormBuilderClient({ projects, selectedProjectId, initialForms }: FormBuilderClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeProjectId, setActiveProjectId] = useState(selectedProjectId);
  const [forms, setForms] = useState<FormItem[]>(initialForms);
  const [selectedForm, setSelectedForm] = useState<FormItem | null>(initialForms[0] || null);

  // Form Builder state
  const [newFormName, setNewFormName] = useState("");
  const [formFields, setFormFields] = useState<FormField[]>([
    { id: "f1", type: "text", label: "Full Name", placeholder: "John Doe", required: true },
    { id: "f2", type: "email", label: "Email Address", placeholder: "john@example.com", required: true },
    { id: "f3", type: "textarea", label: "Message / Feedback", placeholder: "Write your message here...", required: false }
  ]);
  const [googleSheetsSync, setGoogleSheetsSync] = useState(true);
  const [salesforceSync, setSalesforceSync] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isRetryingWebhooks, setIsRetryingWebhooks] = useState(false);
  
  const [copied, setCopied] = useState(false);
  const [spamBlockedCount, setSpamBlockedCount] = useState(14); // Simulated blocked spam submissions

  useEffect(() => {
    setForms(initialForms);
    if (initialForms.length > 0) {
      // Keep selected form active if it exists, otherwise default to first
      const currentActive = initialForms.find(f => f.id === selectedForm?.id);
      setSelectedForm(currentActive || initialForms[0]);
    } else {
      setSelectedForm(null);
    }
  }, [initialForms]);

  useEffect(() => {
    if (selectedForm) {
      setGoogleSheetsSync(selectedForm.googleSheetsSync ?? true);
      setSalesforceSync(selectedForm.salesforceSync ?? false);
      setWebhookUrl(selectedForm.webhookUrl || "");
      setWebhookSecret(selectedForm.webhookSecret || "");
    }
  }, [selectedForm?.id]);

  const handleSaveSettings = async () => {
    if (!selectedForm) return;
    setIsSavingSettings(true);
    try {
      const res = await updateFormSettingsAction(selectedForm.id, {
        googleSheetsSync,
        salesforceSync,
        webhookUrl: webhookUrl.trim() || null,
        webhookSecret: webhookSecret.trim() || null,
      });
      if (res.success) {
        toast.success("Settings and integrations saved successfully!");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRunRetryJob = async () => {
    setIsRetryingWebhooks(true);
    try {
      const res = await fetch("/api/cron/webhook-retry", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Retry job completed. Processed: ${data.processed}, Succeeded: ${data.succeeded}`);
        router.refresh();
      } else {
        toast.error(`Error running retry job: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(`Network error running retry job: ${err.message}`);
    } finally {
      setIsRetryingWebhooks(false);
    }
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value;
    setActiveProjectId(nextId);
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("projectId", nextId);
    router.push(`/dashboard/forms?${current.toString()}`);
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormName.trim()) return;

    const res = await createFormAction(activeProjectId, newFormName.trim());
    if (res.success && res.form) {
      setNewFormName("");
      router.refresh();
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (confirm("Are you sure you want to delete this static form? All submissions data will be lost.")) {
      const res = await deleteFormAction(formId);
      if (res.success) {
        router.refresh();
      }
    }
  };

  const addField = (type: "text" | "email" | "textarea" | "checkbox") => {
    const id = "field_" + Math.random().toString(36).substring(2, 9);
    let label = "New Field";
    let placeholder = "";

    if (type === "text") { label = "Subject"; placeholder = "Enter subject..."; }
    else if (type === "email") { label = "Contact Email"; placeholder = "email@domain.com"; }
    else if (type === "textarea") { label = "Description"; placeholder = "Enter details..."; }
    else if (type === "checkbox") { label = "Subscribe to newsletter"; }

    setFormFields([...formFields, { id, type, label, placeholder, required: false }]);
  };

  const removeField = (id: string) => {
    setFormFields(formFields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFormFields(formFields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const getEmbedCode = () => {
    if (!selectedForm) return "<!-- Select or create a form first -->";
    
    const fieldsHtml = formFields.map(f => {
      const reqAttr = f.required ? " required" : "";
      if (f.type === "textarea") {
        return `  <div class="form-group">\n    <label>${f.label}</label>\n    <textarea name="${f.label.toLowerCase().replace(/[^a-z0-9]/g, "_")}" placeholder="${f.placeholder}"${reqAttr}></textarea>\n  </div>`;
      }
      if (f.type === "checkbox") {
        return `  <div class="form-group-checkbox">\n    <input type="checkbox" name="${f.label.toLowerCase().replace(/[^a-z0-9]/g, "_")}" id="${f.id}"${reqAttr}>\n    <label for="${f.id}">${f.label}</label>\n  </div>`;
      }
      return `  <div class="form-group">\n    <label>${f.label}</label>\n    <input type="${f.type}" name="${f.label.toLowerCase().replace(/[^a-z0-9]/g, "_")}" placeholder="${f.placeholder}"${reqAttr}>\n  </div>`;
    }).join("\n\n");

    return `<form action="https://lepos.dev/api/forms/submit" method="POST">\n  <!-- LepoS WAF static configuration keys -->\n  <input type="hidden" name="formId" value="${selectedForm.id}">\n\n${fieldsHtml}\n\n  <button type="submit">Submit Response</button>\n</form>`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isMobile = (ua: string | null) => {
    if (!ua) return false;
    return /Mobi|Android|iPhone/i.test(ua);
  };

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Top Controller */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-hairline/10 backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="size-5 text-indigo-400" />
            Static Forms & Productivity Engine
          </h2>
          <p className="text-xs text-slate-400">
            Collect static HTML form submissions seamlessly with built-in Akismet spam protection and third-party syncs.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="project-select" className="text-xs font-semibold text-slate-400">
            Project:
          </label>
          <select
            id="project-select"
            value={activeProjectId}
            onChange={handleProjectChange}
            className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Side: Forms list */}
        <Card className="xl:col-span-1 border border-hairline bg-canvas-night/40 backdrop-blur-md shadow-lg flex flex-col max-h-[600px]">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-200">Your Static Forms</CardTitle>
            <CardDescription className="text-xs text-slate-400">Create & manage project form endpoints</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 overflow-hidden">
            {/* Create Form Form */}
            <form onSubmit={handleCreateForm} className="flex gap-2">
              <Input
                placeholder="Contact Form..."
                value={newFormName}
                onChange={(e) => setNewFormName(e.target.value)}
                className="h-8 text-xs bg-slate-900 border-slate-800 text-slate-100 focus:ring-indigo-500"
              />
              <Button type="submit" size="sm" className="h-8 bg-indigo-500 hover:bg-indigo-600">
                <Plus className="size-3.5" />
              </Button>
            </form>

            {/* List of Forms */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
              {forms.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  No forms created yet.
                </div>
              ) : (
                forms.map((f) => {
                  const isSelected = selectedForm?.id === f.id;
                  return (
                    <div
                      key={f.id}
                      className={`group w-full flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                        isSelected 
                          ? "bg-indigo-500/10 border-indigo-500/40" 
                          : "bg-slate-900/30 border-slate-900 hover:border-slate-800"
                      }`}
                      onClick={() => setSelectedForm(f)}
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-xs font-bold text-slate-200 truncate">{f.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {f.id.slice(0, 10)}...</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[9px] border-slate-800 text-slate-400 font-semibold">
                          {f.submissions.length} responses
                        </Badge>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteForm(f.id);
                          }}
                          className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Center: Visual Builder & Live Preview */}
        <Card className="xl:col-span-2 border border-hairline bg-canvas-night/40 backdrop-blur-md shadow-lg flex flex-col min-h-[600px]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-hairline/10 pb-4">
            <div>
              <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="size-4.5 text-indigo-400" />
                Visual Form Builder & Preview
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Design fields visually and view real-time form rendering.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-5 gap-6 flex-1 overflow-hidden">
            {/* Fields Palette */}
            <div className="md:col-span-2 border-r border-slate-900 pr-4 flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Add Form Fields</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  onClick={() => addField("text")} 
                  variant="outline" 
                  className="justify-start h-9 text-xs bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                >
                  <Plus className="size-3.5 mr-2 text-indigo-400" /> Text Input Field
                </Button>
                <Button 
                  onClick={() => addField("email")} 
                  variant="outline" 
                  className="justify-start h-9 text-xs bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                >
                  <Plus className="size-3.5 mr-2 text-blue-400" /> Email Input Field
                </Button>
                <Button 
                  onClick={() => addField("textarea")} 
                  variant="outline" 
                  className="justify-start h-9 text-xs bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                >
                  <Plus className="size-3.5 mr-2 text-amber-400" /> Textarea (Multiline)
                </Button>
                <Button 
                  onClick={() => addField("checkbox")} 
                  variant="outline" 
                  className="justify-start h-9 text-xs bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                >
                  <Plus className="size-3.5 mr-2 text-emerald-400" /> Checkbox / Consent
                </Button>
              </div>

              {/* Fields List Config */}
              <div className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Edit Form Layout</span>
                {formFields.map((field) => (
                  <div key={field.id} className="p-3 rounded-lg bg-slate-950/40 border border-slate-900 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold font-mono text-indigo-400 uppercase">{field.type}</span>
                      <button 
                        onClick={() => removeField(field.id)}
                        className="text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      placeholder="Field Label"
                      className="h-7 text-xs bg-slate-900 border-slate-800 text-slate-200"
                    />
                    {field.type !== "checkbox" && (
                      <Input
                        value={field.placeholder}
                        onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                        placeholder="Placeholder text"
                        className="h-7 text-xs bg-slate-900 border-slate-800 text-slate-400"
                      />
                    )}
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="rounded bg-slate-900 border-slate-800 text-indigo-500"
                      />
                      <span>Required field</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Form Preview Panel */}
            <div className="md:col-span-3 flex flex-col gap-4 overflow-hidden">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Preview Output</h4>
              <div className="flex-1 p-6 rounded-xl bg-slate-950/20 border border-slate-900/60 flex flex-col gap-4 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-100 mb-2">{selectedForm ? selectedForm.name : "Form Preview"}</h3>
                
                {formFields.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-xs italic border border-dashed border-slate-800 rounded-lg py-12">
                    Form has no input fields. Add fields from the left palette.
                  </div>
                ) : (
                  formFields.map((field) => (
                    <div key={field.id} className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                        {field.label}
                        {field.required && <span className="text-red-400">*</span>}
                      </Label>
                      
                      {field.type === "textarea" ? (
                        <textarea
                          readOnly
                          placeholder={field.placeholder}
                          className="w-full min-h-[70px] rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-2 text-xs text-slate-300 focus:outline-none"
                        />
                      ) : field.type === "checkbox" ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input type="checkbox" disabled className="rounded bg-slate-900 border-slate-800 text-indigo-500" />
                          <span className="text-xs text-slate-400">{field.label}</span>
                        </div>
                      ) : (
                        <Input
                          readOnly
                          type={field.type}
                          placeholder={field.placeholder}
                          className="h-9 bg-slate-900/80 border-slate-800 text-xs text-slate-300"
                        />
                      )}
                    </div>
                  ))
                )}

                <Button disabled className="w-full mt-4 bg-indigo-500/80 text-white font-bold text-xs h-9">
                  Submit Form
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Side: Integrations settings & HTML code */}
        <Card className="xl:col-span-1 border border-hairline bg-canvas-night/40 backdrop-blur-md shadow-lg flex flex-col max-h-[600px]">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Settings className="size-4.5 text-slate-400" />
              Settings & Integrations
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">Sync details and HTML output code</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 overflow-y-auto">
            {/* Sync Settings */}
            <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-slate-900/30 border border-slate-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">External Web Syncs</span>
              
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer py-1">
                <span>Google Sheets Sync</span>
                <input 
                  type="checkbox"
                  checked={googleSheetsSync}
                  onChange={(e) => setGoogleSheetsSync(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer py-1">
                <span>Salesforce Lead Sync</span>
                <input 
                  type="checkbox"
                  checked={salesforceSync}
                  onChange={(e) => setSalesforceSync(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-500"
                />
              </label>
            </div>

            {/* Webhook Settings */}
            <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-slate-900/30 border border-slate-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Database className="size-3 text-indigo-400" /> Custom Webhook Trigger
              </span>
              
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="webhook-url" className="text-[10px] text-slate-400">Webhook HTTP Endpoint</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://api.yourdomain.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="h-8 bg-slate-950 border-slate-800 text-xs text-slate-300 placeholder:text-slate-600"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="webhook-secret" className="text-[10px] text-slate-400">Webhook Secret Key (Optional)</Label>
                <Input
                  id="webhook-secret"
                  type="password"
                  placeholder="Secret signature token..."
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="h-8 bg-slate-950 border-slate-800 text-xs text-slate-300 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveSettings}
              disabled={isSavingSettings || !selectedForm}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs h-9 gap-1.5 transition"
            >
              <Save className="size-3.5" />
              {isSavingSettings ? "Saving Settings..." : "Save Settings & Syncs"}
            </Button>

            {/* Spam Counter */}
            <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-between text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-red-400">Akismet Shield</span>
                <span className="text-[10px] text-slate-400">Spam submissions blocked</span>
              </div>
              <Badge variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 font-bold font-mono">
                {spamBlockedCount} blocked
              </Badge>
            </div>

            {/* Embed HTML code output */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">HTML Code Snippet</span>
                <Button 
                  onClick={handleCopyCode} 
                  size="sm" 
                  variant="outline" 
                  className="h-7 px-2 text-[10px] bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 mr-1 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3 mr-1" /> Copy Code
                    </>
                  )}
                </Button>
              </div>
              <textarea
                readOnly
                value={getEmbedCode()}
                className="w-full h-[180px] p-2.5 rounded-lg bg-slate-950/80 border border-slate-900 font-mono text-[9px] text-slate-400 focus:outline-none"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Layout: Form Submissions & Webhook Deliveries Tabs */}
      {selectedForm && (
        <Card className="border border-hairline bg-canvas-night/40 backdrop-blur-md shadow-lg">
          <Tabs defaultValue="submissions" className="w-full">
            <CardHeader className="flex flex-row items-center justify-between border-b border-hairline/10 pb-4">
              <div className="flex flex-col gap-2">
                <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <Table className="size-4.5 text-indigo-400" />
                  Data Room ({selectedForm.name})
                </CardTitle>
                <TabsList className="bg-slate-950 border border-slate-900 h-8 p-0.5">
                  <TabsTrigger value="submissions" className="text-[10px] h-7 px-3.5 data-[state=active]:bg-slate-900 data-[state=active]:text-slate-100">
                    Submissions ({selectedForm.submissions.length})
                  </TabsTrigger>
                  <TabsTrigger value="webhooks" className="text-[10px] h-7 px-3.5 data-[state=active]:bg-slate-900 data-[state=active]:text-slate-100">
                    Webhook Deliveries ({(selectedForm.webhookDeliveries || []).length})
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Retry Webhooks Trigger Button */}
              <Button
                onClick={handleRunRetryJob}
                disabled={isRetryingWebhooks}
                variant="outline"
                className="h-8 text-[10px] bg-slate-950 border-slate-900 hover:bg-slate-900 hover:text-slate-100 text-slate-400 gap-1.5"
              >
                <RefreshCw className={`size-3.5 ${isRetryingWebhooks ? "animate-spin" : ""}`} />
                Process Retries
              </Button>
            </CardHeader>

            <CardContent className="pt-6">
              <TabsContent value="submissions" className="mt-0 focus:outline-none">
                {selectedForm.submissions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs italic">
                    No submissions recorded yet for this form. Send a POST request containing `formId: "${selectedForm.id}"` to try it out.
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto rounded-xl border border-slate-900">
                    <table className="w-full border-collapse text-left text-xs text-slate-300">
                      <thead className="bg-slate-950/40 border-b border-slate-900 font-bold text-slate-200">
                        <tr>
                          <th className="p-3.5">Submission Date</th>
                          <th className="p-3.5">IP Address</th>
                          <th className="p-3.5">Device Agent</th>
                          <th className="p-3.5">Payload Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 bg-slate-900/10">
                        {selectedForm.submissions.map((sub) => {
                          const devIcon = isMobile(sub.userAgent) ? (
                            <Smartphone className="size-3.5 text-slate-500 mr-1 inline" />
                          ) : (
                            <Monitor className="size-3.5 text-slate-500 mr-1 inline" />
                          );

                          return (
                            <tr key={sub.id} className="hover:bg-slate-900/30 transition">
                              <td className="p-3.5 font-medium whitespace-nowrap">
                                {new Date(sub.createdAt).toLocaleString()}
                              </td>
                              <td className="p-3.5 font-mono text-slate-400">
                                {sub.ipAddress || "Unknown"}
                              </td>
                              <td className="p-3.5 text-slate-400 truncate max-w-[200px]" title={sub.userAgent || ""}>
                                {devIcon}
                                {sub.userAgent || "Unknown"}
                              </td>
                              <td className="p-3.5">
                                <div className="p-2 rounded bg-slate-950/60 border border-slate-900 font-mono text-[10px] text-indigo-300 max-w-sm overflow-x-auto">
                                  {JSON.stringify(sub.data)}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="webhooks" className="mt-0 focus:outline-none">
                {(!selectedForm.webhookDeliveries || selectedForm.webhookDeliveries.length === 0) ? (
                  <div className="text-center py-12 text-slate-500 text-xs italic">
                    No webhook deliveries recorded yet for this form. Set a Webhook URL and submit a response to trigger.
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto rounded-xl border border-slate-900">
                    <table className="w-full border-collapse text-left text-xs text-slate-300">
                      <thead className="bg-slate-950/40 border-b border-slate-900 font-bold text-slate-200">
                        <tr>
                          <th className="p-3.5">Triggered At</th>
                          <th className="p-3.5">Endpoint URL</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">Attempts</th>
                          <th className="p-3.5">Last Error</th>
                          <th className="p-3.5">Next Retry</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 bg-slate-900/10">
                        {selectedForm.webhookDeliveries.map((delivery) => {
                          const statusBadge = 
                            delivery.status === "SUCCESS" ? (
                              <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                                SUCCESS
                              </Badge>
                            ) : delivery.status === "PENDING" ? (
                              <Badge className="bg-amber-500/10 border-amber-500/20 text-amber-400 font-bold text-[10px] animate-pulse">
                                PENDING
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-500/10 border-rose-500/20 text-rose-400 font-bold text-[10px]">
                                FAILED
                              </Badge>
                            );

                          return (
                            <tr key={delivery.id} className="hover:bg-slate-900/30 transition">
                              <td className="p-3.5 font-medium whitespace-nowrap">
                                {new Date(delivery.createdAt).toLocaleString()}
                              </td>
                              <td className="p-3.5 font-mono text-slate-400 max-w-[200px] truncate" title={delivery.url}>
                                {delivery.url}
                              </td>
                              <td className="p-3.5 whitespace-nowrap">
                                {statusBadge}
                              </td>
                              <td className="p-3.5 font-mono text-slate-400 text-center">
                                {delivery.attempts} / 5
                              </td>
                              <td className="p-3.5 text-rose-400 max-w-[200px] truncate font-mono text-[10px]" title={delivery.lastError || ""}>
                                {delivery.lastError || <span className="text-slate-600">-</span>}
                              </td>
                              <td className="p-3.5 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                                {delivery.nextRetryAt ? new Date(delivery.nextRetryAt).toLocaleTimeString() : <span className="text-slate-600">-</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}
