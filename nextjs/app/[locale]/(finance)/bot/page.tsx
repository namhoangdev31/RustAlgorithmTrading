"use client";

import { useState, useEffect, use } from "react";
import { useTranslations } from "next-intl";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { LiveDashboardPanel } from "@/components/bfxps/live-dashboard-panel";
import { TradingViewPanel } from "@/components/bfxps/trading-view-panel";
import { ChatConversationPanel } from "@/components/bfxps/chat-conversation-panel";
import { QaLibraryPanel } from "@/components/bfxps/qa-library-panel";
import { TradeHistoryModal } from "@/components/bfxps/trade-history-modal";
import {
  MarketSnapshot,
  TradingPlan,
  ConsensusResult,
} from "@/lib/server/quant/types";
import {
  Database,
  HelpCircle,
  Bot,
  BarChart2,
  Zap,
  RotateCcw,
  LayoutGrid,
} from "lucide-react";

export default function LeposTradingBotPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [plans, setPlans] = useState<TradingPlan[]>([]);
  const [consensus, setConsensus] = useState<ConsensusResult | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string>("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [recalibrateNotice, setRecalibrateNotice] = useState<string | null>(
    null,
  );
  const [isNoticeDismissed, setIsNoticeDismissed] = useState(false);

  // Responsive & Tab states
  const [mobileTab, setMobileTab] = useState<
    "chart" | "advisor" | "chat" | "qa"
  >("chart");
  const [sidebarTab, setSidebarTab] = useState<"advisor" | "chat" | "qa">(
    "advisor",
  );
  const [layoutMode, setLayoutMode] = useState<"split" | "three_columns">(
    "split",
  );
  const [activeRightTab, setActiveRightTab] = useState<"chat" | "qa">("chat");

  const fetchHealth = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const res = await fetch(`/api/bfxps/health?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.live_market) setSnapshot(data.live_market);
        if (data.plans) setPlans(data.plans);
        if (data.consensus) setConsensus(data.consensus);
        if (data.summary) setSummary(data.summary);
      }
    } catch (e) {
      // Ignore network errors
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth(false);
    // Background polling every 4s realtime
    const interval = setInterval(() => {
      fetchHealth(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSendChat = async (
    question: string,
    ohlcOverrides?: {
      open?: number;
      high?: number;
      low?: number;
      close?: number;
    },
  ) => {
    const res = await fetch("/api/bfxps/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        snapshot,
        plans,
        session_open: ohlcOverrides?.open,
        session_high: ohlcOverrides?.high,
        session_low: ohlcOverrides?.low,
        live_price: ohlcOverrides?.close,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      answer: data.answer || tChat("error_no_reply"),
      hasChart: (data.charts || []).length > 0,
    };
  };

  const handleRecalibrateAfterSl = async () => {
    if (isRecalibrating) return;
    setIsRecalibrating(true);
    try {
      const res = await fetch("/api/bfxps/recalibrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cutlossPrice:
            currentPlan?.execution?.exitPrice ?? currentPlan?.slPrice,
          force: true,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        // Cập nhật ngay lập tức kế hoạch mới vào React state để UI lập tức đổi sang kèo mới
        if (data.plan) {
          setPlans((prev) => {
            const simIdx = prev.findIndex((p) => p.engine === "simcarrry6");
            const newPlan = {
              ...data.plan,
              profile: "RECALIBRATED_AFTER_SL",
              execution: data.execution || (simIdx >= 0 ? prev[simIdx].execution : undefined),
            };
            if (simIdx >= 0) {
              const updated = [...prev];
              updated[simIdx] = newPlan;
              return updated;
            }
            return [newPlan, ...prev];
          });
        }
        setIsNoticeDismissed(false);
        setRecalibrateNotice(data.message);
        // Giữ thông báo cố định để người dùng luôn theo dõi được thông số kèo tối ưu tới hết phiên
        await fetchHealth(false);
      } else {
        alert(data.error || "Không thể tái lập kèo lúc này");
      }
    } catch (err: any) {
      alert("Lỗi kết nối khi tái lập kèo: " + err?.message);
    } finally {
      setIsRecalibrating(false);
    }
  };

  const tHeader = useTranslations("Bfxps.header");
  const tChat = useTranslations("Bfxps.chat");
  const currentPlan =
    plans.find((p) => p.engine === "simcarrry6") ||
    plans.find((p) => p.isCanonical) ||
    plans[0];
  const isCurrentShort = currentPlan?.side === "SHORT";
  const isSlHit =
    currentPlan?.execution?.status === "EXIT_SL" ||
    currentPlan?.status === "FILLED_SL" ||
    false;
  const isRecalibrated =
    currentPlan?.profile === "RECALIBRATED_AFTER_SL" ||
    currentPlan?.resolvedSource?.includes("REVERSAL") ||
    currentPlan?.resolvedSource?.includes("SESSION_OPTIMAL") ||
    currentPlan?.reason?.includes("tái lập sau Stop Loss") ||
    currentPlan?.reason?.includes("Tối ưu toàn phiên") ||
    false;

  const cleanPlanReason = currentPlan?.reason
    ? currentPlan.reason
        .replace(/^(\[Tối ưu toàn phiên\]\s*)+/, "")
        .split(" | ")[0]
        .trim()
    : "";

  const activeNoticeMessage =
    recalibrateNotice ||
    (isRecalibrated && !isNoticeDismissed
      ? cleanPlanReason ||
        `Đã tính toán toàn bộ phiên: Đảo sang ${currentPlan?.side} @ ${currentPlan?.entryPrice?.toFixed(1)}, TP ${currentPlan?.tpPrice?.toFixed(1)}, SL ${currentPlan?.slPrice?.toFixed(1)} (Hiệu lực tới kết thúc phiên ATC)`
      : null);

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] w-full max-w-[100vw] flex-col bg-[#070a0f] text-slate-100 antialiased selection:bg-sky-500/30 selection:text-white overflow-hidden">
      {/* Top Banner Consensus Bar */}
      <header className="border-b border-white/[0.08] bg-[#090d16]/90 backdrop-blur-xl px-2.5 sm:px-4 py-2 sm:py-2.5 z-20 shadow-lg shrink-0 w-full overflow-hidden">
        <div className="flex items-center justify-between gap-1.5 sm:gap-4 w-full">
          {/* Brand Identity */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 items-center justify-center">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full ${isCurrentShort ? "bg-rose-400" : "bg-emerald-400"} opacity-75`}
              ></span>
              <span
                className={`relative inline-flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${isCurrentShort ? "bg-rose-500 shadow-[0_0_10px_#f43f5e]" : "bg-emerald-500 shadow-[0_0_10px_#10b981]"}`}
              ></span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-black tracking-wider text-white text-xs sm:text-sm bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                <span className="sm:hidden">LepoBot</span>
                <span className="hidden sm:inline">{tHeader("title")}</span>
              </span>
              <span className="rounded-md bg-sky-500/10 px-1 sm:px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-sky-400">
                VN30F1M
              </span>
            </div>
          </div>

          {/* Canonical Strategy Ticker Pills - Visible on sm and up */}
          <div className="hidden md:flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
            <div
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-bold shadow-sm ${
                isCurrentShort
                  ? "bg-rose-500/15 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.12)]"
                  : "bg-emerald-500/15 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.12)]"
              }`}
            >
              <span
                className={`text-[11px] ${isCurrentShort ? "text-rose-300/80" : "text-emerald-300/80"}`}
              >
                {isRecalibrated ? "KÈO TỐI ƯU (ATC):" : `${tHeader("canonical_plan")}:`}
              </span>
              <span className="font-mono text-white tracking-tight">
                {currentPlan
                  ? `${currentPlan.side} @ ${currentPlan.entryPrice?.toFixed(1) ?? "--"}`
                  : "--"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-md bg-sky-500/15 px-2.5 py-1 text-sky-400 font-semibold shadow-sm">
              <span className="text-[11px] text-sky-300/80">TP:</span>
              <span className="font-mono font-bold text-white tracking-tight">
                {currentPlan?.tpPrice ? currentPlan.tpPrice.toFixed(1) : "--"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-md bg-rose-500/15 px-2.5 py-1 text-rose-400 font-semibold shadow-sm">
              <span className="text-[11px] text-rose-300/80">SL:</span>
              <span className="font-mono font-bold text-white tracking-tight">
                {currentPlan?.slPrice ? currentPlan.slPrice.toFixed(1) : "--"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 text-xs">
            <div className="hidden lg:flex items-center gap-1 rounded-md bg-[#101624] p-0.5 font-mono text-[11px] shadow-sm">
              <button
                onClick={handleRecalibrateAfterSl}
                disabled={isRecalibrating}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-bold transition-all cursor-pointer select-none shadow-sm ${
                  isRecalibrating
                    ? "bg-amber-500/20 text-amber-300"
                    : isSlHit
                      ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30 animate-pulse hover:bg-amber-400"
                      : isRecalibrated
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-white/[0.04] text-slate-400 hover:text-slate-200"
                }`}
                title={
                  isSlHit
                    ? tHeader("recalibrate_sl_tooltip_active")
                    : isRecalibrated
                      ? tHeader("recalibrate_sl_ready")
                      : tHeader("recalibrate_sl_tooltip_standby")
                }
              >
                <RotateCcw
                  className={`h-3 w-3 ${
                    isRecalibrating
                      ? "animate-spin text-amber-400"
                      : isSlHit
                        ? "text-slate-950"
                        : isRecalibrated
                          ? "text-emerald-400"
                          : "text-slate-400"
                  }`}
                />
                <span>
                  {isRecalibrating
                    ? tHeader("recalibrate_sl_loading")
                    : isSlHit
                      ? tHeader("recalibrate_sl_active")
                      : isRecalibrated
                        ? tHeader("recalibrate_sl_ready")
                        : tHeader("recalibrate_sl_standby")}
                </span>
                {isSlHit && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-950 opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-slate-950"></span>
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={handleRecalibrateAfterSl}
              disabled={isRecalibrating}
              className={`lg:hidden flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm ${
                isRecalibrating
                  ? "bg-amber-500/20 text-amber-300"
                  : isSlHit
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30 animate-pulse"
                    : isRecalibrated
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-[#101624] text-slate-300 hover:text-white"
              }`}
              title={
                isSlHit
                  ? tHeader("recalibrate_sl_tooltip_active")
                  : isRecalibrated
                    ? tHeader("recalibrate_sl_ready")
                    : tHeader("recalibrate_sl_tooltip_standby")
              }
            >
              <RotateCcw
                className={`h-3 w-3 shrink-0 ${
                  isRecalibrating
                    ? "animate-spin text-amber-400"
                    : isSlHit
                      ? "text-slate-950"
                      : isRecalibrated
                        ? "text-emerald-400"
                        : "text-slate-400"
                }`}
              />
              <span className="text-[10px] font-bold">
                <span className="sm:hidden">
                  {isRecalibrating
                    ? "Quét..."
                    : isSlHit
                      ? "Tối Ưu SL"
                      : "Tối Ưu"}
                </span>
                <span className="hidden sm:inline">
                  {isRecalibrating
                    ? tHeader("recalibrate_sl_loading")
                    : isSlHit
                      ? tHeader("recalibrate_sl_active")
                      : isRecalibrated
                        ? tHeader("recalibrate_sl_ready")
                        : tHeader("recalibrate_sl_standby")}
                </span>
              </span>
            </button>

            {/* Sổ Lệnh Lịch Sử Button - Lấy dữ liệu THẬT (Nút nổi không border) */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="group flex items-center gap-1 sm:gap-2 rounded-md bg-sky-600 hover:bg-sky-500 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-bold text-white transition-all shadow-md shadow-sky-600/25 cursor-pointer shrink-0"
              title={tHeader("history_button_tooltip")}
            >
              <Database className="h-3.5 w-3.5 text-white group-hover:scale-110 transition-transform shrink-0" />
              <span className="hidden sm:inline">
                {summary?.totalSessions != null
                  ? tHeader("history_button", {
                      count: summary.totalSessions,
                    })
                  : tHeader("history_button_loading")}
              </span>
              <span className="sm:hidden font-mono text-[10px]">
                {summary?.totalSessions != null
                  ? `${summary.totalSessions}P`
                  : "--"}
              </span>
              <span className="rounded bg-white/20 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-mono text-white font-bold">
                {summary?.totalPnl != null
                  ? `${summary.totalPnl > 0 ? "+" : ""}${summary.totalPnl.toFixed(1)}đ`
                  : "--"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {activeNoticeMessage && !isNoticeDismissed && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-3 sm:px-4 py-2 text-xs text-emerald-300 font-mono flex items-center justify-between animate-in fade-in slide-in-from-top-1 z-30 shadow-md">
          <div className="flex items-center gap-2 overflow-hidden mr-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="truncate sm:whitespace-normal leading-relaxed font-semibold">
              {activeNoticeMessage}
            </span>
          </div>
          <button
            onClick={() => {
              setIsNoticeDismissed(true);
              setRecalibrateNotice(null);
            }}
            title="Đóng thông báo"
            className="text-slate-400 hover:text-white text-xs cursor-pointer p-1 rounded hover:bg-emerald-500/20 shrink-0 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex md:hidden flex-1 overflow-hidden p-2 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        <div className="h-full w-full">
          {mobileTab === "chart" && (
            <TradingViewPanel snapshot={snapshot} plan={currentPlan} />
          )}
          {mobileTab === "advisor" && (
            <LiveDashboardPanel
              snapshot={snapshot}
              plans={plans}
              consensus={consensus}
              summary={summary}
              onRefresh={fetchHealth}
              isLoading={isLoading}
              onOpenHistory={() => setIsHistoryOpen(true)}
            />
          )}
          {mobileTab === "chat" && (
            <div className="h-full w-full rounded-lg border border-white/[0.08] bg-[#0b0f17]/90 shadow-2xl backdrop-blur-xl overflow-hidden">
              <ChatConversationPanel
                snapshot={snapshot}
                onSendQuestion={handleSendChat}
                externalQuestion={activeQuestion}
                onQuestionConsumed={() => setActiveQuestion("")}
              />
            </div>
          )}
          {mobileTab === "qa" && (
            <div className="h-full w-full rounded-lg border border-white/[0.08] bg-[#0b0f17]/90 shadow-2xl backdrop-blur-xl overflow-hidden">
              <QaLibraryPanel
                onSelectQuestion={(q) => {
                  setActiveQuestion(q);
                  setMobileTab("chat");
                }}
              />
            </div>
          )}
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/[0.08] bg-[#070a0f]/95 backdrop-blur-xl px-2 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => setMobileTab("chart")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-md text-[10px] font-bold transition-all ${
              mobileTab === "chart"
                ? "text-emerald-400 bg-emerald-500/15 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>{tHeader("tab_chart")}</span>
          </button>

          <button
            onClick={() => setMobileTab("advisor")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-md text-[10px] font-bold transition-all ${
              mobileTab === "advisor"
                ? "text-sky-300 bg-sky-600/20 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>{tHeader("tab_advisor")}</span>
          </button>

          <button
            onClick={() => setMobileTab("chat")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-md text-[10px] font-bold transition-all ${
              mobileTab === "chat"
                ? "text-sky-300 bg-sky-600/20 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>{tHeader("tab_copilot")}</span>
          </button>

          <button
            onClick={() => setMobileTab("qa")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-md text-[10px] font-bold transition-all ${
              mobileTab === "qa"
                ? "text-amber-300 bg-amber-500/15 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>{tHeader("tab_qa")}</span>
          </button>
        </nav>
      </div>

      <main className="hidden md:flex flex-1 overflow-hidden p-2.5 sm:p-3">
        {layoutMode === "split" ? (
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full w-full gap-2.5"
          >
            <ResizablePanel
              id="lap-chart"
              defaultSize="64%"
              minSize="50%"
              maxSize="75%"
              className="h-full"
            >
              <TradingViewPanel snapshot={snapshot} plan={currentPlan} />
            </ResizablePanel>

            <ResizableHandle
              withHandle
              className="w-1.5 bg-white/[0.06] hover:bg-sky-500/60 transition-colors rounded"
            />

            <ResizablePanel
              id="lap-sidebar"
              defaultSize="36%"
              minSize="25%"
              maxSize="50%"
              className="h-full"
            >
              <div className="flex h-full flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-[#0b0f17]/90 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#090d16]/80 px-3 py-2 shrink-0">
                  <div className="flex items-center gap-1 rounded-md bg-[#101624] p-0.5 shadow-sm">
                    <button
                      onClick={() => setSidebarTab("advisor")}
                      className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        sidebarTab === "advisor"
                          ? "bg-emerald-500/20 text-emerald-300 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{tHeader("tab_advisor")}</span>
                    </button>

                    <button
                      onClick={() => setSidebarTab("chat")}
                      className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        sidebarTab === "chat"
                          ? "bg-sky-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Bot className="h-3.5 w-3.5 text-sky-400" />
                      <span>{tHeader("tab_copilot")}</span>
                    </button>

                    <button
                      onClick={() => setSidebarTab("qa")}
                      className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        sidebarTab === "qa"
                          ? "bg-amber-500/20 text-amber-300 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                      <span>{tHeader("tab_qa")}</span>
                    </button>
                  </div>

                  <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                    {sidebarTab === "advisor"
                      ? tHeader("canonical_badge")
                      : sidebarTab === "chat"
                        ? tChat("analysis_badge")
                        : tChat("qa_count_badge")}
                  </span>
                </div>

                {/* Sidebar Active Tab Content */}
                <div className="flex-1 overflow-hidden">
                  {sidebarTab === "advisor" && (
                    <LiveDashboardPanel
                      snapshot={snapshot}
                      plans={plans}
                      consensus={consensus}
                      summary={summary}
                      onRefresh={fetchHealth}
                      isLoading={isLoading}
                      onOpenHistory={() => setIsHistoryOpen(true)}
                    />
                  )}
                  {sidebarTab === "chat" && (
                    <ChatConversationPanel
                      snapshot={snapshot}
                      onSendQuestion={handleSendChat}
                      externalQuestion={activeQuestion}
                      onQuestionConsumed={() => setActiveQuestion("")}
                    />
                  )}
                  {sidebarTab === "qa" && (
                    <QaLibraryPanel
                      onSelectQuestion={(q) => {
                        setActiveQuestion(q);
                        setSidebarTab("chat");
                      }}
                    />
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          // DESKTOP 3-COLUMN EXPANDED MODE (Balanced: 28% / 44% / 28%)
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full w-full gap-2.5"
          >
            {/* Panel 1: Live Dashboard Kèo Duy Nhất */}
            <ResizablePanel
              id="p1-dashboard"
              defaultSize="28%"
              minSize="22%"
              maxSize="35%"
              className="h-full"
            >
              <LiveDashboardPanel
                snapshot={snapshot}
                plans={plans}
                consensus={consensus}
                summary={summary}
                onRefresh={fetchHealth}
                isLoading={isLoading}
                onOpenHistory={() => setIsHistoryOpen(true)}
              />
            </ResizablePanel>

            <ResizableHandle
              withHandle
              className="w-1.5 bg-white/[0.06] hover:bg-sky-500/60 transition-colors rounded"
            />

            {/* Panel 2: TradingView Center Panel */}
            <ResizablePanel
              id="p2-tradingview"
              defaultSize="44%"
              minSize="35%"
              maxSize="55%"
              className="h-full"
            >
              <TradingViewPanel snapshot={snapshot} plan={currentPlan} />
            </ResizablePanel>

            <ResizableHandle
              withHandle
              className="w-1.5 bg-white/[0.06] hover:bg-sky-500/60 transition-colors rounded"
            />

            {/* Panel 3: Chat Advisor & QA */}
            <ResizablePanel
              id="p3-chat"
              defaultSize="28%"
              minSize="22%"
              maxSize="35%"
              className="h-full"
            >
              <div className="flex h-full flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-[#0b0f17]/90 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#090d16]/80 px-3 py-2 shrink-0">
                  <div className="flex items-center gap-1 rounded-md bg-[#101624] p-0.5 shadow-sm">
                    <button
                      onClick={() => setActiveRightTab("chat")}
                      className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        activeRightTab === "chat"
                          ? "bg-sky-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Bot className="h-3.5 w-3.5" />
                      <span>{tChat("tab_advisor")}</span>
                    </button>
                    <button
                      onClick={() => setActiveRightTab("qa")}
                      className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        activeRightTab === "qa"
                          ? "bg-sky-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>{tChat("tab_qa")}</span>
                    </button>
                  </div>

                  <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                    {activeRightTab === "chat"
                      ? tChat("analysis_badge")
                      : tChat("qa_count_badge")}
                  </span>
                </div>

                <div className="flex-1 overflow-hidden">
                  {activeRightTab === "chat" ? (
                    <ChatConversationPanel
                      snapshot={snapshot}
                      onSendQuestion={handleSendChat}
                      externalQuestion={activeQuestion}
                      onQuestionConsumed={() => setActiveQuestion("")}
                    />
                  ) : (
                    <QaLibraryPanel
                      onSelectQuestion={(q) => {
                        setActiveQuestion(q);
                        setActiveRightTab("chat");
                      }}
                    />
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </main>

      {/* Sổ Lệnh Lịch Sử Kiểm Định & Thực Chiến (Database PostgreSQL) */}
      <TradeHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        livePlans={plans}
        liveSnapshot={snapshot}
      />
    </div>
  );
}
