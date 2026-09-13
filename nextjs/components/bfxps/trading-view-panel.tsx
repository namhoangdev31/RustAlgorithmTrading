"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  memo,
  useCallback,
} from "react";
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
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
  snapshot?: MarketSnapshot | null;
  plan?: TradingPlan | null;
}

export const TradingViewPanel: React.FC<TradingViewPanelProps> = memo(
  ({ snapshot, plan }) => {
    const t = useTranslations("Bfxps.chart");
    const [timeframe, setTimeframe] = useState<"15m" | "1m">("15m");
    const [symbol, setSymbol] = useState("VN30F1M");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoadingCandles, setIsLoadingCandles] = useState(false);
    const [candles, setCandles] = useState<CandleBar[]>([]);
    const [candleCount, setCandleCount] = useState<number>(7259);
    const [visibleCount, setVisibleCount] = useState<number>(60);
    const [hoveredBar, setHoveredBar] = useState<CandleBar | null>(null);

    // Tính toán mốc thị trường & tỷ lệ
    const currentPrice =
      snapshot?.current ||
      (candles.length ? candles[candles.length - 1].close : 0);
    const openPrice =
      snapshot?.open || (candles.length ? candles[0].open : currentPrice);
    const priceDiff = currentPrice - openPrice;
    const pricePct = openPrice > 0 ? (priceDiff / openPrice) * 100 : 0;
    const isUp = priceDiff >= 0;
    const basis = snapshot?.basis ?? null;
    const volume =
      snapshot?.volume ??
      (candles.length ? candles[candles.length - 1].volume : 0);
    const oi = snapshot?.oi ?? null;
    const foreignNet = snapshot?.foreignNet ?? null;

    // Mốc Kèo Quant động (không gán cứng)
    const entryPrice = plan?.entryPrice ?? null;
    const tpPrice = plan?.tpPrice ?? null;
    const slPrice = plan?.slPrice ?? null;
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
        console.error("Candle fetch error:", err);
      } finally {
        setIsLoadingCandles(false);
      }
    }, []);

    useEffect(() => {
      fetchCandles(timeframe);
    }, [timeframe, fetchCandles]);

    // Visible bars slice - sync latest bar in real time with snapshot.current
    const displayedBars = useMemo(() => {
      if (!candles.length) return [];
      const sliced = candles.slice(-visibleCount);
      if (!snapshot?.current) return sliced;

      const bars = sliced.map((b) => ({ ...b }));
      const last = bars[bars.length - 1];
      if (last) {
        last.close = snapshot.current;
        if (snapshot.current > last.high) last.high = snapshot.current;
        if (snapshot.current < last.low) last.low = snapshot.current;
      }
      return bars;
    }, [candles, visibleCount, snapshot?.current]);

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
    const ema10 = useMemo(
      () => calculateEMA(displayedBars, 10),
      [displayedBars],
    );

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
      let minPrice = displayedBars.length
        ? Math.min(...displayedBars.map((b) => b.low))
        : 1935;
      let maxPrice = displayedBars.length
        ? Math.max(...displayedBars.map((b) => b.high))
        : 1965;
      if (slPrice != null) {
        minPrice = Math.min(minPrice, slPrice - 2);
      }
      if (tpPrice != null) {
        maxPrice = Math.max(maxPrice, tpPrice + 2);
      }
      const priceRange = maxPrice - minPrice || 1;

      const maxVolume = Math.max(...displayedBars.map((b) => b.volume), 1);

      // Helpers to convert data to pixels
      const getY = (price: number) => {
        return (
          paddingTop +
          candleAreaHeight -
          ((price - minPrice) / priceRange) * candleAreaHeight
        );
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
      const drawLevel = (
        price: number,
        color: string,
        label: string,
        isDashed = true,
      ) => {
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

      const refPrice = openPrice;
      if (refPrice > 0) {
        drawLevel(
          refPrice,
          "#484f58",
          `${t("ref_level_label")}: ${refPrice.toFixed(1)}`,
          true,
        );
      }
      if (entryPrice != null) {
        drawLevel(
          entryPrice,
          "#3fb950",
          `${side} ${t("stop_entry_level")}: ${entryPrice.toFixed(1)}`,
          true,
        );
      }
      if (tpPrice != null) {
        drawLevel(tpPrice, "#58a6ff", `TP: ${tpPrice.toFixed(1)}`, true);
      }
      if (slPrice != null) {
        drawLevel(slPrice, "#f85149", `SL: ${slPrice.toFixed(1)}`, true);
      }

      // Live Close Line & Pill
      const currentClose = currentPrice;
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

        ctx.fillStyle = isUp
          ? "rgba(38, 166, 154, 0.35)"
          : "rgba(239, 83, 80, 0.35)";
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
            date.getMinutes(),
          ).padStart(2, "0")}`;
          const dayStr = `${date.getDate()}/${date.getMonth() + 1}`;
          ctx.fillStyle = "#6e7681";
          ctx.font = "9px JetBrains Mono, monospace";
          ctx.textAlign = "center";
          ctx.fillText(
            timeframe === "15m" ? `${dayStr} ${timeStr}` : timeStr,
            x,
            height - 8,
          );
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
    }, [
      displayedBars,
      slPrice,
      tpPrice,
      entryPrice,
      side,
      openPrice,
      currentPrice,
      ema5,
      ema10,
      timeframe,
      hoveredBar,
      t,
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

    const activeBar = hoveredBar || displayedBars[displayedBars.length - 1];
    const activeBarStats = useMemo(() => {
      if (!activeBar) return null;
      const isUp = activeBar.close >= activeBar.open;
      const diff = activeBar.close - activeBar.open;
      const pct = ((diff / (activeBar.open || 1)) * 100).toFixed(2);
      const date = new Date(activeBar.time * 1000);
      const dtStr = `${date.toLocaleDateString("vi-VN")} ${String(
        date.getHours(),
      ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      return { isUp, diff, pct, dtStr };
    }, [activeBar]);

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
              <span>
                {t("real_candles")} ({timeframe})
              </span>
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
                onClick={() =>
                  setVisibleCount((prev) => Math.max(20, prev - 15))
                }
                className="rounded p-1 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title={t("zoom_in")}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() =>
                  setVisibleCount((prev) => Math.min(180, prev + 15))
                }
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
            {entryPrice != null && (
              <span
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-bold shadow-sm ${
                  side === "LONG"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
                }`}
              >
                {side} {t("stop_chip_label")}: {entryPrice.toFixed(1)}
              </span>
            )}
            {tpPrice != null && (
              <span className="rounded-md bg-sky-500/15 px-2 py-0.5 font-bold text-sky-400 border border-sky-500/30 shadow-[0_0_10px_rgba(56,189,248,0.1)]">
                TP: {tpPrice.toFixed(1)}
              </span>
            )}
            {slPrice != null && (
              <span className="rounded-md bg-rose-500/15 px-2 py-0.5 font-bold text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                SL: {slPrice.toFixed(1)}
              </span>
            )}

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

        {/* Chart Legend & OHLC Live Ribbon (Responsive HTML Overlay) */}
        <div className="flex flex-wrap items-center justify-between border-b border-white/[0.04] bg-[#070a0f]/95 px-3 py-1.5 text-[11px] font-mono gap-2 text-slate-300">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-white">VN30F1M ({timeframe})</span>
            {activeBar && activeBarStats && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400 text-[10px]">{activeBarStats.dtStr}</span>
                <span className="text-slate-600">·</span>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span>O: <strong className="text-slate-200">{activeBar.open.toFixed(1)}</strong></span>
                  <span>H: <strong className="text-emerald-400">{activeBar.high.toFixed(1)}</strong></span>
                  <span>L: <strong className="text-rose-400">{activeBar.low.toFixed(1)}</strong></span>
                  <span>C: <strong className={activeBarStats.isUp ? "text-emerald-400" : "text-rose-400"}>{activeBar.close.toFixed(1)}</strong></span>
                  <span className={`font-bold ${activeBarStats.isUp ? "text-emerald-400" : "text-rose-400"}`}>
                    ({activeBarStats.diff >= 0 ? "+" : ""}{activeBarStats.diff.toFixed(1)} / {activeBarStats.pct}%)
                  </span>
                  <span className="hidden xl:inline text-slate-400">{t("vol_label")} <strong className="text-slate-200">{activeBar.volume.toLocaleString()}</strong></span>
                </div>
              </>
            )}
          </div>

          {/* EMA Legend */}
          <div className="flex items-center gap-2.5 text-[10px] shrink-0">
            <span className="flex items-center gap-1 text-[#f1e05a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f1e05a]"></span>
              <span>EMA(5)</span>
            </span>
            <span className="flex items-center gap-1 text-[#a371f7]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#a371f7]"></span>
              <span>EMA(10)</span>
            </span>
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

        {/* Bottom Status Bar - Live Quant Stream */}
        <div className="flex flex-wrap items-center justify-between border-t border-white/[0.08] bg-[#090d16]/95 backdrop-blur-md px-3 py-1.5 gap-2 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Live Price VN30F1M */}
            <span className="flex items-center gap-1.5 font-bold text-white">
              <span className="text-emerald-400">VN30F1M:</span>
              <span className="font-mono text-white font-black text-xs">
                {currentPrice.toFixed(1)}
              </span>
              <span
                className={`text-[10px] font-mono font-bold ${
                  isUp ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isUp ? "+" : ""}
                {priceDiff.toFixed(1)} ({isUp ? "+" : ""}
                {pricePct.toFixed(2)}%)
              </span>
            </span>

            <span className="text-white/10">|</span>

            {/* Basis */}
            <span className="flex items-center gap-1">
              <span className="text-slate-400">Basis:</span>
              <span
                className={`font-mono font-bold ${
                  basis !== null && basis >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {basis !== null
                  ? `${basis > 0 ? "+" : ""}${basis.toFixed(1)}`
                  : "--"}
              </span>
            </span>

            <span className="text-white/10">|</span>

            {/* Volume */}
            <span className="flex items-center gap-1">
              <span className="text-slate-400">{t("vol_label")}</span>
              <span className="font-mono font-bold text-white">
                {volume > 0 ? volume.toLocaleString() : "--"}
              </span>
            </span>

            {/* OI */}
            {oi !== null && (
              <>
                <span className="text-white/10">|</span>
                <span className="hidden sm:flex items-center gap-1">
                  <span className="text-slate-400">OI:</span>
                  <span className="font-mono font-bold text-sky-400">
                    {oi.toLocaleString()}
                  </span>
                </span>
              </>
            )}

            {/* Foreign Net */}
            {foreignNet !== null && (
              <>
                <span className="text-white/10">|</span>
                <span className="hidden md:flex items-center gap-1">
                  <span className="text-slate-400">{t("foreign_net")}</span>
                  <span
                    className={`font-mono font-bold ${
                      foreignNet >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {foreignNet > 0
                      ? `+${foreignNet.toLocaleString()}`
                      : foreignNet.toLocaleString()}{" "}
                    HĐ
                  </span>
                </span>
              </>
            )}

            <span className="text-white/10">|</span>

            {/* Quant Target Info */}
            {entryPrice != null && tpPrice != null && slPrice != null && (
              <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-slate-300 border border-white/5">
                <strong
                  className={
                    side === "LONG" ? "text-emerald-400" : "text-rose-400"
                  }
                >
                  {side} @ {entryPrice.toFixed(1)}
                </strong>
                <span className="text-slate-500 mx-1">·</span>
                <span>
                  TP{" "}
                  <strong className="text-sky-400">{tpPrice.toFixed(1)}</strong>
                </span>
                <span className="text-slate-500 mx-1">·</span>
                <span>
                  SL{" "}
                  <strong className="text-rose-400">{slPrice.toFixed(1)}</strong>
                </span>
              </span>
            )}
          </div>

          {/* Live Feed Heartbeat */}
          <div className="flex items-center gap-2 text-[10px]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]"></span>
              <span>{t("live_feed_active")}</span>
            </span>
          </div>
        </div>
      </div>
    );
  },
);

TradingViewPanel.displayName = "TradingViewPanel";
