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

export interface TradeItem {
  date: string;
  side: "LONG" | "SHORT";
  entryPrice: number;
  slPrice: number;
  tpPrice: number;
  exitPrice: number;
  exitType: "TP" | "SL" | "ATC" | "NO_FILL" | "PENDING";
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
}

export const TradeHistoryModal: React.FC<TradeHistoryModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations("Bfxps.history");
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [monthlyPnl, setMonthlyPnl] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "FILLED" | "WIN" | "LOSS" | "NO_FILL">("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/bfxps/history")
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

  // Danh sách các tháng có trong dữ liệu
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    trades.forEach((t) => {
      if (t.date) months.add(t.date.slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [trades]);

  // Bộ lọc dữ liệu
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      // Lọc theo search
      if (searchTerm && !t.date.includes(searchTerm)) {
        return false;
      }
      // Lọc theo tháng
      if (selectedMonth !== "ALL" && !t.date.startsWith(selectedMonth)) {
        return false;
      }
      // Lọc theo trạng thái
      if (filterType === "FILLED" && (t.exitType === "NO_FILL" || t.exitType === "PENDING")) {
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
  }, [trades, searchTerm, selectedMonth, filterType]);

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
              <p className="text-xs text-slate-400 mt-0.5">
                {t("subtitle")}
              </p>
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
            <div className="text-[10px] text-emerald-400/80 uppercase font-bold">{t("kpi_total_pnl")}</div>
            <div className="mt-1 text-lg font-black text-emerald-400 flex items-center gap-1 font-mono">
              <TrendingUp className="h-4 w-4" />
              {summary?.totalPnl != null ? (summary.totalPnl > 0 ? `+${summary.totalPnl.toFixed(1)}` : summary.totalPnl.toFixed(1)) : "0.0"}{t("pts_unit")}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">{t("kpi_total_pnl_sub")}</div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 shadow-sm">
            <div className="text-[10px] text-slate-400 uppercase font-bold">{t("kpi_winrate")}</div>
            <div className="mt-1 text-lg font-black text-white font-mono">
              {summary?.winRate != null ? `${summary.winRate}%` : "0.0%"}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {t("kpi_win_loss", { wins: summary?.wins ?? 0, losses: summary?.losses ?? 0 })}
            </div>
          </div>

          <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3 shadow-sm">
            <div className="text-[10px] text-sky-400/80 uppercase font-bold">{t("kpi_pf")}</div>
            <div className="mt-1 text-lg font-black text-sky-400 font-mono">
              {summary?.profitFactor != null ? Number(summary.profitFactor).toFixed(2) : "0.00"}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">{t("kpi_pf_sub")}</div>
          </div>

          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 shadow-sm">
            <div className="text-[10px] text-rose-400/80 uppercase font-bold">{t("kpi_mdd")}</div>
            <div className="mt-1 text-lg font-black text-rose-400 font-mono">
              {summary?.maxDrawdown != null ? `${summary.maxDrawdown.toFixed(1)}${t("pts_unit")}` : `0.0${t("pts_unit")}`}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">{t("kpi_mdd_sub")}</div>
          </div>

          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 shadow-sm">
            <div className="text-[10px] text-purple-300/80 uppercase font-bold">{t("kpi_sessions")}</div>
            <div className="mt-1 text-lg font-black text-purple-300 font-mono">
              {summary?.totalSessions ?? trades.length} {t("kpi_sessions_unit")}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {t("kpi_filled_info", { filled: summary?.tradedCount ?? 0, noFill: Math.max(0, (summary?.totalSessions ?? trades.length) - (summary?.tradedCount ?? 0)) })}
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
            {Object.entries(monthlyPnl).map(([month, pnl]) => {
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
                  <div className="text-[10px] font-mono text-slate-400">{month}</div>
                  <div
                    className={`text-xs font-bold font-mono ${
                      isPos ? "text-emerald-400" : isZero ? "text-slate-400" : "text-rose-400"
                    }`}
                  >
                    {isPos ? `+${pnl.toFixed(1)}` : pnl.toFixed(1)}{t("pts_unit")}
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
              { id: "ALL", label: t("filter_all", { count: trades.length }) },
              { id: "WIN", label: t("filter_win", { count: summary?.wins ?? trades.filter((tr) => tr.isWin).length }) },
              { id: "LOSS", label: t("filter_loss", { count: summary?.losses ?? trades.filter((tr) => tr.pnl < 0 && tr.exitType !== "NO_FILL").length }) },
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
                  <th className="py-2.5 px-3 font-semibold">{t("col_plan")}</th>
                  <th className="py-2.5 px-3 font-semibold">{t("col_entry")}</th>
                  <th className="py-2.5 px-3 font-semibold">{t("col_tp")}</th>
                  <th className="py-2.5 px-3 font-semibold">{t("col_sl")}</th>
                  <th className="py-2.5 px-3 font-semibold">{t("col_exit")}</th>
                  <th className="py-2.5 px-3 font-semibold">{t("col_exit_type")}</th>
                  <th className="py-2.5 px-3 font-semibold">{t("col_exit_time")}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{t("col_pnl")}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{t("col_cum_pnl")}</th>
                  <th className="py-2.5 px-3 font-semibold text-center">{t("col_status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono">
                {paginatedTrades.map((trade) => {
                  const isLong = trade.side === "LONG";
                  const isNoFill = trade.exitType === "NO_FILL" || trade.exitType === "PENDING";
                  const isWin = trade.isWin;
                  const isLoss = trade.pnl < 0;

                  return (
                    <tr
                      key={trade.date}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-white">
                        {trade.date}
                        {trade.exitType === "PENDING" && (
                          <span className="ml-1.5 rounded-md bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-400 font-sans border border-sky-500/30">
                            {t("next_session")}
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
                        {trade.exitPrice > 0 ? trade.exitPrice.toFixed(1) : "—"}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            trade.exitType === "TP"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : trade.exitType === "SL"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : trade.exitType === "ATC"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : trade.exitType === "PENDING"
                              ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                              : "bg-white/10 text-slate-400 border border-white/10"
                          }`}
                        >
                          {trade.exitType === "NO_FILL"
                            ? t("exit_no_fill")
                            : trade.exitType === "PENDING"
                            ? t("exit_pending")
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
                        {isNoFill ? `0.0${t("pts_unit")}` : `${trade.pnl > 0 ? `+${trade.pnl.toFixed(1)}` : trade.pnl.toFixed(1)}${t("pts_unit")}`}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-white">
                        {trade.cumulativePnl > 0 ? `+${trade.cumulativePnl.toFixed(1)}` : trade.cumulativePnl.toFixed(1)}{t("pts_unit")}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <span className="text-[10px] text-slate-400">
                          {trade.status || (isNoFill ? t("status_no_fill") : t("status_settled"))}
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
              from: reversedFiltered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0,
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
