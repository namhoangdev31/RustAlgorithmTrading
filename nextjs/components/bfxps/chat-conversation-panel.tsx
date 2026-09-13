"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Play, Pause, BarChart2, SlidersHorizontal, Sparkles } from "lucide-react";
import { DynamicPnlChart } from "./dynamic-pnl-chart";
import { MarketSnapshot } from "@/lib/server/quant/types";
import { useTranslations } from "next-intl";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  provenanceRole?: string;
  hasChart?: boolean;
}

interface ChatPanelProps {
  snapshot?: MarketSnapshot | null;
  onSendQuestion: (
    question: string,
    ohlcOverrides?: { open?: number; high?: number; low?: number; close?: number }
  ) => Promise<{ answer: string; hasChart?: boolean }>;
  externalQuestion?: string;
  onQuestionConsumed?: () => void;
}

export function ChatConversationPanel({
  snapshot,
  onSendQuestion,
  externalQuestion,
  onQuestionConsumed,
}: ChatPanelProps) {
  const t = useTranslations("Bfxps.chat");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_welcome",
      role: "bot",
      content: t("intro_message"),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [showCustomOhlc, setShowCustomOhlc] = useState(false);

  // Manual OHLC fields
  const [openVal, setOpenVal] = useState(snapshot ? String(snapshot.open) : "");
  const [highVal, setHighVal] = useState(snapshot ? String(snapshot.high) : "");
  const [lowVal, setLowVal] = useState(snapshot ? String(snapshot.low) : "");
  const [closeVal, setCloseVal] = useState(snapshot ? String(snapshot.current) : "");
  const [isAutoLive, setIsAutoLive] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAutoLive && snapshot) {
      setOpenVal(String(snapshot.open));
      setHighVal(String(snapshot.high));
      setLowVal(String(snapshot.low));
      setCloseVal(String(snapshot.current));
    }
  }, [snapshot, isAutoLive]);

  // Handle external QA click
  useEffect(() => {
    if (externalQuestion) {
      handleSend(externalQuestion);
      onQuestionConsumed?.();
    }
  }, [externalQuestion]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showChart]);

  const handleSend = async (customQ?: string) => {
    const q = (customQ || inputText).trim();
    if (!q || isBusy) return;

    const userMsgId = `u_${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: q }]);
    setInputText("");
    setIsBusy(true);

    try {
      const overrides = isAutoLive
        ? undefined
        : {
            open: openVal ? Number(openVal) : undefined,
            high: highVal ? Number(highVal) : undefined,
            low: lowVal ? Number(lowVal) : undefined,
            close: closeVal ? Number(closeVal) : undefined,
          };

      const result = await onSendQuestion(q, overrides);

      if (result.hasChart) {
        setShowChart(true);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `b_${Date.now()}`,
          role: "bot",
          content: result.answer,
          hasChart: result.hasChart,
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "bot",
          content: `${t("error_prefix")}${e.message || t("conn_lost")}`,
        },
      ]);
    } finally {
      setIsBusy(false);
    }
  };

  // Helper để format và tô màu 4 khối BFXPS
  const renderMessageContent = (content: string) => {
    const blocks = content.split(/(?=🟦 (?:HỆ THỐNG\/CSDL|SYSTEM\/DB)|🟧 (?:LỊCH SỬ\/SUY LUẬN|HISTORY\/REASONING)|🟪 (?:SUY LUẬN\/BRAIN|INFERENCE\/BRAIN)|⬜ (?:KẾT LUẬN\/HÀNH ĐỘNG|CONCLUSION\/ACTION))/g);

    if (blocks.length <= 1) {
      return <p className="whitespace-pre-wrap">{content}</p>;
    }

    return (
      <div className="space-y-2.5">
        {blocks.map((block, i) => {
          const trimmed = block.trim();
          if (!trimmed) return null;

          let borderClass = "border border-white/10 bg-white/[0.03]";
          let badgeClass = "bg-white/10 text-slate-300 border-white/15";
          let badgeText = t("badge_analysis");

          if (trimmed.startsWith("🟦")) {
            borderClass = "border border-sky-500/30 bg-sky-950/30 text-sky-100";
            badgeClass = "bg-sky-500/20 text-sky-300 border-sky-500/30";
            badgeText = t("badge_system");
          } else if (trimmed.startsWith("🟧")) {
            borderClass = "border border-amber-500/30 bg-amber-950/30 text-amber-100";
            badgeClass = "bg-amber-500/20 text-amber-300 border-amber-500/30";
            badgeText = t("badge_history");
          } else if (trimmed.startsWith("🟪")) {
            borderClass = "border border-purple-500/30 bg-purple-950/30 text-purple-100";
            badgeClass = "bg-purple-500/20 text-purple-300 border-purple-500/30";
            badgeText = t("badge_inference");
          } else if (trimmed.startsWith("⬜")) {
            borderClass = "border border-emerald-500/30 bg-emerald-950/30 text-emerald-100";
            badgeClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
            badgeText = t("badge_conclusion");
          }

          return (
            <div key={i} className={`rounded-xl p-3 text-xs leading-relaxed shadow-sm ${borderClass}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider border ${badgeClass}`}>
                  {badgeText}
                </span>
              </div>
              <p className="whitespace-pre-wrap font-sans text-slate-200 text-xs">{trimmed.replace(/^[🟦🟧🟪⬜]\s*[^\n]+\n?/, "")}</p>
            </div>
          );
        })}
      </div>
    );
  };

  const quickPrompts = [
    t("quick_today"),
    t("quick_r5"),
    t("quick_v44"),
    t("quick_perf"),
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0b0f17] text-slate-100">
      {/* Vùng tin nhắn chat & biểu đồ */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {showChart && (
          <div className="mb-3">
            <DynamicPnlChart />
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "bot" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                m.role === "user"
                  ? "rounded-tr-none bg-gradient-to-r from-sky-600 to-blue-600 text-white font-medium shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                  : "rounded-tl-none border border-white/[0.08] bg-white/[0.03] text-slate-200 backdrop-blur-md"
              }`}
            >
              {m.role === "user" ? m.content : renderMessageContent(m.content)}
            </div>
            {m.role === "user" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Khung điều khiển OHLC & Input */}
      <div className="border-t border-white/[0.08] bg-[#090d16]/95 backdrop-blur-md p-2.5 space-y-2">
        {/* Quick prompt suggestions */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(qp)}
              disabled={isBusy}
              className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-slate-300 hover:text-sky-300 hover:border-sky-500/40 hover:bg-sky-500/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsAutoLive(!isAutoLive)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                isAutoLive
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/[0.04] text-slate-400 border border-white/10"
              }`}
            >
              {isAutoLive ? <Play className="h-2.5 w-2.5 text-emerald-400" /> : <Pause className="h-2.5 w-2.5 text-slate-400" />}
              <span>{t("auto_live_label")}: {isAutoLive ? t("status_on") : t("status_off")}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCustomOhlc(!showCustomOhlc)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold border transition-all cursor-pointer ${
                showCustomOhlc || !isAutoLive
                  ? "border-sky-500/40 bg-sky-500/15 text-sky-400"
                  : "border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
              }`}
              title="Tùy chỉnh OHLC thủ công"
            >
              <SlidersHorizontal className="h-2.5 w-2.5" />
              <span>OHLC</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowChart(!showChart)}
            className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-bold text-sky-400 hover:border-sky-500/40 hover:bg-sky-500/10 transition-all cursor-pointer"
          >
            <BarChart2 className="h-2.5 w-2.5" />
            <span>{showChart ? t("btn_hide_chart") : t("btn_show_chart")}</span>
          </button>
        </div>

        {/* Collapsible OHLC input drawer */}
        {(showCustomOhlc || !isAutoLive) && (
          <div className="grid grid-cols-4 gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] p-1.5">
            <div>
              <span className="block text-[9px] text-slate-400 text-center font-mono font-medium">O</span>
              <input
                type="number"
                step="0.1"
                value={openVal}
                disabled={isAutoLive}
                onChange={(e) => setOpenVal(e.target.value)}
                placeholder={t("field_open")}
                className="w-full rounded border border-white/10 bg-black/40 px-1 py-0.5 text-center font-mono text-[11px] text-white disabled:opacity-60 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 text-center font-mono font-medium">H</span>
              <input
                type="number"
                step="0.1"
                value={highVal}
                disabled={isAutoLive}
                onChange={(e) => setHighVal(e.target.value)}
                placeholder={t("field_high")}
                className="w-full rounded border border-white/10 bg-black/40 px-1 py-0.5 text-center font-mono text-[11px] text-white disabled:opacity-60 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 text-center font-mono font-medium">L</span>
              <input
                type="number"
                step="0.1"
                value={lowVal}
                disabled={isAutoLive}
                onChange={(e) => setLowVal(e.target.value)}
                placeholder={t("field_low")}
                className="w-full rounded border border-white/10 bg-black/40 px-1 py-0.5 text-center font-mono text-[11px] text-white disabled:opacity-60 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 text-center font-mono font-medium">C</span>
              <input
                type="number"
                step="0.1"
                value={closeVal}
                disabled={isAutoLive}
                onChange={(e) => setCloseVal(e.target.value)}
                placeholder={t("field_close")}
                className="w-full rounded border border-white/10 bg-black/40 px-1 py-0.5 text-center font-mono text-[11px] text-white disabled:opacity-60 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Input box */}
        <div className="flex items-end gap-1.5">
          <textarea
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t("input_placeholder")}
            className="flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.03] p-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:bg-white/[0.06] focus:outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isBusy || !inputText.trim()}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.2)]"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
