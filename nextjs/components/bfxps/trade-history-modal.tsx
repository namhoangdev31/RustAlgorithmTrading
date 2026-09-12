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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-xl border border-[#30363d] bg-[#0d1117] shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-[#30363d] bg-[#161b22] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1f6feb]/20 text-[#58a6ff]">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  {t("title")}
                </h2>
                <span className="rounded bg-[#238636]/20 px-2 py-0.5 text-[11px] font-bold text-[#3fb950] border border-[#238636]/40">
                  {t("db_badge")}
                </span>
                <span className="rounded bg-[#1f6feb]/20 px-2 py-0.5 text-[11px] font-medium text-[#58a6ff] border border-[#1f6feb]/40">
                  {t("zero_lookahead_badge")}
                </span>
              </div>
              <p className="text-xs text-[#8b949e]">
                {t("subtitle")}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8b949e] hover:bg-[#21262d] hover:text-white transition-colors"
            title={t("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thống kê Tổng quan (KPI Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-[#161b22]/50 border-b border-[#30363d]">
          <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3">
            <div className="text-[11px] text-[#8b949e] uppercase font-bold">{t("kpi_total_pnl")}</div>
            <div className="mt-1 text-lg font-black text-[#3fb950] flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {summary?.totalPnl != null ? (summary.totalPnl > 0 ? `+${summary.totalPnl.toFixed(1)}` : summary.totalPnl.toFixed(1)) : "0.0"}{t("pts_unit")}
            </div>
            <div className="text-[10px] text-[#8b949e]">{t("kpi_total_pnl_sub")}</div>
          </div>

          <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3">
            <div className="text-[11px] text-[#8b949e] uppercase font-bold">{t("kpi_winrate")}</div>
            <div className="mt-1 text-lg font-black text-white">
              {summary?.winRate != null ? `${summary.winRate}%` : "0.0%"}
            </div>
            <div className="text-[10px] text-[#8b949e]">
              {t("kpi_win_loss", { wins: summary?.wins ?? 0, losses: summary?.losses ?? 0 })}
            </div>
          </div>

          <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3">
            <div className="text-[11px] text-[#8b949e] uppercase font-bold">{t("kpi_pf")}</div>
            <div className="mt-1 text-lg font-black text-[#58a6ff]">
              {summary?.profitFactor != null ? Number(summary.profitFactor).toFixed(2) : "0.00"}
            </div>
            <div className="text-[10px] text-[#8b949e]">{t("kpi_pf_sub")}</div>
          </div>

          <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3">
            <div className="text-[11px] text-[#8b949e] uppercase font-bold">{t("kpi_mdd")}</div>
            <div className="mt-1 text-lg font-black text-[#f85149]">
              {summary?.maxDrawdown != null ? `${summary.maxDrawdown.toFixed(1)}${t("pts_unit")}` : `0.0${t("pts_unit")}`}
            </div>
            <div className="text-[10px] text-[#8b949e]">{t("kpi_mdd_sub")}</div>
          </div>

          <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3">
            <div className="text-[11px] text-[#8b949e] uppercase font-bold">{t("kpi_sessions")}</div>
            <div className="mt-1 text-lg font-black text-[#d2a8ff]">
              {summary?.totalSessions ?? trades.length} {t("kpi_sessions_unit")}
            </div>
            <div className="text-[10px] text-[#8b949e]">
              {t("kpi_filled_info", { filled: summary?.tradedCount ?? 0, noFill: Math.max(0, (summary?.totalSessions ?? trades.length) - (summary?.tradedCount ?? 0)) })}
            </div>
          </div>
        </div>

        {/* Grid PnL 21 Tháng */}
        <div className="px-4 py-2 bg-[#0b0e14] border-b border-[#30363d] overflow-x-auto">
          <div className="text-[11px] font-bold text-[#8b949e] mb-1.5 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#58a6ff]" />
            {t("monthly_title")}
          </div>
          <div className="flex items-center gap-1.5 min-w-max pb-1">
            {Object.entries(monthlyPnl).map(([month, pnl]) => {
              const isPos = pnl > 0;
              const isZero = pnl === 0;
              return (
                <div
                  key={month}
                  onClick={() => {
                    setSelectedMonth(selectedMonth === month ? "ALL" : month);
                    setCurrentPage(1);
                  }}
                  className={`cursor-pointer rounded border px-2 py-1 text-center transition-all ${
                    selectedMonth === month
                      ? "border-[#58a6ff] bg-[#1f6feb]/20"
                      : "border-[#30363d] bg-[#161b22] hover:border-[#8b949e]"
                  }`}
                >
                  <div className="text-[10px] font-mono text-[#8b949e]">{month}</div>
                  <div
                    className={`text-xs font-bold font-mono ${
                      isPos ? "text-[#3fb950]" : isZero ? "text-[#8b949e]" : "text-[#f85149]"
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
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#161b22] border-b border-[#30363d]">
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
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  filterType === tab.id
                    ? "bg-[#1f6feb] text-white"
                    : "bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Chọn tháng & Tìm kiếm */}
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-md border border-[#30363d] bg-[#0d1117] px-2.5 py-1 text-xs text-white focus:border-[#58a6ff] focus:outline-none"
            >
              <option value="ALL">{t("all_months")}</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {t("month_label", { m })}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b949e]" />
              <input
                type="text"
                placeholder={t("search_placeholder")}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-48 rounded-md border border-[#30363d] bg-[#0d1117] pl-8 pr-3 py-1 text-xs text-white placeholder-[#8b949e] focus:border-[#58a6ff] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bảng Dữ Liệu Lịch Sử */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-[#8b949e]">
              {t("loading_db")}
            </div>
          ) : reversedFiltered.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[#8b949e]">
              {t("no_records")}
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 border-b border-[#30363d] bg-[#161b22] text-[#8b949e]">
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
              <tbody className="divide-y divide-[#21262d] font-mono">
                {paginatedTrades.map((trade) => {
                  const isLong = trade.side === "LONG";
                  const isNoFill = trade.exitType === "NO_FILL" || trade.exitType === "PENDING";
                  const isWin = trade.isWin;
                  const isLoss = trade.pnl < 0;

                  return (
                    <tr
                      key={trade.date}
                      className="hover:bg-[#161b22]/70 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-white">
                        {trade.date}
                        {trade.exitType === "PENDING" && (
                          <span className="ml-1.5 rounded bg-[#1f6feb]/30 px-1.5 py-0.5 text-[10px] text-[#58a6ff] font-sans">
                            {t("next_session")}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold ${
                            isLong
                              ? "bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30"
                              : "bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/30"
                          }`}
                        >
                          {trade.side}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#e6edf3]">
                        {trade.entryPrice ? trade.entryPrice.toFixed(1) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-[#58a6ff]">
                        {trade.tpPrice ? trade.tpPrice.toFixed(1) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-[#f85149]">
                        {trade.slPrice ? trade.slPrice.toFixed(1) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-white font-semibold">
                        {trade.exitPrice > 0 ? trade.exitPrice.toFixed(1) : "—"}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            trade.exitType === "TP"
                              ? "bg-[#238636]/30 text-[#3fb950]"
                              : trade.exitType === "SL"
                              ? "bg-[#da3633]/30 text-[#f85149]"
                              : trade.exitType === "ATC"
                              ? "bg-[#d29922]/30 text-[#e3b341]"
                              : trade.exitType === "PENDING"
                              ? "bg-[#1f6feb]/30 text-[#58a6ff]"
                              : "bg-[#30363d] text-[#8b949e]"
                          }`}
                        >
                          {trade.exitType === "NO_FILL"
                            ? t("exit_no_fill")
                            : trade.exitType === "PENDING"
                            ? t("exit_pending")
                            : trade.exitType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#8b949e]">
                        {trade.exitMinute || "—"}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold ${
                          isNoFill
                            ? "text-[#8b949e]"
                            : isWin
                            ? "text-[#3fb950]"
                            : isLoss
                            ? "text-[#f85149]"
                            : "text-[#8b949e]"
                        }`}
                      >
                        {isNoFill ? `0.0${t("pts_unit")}` : `${trade.pnl > 0 ? `+${trade.pnl.toFixed(1)}` : trade.pnl.toFixed(1)}${t("pts_unit")}`}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-white">
                        {trade.cumulativePnl > 0 ? `+${trade.cumulativePnl.toFixed(1)}` : trade.cumulativePnl.toFixed(1)}{t("pts_unit")}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <span className="text-[10px] text-[#8b949e]">
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
        <div className="flex items-center justify-between border-t border-[#30363d] bg-[#161b22] px-6 py-3 text-xs text-[#8b949e]">
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
              className="flex items-center gap-1 rounded-md border border-[#30363d] bg-[#21262d] px-2.5 py-1 font-medium text-white hover:bg-[#30363d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> {t("btn_prev")}
            </button>
            <span className="text-white font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-md border border-[#30363d] bg-[#21262d] px-2.5 py-1 font-medium text-white hover:bg-[#30363d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t("btn_next")} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
