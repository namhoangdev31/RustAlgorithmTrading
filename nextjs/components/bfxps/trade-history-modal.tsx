"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Database,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { TradingPlan, MarketSnapshot } from "@/lib/server/quant/types";

export interface TradeItem {
  date: string;
  mode?: "LIVE" | "BACKTEST";
  isLive?: boolean;
  side: "LONG" | "SHORT";
  entryPrice: number;
  slPrice: number;
  tpPrice: number;
  exitPrice: number;
  exitType:
    | "TP"
    | "SL"
    | "ATC"
    | "NO_FILL"
    | "PENDING"
    | "TRAIL"
    | "BE"
    | "FILLED"
    | string;
  exitMinute: string;
  pnl: number;
  isWin: boolean;
  cumulativePnl: number;
  status: string;
  notes?: string;
}

interface TradeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  livePlans?: TradingPlan[] | null;
  liveSnapshot?: MarketSnapshot | null;
}

export const TradeHistoryModal: React.FC<TradeHistoryModalProps> = ({
  isOpen,
  onClose,
  livePlans,
  liveSnapshot,
}) => {
  const t = useTranslations("Bfxps.history");
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [monthlyPnl, setMonthlyPnl] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<
    "ALL" | "LIVE" | "FILLED" | "WIN" | "LOSS" | "NO_FILL"
  >("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`/api/bfxps/history?_t=${Date.now()}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setTrades(data.trades || []);
            setSummary(data.summary || null);
            setMonthlyPnl(data.monthlyPnl || {});
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const activeTrades = useMemo(() => {
    if (!trades.length) return trades;
    const canonicalPlan =
      livePlans?.find((p) => p.isCanonical) ||
      livePlans?.find((p) => p.engine === "CanonicalDirectionalBreakout") ||
      livePlans?.[0];

    if (!canonicalPlan || !canonicalPlan.date) return trades;

    const exec = canonicalPlan.execution;
    const isFilled = exec?.isFilled ?? false;
    const isSettled = exec?.settled ?? false;
    const exitType = isSettled
      ? exec?.status === "TP_EXIT"
        ? "TP"
        : exec?.status === "EXIT_SL"
          ? "SL"
          : exec?.status === "TRAIL_EXIT"
            ? "TRAIL"
            : exec?.status === "BE_EXIT"
              ? "BE"
              : "ATC"
      : isFilled
        ? "FILLED"
        : "PENDING";
    const pnl = isFilled ? (exec?.livePnlPoints ?? 0) : 0;
    const isWin = pnl > 0;

    const liveItem: TradeItem = {
      date: canonicalPlan.date,
      mode: "LIVE",
      isLive: true,
      side: canonicalPlan.side,
      entryPrice: isFilled ? exec!.avgEntryPrice : canonicalPlan.entryPrice,
      tpPrice: canonicalPlan.tpPrice,
      slPrice: canonicalPlan.slPrice,
      exitPrice: isSettled
        ? (exec?.exitPrice ?? 0)
        : isFilled
          ? (liveSnapshot?.current ?? exec!.avgEntryPrice)
          : 0,
      exitType,
      exitMinute: exec?.exitTime || (isFilled ? "11:30" : "—"),
      pnl,
      isWin,
      status: isSettled ? "ĐÃ ĐÓNG" : isFilled ? "ĐANG GIỮ VỊ THẾ" : "CHỜ KHỚP",
      notes: isFilled
        ? `Khớp lệnh ${canonicalPlan.side} @ ${exec!.avgEntryPrice.toFixed(1)} (PnL Live: ${pnl > 0 ? "+" : ""}${pnl.toFixed(1)}đ)`
        : `Lệnh Chờ Kích Hoạt ${canonicalPlan.side} @ ${canonicalPlan.entryPrice.toFixed(1)}`,
      cumulativePnl: 0,
    };

    const hasToday = trades.some((item) => item.date === canonicalPlan.date);
    const baseTrades = hasToday
      ? trades.map((item) =>
          item.date === canonicalPlan.date ? { ...item, ...liveItem } : item,
        )
      : [...trades, liveItem];

    // Tính toán lại Lợi nhuận Lũy kế (Cumulative PnL) chuẩn xác từ đầu đến cuối
    let runningCumulative = 0;
    return baseTrades.map((t) => {
      const isTradeFilled = t.status !== "PENDING" && t.exitType !== "NO_FILL";
      if (isTradeFilled) {
        runningCumulative += t.pnl;
      }
      return {
        ...t,
        cumulativePnl: Number(runningCumulative.toFixed(1)),
      };
    });
  }, [trades, livePlans, liveSnapshot]);

  const activeSummary = useMemo(() => {
    if (!activeTrades.length) return summary;
    let tradedCount = 0;
    let wins = 0;
    let losses = 0;
    let totalPnl = 0;
    let totalWinPts = 0;
    let totalLossPts = 0;
    let peak = 0;
    let maxDrawdown = 0;
    let runningCum = 0;

    activeTrades.forEach((t) => {
      const isFilled = t.status !== "PENDING" && t.exitType !== "NO_FILL";
      if (isFilled) {
        tradedCount++;
        totalPnl += t.pnl;
        runningCum += t.pnl;
        if (runningCum > peak) peak = runningCum;
        const dd = runningCum - peak;
        if (dd < maxDrawdown) maxDrawdown = dd;

        if (t.pnl > 0) {
          wins++;
          totalWinPts += t.pnl;
        } else if (t.pnl < 0) {
          losses++;
          totalLossPts += Math.abs(t.pnl);
        }
      }
    });

    const winRate =
      tradedCount > 0 ? Number(((wins / tradedCount) * 100).toFixed(1)) : 0;
    const profitFactor =
      totalLossPts > 0
        ? Number((totalWinPts / totalLossPts).toFixed(2))
        : totalWinPts > 0
          ? 99.0
          : 0;

    return {
      totalSessions: activeTrades.length,
      liveCount: activeTrades.filter((tr) => tr.date >= "2026-09-14").length,
      backtestCount: activeTrades.filter((tr) => tr.date < "2026-09-14").length,
      tradedCount,
      wins,
      losses,
      winRate,
      profitFactor,
      totalPnl: Number(totalPnl.toFixed(1)),
      maxDrawdown: Number(maxDrawdown.toFixed(1)),
    };
  }, [activeTrades, summary]);

  // Tự động tính lại PnL các tháng với PnL Live cập nhật
  const activeMonthlyPnl = useMemo(() => {
    if (!activeTrades.length) return monthlyPnl;
    const res: Record<string, number> = {};
    activeTrades.forEach((t) => {
      const isFilled = t.status !== "PENDING" && t.exitType !== "NO_FILL";
      if (isFilled && t.date) {
        const m = t.date.slice(0, 7);
        res[m] = Number(((res[m] || 0) + t.pnl).toFixed(1));
      }
    });
    return res;
  }, [activeTrades, monthlyPnl]);

  // Danh sách các tháng có trong dữ liệu
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    activeTrades.forEach((t) => {
      if (t.date) months.add(t.date.slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [activeTrades]);

  // Bộ lọc dữ liệu
  const filteredTrades = useMemo(() => {
    return activeTrades.filter((t) => {
      // Lọc theo search
      if (searchTerm && !t.date.includes(searchTerm)) {
        return false;
      }
      // Lọc theo tháng
      if (selectedMonth !== "ALL" && !t.date.startsWith(selectedMonth)) {
        return false;
      }
      // Lọc theo chế độ Live
      if (filterType === "LIVE" && t.date < "2026-09-14") {
        return false;
      }
      // Lọc theo trạng thái
      if (
        filterType === "FILLED" &&
        (t.exitType === "NO_FILL" || t.exitType === "PENDING")
      ) {
        return false;
      }
      if (filterType === "WIN" && (!t.isWin || t.exitType === "NO_FILL")) {
        return false;
      }
      if (filterType === "LOSS" && (t.pnl >= 0 || t.exitType === "NO_FILL")) {
        return false;
      }
      if (filterType === "NO_FILL" && t.exitType !== "NO_FILL") {
        return false;
      }
      return true;
    });
  }, [activeTrades, searchTerm, selectedMonth, filterType]);

  // Đảo ngược danh sách để hiển thị phiên mới nhất lên đầu
  const reversedFiltered = useMemo(() => {
    return [...filteredTrades].reverse();
  }, [filteredTrades]);

  const totalPages = Math.ceil(reversedFiltered.length / pageSize) || 1;
  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return reversedFiltered.slice(start, start + pageSize);
  }, [reversedFiltered, currentPage, pageSize]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-2xl border border-white/10 bg-[#0b0f17] text-slate-100 shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#090d16]/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  {t("title")}
                </h2>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 font-mono">
                  {t("db_badge")}
                </span>
                <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-bold text-sky-400 border border-sky-500/30 font-mono">
                  {t("zero_lookahead_badge")}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{t("subtitle")}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title={t("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thống kê Tổng quan (KPI Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 p-3.5 bg-white/[0.02] border-b border-white/[0.08]">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 shadow-sm">
            <div className="text-[10px] text-emerald-400/80 uppercase font-bold">
              {t("kpi_total_pnl")}
            </div>
            <div className="mt-1 text-lg font-black text-emerald-400 flex items-center gap-1 font-mono">
              <TrendingUp className="h-4 w-4" />
              {activeSummary?.totalPnl != null
                ? activeSummary.totalPnl > 0
                  ? `+${activeSummary.totalPnl.toFixed(1)}`
                  : activeSummary.totalPnl.toFixed(1)
                : "0.0"}
              {t("pts_unit")}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {t("kpi_total_pnl_sub", {
                vnd:
                  activeSummary?.totalPnl != null
                    ? activeSummary.totalPnl > 0
                      ? `+${(activeSummary.totalPnl / 10).toFixed(2)}`
                      : (activeSummary.totalPnl / 10).toFixed(2)
                    : "0.00",
              })}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 shadow-sm">
            <div className="text-[10px] text-slate-400 uppercase font-bold">
              {t("kpi_winrate")}
            </div>
            <div className="mt-1 text-lg font-black text-white font-mono">
              {activeSummary?.winRate != null
                ? `${activeSummary.winRate}%`
                : "0.0%"}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {t("kpi_win_loss", {
                wins: activeSummary?.wins ?? 0,
                losses: activeSummary?.losses ?? 0,
              })}
            </div>
          </div>

          <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3 shadow-sm">
            <div className="text-[10px] text-sky-400/80 uppercase font-bold">
              {t("kpi_pf")}
            </div>
            <div className="mt-1 text-lg font-black text-sky-400 font-mono">
              {activeSummary?.profitFactor != null
                ? Number(activeSummary.profitFactor).toFixed(2)
                : "0.00"}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {t("kpi_pf_sub")}
            </div>
          </div>

          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 shadow-sm">
            <div className="text-[10px] text-rose-400/80 uppercase font-bold">
              {t("kpi_mdd")}
            </div>
            <div className="mt-1 text-lg font-black text-rose-400 font-mono">
              {activeSummary?.maxDrawdown != null
                ? `${activeSummary.maxDrawdown.toFixed(1)}${t("pts_unit")}`
                : `0.0${t("pts_unit")}`}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {t("kpi_mdd_sub")}
            </div>
          </div>

          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 shadow-sm">
            <div className="text-[10px] text-purple-300/80 uppercase font-bold">
              {t("kpi_sessions")}
            </div>
            <div className="mt-1 text-lg font-black text-purple-300 font-mono">
              {activeSummary?.totalSessions ?? activeTrades.length}{" "}
              {t("kpi_sessions_unit")}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {t("kpi_filled_info", {
                filled: activeSummary?.tradedCount ?? 0,
                noFill: Math.max(
                  0,
                  (activeSummary?.totalSessions ?? activeTrades.length) -
                    (activeSummary?.tradedCount ?? 0),
                ),
              })}
            </div>
          </div>
        </div>

        {/* Grid PnL Các Tháng */}
        <div className="px-4 py-2 bg-black/30 border-b border-white/[0.08] overflow-x-auto custom-scrollbar">
          <div className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar className="h-3 w-3 text-sky-400" />
            {t("monthly_title")}
          </div>
          <div className="flex items-center gap-1.5 min-w-max pb-1">
            {Object.entries(activeMonthlyPnl).map(([month, pnl]) => {
              const isPos = pnl > 0;
              const isZero = pnl === 0;
              const isSelected = selectedMonth === month;
              return (
                <div
                  key={month}
                  onClick={() => {
                    setSelectedMonth(isSelected ? "ALL" : month);
                    setCurrentPage(1);
                  }}
                  className={`cursor-pointer rounded-lg border px-2.5 py-1 text-center transition-all ${
                    isSelected
                      ? "border-sky-400 bg-sky-500/20 shadow-[0_0_12px_rgba(56,189,248,0.2)]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="text-[10px] font-mono text-slate-400">
                    {month}
                  </div>
                  <div
                    className={`text-xs font-bold font-mono ${
                      isPos
                        ? "text-emerald-400"
                        : isZero
                          ? "text-slate-400"
                          : "text-rose-400"
                    }`}
                  >
                    {isPos ? `+${pnl.toFixed(1)}` : pnl.toFixed(1)}
                    {t("pts_unit")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Thanh công cụ tìm kiếm và lọc */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#090d16] border-b border-white/[0.08]">
          {/* Bộ lọc loại lệnh */}
          <div className="flex items-center gap-1.5">
            {[
              {
                id: "ALL",
                label: t("filter_all", { count: activeTrades.length }),
              },
              {
                id: "LIVE",
                label: t("filter_live", {
                  count:
                    activeSummary?.liveCount ??
                    activeTrades.filter((tr) => tr.date >= "2026-09-14").length,
                }),
              },
              {
                id: "WIN",
                label: t("filter_win", {
                  count:
                    activeSummary?.wins ??
                    activeTrades.filter((tr) => tr.isWin).length,
                }),
              },
              {
                id: "LOSS",
                label: t("filter_loss", {
                  count:
                    activeSummary?.losses ??
                    activeTrades.filter(
                      (tr) => tr.pnl < 0 && tr.exitType !== "NO_FILL",
                    ).length,
                }),
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setFilterType(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  filterType === tab.id
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
                    : "border border-white/10 bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t("search_placeholder")}
              className="w-48 rounded-lg border border-white/10 bg-white/[0.03] pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:bg-white/[0.06] focus:outline-none transition-all font-mono"
            />
          </div>
        </div>

        {/* Bảng Dữ Liệu Lịch Sử */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              {t("loading_db")}
            </div>
          ) : reversedFiltered.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              {t("no_records")}
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 border-b border-white/10 bg-[#090d16] text-slate-400">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">{t("col_date")}</th>
                  <th className="py-2.5 px-3 font-semibold text-center">
                    {t("col_mode")}
                  </th>
                  <th className="py-2.5 px-3 font-semibold">{t("col_plan")}</th>
                  <th className="py-2.5 px-3 font-semibold">
                    {t("col_entry")}
                  </th>
                  <th className="py-2.5 px-3 font-semibold">{t("col_tp")}</th>
                  <th className="py-2.5 px-3 font-semibold">{t("col_sl")}</th>
                  <th className="py-2.5 px-3 font-semibold">{t("col_exit")}</th>
                  <th className="py-2.5 px-3 font-semibold">
                    {t("col_exit_type")}
                  </th>
                  <th className="py-2.5 px-3 font-semibold">
                    {t("col_exit_time")}
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-right">
                    {t("col_pnl")}
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-right">
                    {t("col_cum_pnl")}
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-center">
                    {t("col_status")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono">
                {paginatedTrades.map((trade) => {
                  const isLong = trade.side === "LONG";
                  const isNoFill =
                    trade.exitType === "NO_FILL" ||
                    trade.exitType === "PENDING";
                  const isWin = trade.isWin;
                  const isLoss = trade.pnl < 0;

                  return (
                    <tr
                      key={trade.date}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-white">
                        {trade.date}
                        {trade.exitType === "FILLED" ? (
                          <span className="ml-1.5 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300 font-sans border border-emerald-500/40">
                            PHIÊN NÀY
                          </span>
                        ) : trade.exitType === "PENDING" ? (
                          <span className="ml-1.5 rounded-md bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-400 font-sans border border-sky-500/30">
                            {t("next_session")}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {trade.date >= "2026-09-14" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.2)]">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            {t("mode_live")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300/80 border border-purple-500/20">
                            {t("mode_backtest")}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            isLong
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {trade.side}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">
                        {trade.entryPrice ? trade.entryPrice.toFixed(1) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-sky-400">
                        {trade.tpPrice ? trade.tpPrice.toFixed(1) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-rose-400">
                        {trade.slPrice ? trade.slPrice.toFixed(1) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-white font-semibold">
                        {trade.exitType === "FILLED"
                          ? trade.exitPrice > 0
                            ? `${trade.exitPrice.toFixed(1)} (Live)`
                            : "—"
                          : trade.exitPrice > 0
                            ? trade.exitPrice.toFixed(1)
                            : "—"}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            trade.exitType === "TP" ||
                            trade.exitType === "TRAIL"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : trade.exitType === "BE"
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                : trade.exitType === "SL"
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : trade.exitType === "ATC"
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : trade.exitType === "FILLED"
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                      : trade.exitType === "PENDING"
                                        ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                                        : "bg-white/10 text-slate-400 border border-white/10"
                          }`}
                        >
                          {trade.exitType === "NO_FILL"
                            ? t("exit_no_fill")
                            : trade.exitType === "PENDING"
                              ? t("exit_pending")
                              : trade.exitType === "FILLED"
                                ? "ĐANG KHỚP"
                                : trade.exitType === "BE"
                                  ? "BE (Hòa vốn)"
                                  : trade.exitType === "TRAIL"
                                    ? "TRAIL (Khóa lãi)"
                                    : trade.exitType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {trade.exitMinute || "—"}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold ${
                          isNoFill
                            ? "text-slate-500"
                            : isWin
                              ? "text-emerald-400"
                              : isLoss
                                ? "text-rose-400"
                                : "text-slate-400"
                        }`}
                      >
                        {isNoFill
                          ? `0.0${t("pts_unit")}`
                          : `${trade.pnl > 0 ? `+${trade.pnl.toFixed(1)}` : trade.pnl.toFixed(1)}${t("pts_unit")}`}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-white">
                        {trade.cumulativePnl > 0
                          ? `+${trade.cumulativePnl.toFixed(1)}`
                          : trade.cumulativePnl.toFixed(1)}
                        {t("pts_unit")}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <span className="text-[10px] text-slate-400">
                          {trade.status ||
                            (isNoFill
                              ? t("status_no_fill")
                              : t("status_settled"))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Phân Trang */}
        <div className="flex items-center justify-between border-t border-white/[0.08] bg-[#090d16] px-6 py-3 text-xs text-slate-400">
          <div>
            {t("pagination_showing", {
              from:
                reversedFiltered.length > 0
                  ? (currentPage - 1) * pageSize + 1
                  : 0,
              to: Math.min(currentPage * pageSize, reversedFiltered.length),
              total: reversedFiltered.length,
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 font-medium text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> {t("btn_prev")}
            </button>
            <span className="text-white font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 font-medium text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {t("btn_next")} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
