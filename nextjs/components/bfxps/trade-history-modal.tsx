"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Database,
  Search,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Table as TableIcon,
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
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [filterType, setFilterType] = useState<
    "ALL" | "LIVE" | "FILLED" | "WIN" | "LOSS" | "NO_FILL"
  >("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setViewMode("table");
    }
  }, []);

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
      livePlans?.find((p) => p.engine === "simcarrry6") ||
      livePlans?.find((p) => p.isCanonical) ||
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
      <div className="flex h-[100dvh] md:h-[90vh] w-full max-w-6xl flex-col rounded-none md:rounded-lg border-0 md:border md:border-white/[0.08] bg-[#0b0f17] text-slate-100 shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#090d16]/95 px-3.5 sm:px-6 py-2.5 sm:py-3.5 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-md bg-sky-500/20 text-sky-400 shadow-sm shrink-0">
              <Database className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-white tracking-wide truncate">
                  <span className="sm:hidden">SỔ LỆNH KÈO CHÍNH</span>
                  <span className="hidden sm:inline">{t("title")}</span>
                </h2>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-400 font-mono">
                    {t("db_badge")}
                  </span>
                  <span className="hidden sm:inline-flex rounded-md bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-400 font-mono">
                    {t("zero_lookahead_badge")}
                  </span>
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5">
                <span className="sm:hidden">PostgreSQL · Zero Lookahead</span>
                <span className="hidden sm:inline">{t("subtitle")}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1.5 sm:p-2 text-slate-400 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] transition-colors cursor-pointer shrink-0 ml-2 shadow-sm"
            title={t("close")}
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Thống kê Tổng quan (KPI Cards - Không khung viền lồng, dùng nền nổi bật nhẹ nhàng) */}
        <div className="flex md:grid md:grid-cols-5 gap-2 p-2 sm:p-3.5 bg-white/[0.02] border-b border-white/[0.08] overflow-x-auto no-scrollbar shrink-0 touch-pan-x">
          <div className="min-w-[130px] md:min-w-0 flex-1 rounded-md bg-emerald-950/30 p-2 sm:p-3 shadow-sm shrink-0 md:shrink">
            <div className="text-[9px] sm:text-[10px] text-emerald-400/80 uppercase font-bold whitespace-nowrap">
              {t("kpi_total_pnl")}
            </div>
            <div className="mt-0.5 sm:mt-1 text-base sm:text-lg font-black text-emerald-400 flex items-center gap-1 font-mono whitespace-nowrap">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              {activeSummary?.totalPnl != null
                ? activeSummary.totalPnl > 0
                  ? `+${activeSummary.totalPnl.toFixed(1)}`
                  : activeSummary.totalPnl.toFixed(1)
                : "0.0"}
              {t("pts_unit")}
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono whitespace-nowrap">
              {activeSummary?.totalPnl != null
                ? activeSummary.totalPnl > 0
                  ? `+${(activeSummary.totalPnl / 10).toFixed(2)} tr VNĐ/HĐ`
                  : `${(activeSummary.totalPnl / 10).toFixed(2)} tr VNĐ/HĐ`
                : "0.00 tr VNĐ/HĐ"}
            </div>
          </div>

          <div className="min-w-[125px] md:min-w-0 flex-1 rounded-md bg-[#101624] p-2 sm:p-3 shadow-sm shrink-0 md:shrink">
            <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold whitespace-nowrap">
              {t("kpi_winrate")}
            </div>
            <div className="mt-0.5 sm:mt-1 text-base sm:text-lg font-black text-white font-mono whitespace-nowrap">
              {activeSummary?.winRate != null
                ? `${activeSummary.winRate}%`
                : "0.0%"}
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono whitespace-nowrap">
              {activeSummary?.wins ?? 0} thắng · {activeSummary?.losses ?? 0} thua
            </div>
          </div>

          <div className="min-w-[110px] md:min-w-0 flex-1 rounded-md bg-sky-950/25 p-2 sm:p-3 shadow-sm shrink-0 md:shrink">
            <div className="text-[9px] sm:text-[10px] text-sky-400/80 uppercase font-bold whitespace-nowrap">
              {t("kpi_pf")}
            </div>
            <div className="mt-0.5 sm:mt-1 text-base sm:text-lg font-black text-sky-400 font-mono whitespace-nowrap">
              {activeSummary?.profitFactor != null
                ? Number(activeSummary.profitFactor).toFixed(2)
                : "0.00"}
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono whitespace-nowrap">
              {t("kpi_pf_sub")}
            </div>
          </div>

          <div className="min-w-[115px] md:min-w-0 flex-1 rounded-md bg-rose-950/25 p-2 sm:p-3 shadow-sm shrink-0 md:shrink">
            <div className="text-[9px] sm:text-[10px] text-rose-400/80 uppercase font-bold whitespace-nowrap">
              {t("kpi_mdd")}
            </div>
            <div className="mt-0.5 sm:mt-1 text-base sm:text-lg font-black text-rose-400 font-mono whitespace-nowrap">
              {activeSummary?.maxDrawdown != null
                ? `${activeSummary.maxDrawdown.toFixed(1)}${t("pts_unit")}`
                : `0.0${t("pts_unit")}`}
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono whitespace-nowrap">
              {t("kpi_mdd_sub")}
            </div>
          </div>

          <div className="min-w-[125px] md:min-w-0 flex-1 rounded-md bg-purple-950/25 p-2 sm:p-3 shadow-sm shrink-0 md:shrink">
            <div className="text-[9px] sm:text-[10px] text-purple-300/80 uppercase font-bold whitespace-nowrap">
              {t("kpi_sessions")}
            </div>
            <div className="mt-0.5 sm:mt-1 text-base sm:text-lg font-black text-purple-300 font-mono whitespace-nowrap">
              {activeSummary?.totalSessions ?? activeTrades.length}{" "}
              <span className="text-xs font-normal text-purple-400/80">P</span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono whitespace-nowrap">
              {activeSummary?.tradedCount ?? 0} khớp ·{" "}
              {Math.max(
                0,
                (activeSummary?.totalSessions ?? activeTrades.length) -
                  (activeSummary?.tradedCount ?? 0),
              )}{" "}
              ko khớp
            </div>
          </div>
        </div>

        {/* Grid PnL Các Tháng (Nút nổi không border) */}
        <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-black/30 border-b border-white/[0.08] overflow-x-auto no-scrollbar shrink-0 touch-pan-x">
          <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar className="h-3 w-3 text-sky-400" />
            {t("monthly_title")}
          </div>
          <div className="flex items-center gap-1.5 min-w-max pb-0.5">
            {/* Nút Tất Cả Tháng */}
            <div
              onClick={() => {
                setSelectedMonth("ALL");
                setCurrentPage(1);
              }}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-center transition-all shadow-sm ${
                selectedMonth === "ALL"
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/25 font-bold"
                  : "bg-[#101624] text-slate-300 hover:bg-[#162033] hover:text-white"
              }`}
            >
              <div className="text-[9px] sm:text-[10px] font-mono opacity-80">
                {t("all_months_pill")}
              </div>
              <div className={`text-[11px] sm:text-xs font-bold font-mono ${selectedMonth === "ALL" ? "text-white" : "text-sky-300"}`}>
                {activeSummary?.totalPnl != null
                  ? `${activeSummary.totalPnl > 0 ? "+" : ""}${activeSummary.totalPnl.toFixed(1)}${t("pts_unit")}`
                  : "--"}
              </div>
            </div>

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
                  className={`cursor-pointer rounded-md px-2.5 py-1 text-center transition-all shadow-sm ${
                    isSelected
                      ? "bg-sky-600 text-white shadow-md shadow-sky-600/25 font-bold"
                      : "bg-[#101624] text-slate-300 hover:bg-[#162033] hover:text-white"
                  }`}
                >
                  <div className="text-[9px] sm:text-[10px] font-mono opacity-80">
                    {month}
                  </div>
                  <div
                    className={`text-[11px] sm:text-xs font-bold font-mono ${
                      isSelected
                        ? "text-white"
                        : isPos
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

        {/* Thanh công cụ tìm kiếm, bộ lọc và chuyển đổi giao diện */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 sm:p-3.5 bg-[#090d16] border-b border-white/[0.08] shrink-0">
          {/* Bộ lọc loại lệnh */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 touch-pan-x">
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
                className={`rounded-md px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-sm ${
                  filterType === tab.id
                    ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                    : "bg-[#101624] text-slate-400 hover:text-white hover:bg-[#162033]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Chuyển đổi Dạng Thẻ (Cards) / Dạng Bảng (Table) */}
            <div className="flex items-center rounded-md bg-[#101624] p-0.5 shrink-0 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title={t("view_cards")}
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold sm:hidden">Thẻ</span>
                <span className="text-[10px] font-bold hidden sm:inline">{t("view_cards")}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title={t("view_table")}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold sm:hidden">Bảng</span>
                <span className="text-[10px] font-bold hidden sm:inline">{t("view_table")}</span>
              </button>
            </div>

            {/* Ô tìm kiếm */}
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t("search_placeholder")}
                className="w-full rounded-md bg-[#101624] pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-sky-500 focus:outline-none transition-all font-mono shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Nội dung dữ liệu (Chế độ Dạng Thẻ hoặc Dạng Bảng) */}
        <div className="flex-1 overflow-auto custom-scrollbar min-h-0">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              {t("loading_db")}
            </div>
          ) : reversedFiltered.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              {t("no_records")}
            </div>
          ) : viewMode === "cards" ? (
            /* DẠNG THẺ TỐI ƯU MOBILE (Card View) */
            <div className="p-2 sm:p-4 space-y-2">
              {paginatedTrades.map((trade) => {
                const isLong = trade.side === "LONG";
                const isNoFill =
                  trade.exitType === "NO_FILL" ||
                  trade.exitType === "PENDING";
                const isWin = trade.isWin;
                const isLoss = trade.pnl < 0;
                const isLive = trade.date >= "2026-09-14";

                return (
                  <div
                    key={trade.date}
                    className="rounded-lg bg-[#0e1422] p-3 hover:bg-[#111828] transition-all shadow-sm"
                  >
                    {/* Hàng 1: Ngày + Mode + Kèo + PnL */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.04]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-white">
                          {trade.date}
                        </span>
                        {isLive ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-400">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                            </span>
                            {t("mode_live")}
                          </span>
                        ) : (
                          <span className="rounded-md bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-medium text-purple-300/80">
                            {t("mode_backtest")}
                          </span>
                        )}
                        {trade.exitType === "FILLED" && (
                          <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[9px] text-emerald-300 font-sans font-bold">
                            PHIÊN NÀY
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            isLong
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-rose-500/15 text-rose-400"
                          }`}
                        >
                          {trade.side}
                        </span>
                        <span
                          className={`font-mono text-sm font-black ${
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
                        </span>
                      </div>
                    </div>

                    {/* Hàng 2: Grid 4 Giá (Vào, TP, SL, Đóng) - Dạng strip liền mạch KHÔNG khung lồng khung */}
                    <div className="grid grid-cols-4 gap-2 py-2 px-1 text-center font-mono text-[11px] bg-black/25 rounded-md my-2">
                      <div>
                        <span className="block text-[9px] uppercase text-slate-400 font-semibold truncate">
                          <span className="sm:hidden">VÀO</span>
                          <span className="hidden sm:inline">{t("col_entry")}</span>
                        </span>
                        <span className="font-semibold text-slate-200">
                          {trade.entryPrice ? trade.entryPrice.toFixed(1) : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase text-sky-400 font-semibold truncate">
                          TP
                        </span>
                        <span className="font-bold text-sky-400">
                          {trade.tpPrice ? trade.tpPrice.toFixed(1) : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase text-rose-400 font-semibold truncate">
                          SL
                        </span>
                        <span className="font-bold text-rose-400">
                          {trade.slPrice ? trade.slPrice.toFixed(1) : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase text-slate-400 font-semibold truncate">
                          <span className="sm:hidden">ĐÓNG</span>
                          <span className="hidden sm:inline">{t("col_exit")}</span>
                        </span>
                        <span className="font-bold text-white">
                          {trade.exitPrice > 0 ? trade.exitPrice.toFixed(1) : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Hàng 3: Loại Thoát + Giờ Thoát + Lũy Kế (Cân đối 1 dòng) */}
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono gap-1">
                      <div className="flex items-center gap-1.5 min-w-0 shrink truncate">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold shrink-0 whitespace-nowrap ${
                            trade.exitType === "TP" || trade.exitType === "TRAIL"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : trade.exitType === "BE"
                                ? "bg-cyan-500/20 text-cyan-400"
                                : trade.exitType === "SL"
                                  ? "bg-rose-500/20 text-rose-400"
                                  : trade.exitType === "ATC"
                                    ? "bg-amber-500/20 text-amber-300"
                                    : trade.exitType === "FILLED"
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : "bg-white/10 text-slate-400"
                          }`}
                        >
                          {trade.exitType === "NO_FILL"
                            ? t("exit_no_fill")
                            : trade.exitType === "PENDING"
                              ? t("exit_pending")
                              : trade.exitType === "FILLED"
                                ? "ĐANG KHỚP"
                                : trade.exitType === "BE"
                                  ? "BE"
                                  : trade.exitType === "TRAIL"
                                    ? "TRAIL"
                                    : trade.exitType}
                        </span>
                        {trade.exitMinute && (
                          <span className="text-slate-500 shrink-0 whitespace-nowrap">
                            {trade.exitMinute}
                          </span>
                        )}
                        <span className="text-slate-600 shrink-0">·</span>
                        <span className="text-slate-400 font-sans truncate">
                          {trade.status || (isNoFill ? t("status_no_fill") : t("status_settled"))}
                        </span>
                      </div>

                      <div className="text-right shrink-0 whitespace-nowrap pl-1">
                        <span className="text-slate-500 mr-1">Lũy kế:</span>
                        <span
                          className={`font-bold font-mono ${
                            trade.cumulativePnl > 0
                              ? "text-emerald-400"
                              : trade.cumulativePnl < 0
                                ? "text-rose-400"
                                : "text-white"
                          }`}
                        >
                          {trade.cumulativePnl > 0 ? `+${trade.cumulativePnl.toFixed(1)}` : trade.cumulativePnl.toFixed(1)}
                          {t("pts_unit")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* DẠNG BẢNG TOÀN BỘ CỘT (Table View với Sticky Date Column) */
            <div className="min-w-[960px] sm:min-w-full">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-20 border-b border-white/10 bg-[#090d16] text-slate-400">
                  <tr>
                    <th className="sticky left-0 z-30 bg-[#090d16] py-2.5 px-3 font-semibold whitespace-nowrap shadow-[2px_0_5px_rgba(0,0,0,0.4)] border-r border-white/10">
                      {t("col_date")}
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-center whitespace-nowrap">
                      {t("col_mode")}
                    </th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                      {t("col_plan")}
                    </th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                      {t("col_entry")}
                    </th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                      {t("col_tp")}
                    </th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                      {t("col_sl")}
                    </th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                      {t("col_exit")}
                    </th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                      {t("col_exit_type")}
                    </th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                      {t("col_exit_time")}
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">
                      {t("col_pnl")}
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">
                      {t("col_cum_pnl")}
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-center whitespace-nowrap">
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
                        className="group hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="sticky left-0 z-10 bg-[#0b0f17] group-hover:bg-[#111726] py-2.5 px-3 font-bold text-white whitespace-nowrap shadow-[2px_0_5px_rgba(0,0,0,0.4)] border-r border-white/10 transition-colors">
                          {trade.date}
                          {trade.exitType === "FILLED" ? (
                            <span className="ml-1.5 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300 font-sans font-bold">
                              PHIÊN NÀY
                            </span>
                          ) : trade.exitType === "PENDING" ? (
                            <span className="ml-1.5 rounded-md bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-400 font-sans font-bold">
                              {t("next_session")}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {trade.date >= "2026-09-14" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)] whitespace-nowrap">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                              </span>
                              {t("mode_live")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300/80 whitespace-nowrap">
                              {t("mode_backtest")}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${
                              isLong
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-rose-500/15 text-rose-400"
                            }`}
                          >
                            {trade.side}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-200 whitespace-nowrap">
                          {trade.entryPrice ? trade.entryPrice.toFixed(1) : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-sky-400 whitespace-nowrap">
                          {trade.tpPrice ? trade.tpPrice.toFixed(1) : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-rose-400 whitespace-nowrap">
                          {trade.slPrice ? trade.slPrice.toFixed(1) : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-white font-semibold whitespace-nowrap">
                          {trade.exitType === "FILLED"
                            ? trade.exitPrice > 0
                              ? `${trade.exitPrice.toFixed(1)} (Live)`
                              : "—"
                            : trade.exitPrice > 0
                              ? trade.exitPrice.toFixed(1)
                              : "—"}
                        </td>
                        <td className="py-2.5 px-3 font-sans whitespace-nowrap">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${
                              trade.exitType === "TP" ||
                              trade.exitType === "TRAIL"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : trade.exitType === "BE"
                                  ? "bg-cyan-500/20 text-cyan-400"
                                  : trade.exitType === "SL"
                                    ? "bg-rose-500/20 text-rose-400"
                                    : trade.exitType === "ATC"
                                      ? "bg-amber-500/20 text-amber-300"
                                      : trade.exitType === "FILLED"
                                        ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                        : trade.exitType === "PENDING"
                                          ? "bg-sky-500/20 text-sky-400"
                                          : "bg-white/10 text-slate-400"
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
                        <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                          {trade.exitMinute || "—"}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
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
                        <td className="py-2.5 px-3 text-right font-semibold text-white whitespace-nowrap">
                          {trade.cumulativePnl > 0
                            ? `+${trade.cumulativePnl.toFixed(1)}`
                            : trade.cumulativePnl.toFixed(1)}
                          {t("pts_unit")}
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans whitespace-nowrap">
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
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
            </div>
          )}
        </div>

        {/* Footer Phân Trang */}
        <div className="flex items-center justify-between border-t border-white/[0.08] bg-[#090d16] px-3 sm:px-6 py-2 sm:py-3 text-[11px] sm:text-xs text-slate-400 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="truncate pr-2 pl-12 sm:pl-0">
            <span className="sm:hidden font-mono">
              {reversedFiltered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, reversedFiltered.length)} / {reversedFiltered.length}P
            </span>
            <span className="hidden sm:inline">
              {t("pagination_showing", {
                from:
                  reversedFiltered.length > 0
                    ? (currentPage - 1) * pageSize + 1
                    : 0,
                to: Math.min(currentPage * pageSize, reversedFiltered.length),
                total: reversedFiltered.length,
              })}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-md bg-[#101624] hover:bg-[#162033] px-2 sm:px-2.5 py-1 font-medium text-white shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> {t("btn_prev")}
            </button>
            <span className="text-white font-mono px-1">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-md bg-[#101624] hover:bg-[#162033] px-2 sm:px-2.5 py-1 font-medium text-white shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {t("btn_next")} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
