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
import { MarketSnapshot, TradingPlan, ConsensusResult } from "@/lib/server/quant/types";
import { Activity, ShieldCheck, Database, HelpCircle, Bot } from "lucide-react";

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
  const [showQaLibrary, setShowQaLibrary] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<"chat" | "qa">("chat");

  const fetchHealth = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleSendChat = async (
    question: string,
    ohlcOverrides?: { open?: number; high?: number; low?: number; close?: number }
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
      <header className="border-b border-white/[0.08] bg-[#090d16]/90 backdrop-blur-xl px-4 py-2.5 z-20 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-wider text-white text-xs sm:text-sm bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {tHeader("title")}
              </span>
              <span className="rounded-md bg-sky-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-sky-400 border border-sky-500/20">
                VN30F1M
              </span>
            </div>
          </div>

          {/* Canonical Strategy Ticker Pills */}
          <div className="hidden md:flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.12)]">
              <span className="text-[11px] text-emerald-300/80">{tHeader("canonical_plan")}:</span>
              <span className="font-mono text-white tracking-tight">{currentPlan?.side || "LONG"} @ {currentPlan?.entryPrice?.toFixed(1) || "1945.3"}</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-sky-400 font-semibold shadow-[0_0_15px_rgba(56,189,248,0.1)]">
              <span className="text-[11px] text-sky-300/80">TP:</span>
              <span className="font-mono font-bold text-white tracking-tight">{currentPlan?.tpPrice?.toFixed(1) || "1961.3"} ({tHeader("tp_pts")})</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-rose-400 font-semibold shadow-[0_0_15px_rgba(244,63,94,0.1)]">
              <span className="text-[11px] text-rose-300/80">SL:</span>
              <span className="font-mono font-bold text-white tracking-tight">{currentPlan?.slPrice?.toFixed(1) || "1937.3"} ({tHeader("sl_pts")})</span>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-300 font-mono">
              <span className="text-slate-400">{tHeader("rr_ratio")}</span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400 font-bold">{tHeader("atc_close")}</span>
            </div>
          </div>

          {/* Action Suite & Audit Proof */}
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="group flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-sky-400 hover:bg-sky-500/20 hover:border-sky-400/60 transition-all shadow-[0_0_15px_rgba(56,189,248,0.12)] cursor-pointer"
              title={tHeader("history_button_tooltip")}
            >
              <Database className="h-3.5 w-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
              <span>{tHeader("history_button", { count: summary?.totalSessions ?? 413 })}</span>
              <span className="hidden sm:inline-block rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-mono text-emerald-300 border border-emerald-500/30 font-bold">
                +770.5đ
              </span>
            </button>

            <button
              onClick={() => setShowQaLibrary(!showQaLibrary)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                showQaLibrary
                  ? "border-amber-400/50 bg-amber-400/15 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  : "border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/[0.08]"
              }`}
              title={tHeader("qa_toggle_tooltip")}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{showQaLibrary ? tHeader("qa_toggle_visible") : tHeader("qa_toggle_hidden")}</span>
            </button>

            <div className="hidden 2xl:flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-slate-400 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
              <span>{tHeader("zero_lookahead")}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Split Workspace */}
      <main className="flex-1 overflow-hidden p-2.5 sm:p-3">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full w-full gap-2.5"
        >
          {/* Panel 1: Live Dashboard Kèo Duy Nhất (Cột Trái - Tỷ lệ Max Chiều Rộng) */}
          <ResizablePanel
            id="p1-dashboard"
            defaultSize={showQaLibrary ? "30%" : "34%"}
            minSize="22%"
            maxSize="42%"
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

          <ResizableHandle withHandle className="w-1.5 bg-white/[0.06] hover:bg-sky-500/60 transition-colors rounded-full" />

          {/* Panel 2: TradingView Center Panel (Cột Giữa) */}
          <ResizablePanel
            id="p2-tradingview"
            defaultSize={showQaLibrary ? "38%" : "48%"}
            minSize="30%"
            maxSize="70%"
            className="h-full"
          >
            <TradingViewPanel
              snapshot={snapshot}
              plan={currentPlan}
            />
          </ResizablePanel>

          <ResizableHandle withHandle className="w-1.5 bg-white/[0.06] hover:bg-sky-500/60 transition-colors rounded-full" />

          {/* Panel 3: Chat Advisor Thay Vào Chỗ Thư Viện (Cột Phải - Tỷ lệ Min Chiều Rộng) */}
          <ResizablePanel
            id="p3-chat"
            defaultSize={showQaLibrary ? "16%" : "18%"}
            minSize="16%"
            maxSize="38%"
            className="h-full"
          >
            <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0f17]/90 shadow-2xl backdrop-blur-xl">
              {/* Tabs Switcher Chat / QA */}
              <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#090d16]/80 px-3 py-2">
                <div className="flex items-center gap-1 rounded-lg border border-white/5 bg-white/[0.03] p-0.5">
                  <button
                    onClick={() => setActiveRightTab("chat")}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
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
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
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
                  {activeRightTab === "chat" ? tChat("analysis_badge") : tChat("qa_count_badge")}
                </span>
              </div>

              {/* Body Content Cột Phải */}
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
                      setActiveRightTab("chat"); // Chuyển sang chat xem bot trả lời
                    }}
                  />
                )}
              </div>
            </div>
          </ResizablePanel>

          {/* Panel 4: Cột Thư Viện QA Mở Rộng Khi Người Dùng Bật */}
          {showQaLibrary && (
            <>
              <ResizableHandle withHandle className="w-1.5 bg-white/[0.06] hover:bg-sky-500/60 transition-colors rounded-full" />
              <ResizablePanel id="p4-qa-dock" defaultSize="18%" minSize="14%" maxSize="30%" className="h-full">
                <QaLibraryPanel
                  onSelectQuestion={(q) => {
                    setActiveQuestion(q);
                    setActiveRightTab("chat");
                  }}
                  onClose={() => setShowQaLibrary(false)}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </main>

      {/* Sổ Lệnh Lịch Sử Kiểm Định & Thực Chiến (Database PostgreSQL) */}
      <TradeHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
