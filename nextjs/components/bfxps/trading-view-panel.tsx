"use client";

import React, { useEffect, useRef, useState, useMemo, memo, useCallback } from "react";
import {
  TrendingUp,
  Maximize2,
  Minimize2,
  BarChart2,
  Sliders,
  Compass,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { TradingPlan, MarketSnapshot } from "@/lib/server/quant/types";
import { useTranslations } from "next-intl";

interface CandleBar {
  time: number; // seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingViewPanelProps {
  snapshot: MarketSnapshot;
  plan?: TradingPlan;
}

export const TradingViewPanel: React.FC<TradingViewPanelProps> = memo(({
  snapshot,
  plan,
}) => {
  const t = useTranslations("Bfxps.chart");
  const [timeframe, setTimeframe] = useState<"15m" | "1m">("15m");
  const [symbol, setSymbol] = useState("VN30F1M");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoadingCandles, setIsLoadingCandles] = useState(false);
  const [candles, setCandles] = useState<CandleBar[]>([]);
  const [candleCount, setCandleCount] = useState<number>(7259);
  const [visibleCount, setVisibleCount] = useState<number>(60);
  const [hoveredBar, setHoveredBar] = useState<CandleBar | null>(null);

  // Mốc Kèo Quant
  const entryPrice = plan?.entryPrice || 1945.3;
  const tpPrice = plan?.tpPrice || 1961.3;
  const slPrice = plan?.slPrice || 1937.3;
  const side = plan?.side || "LONG";

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch real candles from /api/bfxps/candles
  const fetchCandles = useCallback(async (tf: "15m" | "1m") => {
    setIsLoadingCandles(true);
    try {
      const res = await fetch(`/api/bfxps/candles?timeframe=${tf}&limit=200`);
      const json = await res.json();
      if (json.ok && Array.isArray(json.bars)) {
        setCandles(json.bars);
        setCandleCount(json.totalCount || (tf === "15m" ? 7259 : 100746));
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu nến:", err);
    } finally {
      setIsLoadingCandles(false);
    }
  }, []);

  useEffect(() => {
    fetchCandles(timeframe);
  }, [timeframe, fetchCandles]);

  // Visible bars slice
  const displayedBars = useMemo(() => {
    if (!candles.length) return [];
    return candles.slice(-visibleCount);
  }, [candles, visibleCount]);

  // Tính toán EMA(5) và EMA(10)
  const calculateEMA = (data: CandleBar[], period: number) => {
    const k = 2 / (period + 1);
    const emaArr: (number | null)[] = [];
    let prevEMA: number | null = null;
    for (let i = 0; i < data.length; i++) {
      const price = data[i].close;
      if (i < period - 1) {
        emaArr.push(null);
      } else if (i === period - 1) {
        let sum = 0;
        for (let j = 0; j < period; j++) sum += data[j].close;
        prevEMA = sum / period;
        emaArr.push(prevEMA);
      } else if (prevEMA !== null) {
        prevEMA = price * k + prevEMA * (1 - k);
        emaArr.push(prevEMA);
      }
    }
    return emaArr;
  };

  const ema5 = useMemo(() => calculateEMA(displayedBars, 5), [displayedBars]);
  const ema10 = useMemo(() => calculateEMA(displayedBars, 10), [displayedBars]);

  // Vẽ Canvas Candlestick Pro Chart
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !displayedBars.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear background
    ctx.fillStyle = "#070a0f";
    ctx.fillRect(0, 0, width, height);

    const paddingRight = 65; // Price scale
    const paddingBottom = 26; // Time scale
    const paddingTop = 28; // Header info space
    const chartWidth = width - paddingRight;
    const chartHeight = height - paddingBottom - paddingTop;
    const volumeHeight = Math.min(80, chartHeight * 0.22);
    const candleAreaHeight = chartHeight - volumeHeight - 10;

    // Tìm Min/Max Price bao gồm cả Kèo (Entry, TP, SL)
    let minPrice = Math.min(...displayedBars.map((b) => b.low));
    let maxPrice = Math.max(...displayedBars.map((b) => b.high));
    minPrice = Math.min(minPrice, slPrice - 2, 1935);
    maxPrice = Math.max(maxPrice, tpPrice + 2, 1965);
    const priceRange = maxPrice - minPrice || 1;

    const maxVolume = Math.max(...displayedBars.map((b) => b.volume), 1);

    // Helpers to convert data to pixels
    const getY = (price: number) => {
      return paddingTop + candleAreaHeight - ((price - minPrice) / priceRange) * candleAreaHeight;
    };
    const getVolY = (vol: number) => {
      const volAreaTop = paddingTop + candleAreaHeight + 10;
      return volAreaTop + volumeHeight - (vol / maxVolume) * volumeHeight;
    };

    const count = displayedBars.length;
    const candleSpacing = chartWidth / count;
    const candleWidth = Math.max(2, candleSpacing * 0.7);

    // 1. Grid Lines & Price Labels
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const priceStep = priceRange > 30 ? 10 : priceRange > 15 ? 5 : 2;
    const startGridPrice = Math.ceil(minPrice / priceStep) * priceStep;

    for (let p = startGridPrice; p <= maxPrice; p += priceStep) {
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      ctx.fillText(p.toFixed(1), chartWidth + 6, y);
    }

    // 2. Kèo Quant Target Lines (Entry, TP, SL, Ref)
    const drawLevel = (price: number, color: string, label: string, isDashed = true) => {
      const y = getY(price);
      if (y < paddingTop || y > paddingTop + candleAreaHeight) return;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      if (isDashed) ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Badge on right axis
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.fillRect(chartWidth + 1, y - 9, 62, 18);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px JetBrains Mono, monospace";
      ctx.fillText(price.toFixed(1), chartWidth + 5, y);

      // Label on chart
      ctx.fillStyle = color;
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(label, 8, y - 6);
      ctx.restore();
    };

    drawLevel(1940.0, "#484f58", `${t("ref_level_label")}: 1940.0`, true);
    drawLevel(entryPrice, "#3fb950", `${side} ${t("stop_entry_level")}: ${entryPrice.toFixed(1)}`, true);
    drawLevel(tpPrice, "#58a6ff", `TP (${t("tp_pts_val")}): ${tpPrice.toFixed(1)}`, true);
    drawLevel(slPrice, "#f85149", `SL (${t("sl_pts_val")}): ${slPrice.toFixed(1)}`, true);

    // Entrade Current Close Line & Pill (1940.00)
    const currentClose = displayedBars[displayedBars.length - 1]?.close || 1940.0;
    const yCurrent = getY(currentClose);
    if (yCurrent >= paddingTop && yCurrent <= paddingTop + candleAreaHeight) {
      ctx.save();
      ctx.strokeStyle = "#26a69a";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(0, yCurrent);
      ctx.lineTo(chartWidth, yCurrent);
      ctx.stroke();

      // Entrade Green Pill on Right Price Axis
      ctx.setLineDash([]);
      ctx.fillStyle = "#26a69a";
      ctx.fillRect(chartWidth + 1, yCurrent - 9, 62, 18);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px JetBrains Mono, monospace";
      ctx.fillText(currentClose.toFixed(2), chartWidth + 5, yCurrent);
      ctx.restore();
    }

    // 3. Draw Volume Bars
    const volAreaTop = paddingTop + candleAreaHeight + 10;
    for (let i = 0; i < count; i++) {
      const b = displayedBars[i];
      const x = i * candleSpacing + candleSpacing / 2;
      const isUp = b.close >= b.open;
      const vY = getVolY(b.volume);
      const vH = volAreaTop + volumeHeight - vY;

      ctx.fillStyle = isUp ? "rgba(38, 166, 154, 0.35)" : "rgba(239, 83, 80, 0.35)";
      ctx.fillRect(x - candleWidth / 2, vY, candleWidth, vH);
    }

    // 4. Draw Candlesticks (Wick & Body)
    for (let i = 0; i < count; i++) {
      const b = displayedBars[i];
      const x = i * candleSpacing + candleSpacing / 2;
      const isUp = b.close >= b.open;
      const color = isUp ? "#26a69a" : "#ef5350";

      const yOpen = getY(b.open);
      const yClose = getY(b.close);
      const yHigh = getY(b.high);
      const yLow = getY(b.low);

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Body
      const bodyY = Math.min(yOpen, yClose);
      const bodyH = Math.max(2, Math.abs(yClose - yOpen));
      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyH);

      // Time X-Axis labels
      if (i % Math.ceil(count / 7) === 0 || i === count - 1) {
        const date = new Date(b.time * 1000);
        const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(
          date.getMinutes()
        ).padStart(2, "0")}`;
        const dayStr = `${date.getDate()}/${date.getMonth() + 1}`;
        ctx.fillStyle = "#6e7681";
        ctx.font = "9px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText(timeframe === "15m" ? `${dayStr} ${timeStr}` : timeStr, x, height - 8);
      }
    }

    // 5. Draw EMA Lines
    const drawIndicatorLine = (data: (number | null)[], color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < count; i++) {
        const val = data[i];
        if (val === null) continue;
        const x = i * candleSpacing + candleSpacing / 2;
        const y = getY(val);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    drawIndicatorLine(ema5, "#f1e05a"); // Yellow EMA5
    drawIndicatorLine(ema10, "#a371f7"); // Purple EMA10

    // 6. Header Status Summary on Canvas
    const lastBar = hoveredBar || displayedBars[displayedBars.length - 1];
    if (lastBar) {
      const isUp = lastBar.close >= lastBar.open;
      const diff = lastBar.close - lastBar.open;
      const pct = ((diff / (lastBar.open || 1)) * 100).toFixed(2);
      const date = new Date(lastBar.time * 1000);
      const dtStr = `${date.toLocaleDateString("vi-VN")} ${String(date.getHours()).padStart(
        2,
        "0"
      )}:${String(date.getMinutes()).padStart(2, "0")}`;

      ctx.fillStyle = "#8b949e";
      ctx.font = "11px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText(`VN30F1M (${timeframe}) · ${dtStr}`, 10, 16);

      ctx.fillStyle = isUp ? "#3fb950" : "#f85149";
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.fillText(
        `O: ${lastBar.open.toFixed(1)}  H: ${lastBar.high.toFixed(1)}  L: ${lastBar.low.toFixed(
          1
        )}  C: ${lastBar.close.toFixed(1)}  (${diff >= 0 ? "+" : ""}${diff.toFixed(
          1
        )} / ${pct}%)  Vol: ${lastBar.volume.toLocaleString()}`,
        200,
        16
      );

      // Legend for EMAs
      ctx.fillStyle = "#f1e05a";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.fillText("EMA(5)", width - 180, 16);
      ctx.fillStyle = "#a371f7";
      ctx.fillText("EMA(10)", width - 120, 16);
    }
  }, [
    displayedBars,
    slPrice,
    tpPrice,
    entryPrice,
    side,
    ema5,
    ema10,
    timeframe,
    hoveredBar,
  ]);

  // Redraw when bars or window resize
  useEffect(() => {
    drawChart();
    const handleResize = () => drawChart();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawChart]);

  // Mouse move handler for canvas hover
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !displayedBars.length) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const paddingRight = 65;
    const chartWidth = rect.width - paddingRight;
    const candleSpacing = chartWidth / displayedBars.length;
    const idx = Math.floor(x / candleSpacing);
    if (idx >= 0 && idx < displayedBars.length) {
      setHoveredBar(displayedBars[idx]);
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoveredBar(null);
  };

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#070a0f] text-slate-100 shadow-2xl backdrop-blur-xl transition-all ${
        isFullscreen ? "fixed inset-2 z-50 rounded-xl shadow-2xl" : ""
      }`}
    >
      {/* Top Header Controls Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/[0.08] bg-[#090d16]/90 backdrop-blur-md px-3 py-2 gap-2 text-xs">
        {/* Chế độ Chart & Ticker Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Badge: Nến Thật VN30F1M */}
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-bold text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)]">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>{t("real_candles")} ({timeframe})</span>
          </div>

          {/* Timeframe selector (15m vs 1m) */}
          <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-0.5 font-mono text-[11px]">
            <button
              onClick={() => setTimeframe("15m")}
              className={`rounded-md px-2 py-0.5 font-bold transition-all cursor-pointer ${
                timeframe === "15m"
                  ? "bg-emerald-500 text-slate-950 font-extrabold shadow-sm"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
              }`}
              title={t("tf_15m_tooltip")}
            >
              15m ({candleCount.toLocaleString()})
            </button>
            <button
              onClick={() => setTimeframe("1m")}
              className={`rounded-md px-2 py-0.5 font-bold transition-all cursor-pointer ${
                timeframe === "1m"
                  ? "bg-emerald-500 text-slate-950 font-extrabold shadow-sm"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
              }`}
              title={t("tf_1m_tooltip")}
            >
              1m ({t("candles_100k")})
            </button>
          </div>

          {/* Zoom controls cho Canvas */}
          <div className="flex items-center gap-0.5 border-l border-white/10 pl-2 text-slate-400">
            <button
              onClick={() => setVisibleCount((prev) => Math.max(20, prev - 15))}
              className="rounded p-1 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title={t("zoom_in")}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setVisibleCount((prev) => Math.min(180, prev + 15))}
              className="rounded p-1 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title={t("zoom_out")}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setVisibleCount(60)}
              className="rounded p-1 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title={t("reset_zoom")}
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Mốc Kèo Quant Overlay Chips */}
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-bold shadow-sm ${
              side === "LONG"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                : "bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
            }`}
          >
            {side} {t("stop_chip_label")}: {entryPrice.toFixed(1)}
          </span>
          <span className="rounded-md bg-sky-500/15 px-2 py-0.5 font-bold text-sky-400 border border-sky-500/30 shadow-[0_0_10px_rgba(56,189,248,0.1)]">
            TP: {tpPrice.toFixed(1)} ({t("tp_pts_val")})
          </span>
          <span className="rounded-md bg-rose-500/15 px-2 py-0.5 font-bold text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
            SL: {slPrice.toFixed(1)} ({t("sl_pts_val")})
          </span>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="ml-1 rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? t("minimize") : t("fullscreen")}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="relative flex-1 w-full overflow-hidden bg-[#070a0f]">
        <div className="relative h-full w-full">
          {isLoadingCandles && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#070a0f]/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>{t("loading_candles", { tf: timeframe })}</span>
              </div>
            </div>
          )}
          <canvas
            ref={canvasRef}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            className="h-full w-full cursor-crosshair"
          />
        </div>
      </div>

      {/* Bottom Status Bar - Entrade Pro Market Strip */}
      <div className="flex flex-col border-t border-white/[0.08] bg-[#090d16]/95 backdrop-blur-md text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center justify-between px-3 py-1.5 border-b border-white/[0.04]">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="flex items-center gap-1 font-bold text-white">
              <span className="text-emerald-400">VN30F1M:</span>
              <span className="font-mono text-emerald-400 font-black text-xs">1,940.00</span>
              <span className="text-[10px] text-rose-400 font-mono font-medium">-2.00 (-0.10%)</span>
            </span>
            <span className="text-white/10">|</span>
            <span className="flex items-center gap-1">
              <span className="text-slate-400">VN30-INDEX:</span>
              <span className="font-mono font-bold text-rose-400">1,936.69</span>
              <span className="text-[10px] text-rose-400 font-mono">-40.13 (-2.03%)</span>
            </span>
            <span className="text-white/10">|</span>
            <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 border border-white/5">
              {t("session_status_label")} <strong className="text-white font-bold">{t("market_status_closed")}</strong>
            </span>
            <span className="text-white/10">|</span>
            <span className="hidden md:inline-flex items-center gap-2 text-[10px]">
              <span>{t("floor_price_label")} <strong className="font-mono text-sky-400">1,837.3</strong></span>
              <span>{t("ref_price_label")} <strong className="font-mono text-amber-300">1,975.5</strong></span>
              <span>{t("ceiling_price_label")} <strong className="font-mono text-purple-400">2,113.7</strong></span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-slate-400 font-mono">{t("margin_collat", { amount: `103,799,680 ${t("currency_unit")}` })}</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{t("datafeed_entrade")}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between px-3 py-1 bg-[#070a0f] text-[10px]">
          <div className="flex items-center gap-2 text-slate-400">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>{t("loaded_candles", { tf: timeframe, count: candleCount.toLocaleString(), dateRange: "01/2025 → 11/09/2026 14:45 ATC" })}</span>
            <span className="text-slate-600">·</span>
            <span>{t("atr_label")} <strong className="font-mono text-white">26.5</strong></span>
            <span className="text-slate-600">·</span>
            <span>{t("stop_trigger_label")} <strong className="font-mono text-sky-400 font-bold">1945.3</strong></span>
          </div>
          <div className="text-slate-500 font-mono">
            {t("last_candle_atc")}
          </div>
        </div>
      </div>
    </div>
  );
});

TradingViewPanel.displayName = "TradingViewPanel";
