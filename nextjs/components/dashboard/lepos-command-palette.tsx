"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Terminal, 
  Shield, 
  Folder, 
  ToggleLeft, 
  Settings, 
  HelpCircle,
  FileText,
  Sparkles,
  Loader2
} from "lucide-react";
import { executeAiCommandAction } from "@/app/actions/ai-command";

export function LeposCommandPalette({ projectId }: { projectId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAiCommand = async () => {
    if (!search.trim()) return;
    try {
      setLoading(true);
      setAiMessage(null);
      
      const result = await executeAiCommandAction(search, projectId);
      
      if (result.type === "navigate" && result.path) {
        router.push(result.path);
        setIsOpen(false);
      } else if (result.type === "block_ip") {
        setAiMessage(result.message || `[AI] Đã chặn IP thành công.`);
        setTimeout(() => {
          router.refresh();
          setIsOpen(false);
          setAiMessage(null);
        }, 2000);
      } else if (result.type === "toggle_flag") {
        setAiMessage(result.message || `[AI] Đã cập nhật cờ tính năng.`);
        setTimeout(() => {
          router.refresh();
          setIsOpen(false);
          setAiMessage(null);
        }, 2000);
      } else if (result.type === "trigger_build") {
        setAiMessage(result.message || `[AI] Đã kích hoạt build mới.`);
        setTimeout(() => {
          router.refresh();
          setIsOpen(false);
          setAiMessage(null);
        }, 2000);
      } else if (result.type === "view_logs") {
        setAiMessage(result.message || `[AI] Đang chuyển hướng xem logs dự án...`);
        setTimeout(() => {
          router.push("/dashboard");
          setIsOpen(false);
          setAiMessage(null);
        }, 2000);
      } else if (result.type === "unknown") {
        setAiMessage(result.message || "Không hiểu lệnh này.");
      }
    } catch (err: any) {
      setAiMessage("Gặp lỗi khi xử lý lệnh AI: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAiCommand();
    }
  };

  if (!isOpen) return null;

  const commands = [
    { icon: Folder, name: "Go to Projects", description: "View all active deployment projects", action: () => router.push("/dashboard") },
    { icon: Shield, name: "WAF & Firewall Config", description: "Manage blocked IPs and country rules", action: () => router.push("/dashboard/settings/security") },
    { icon: Terminal, name: "LepoShip Mobile WebView Builder", description: "Open WebView bundle manager", action: () => router.push("/lepoship") },
    { icon: ToggleLeft, name: "Feature Flags", description: "Toggle experimental features", action: () => router.push("/dashboard/platform") },
    { icon: FileText, name: "API Documentation", description: "Read API integration specs", action: () => router.push("/docs") },
    { icon: Settings, name: "Workspace Governance", description: "Manage members and billing limits", action: () => router.push("/dashboard/settings") }
  ];

  const filteredCommands = commands.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Palette Container */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-100 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input */}
        <div className="flex items-center border-b border-zinc-800 px-4 py-3">
          <Search className="h-5 w-5 text-zinc-400 mr-3" />
          <input
            type="text"
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
            placeholder="Search projects or ask AI (e.g., 'chặn IP 1.2.3.4')..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoFocus
          />
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          ) : (
            <div className="flex items-center gap-1.5">
              <button 
                onClick={handleAiCommand}
                className="flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/30 transition"
              >
                <Sparkles className="h-3 w-3" /> Ask AI
              </button>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-zinc-800 bg-zinc-950 px-1.5 font-mono text-[10px] font-medium text-zinc-500">
                ENTER
              </kbd>
            </div>
          )}
        </div>

        {/* AI Messages / Warnings */}
        {aiMessage && (
          <div className="border-b border-zinc-800 bg-emerald-950/20 px-4 py-2 text-xs text-emerald-400">
            {aiMessage}
          </div>
        )}

        {/* Commands List */}
        <div className="max-h-[320px] overflow-y-auto p-2 space-y-1">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    cmd.action();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 transition-all duration-150 group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-850 bg-zinc-950/40 text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors mr-3">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{cmd.name}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{cmd.description}</p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
              <HelpCircle className="h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-xs">No direct commands match. Press <strong>Enter</strong> to run query with AI command assistant.</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950/40 px-4 py-2 text-[10px] text-zinc-500">
          <span>Tip: Press <kbd className="font-mono text-zinc-400 font-bold bg-zinc-900 px-1 py-0.5 rounded">⌘K</kbd> to open anytime</span>
          <span>Use arrows to navigate</span>
        </div>
      </div>
    </div>
  );
}
