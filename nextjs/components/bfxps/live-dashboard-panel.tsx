"use client";

import React, { useState } from "react";
import { ConsensusResult, MarketSnapshot, TradingPlan } from "@/lib/server/quant/types";
import { RefreshCw, TrendingUp, TrendingDown, ArrowUpRight, Layers } from "lucide-react";
import { useTranslations } from "next-intl";

interface LiveDashboardPanelProps {
  snapshot?: MarketSnapshot | null;
  plans: TradingPlan[];
  consensus?: ConsensusResult | null;
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
  const tEngines = useTranslations("Bfxps.engines");
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);

  const plan = plans[selectedPlanIdx] || plans[0];
  const isShort = plan?.side === "SHORT";

  const getEngineTitle = (engineName?: string) => {
    if (!engineName) return "";
    return tEngines.has(engineName as any) ? tEngines(engineName as any) : engineName;
  };

  const tpDiff =
    plan?.tpPrice != null && plan?.entryPrice != null
      ? Math.abs(plan.tpPrice - plan.entryPrice)
      : null;
  const slDiff =
    plan?.slPrice != null && plan?.entryPrice != null
      ? Math.abs(plan.slPrice - plan.entryPrice)
      : null;
  const rrRatio =
    tpDiff != null && slDiff != null && slDiff > 0
      ? `1:${(tpDiff / slDiff).toFixed(1)}`
      : "1:2";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0f17]/90 shadow-2xl backdrop-blur-xl text-slate-100">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#090d16]/80 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${isShort ? "bg-rose-400" : "bg-emerald-400"} opacity-75`}></span>
            <span className={`relative inline-flex h-2 w-2 rounded-full ${isShort ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]" : "bg-emerald-500 shadow-[0_0_8px_#10b981]"}`}></span>
          </div>
          <h2 className="text-xs font-black tracking-wider uppercase text-white bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            {t("title")}
          </h2>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] hover:border-sky-500/40 hover:text-sky-400 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin text-sky-400" : "text-slate-400"}`} />
          <span>{t("refresh")}</span>
        </button>
      </div>

      {/* Body scroll */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs custom-scrollbar">
        {/* Banner trạng thái Hero Action Card */}
        <div
          className={`relative overflow-hidden rounded-xl border p-3.5 shadow-lg transition-all ${
            isShort
              ? "border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-[#1f0b12]/50 to-[#12060a]/70 shadow-[0_0_20px_rgba(244,63,94,0.08)]"
              : "border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-[#0a1e17]/50 to-[#07130f]/70 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
          }`}
        >
          <div className={`absolute top-0 right-0 h-16 w-16 ${isShort ? "bg-rose-500/10" : "bg-emerald-500/10"} blur-xl pointer-events-none rounded-full`} />
          <div className="flex items-center justify-between gap-2">
            <div className={`flex items-center gap-2 font-bold ${isShort ? "text-rose-400" : "text-emerald-400"}`}>
              <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${isShort ? "bg-rose-500/20 border-rose-500/30" : "bg-emerald-500/20 border-emerald-500/30"} border`}>
                {isShort ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
              </div>
              <span className="text-xs tracking-wide uppercase">{t("recommendation_title")}</span>
            </div>
            {plan && (
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold border ${
                  isShort
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                }`}
              >
                {plan.side} {consensus?.isUnanimous ? "100%" : `${Math.round((consensus?.strength || 1) * 100)}%`}
              </span>
            )}
          </div>
          <p className={`mt-2 text-xs leading-relaxed font-medium ${isShort ? "text-rose-100/90" : "text-emerald-100/90"}`}>
            {plan
              ? t("recommendation_desc", {
                  side: plan.side || "SHORT",
                  price: plan.entryPrice?.toFixed(1) || "--",
                  rr: rrRatio,
                  tp: tpDiff != null ? tpDiff.toFixed(1) : "--",
                  sl: slDiff != null ? slDiff.toFixed(1) : "--",
                })
              : t("awaiting_plan")}
          </p>
        </div>

        {/* Bộ chuyển đổi Engine (Nếu có nhiều hơn 1 plan) */}
        {plans.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-1 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              <Layers className="h-3 w-3 text-sky-400" />
              <span>3 Engine:</span>
            </div>
            {plans.map((p, idx) => {
              const isSelected = idx === selectedPlanIdx;
              const isPShort = p.side === "SHORT";
              return (
                <button
                  key={p.id || idx}
                  onClick={() => setSelectedPlanIdx(idx)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-sky-500/20 border border-sky-400 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]"
                      : "bg-white/[0.02] border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isPShort ? "bg-rose-400" : "bg-emerald-400"}`} />
                  <span className="font-bold">{idx === 0 ? "Kèo Chính" : idx === 1 ? "Rải Nấc" : "Breakout"}:</span>
                  <span className="font-mono">{p.side} @ {p.entryPrice?.toFixed(1)}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 4 Thẻ Grid Chỉ Số Thị Trường */}
        <div className="grid grid-cols-2 gap-2">
          {/* OHLC */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5 shadow-sm hover:border-white/15 transition-colors">
            <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400">
              {t("ohlc_title")}
            </span>
            <div className="mt-1.5 font-mono text-xs font-bold text-white tracking-tight">
              <span className="text-slate-300">{snapshot?.open?.toFixed(1) ?? "--"}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-emerald-400">{snapshot?.high?.toFixed(1) ?? "--"}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-rose-400">{snapshot?.low?.toFixed(1) ?? "--"}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-sky-300 font-extrabold">{snapshot?.current?.toFixed(1) ?? "--"}</span>
            </div>
          </div>

          {/* Consensus */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5 shadow-sm hover:border-white/15 transition-colors">
            <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400">
              {t("consensus_title")}
            </span>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-sky-400">
                {consensus ? `${consensus.direction} · ${Math.round(consensus.strength * 100)}%` : "--"}
              </span>
              <span className="rounded bg-sky-500/10 px-1.5 py-0.2 text-[10px] font-mono text-sky-300 border border-sky-500/20">
                {consensus ? `${consensus.longCount}L/${consensus.shortCount}S` : "--"}
              </span>
            </div>
            {/* Mini Progress Bar */}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${
                  consensus?.direction === "SHORT"
                    ? "bg-gradient-to-r from-rose-500 to-amber-400"
                    : "bg-gradient-to-r from-sky-400 to-emerald-400"
                }`}
                style={{ width: consensus ? `${Math.round(consensus.strength * 100)}%` : "0%" }}
              />
            </div>
          </div>

          {/* Basis & NN Net */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5 shadow-sm hover:border-white/15 transition-colors">
            <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400">
              {t("basis_nn_title")}
            </span>
            <div className="mt-1.5 flex items-center gap-1.5 font-mono text-xs font-bold">
              <span className={snapshot?.basis && snapshot.basis < 0 ? "text-rose-400" : "text-emerald-400"}>
                {snapshot?.basis != null ? `${snapshot.basis > 0 ? "+" : ""}${snapshot.basis.toFixed(1)}${t("pts_unit")}` : "--"}
              </span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-200">
                {snapshot?.foreignNet != null ? `${snapshot.foreignNet > 0 ? "+" : ""}${snapshot.foreignNet} ${t("contracts_unit")}` : "--"}
              </span>
            </div>
          </div>

          {/* Performance CSDL */}
          <div
            onClick={onOpenHistory}
            className="group rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5 shadow-sm hover:border-sky-500/40 hover:bg-sky-500/[0.05] transition-all cursor-pointer"
            title={t("view_history_tooltip")}
          >
            <div className="flex items-center justify-between">
              <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                {t("perf_title")}
              </span>
              <span className="text-[10px] text-sky-400 font-bold group-hover:underline flex items-center gap-0.5">
                {summary?.totalSessions != null
                  ? t("view_history", { count: summary.totalSessions })
                  : t("view_history_loading")}
                <ArrowUpRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </div>
            <div className="mt-1.5 font-mono text-xs font-black text-emerald-400">
              {summary?.winRate != null && summary?.totalPnl != null
                ? t("perf_summary", {
                    winrate: `${summary.winRate}%`,
                    pnl: `${summary.totalPnl > 0 ? "+" : ""}${summary.totalPnl}`,
                  })
                : "--"}
            </div>
          </div>
        </div>

        {/* Thẻ Kèo Chi Tiết (Plan Details Card) */}
        {plan && (
          <div className="rounded-xl border border-sky-500/30 bg-gradient-to-b from-[#0e1626]/90 to-[#090d16]/90 p-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs" title={plan.engine}>
                  {getEngineTitle(plan.engine)}
                </span>
                <span className="rounded-full bg-sky-500/20 border border-sky-500/40 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                  {selectedPlanIdx === 0 ? "KÈO CHÍNH" : selectedPlanIdx === 1 ? "RẢI NẤC" : "BREAKOUT"}
                </span>
              </div>
              <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-mono text-slate-400">
                {t("session_label")} {plan.date}
              </span>
            </div>

            {/* 4 Chips Thông Số Lệnh */}
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              <div className={`rounded-lg p-2 shadow-inner border ${isShort ? "bg-rose-500/10 border-rose-500/30" : "bg-emerald-500/10 border-emerald-500/30"}`}>
                <span className={`block text-[9px] uppercase font-bold ${isShort ? "text-rose-300/80" : "text-emerald-300/80"}`}>{t("position_label")}</span>
                <span className={`mt-1 block text-xs font-black font-mono ${isShort ? "text-rose-400" : "text-emerald-400"}`}>
                  {plan.side}
                </span>
              </div>

              <div className="rounded-lg bg-white/[0.03] border border-white/10 p-2 shadow-inner">
                <span className="block text-[9px] text-slate-400 uppercase font-bold">{t("stop_entry")}</span>
                <span className="mt-1 block text-xs font-black text-white font-mono">
                  {plan.entryPrice?.toFixed(1) ?? "--"}
                </span>
              </div>

              <div className="rounded-lg bg-sky-500/10 border border-sky-500/30 p-2 shadow-inner">
                <span className="block text-[9px] text-sky-300/80 uppercase font-bold">{t("tp_label")}</span>
                <span className="mt-1 block text-xs font-black text-sky-400 font-mono">
                  {plan.tpPrice?.toFixed(1) ?? "--"}
                </span>
              </div>

              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2 shadow-inner">
                <span className="block text-[9px] text-rose-300/80 uppercase font-bold">{t("sl_label")}</span>
                <span className="mt-1 block text-xs font-black text-rose-400 font-mono">
                  {plan.slPrice?.toFixed(1) ?? "--"}
                </span>
              </div>
            </div>

            {/* Hướng dẫn đặt lệnh & Cẩm nang thực chiến */}
            <div className="mt-3.5 space-y-2 text-xs">
              <div className="rounded-lg border border-sky-500/20 bg-sky-950/30 p-2.5 leading-relaxed">
                <b className="text-sky-400 flex items-center gap-1.5 mb-1 font-semibold">
                  <span>📌</span>
                  <span>{t("order_guide_title")}</span>
                </b>
                <span className="text-slate-300 text-[11px] leading-normal block">
                  {t("order_guide_desc", { price: plan.entryPrice?.toFixed(1) ?? "--" })}
                </span>
              </div>

              <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/30 p-2.5 leading-relaxed">
                <b className="text-emerald-400 flex items-center gap-1.5 mb-1 font-semibold">
                  <span>⚖️</span>
                  <span>{t("rules_title")}</span>
                </b>
                <div className="text-slate-300 text-[11px] space-y-0.5">
                  <p>• {t("rule_tp", { price: plan.tpPrice?.toFixed(1) ?? "--", tp: tpDiff != null ? tpDiff.toFixed(1) : "16.0" })}</p>
                  <p>• {t("rule_sl", { price: plan.slPrice?.toFixed(1) ?? "--", sl: slDiff != null ? slDiff.toFixed(1) : "8.0" })}</p>
                  <p className="text-emerald-300/90 font-medium">• {t("rule_atc")}</p>
                </div>
              </div>

              <div className="rounded-lg border border-purple-500/20 bg-purple-950/30 p-2.5 leading-relaxed">
                <b className="text-purple-300 flex items-center gap-1.5 mb-1 font-semibold">
                  <span>🛡️</span>
                  <span>{t("verification_title")}</span>
                </b>
                <span className="text-slate-300 text-[11px] leading-normal block">
                  {t("verification_desc", {
                    sessions: summary?.totalSessions ?? "--",
                    bars: summary?.totalBars?.toLocaleString() ?? "100.746",
                    winrate: summary?.winRate != null ? `${summary.winRate}%` : "--",
                    pnl: summary?.totalPnl != null ? `${summary.totalPnl > 0 ? "+" : ""}${summary.totalPnl}` : "--",
                    pf: summary?.profitFactor ?? "--",
                    startDate: summary?.startDate ?? "01/2025",
                    endDate: summary?.endDate ?? "11/09/2026",
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
