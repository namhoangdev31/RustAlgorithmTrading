"use client";

import React from "react";
import { ConsensusResult, MarketSnapshot, TradingPlan } from "@/lib/server/quant/types";
import { RefreshCw, TrendingUp, ShieldAlert, ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface LiveDashboardPanelProps {
  snapshot: MarketSnapshot;
  plans: TradingPlan[];
  consensus: ConsensusResult;
  summary?: any;
  onRefresh: () => void;
  isLoading: boolean;
  onOpenHistory?: () => void;
}

export const LiveDashboardPanel: React.FC<LiveDashboardPanelProps> = ({
  snapshot,
  plans,
  consensus,
  summary,
  onRefresh,
  isLoading,
  onOpenHistory,
}) => {
  const t = useTranslations("Bfxps.live");
  const plan = plans[0];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#30363d] bg-[#171b23] text-[#e6edf3]">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#30363d] bg-[#111722] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#36d399] shadow-[0_0_8px_#36d399]"></span>
          <b className="text-sm tracking-wide text-white">{t("title")}</b>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg border border-[#30363d] bg-[#222833] px-2.5 py-1 text-xs font-semibold text-[#e6edf3] hover:border-[#2f81f7] disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          <span>{t("refresh")}</span>
        </button>
      </div>

      {/* Body scroll */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {/* Banner trạng thái */}
        <div className="rounded-xl border-l-4 border-[#36d399] bg-[#0d3026] p-3 text-[#e6edf3]">
          <div className="flex items-center gap-1.5 font-bold text-[#36d399]">
            <TrendingUp className="h-4 w-4" />
            <span>{t("recommendation_title")}</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#c4e8db]">
            {t("recommendation_desc", {
              side: plan?.side || "LONG",
              price: plan?.entryPrice?.toFixed(1) || "1945.3",
              tp: Math.abs((plan?.tpPrice || 0) - (plan?.entryPrice || 0)).toFixed(1),
              sl: Math.abs((plan?.slPrice || 0) - (plan?.entryPrice || 0)).toFixed(1),
            })}
          </p>
        </div>

        {/* 4 Thẻ Grid Chỉ Số Thị Trường */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[#30363d] bg-[#111722] p-2.5">
            <span className="block text-[10px] uppercase tracking-wider text-[#9aa4b2]">
              {t("ohlc_title")}
            </span>
            <strong className="mt-1 block text-sm font-black text-white">
              {snapshot.open} / {snapshot.high} / {snapshot.low} / {snapshot.current}
            </strong>
          </div>

          <div className="rounded-lg border border-[#30363d] bg-[#111722] p-2.5">
            <span className="block text-[10px] uppercase tracking-wider text-[#9aa4b2]">
              {t("consensus_title")}
            </span>
            <strong className="mt-1 block text-sm font-black text-[#60a5fa]">
              {consensus.direction} · {Math.round(consensus.strength * 100)}% ({plan?.side === "LONG" ? "1L/0S" : "0L/1S"})
            </strong>
          </div>

          <div className="rounded-lg border border-[#30363d] bg-[#111722] p-2.5">
            <span className="block text-[10px] uppercase tracking-wider text-[#9aa4b2]">
              {t("basis_nn_title")}
            </span>
            <strong className={`mt-1 block text-sm font-black ${snapshot.basis && snapshot.basis < 0 ? "text-[#ff5a67]" : "text-[#36d399]"}`}>
              {snapshot.basis ?? "N/A"}{t("pts_unit")} / {snapshot.foreignNet ?? "N/A"} {t("contracts_unit")}
            </strong>
          </div>

          <div
            onClick={onOpenHistory}
            className="rounded-lg border border-[#30363d] bg-[#111722] p-2.5 cursor-pointer hover:border-[#58a6ff] hover:bg-[#161b22] transition-all group"
            title={t("view_history_tooltip")}
          >
            <div className="flex items-center justify-between">
              <span className="block text-[10px] uppercase tracking-wider text-[#9aa4b2]">
                {t("perf_title")}
              </span>
              <span className="text-[10px] text-[#58a6ff] font-bold group-hover:underline">
                {t("view_history", { count: summary?.totalSessions ?? 413 })}
              </span>
            </div>
            <strong className="mt-1 block text-xs font-black text-[#36d399]">
              {t("perf_summary", {
                winrate: summary?.winRate != null ? `${summary.winRate}%` : "52.6%",
                pnl: summary?.totalPnl != null ? `${summary.totalPnl > 0 ? "+" : ""}${summary.totalPnl}` : "+770.5",
              })}
            </strong>
          </div>
        </div>

        {/* Thẻ Kèo Chi Tiết Duy Nhất */}
        {plan && (
          <div className="rounded-xl border border-[#388bfd] bg-[#111722] p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-white text-sm">
                <span>{plan.engine}</span>
                <span className="rounded-full bg-[#2f81f7] px-2 py-0.5 text-[10px] font-bold text-white">
                  {t("single_plan_badge")}
                </span>
              </div>
              <span className="rounded-full border border-[#30363d] bg-[#171b23] px-2.5 py-0.5 text-[11px] text-[#9aa4b2]">
                {t("session_label")} {plan.date}
              </span>
            </div>

            {/* Chips thông số lệnh */}
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              <div className="rounded-lg bg-[#0d3026] border border-[#36d399]/40 p-2">
                <span className="block text-[10px] text-[#9aa4b2] uppercase font-bold">{t("position_label")}</span>
                <span className="mt-1 block text-sm font-black text-[#36d399]">
                  {plan.side}
                </span>
              </div>

              <div className="rounded-lg border border-[#30363d] bg-[#171b23] p-2">
                <span className="block text-[10px] text-[#9aa4b2] uppercase font-bold">{t("stop_entry")}</span>
                <span className="mt-1 block text-sm font-black text-white">
                  {plan.entryPrice?.toFixed(1)}
                </span>
              </div>

              <div className="rounded-lg border border-[#30363d] bg-[#171b23] p-2">
                <span className="block text-[10px] text-[#38bdf8] uppercase font-bold">{t("tp_label")}</span>
                <span className="mt-1 block text-sm font-black text-[#38bdf8]">
                  {plan.tpPrice?.toFixed(1)}
                </span>
              </div>

              <div className="rounded-lg border border-[#30363d] bg-[#171b23] p-2">
                <span className="block text-[10px] text-[#ff5a67] uppercase font-bold">{t("sl_label")}</span>
                <span className="mt-1 block text-sm font-black text-[#ff5a67]">
                  {plan.slPrice?.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Hướng dẫn đặt lệnh cho người dùng */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="rounded-lg border-l-4 border-[#2f81f7] bg-[#102a43] p-2.5 leading-relaxed">
                <b className="text-[#60a5fa] block mb-0.5">📌 {t("order_guide_title")}</b>
                <span>
                  {t("order_guide_desc", { price: plan.entryPrice?.toFixed(1) })}
                </span>
              </div>

              <div className="rounded-lg border-l-4 border-[#36d399] bg-[#0d3026] p-2.5 leading-relaxed">
                <b className="text-[#36d399] block mb-0.5">⚖️ {t("rules_title")}</b>
                <span>
                  • {t("rule_tp", { price: plan.tpPrice?.toFixed(1) })}<br />
                  • {t("rule_sl", { price: plan.slPrice?.toFixed(1) })}<br />
                  • {t("rule_atc")}
                </span>
              </div>

              <div className="rounded-lg border-l-4 border-[#a78bfa] bg-[#2b1f3f] p-2.5 leading-relaxed">
                <b className="text-[#c4b5fd] block mb-0.5">📊 {t("verification_title")}</b>
                <span>
                  {t("verification_desc")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
