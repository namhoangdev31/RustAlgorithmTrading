"use client";

import React, { useState, useEffect, use } from "react";
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
  Activity,
  ShieldCheck,
  Database,
  HelpCircle,
  Bot,
  BarChart2,
  Zap,
  Columns3,
  LayoutGrid,
} from "lucide-react";

export default function LeposTradingBotPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  const [snapshot, setSnapshot] = useState<MarketSnapshot>({
    open: 1946.0,
    high: 1948.5,
    low: 1936.2,
    current: 1940.0,
    volume: 18450.0,
    oi: 34210.0,
    basis: -4.2,
    foreignBuy: 450.0,
    foreignSell: 380.0,
    foreignNet: 70.0,
    timestamp: "2026-09-11T14:45:00.000Z",
    source: "DNSE_VN30F1M_2026_09_11",
  });

  const [plans, setPlans] = useState<TradingPlan[]>([
    {
      id: "CANONICAL_2026-09-14",
      date: "2026-09-14",
      engine: "CanonicalDirectionalBreakout",
      profile: "M1_INTRADAY",
      horizon: "t",
      side: "LONG",
      entryPrice: 1945.3,
      tpPrice: 1961.3,
      slPrice: 1937.3,
      maxCap: 0.3,
      r5State: "PRE_OPEN",
      status: "ACTIVE_TODAY",
      isCanonical: true,
      resolvedSource: "CANONICAL_PRE_OPEN_VOLATILITY_EXPANSION",
    },
  ]);

  const [consensus, setConsensus] = useState<ConsensusResult>({
    direction: "LONG",
    strength: 1.0,
    longCount: 1,
    shortCount: 0,
    isUnanimous: true,
    excludedEngines: [],
  });

  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string>("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Responsive & Tab states
  const [mobileTab, setMobileTab] = useState<"chart" | "advisor" | "chat" | "qa">("chart");
  const [sidebarTab, setSidebarTab] = useState<"advisor" | "chat" | "qa">("advisor");
  const [layoutMode, setLayoutMode] = useState<"split" | "three_columns">("split");
  const [activeRightTab, setActiveRightTab] = useState<"chat" | "qa">("chat");

  const fetchHealth = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const res = await fetch("/api/bfxps/health");
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
    // Background polling every 8s
    const interval = setInterval(() => {
      fetchHealth(true);
    }, 8000);
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

  const tHeader = useTranslations("Bfxps.header");
  const tChat = useTranslations("Bfxps.chat");
  const currentPlan = plans[0];

  return (
    <div className="flex h-screen w-full flex-col bg-[#070a0f] text-slate-100 antialiased selection:bg-sky-500/30 selection:text-white overflow-hidden">
      {/* Top Banner Consensus Bar */}
      <header className="border-b border-white/[0.08] bg-[#090d16]/90 backdrop-blur-xl px-3 sm:px-4 py-2 sm:py-2.5 z-20 shadow-lg shrink-0">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black tracking-wider text-white text-xs sm:text-sm bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {tHeader("title")}
              </span>
              <span className="rounded-md bg-sky-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-sky-400 border border-sky-500/20">
                VN30F1M
              </span>
            </div>
          </div>

          {/* Canonical Strategy Ticker Pills - Visible on sm and up */}
          <div className="hidden md:flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.12)]">
              <span className="text-[11px] text-emerald-300/80">
                {tHeader("canonical_plan")}:
              </span>
              <span className="font-mono text-white tracking-tight">
                {currentPlan?.side || "LONG"} @{" "}
                {currentPlan?.entryPrice?.toFixed(1) || "1945.3"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-sky-400 font-semibold shadow-[0_0_15px_rgba(56,189,248,0.1)]">
              <span className="text-[11px] text-sky-300/80">TP:</span>
              <span className="font-mono font-bold text-white tracking-tight">
                {currentPlan?.tpPrice?.toFixed(1) || "1961.3"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-rose-400 font-semibold shadow-[0_0_15px_rgba(244,63,94,0.1)]">
              <span className="text-[11px] text-rose-300/80">SL:</span>
              <span className="font-mono font-bold text-white tracking-tight">
                {currentPlan?.slPrice?.toFixed(1) || "1937.3"}
              </span>
            </div>
          </div>

          {/* Action Suite & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 text-xs">
            {/* Desktop Layout Mode Switcher (Visible on desktop/laptop) */}
            <div className="hidden lg:flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-0.5 font-mono text-[11px]">
              <button
                onClick={() => setLayoutMode("split")}
                className={`flex items-center gap-1 rounded-md px-2 py-1 font-bold transition-all cursor-pointer ${
                  layoutMode === "split"
                    ? "bg-sky-500/20 text-sky-300 shadow-sm border border-sky-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Bố cục chuẩn Laptop: Chart rộng 65% + Sidebar thông minh 35%"
              >
                <LayoutGrid className="h-3 w-3" />
                <span>{tHeader("mode_split")}</span>
              </button>
              <button
                onClick={() => setLayoutMode("three_columns")}
                className={`flex items-center gap-1 rounded-md px-2 py-1 font-bold transition-all cursor-pointer ${
                  layoutMode === "three_columns"
                    ? "bg-sky-500/20 text-sky-300 shadow-sm border border-sky-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Mở rộng 3 cột song song cho màn hình lớn"
              >
                <Columns3 className="h-3 w-3" />
                <span>{tHeader("mode_three_cols")}</span>
              </button>
            </div>

            {/* Sổ Lệnh Lịch Sử Button - Lấy dữ liệu THẬT */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="group flex items-center gap-1.5 sm:gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-bold text-sky-400 hover:bg-sky-500/20 hover:border-sky-400/60 transition-all shadow-[0_0_15px_rgba(56,189,248,0.12)] cursor-pointer"
              title={tHeader("history_button_tooltip")}
            >
              <Database className="h-3.5 w-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">
                {tHeader("history_button", {
                  count: summary?.totalSessions ?? 414,
                })}
              </span>
              <span className="sm:hidden">
                {summary?.totalSessions ?? 414}P
              </span>
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-mono text-emerald-300 border border-emerald-500/30 font-bold">
                {summary?.totalPnl !== undefined
                  ? `${summary.totalPnl > 0 ? "+" : ""}${summary.totalPnl.toFixed(1)}đ`
                  : "+770.5đ"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE WORKSPACE (< 768px): Dedicated Full-Screen Tab View */}
      <div className="flex md:hidden flex-1 overflow-hidden p-2 pb-16">
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
            <div className="h-full w-full rounded-xl border border-white/[0.08] bg-[#0b0f17]/90 shadow-2xl backdrop-blur-xl overflow-hidden">
              <ChatConversationPanel
                snapshot={snapshot}
                onSendQuestion={handleSendChat}
                externalQuestion={activeQuestion}
                onQuestionConsumed={() => setActiveQuestion("")}
              />
            </div>
          )}
          {mobileTab === "qa" && (
            <div className="h-full w-full rounded-xl border border-white/[0.08] bg-[#0b0f17]/90 shadow-2xl backdrop-blur-xl overflow-hidden">
              <QaLibraryPanel
                onSelectQuestion={(q) => {
                  setActiveQuestion(q);
                  setMobileTab("chat");
                }}
              />
            </div>
          )}
        </div>

        {/* Fixed Bottom Navigation Dock for Mobile */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/[0.08] bg-[#070a0f]/95 backdrop-blur-xl px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => setMobileTab("chart")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold transition-all ${
              mobileTab === "chart"
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>{tHeader("tab_chart")}</span>
          </button>

          <button
            onClick={() => setMobileTab("advisor")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold transition-all ${
              mobileTab === "advisor"
                ? "text-sky-400 bg-sky-500/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>{tHeader("tab_advisor")}</span>
          </button>

          <button
            onClick={() => setMobileTab("chat")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold transition-all ${
              mobileTab === "chat"
                ? "text-sky-400 bg-sky-500/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>{tHeader("tab_copilot")}</span>
          </button>

          <button
            onClick={() => setMobileTab("qa")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold transition-all ${
              mobileTab === "qa"
                ? "text-amber-400 bg-amber-500/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>{tHeader("tab_qa")}</span>
          </button>
        </nav>
      </div>

      {/* LAPTOP & DESKTOP WORKSPACE (>= 768px) */}
      <main className="hidden md:flex flex-1 overflow-hidden p-2.5 sm:p-3">
        {layoutMode === "split" ? (
          // LAPTOP PRO PRIMARY FOCUS (Chart 65% + Smart Pro Sidebar 35%)
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full w-full gap-2.5"
          >
            {/* Primary Center Workspace: Candlestick Chart (Thoáng đãng, rộng rãi) */}
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
              className="w-1.5 bg-white/[0.06] hover:bg-sky-500/60 transition-colors rounded-full"
            />

            {/* Secondary Workspace: Smart Tabbed Sidebar (Kèo Quant / AI Copilot / QA) */}
            <ResizablePanel
              id="lap-sidebar"
              defaultSize="36%"
              minSize="25%"
              maxSize="50%"
              className="h-full"
            >
              <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0f17]/90 shadow-2xl backdrop-blur-xl">
                {/* Pro Sidebar Tab Switcher */}
                <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#090d16]/80 px-3 py-2 shrink-0">
                  <div className="flex items-center gap-1 rounded-lg border border-white/5 bg-white/[0.03] p-0.5">
                    <button
                      onClick={() => setSidebarTab("advisor")}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        sidebarTab === "advisor"
                          ? "bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{tHeader("tab_advisor")}</span>
                    </button>

                    <button
                      onClick={() => setSidebarTab("chat")}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        sidebarTab === "chat"
                          ? "bg-sky-500/20 text-sky-400 shadow-sm border border-sky-500/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Bot className="h-3.5 w-3.5 text-sky-400" />
                      <span>{tHeader("tab_copilot")}</span>
                    </button>

                    <button
                      onClick={() => setSidebarTab("qa")}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        sidebarTab === "qa"
                          ? "bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                      <span>{tHeader("tab_qa")}</span>
                    </button>
                  </div>

                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-white/5">
                    {sidebarTab === "advisor"
                      ? "CANONICAL"
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
              className="w-1.5 bg-white/[0.06] hover:bg-sky-500/60 transition-colors rounded-full"
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
              className="w-1.5 bg-white/[0.06] hover:bg-sky-500/60 transition-colors rounded-full"
            />

            {/* Panel 3: Chat Advisor & QA */}
            <ResizablePanel
              id="p3-chat"
              defaultSize="28%"
              minSize="22%"
              maxSize="35%"
              className="h-full"
            >
              <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0f17]/90 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#090d16]/80 px-3 py-2 shrink-0">
                  <div className="flex items-center gap-1 rounded-lg border border-white/5 bg-white/[0.03] p-0.5">
                    <button
                      onClick={() => setActiveRightTab("chat")}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        activeRightTab === "chat"
                          ? "bg-sky-500/20 text-sky-400 shadow-sm border border-sky-500/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Bot className="h-3.5 w-3.5" />
                      <span>{tChat("tab_advisor")}</span>
                    </button>
                    <button
                      onClick={() => setActiveRightTab("qa")}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        activeRightTab === "qa"
                          ? "bg-sky-500/20 text-sky-400 shadow-sm border border-sky-500/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>{tChat("tab_qa")}</span>
                    </button>
                  </div>

                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-white/5">
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
      />
    </div>
  );
}
