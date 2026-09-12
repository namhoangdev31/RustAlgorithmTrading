"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Play, Pause, BarChart2 } from "lucide-react";
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
  snapshot: MarketSnapshot;
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
      id: "m0",
      role: "bot",
      content: t("intro_message"),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [showChart, setShowChart] = useState(false);

  // Manual OHLC fields
  const [openVal, setOpenVal] = useState(String(snapshot.open));
  const [highVal, setHighVal] = useState(String(snapshot.high));
  const [lowVal, setLowVal] = useState(String(snapshot.low));
  const [closeVal, setCloseVal] = useState(String(snapshot.current));
  const [isAutoLive, setIsAutoLive] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAutoLive) {
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
      <div className="space-y-2">
        {blocks.map((block, i) => {
          const trimmed = block.trim();
          if (!trimmed) return null;

          let borderClass = "border-l-4 border-gray-600 bg-[#161b22]";
          let titleColor = "text-gray-300";

          if (trimmed.startsWith("🟦")) {
            borderClass = "border-l-4 border-[#2f81f7] bg-[#102a43]";
            titleColor = "text-[#60a5fa]";
          } else if (trimmed.startsWith("🟧")) {
            borderClass = "border-l-4 border-[#fbbf24] bg-[#2d2212]";
            titleColor = "text-[#fbbf24]";
          } else if (trimmed.startsWith("🟪")) {
            borderClass = "border-l-4 border-[#a78bfa] bg-[#2b1f3f]";
            titleColor = "text-[#c4b5fd]";
          } else if (trimmed.startsWith("⬜")) {
            borderClass = "border-l-4 border-[#36d399] bg-[#0d3026]";
            titleColor = "text-[#36d399]";
          }

          return (
            <div key={i} className={`rounded-r-lg p-2 text-xs leading-relaxed ${borderClass}`}>
              <span className={`block font-bold mb-1 ${titleColor}`}>{trimmed.slice(0, 20)}</span>
              <p className="whitespace-pre-wrap text-[#e6edf3]">{trimmed.replace(/^[🟦🟧🟪⬜]\s*[^\n]+\n?/, "")}</p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#30363d] bg-[#171b23] text-[#e6edf3]">
      {/* Header */}
      <div className="border-b border-[#30363d] bg-[#111722] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-[#2f81f7]" />
            <b className="text-sm tracking-wide text-white">{t("advisor_title")}</b>
          </div>
          <span className="rounded-full border border-[#30363d] bg-[#0d1117] px-2.5 py-0.5 text-[11px] text-[#9aa4b2]">
            {t("source_badge")}
          </span>
        </div>
      </div>

      {/* Vùng chat & biểu đồ */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {showChart && (
          <div className="mb-4">
            <DynamicPnlChart />
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "bot" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2f81f7]/20 text-[#2f81f7]">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                m.role === "user"
                  ? "rounded-tr-none bg-[#2f81f7] text-white font-medium"
                  : "rounded-tl-none border border-[#30363d] bg-[#222833]"
              }`}
            >
              {m.role === "user" ? m.content : renderMessageContent(m.content)}
            </div>
            {m.role === "user" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2f81f7] text-white">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Khung điều khiển OHLC & Input */}
      <div className="border-t border-[#30363d] bg-[#111722] p-3 space-y-2.5">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="0.1"
              value={openVal}
              disabled={isAutoLive}
              onChange={(e) => setOpenVal(e.target.value)}
              placeholder={t("field_open")}
              className="w-16 rounded border border-[#30363d] bg-[#171b23] px-1.5 py-1 text-center font-mono text-[11px] disabled:opacity-60"
            />
            <input
              type="number"
              step="0.1"
              value={highVal}
              disabled={isAutoLive}
              onChange={(e) => setHighVal(e.target.value)}
              placeholder={t("field_high")}
              className="w-16 rounded border border-[#30363d] bg-[#171b23] px-1.5 py-1 text-center font-mono text-[11px] disabled:opacity-60"
            />
            <input
              type="number"
              step="0.1"
              value={lowVal}
              disabled={isAutoLive}
              onChange={(e) => setLowVal(e.target.value)}
              placeholder={t("field_low")}
              className="w-16 rounded border border-[#30363d] bg-[#171b23] px-1.5 py-1 text-center font-mono text-[11px] disabled:opacity-60"
            />
            <input
              type="number"
              step="0.1"
              value={closeVal}
              disabled={isAutoLive}
              onChange={(e) => setCloseVal(e.target.value)}
              placeholder={t("field_close")}
              className="w-16 rounded border border-[#30363d] bg-[#171b23] px-1.5 py-1 text-center font-mono text-[11px] disabled:opacity-60"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAutoLive(!isAutoLive)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors ${
                isAutoLive
                  ? "bg-[#0d6b45] text-[#36d399] border border-[#36d399]/40"
                  : "bg-[#222833] text-[#9aa4b2] border border-[#30363d]"
              }`}
            >
              {isAutoLive ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              <span>{t("auto_live_label")}: {isAutoLive ? t("status_on") : t("status_off")}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowChart(!showChart)}
              className="flex items-center gap-1 rounded-md border border-[#30363d] bg-[#222833] px-2 py-1 text-[11px] font-bold text-[#60a5fa] hover:border-[#60a5fa]"
            >
              <BarChart2 className="h-3 w-3" />
              <span>{showChart ? t("btn_hide_chart") : t("btn_show_chart")}</span>
            </button>
          </div>
        </div>

        {/* Input box */}
        <div className="flex items-end gap-2">
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
            className="flex-1 resize-none rounded-xl border border-[#30363d] bg-[#171b23] p-2.5 text-xs text-[#e6edf3] placeholder-[#9aa4b2] focus:border-[#2f81f7] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isBusy || !inputText.trim()}
            className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-[#2f81f7] font-bold text-white transition-opacity hover:bg-[#1f6feb] disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
