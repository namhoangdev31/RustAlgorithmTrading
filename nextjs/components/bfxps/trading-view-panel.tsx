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
} from "lucide-react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  LineStyle,
  CrosshairMode,
  ColorType,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";
import { TradingPlan, MarketSnapshot } from "@/lib/server/quant/types";
import { useTranslations } from "next-intl";

interface CandleBar {
  time: number; 
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
    const [hoveredBar, setHoveredBar] = useState<CandleBar | null>(null);

    const chartContainerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick", any> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram", any> | null>(null);
    const ema5SeriesRef = useRef<ISeriesApi<"Line", any> | null>(null);
    const ema10SeriesRef = useRef<ISeriesApi<"Line", any> | null>(null);

    const entryLineRef = useRef<any>(null);
    const tpLineRef = useRef<any>(null);
    const slLineRef = useRef<any>(null);

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

    const entryPrice = plan?.entryPrice ?? null;
    const tpPrice = plan?.tpPrice ?? null;
    const slPrice = plan?.slPrice ?? null;
    const side = plan?.side || "LONG";

    const fetchCandles = useCallback(
      async (tf: "15m" | "1m", isBackground = false) => {
        if (!isBackground) setIsLoadingCandles(true);
        try {
          const res = await fetch(
            `/api/bfxps/candles?timeframe=${tf}&limit=300&_t=${Date.now()}`,
            { cache: "no-store" },
          );
          const json = await res.json();
          if (json.ok && Array.isArray(json.bars)) {
            setCandles(json.bars);
            setCandleCount(json.totalCount || (tf === "15m" ? 7259 : 100746));
          }
        } catch (err) {
          console.error("Candle fetch error:", err);
        } finally {
          if (!isBackground) setIsLoadingCandles(false);
        }
      },
      [],
    );

    useEffect(() => {
      fetchCandles(timeframe, false);
      const candleInterval = setInterval(() => {
        fetchCandles(timeframe, true);
      }, 15000); 
      return () => clearInterval(candleInterval);
    }, [timeframe, fetchCandles]);

    const chartData = useMemo(() => {
      if (!candles.length) return [];
      const list = candles.map((c) => ({ ...c }));
      if (!snapshot?.current) return list;

      const last = list[list.length - 1];
      const snapTimeSec = snapshot.timestamp
        ? Math.floor(new Date(snapshot.timestamp).getTime() / 1000)
        : null;

      const intervalSec = timeframe === "1m" ? 60 : 15 * 60;

      if (snapTimeSec && last && snapTimeSec >= last.time + intervalSec) {
        const roundedTime = Math.floor(snapTimeSec / intervalSec) * intervalSec;
        list.push({
          time: roundedTime,
          open: snapshot.open || snapshot.current,
          high: Math.max(snapshot.high || snapshot.current, snapshot.current),
          low: Math.min(snapshot.low || snapshot.current, snapshot.current),
          close: snapshot.current,
          volume: Math.max(1, Math.round((snapshot.volume || 1000) / 100)),
        });
      } else if (last) {
        last.close = snapshot.current;
        if (snapshot.current > last.high) last.high = snapshot.current;
        if (snapshot.current < last.low) last.low = snapshot.current;
      }
      return list;
    }, [candles, snapshot, timeframe]);

