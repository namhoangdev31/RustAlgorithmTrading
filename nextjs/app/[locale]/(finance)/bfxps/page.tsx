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
import { Activity, ShieldCheck, Database, HelpCircle, Bot, BarChart2 } from "lucide-react";

export default function BfxpsAdvisorPage({
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
    <div className="flex h-screen w-full flex-col bg-[#0e1117] text-[#e6edf3] antialiased">
      {/* Top Banner Consensus Bar */}
      <header className="border-b border-[#30363d] bg-[#0b0f15] px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black tracking-wide">
            <span className="flex items-center gap-1.5 text-white">
              <Activity className="h-4 w-4 text-[#36d399]" />
              {tHeader("title")}
            </span>
            <span className="text-[#6b7280]">·</span>
            <span className="text-[#36d399]">
              {tHeader("canonical_plan")} {currentPlan?.date || "14/09/2026"} · {currentPlan?.side || "LONG"}
            </span>
            <span className="text-[#6b7280]">·</span>
            <span className="text-white">
              {tHeader("stop_entry_label")} {currentPlan?.entryPrice?.toFixed(1) || "1945.3"}
            </span>
            <span className="text-[#6b7280]">·</span>
            <span className="text-[#38bdf8]">
              TP {currentPlan?.tpPrice?.toFixed(1) || "1961.3"} ({tHeader("tp_pts")})
            </span>
            <span className="text-[#6b7280]">·</span>
            <span className="text-[#ff5a67]">
              SL {currentPlan?.slPrice?.toFixed(1) || "1937.3"} ({tHeader("sl_pts")})
            </span>
            <span className="text-[#6b7280]">·</span>
            <span className="text-[#36d399]">{tHeader("rr_ratio")} · {tHeader("atc_close")}</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-[#388bfd]/50 bg-[#1f6feb]/20 px-2.5 py-1 text-xs font-bold text-[#58a6ff] hover:bg-[#1f6feb]/30 hover:border-[#58a6ff] transition-all cursor-pointer shadow-sm"
              title={tHeader("history_button_tooltip")}
            >
              <Database className="h-3.5 w-3.5 text-[#58a6ff]" />
              {tHeader("history_button", { count: summary?.totalSessions ?? 413 })}
            </button>

            <button
              onClick={() => setShowQaLibrary(!showQaLibrary)}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold transition-all cursor-pointer shadow-sm ${
                showQaLibrary
                  ? "border-[#e3b341] bg-[#d29922]/20 text-[#f2cc60]"
                  : "border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-white hover:border-[#8b949e]"
              }`}
              title={tHeader("qa_toggle_tooltip")}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              {showQaLibrary ? tHeader("qa_toggle_visible") : tHeader("qa_toggle_hidden")}
            </button>

            <span className="flex items-center gap-1 text-[#9aa4b2]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#2f81f7]" />
              {tHeader("zero_lookahead")} · {tHeader("bars_stats")}
            </span>
          </div>
        </div>
      </header>

      {/* Main Split Workspace: Cột 1 Live Dashboard, Cột 2 TradingView (Giữa), Cột 3 Chat Advisor (Phải) */}
      <main className="flex-1 overflow-hidden p-3">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full w-full gap-2"
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

          <ResizableHandle withHandle className="w-1.5 bg-[#30363d] hover:bg-[#2f81f7] transition-colors" />

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

          <ResizableHandle withHandle className="w-1.5 bg-[#30363d] hover:bg-[#2f81f7] transition-colors" />

          {/* Panel 3: Chat Advisor Thay Vào Chỗ Thư Viện (Cột Phải - Tỷ lệ Min Chiều Rộng) */}
          <ResizablePanel
            id="p3-chat"
            defaultSize={showQaLibrary ? "16%" : "18%"}
            minSize="16%"
            maxSize="38%"
            className="h-full"
          >
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#30363d] bg-[#171b23]">
              {/* Tabs Switcher Chat / QA */}
              <div className="flex items-center justify-between border-b border-[#30363d] bg-[#111722] px-3 py-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveRightTab("chat")}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      activeRightTab === "chat"
                        ? "bg-[#1f6feb] text-white"
                        : "text-[#8b949e] hover:bg-[#222833] hover:text-white"
                    }`}
                  >
                    <Bot className="h-3.5 w-3.5" />
                    <span>{tChat("tab_advisor")}</span>
                  </button>
                  <button
                    onClick={() => setActiveRightTab("qa")}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      activeRightTab === "qa"
                        ? "bg-[#1f6feb] text-white"
                        : "text-[#8b949e] hover:bg-[#222833] hover:text-white"
                    }`}
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>{tChat("tab_qa")}</span>
                  </button>
                </div>

                <span className="text-[10px] text-[#8b949e]">
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
              <ResizableHandle withHandle className="w-1.5 bg-[#30363d] hover:bg-[#2f81f7] transition-colors" />
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