    useEffect(() => {
      const container = chartContainerRef.current;
      if (!container) return;

      const chart = createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        layout: {
          background: { type: ColorType.Solid, color: "#070a0f" },
          textColor: "#94a3b8",
          fontSize: 11,
          fontFamily: "JetBrains Mono, monospace",
        },
        grid: {
          vertLines: { color: "rgba(255, 255, 255, 0.04)" },
          horzLines: { color: "rgba(255, 255, 255, 0.04)" },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            color: "rgba(255, 255, 255, 0.2)",
            width: 1,
            style: LineStyle.Dashed,
            labelBackgroundColor: "#1e293b",
          },
          horzLine: {
            color: "rgba(255, 255, 255, 0.2)",
            width: 1,
            style: LineStyle.Dashed,
            labelBackgroundColor: "#1e293b",
          },
        },
        rightPriceScale: {
          borderColor: "rgba(255, 255, 255, 0.08)",
          scaleMargins: {
            top: 0.1,
            bottom: 0.22,
          },
          autoScale: true,
        },
        timeScale: {
          borderColor: "rgba(255, 255, 255, 0.08)",
          timeVisible: true,
          secondsVisible: false,
          shiftVisibleRangeOnNewBar: true,
        },
        localization: {
          locale: "vi-VN",
          timeFormatter: (time: number) => {
            const date = new Date(time * 1000);
            return new Intl.DateTimeFormat("vi-VN", {
              timeZone: "Asia/Ho_Chi_Minh",
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }).format(date);
          },
        },
      });

      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: "#26a69a",
        priceFormat: { type: "volume" },
        priceScaleId: "", // overlay
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderVisible: false,
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
      });

      const ema5Series = chart.addSeries(LineSeries, {
        color: "#f1e05a",
        lineWidth: 1,
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        title: "EMA 5",
      });

      const ema10Series = chart.addSeries(LineSeries, {
        color: "#a371f7",
        lineWidth: 1,
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        title: "EMA 10",
      });

      chart.subscribeCrosshairMove((param) => {
        if (!param || !param.time || !param.seriesData) {
          setHoveredBar(null);
          return;
        }
        const data = param.seriesData.get(candleSeries) as any;
        if (data) {
          setHoveredBar({
            time: Number(param.time),
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: 0,
          });
        } else {
          setHoveredBar(null);
        }
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volumeSeriesRef.current = volumeSeries;
      ema5SeriesRef.current = ema5Series;
      ema10SeriesRef.current = ema10Series;

      const resizeObserver = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0) return;
        const entry = entries[0];
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      });
      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
        chart.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
        volumeSeriesRef.current = null;
        ema5SeriesRef.current = null;
        ema10SeriesRef.current = null;
      };
    }, []);

    useEffect(() => {
      if (
        !candleSeriesRef.current ||
        !volumeSeriesRef.current ||
        !ema5SeriesRef.current ||
        !ema10SeriesRef.current ||
        !chartData.length
      )
        return;

      const sorted = [...chartData].sort((a, b) => a.time - b.time);
      const uniqueBars: CandleBar[] = [];
      const seenTimes = new Set<number>();
      for (const b of sorted) {
        if (!seenTimes.has(b.time)) {
          seenTimes.add(b.time);
          uniqueBars.push(b);
        }
      }

      const candlePoints = uniqueBars.map((b) => ({
        time: b.time as any,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }));

      const volumePoints = uniqueBars.map((b) => ({
        time: b.time as any,
        value: b.volume,
        color:
          b.close >= b.open
            ? "rgba(38, 166, 154, 0.35)"
            : "rgba(239, 83, 80, 0.35)",
      }));

      const calcEMA = (period: number) => {
        const k = 2 / (period + 1);
        const res: { time: any; value: number }[] = [];
        let prev: number | null = null;
        for (let i = 0; i < uniqueBars.length; i++) {
          const price = uniqueBars[i].close;
          if (i === period - 1) {
            let sum = 0;
            for (let j = 0; j < period; j++) sum += uniqueBars[j].close;
            prev = sum / period;
            res.push({ time: uniqueBars[i].time as any, value: prev });
          } else if (prev !== null && i >= period) {
            prev = price * k + prev * (1 - k);
            res.push({
              time: uniqueBars[i].time as any,
              value: Number(prev.toFixed(2)),
            });
          }
        }
        return res;
      };

      candleSeriesRef.current.setData(candlePoints);
      volumeSeriesRef.current.setData(volumePoints);
      ema5SeriesRef.current.setData(calcEMA(5));
      ema10SeriesRef.current.setData(calcEMA(10));
    }, [chartData]);

    useEffect(() => {
      const candleSeries = candleSeriesRef.current;
      if (!candleSeries) return;

      if (entryLineRef.current) {
        try {
          candleSeries.removePriceLine(entryLineRef.current);
        } catch {}
        entryLineRef.current = null;
      }
      if (tpLineRef.current) {
        try {
          candleSeries.removePriceLine(tpLineRef.current);
        } catch {}
        tpLineRef.current = null;
      }
      if (slLineRef.current) {
        try {
          candleSeries.removePriceLine(slLineRef.current);
        } catch {}
        slLineRef.current = null;
      }

      if (entryPrice != null) {
        entryLineRef.current = candleSeries.createPriceLine({
          price: entryPrice,
          color: side === "LONG" ? "#10b981" : "#f43f5e",
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `${side} STOP`,
        });
      }

      if (tpPrice != null) {
        tpLineRef.current = candleSeries.createPriceLine({
          price: tpPrice,
          color: "#38bdf8",
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "TARGET TP",
        });
      }

      if (slPrice != null) {
        slLineRef.current = candleSeries.createPriceLine({
          price: slPrice,
          color: "#f43f5e",
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "STOP LOSS",
        });
      }
    }, [entryPrice, tpPrice, slPrice, side]);

    const handleZoomIn = () => {
      const timeScale = chartRef.current?.timeScale();
      if (!timeScale) return;
      const logicalRange = timeScale.getVisibleLogicalRange();
      if (logicalRange) {
        const delta = (logicalRange.to - logicalRange.from) * 0.2;
        timeScale.setVisibleLogicalRange({
          from: logicalRange.from + delta,
          to: logicalRange.to - delta,
        });
      }
    };

    const handleZoomOut = () => {
      const timeScale = chartRef.current?.timeScale();
      if (!timeScale) return;
      const logicalRange = timeScale.getVisibleLogicalRange();
      if (logicalRange) {
        const delta = (logicalRange.to - logicalRange.from) * 0.25;
        timeScale.setVisibleLogicalRange({
          from: logicalRange.from - delta,
          to: logicalRange.to + delta,
        });
      }
    };

    const handleResetZoom = () => {
      chartRef.current?.timeScale().resetTimeScale();
    };

    const activeBar = hoveredBar || chartData[chartData.length - 1];
    const activeBarStats = useMemo(() => {
      if (!activeBar) return null;
      const isUp = activeBar.close >= activeBar.open;
      const diff = activeBar.close - activeBar.open;
      const pct = ((diff / (activeBar.open || 1)) * 100).toFixed(2);
      const date = new Date(activeBar.time * 1000);
      const dtFormatter = new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const dtStr = dtFormatter.format(date);
      return { isUp, diff, pct, dtStr };
    }, [activeBar]);

    return (
      <div
        className={`flex h-full flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-[#070a0f] text-slate-100 shadow-2xl backdrop-blur-xl transition-all ${
          isFullscreen ? "fixed inset-2 z-50 rounded-lg shadow-2xl" : ""
        }`}
      >
        {/* Top Header Controls Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-white/[0.08] bg-[#090d16]/90 backdrop-blur-md px-3 py-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-white">
                {symbol}
              </span>
              <span className="rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold text-sky-400">
                VN30
              </span>
            </div>

            {/* Timeframe selector (15m vs 1m) */}
            <div className="flex items-center gap-0.5 rounded-md bg-[#101624] p-0.5 font-mono text-[11px] shadow-sm">
              <button
                onClick={() => setTimeframe("15m")}
                className={`rounded px-2 py-0.5 font-bold transition-all cursor-pointer ${
                  timeframe === "15m"
                    ? "bg-emerald-500 text-slate-950 font-extrabold shadow-sm"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                }`}
                title={t("tf_15m_tooltip")}
              >
                15m
              </button>
              <button
                onClick={() => setTimeframe("1m")}
                className={`rounded px-2 py-0.5 font-bold transition-all cursor-pointer ${
                  timeframe === "1m"
                    ? "bg-emerald-500 text-slate-950 font-extrabold shadow-sm"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                }`}
                title={t("tf_1m_tooltip")}
              >
                1m
              </button>
            </div>

            {/* Zoom controls cho Chart */}
            <div className="flex items-center gap-0.5 border-l border-white/10 pl-2 text-slate-400">
              <button
                onClick={handleZoomIn}
                className="rounded p-1 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title={t("zoom_in")}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="rounded p-1 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title={t("zoom_out")}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
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
                    ? "bg-emerald-500/15 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                    : "bg-rose-500/15 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
                }`}
              >
                {side} {t("stop_chip_label")}: {entryPrice.toFixed(1)}
              </span>
            )}
            {tpPrice != null && (
              <span className="rounded-md bg-sky-500/15 px-2 py-0.5 font-bold text-sky-400 shadow-sm">
                TP: {tpPrice.toFixed(1)}
              </span>
            )}
            {slPrice != null && (
              <span className="rounded-md bg-rose-500/15 px-2 py-0.5 font-bold text-rose-400 shadow-sm">
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
                <span className="text-slate-400 text-[10px]">
                  {activeBarStats.dtStr}
                </span>
                <span className="text-slate-600">·</span>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span>
                    O:{" "}
                    <strong className="text-slate-200">
                      {activeBar.open.toFixed(1)}
                    </strong>
                  </span>
                  <span>
                    H:{" "}
                    <strong className="text-emerald-400">
                      {activeBar.high.toFixed(1)}
                    </strong>
                  </span>
                  <span>
                    L:{" "}
                    <strong className="text-rose-400">
                      {activeBar.low.toFixed(1)}
                    </strong>
                  </span>
                  <span>
                    C:{" "}
                    <strong
                      className={
                        activeBarStats.isUp
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }
                    >
                      {activeBar.close.toFixed(1)}
                    </strong>
                  </span>
                  <span
                    className={`font-bold ${activeBarStats.isUp ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    ({activeBarStats.diff >= 0 ? "+" : ""}
                    {activeBarStats.diff.toFixed(1)} / {activeBarStats.pct}%)
                  </span>
                  {activeBar.volume > 0 && (
                    <span className="hidden xl:inline text-slate-400">
                      {t("vol_label")}{" "}
                      <strong className="text-slate-200">
                        {activeBar.volume.toLocaleString()}
                      </strong>
                    </span>
                  )}
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

        {/* Main Chart Container - TradingView Lightweight Canvas Engine */}
        <div className="relative flex-1 w-full overflow-hidden bg-[#070a0f]">
          {isLoadingCandles && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#070a0f]/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>{t("loading_candles", { tf: timeframe })}</span>
              </div>
            </div>
          )}

          {/* Watermark Logo TradingView Tinh Tế Phía Dưới */}
          <div className="pointer-events-none absolute bottom-8 left-4 z-0 select-none opacity-15">
            <span className="font-mono text-3xl font-black tracking-widest text-slate-500">
              TRADINGVIEW
            </span>
          </div>

          {/* Canvas Mount Point */}
          <div ref={chartContainerRef} className="h-full w-full" />
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
              <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-slate-300 shadow-sm">
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
                  <strong className="text-rose-400">
                    {slPrice.toFixed(1)}
                  </strong>
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
