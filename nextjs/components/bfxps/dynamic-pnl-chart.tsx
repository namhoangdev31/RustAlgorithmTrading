"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import { useTranslations } from "next-intl";

interface ChartBarItem {
  session: string;
  date: string;
  pnl: number;
  equity: number;
  drawdown: number;
}

export function DynamicPnlChart({ title }: { title?: string }) {
  const t = useTranslations("Bfxps.pnl_chart");
  const chartTitle = title || t("default_title");

  const [data, setData] = useState<ChartBarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    sessions: number;
    trades: number;
    winrate: number;
    totalPnl: number;
    maxDd: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/bfxps/history")
      .then((r) => r.json())
      .then((res) => {
        if (!isMounted) return;
        if (res.ok && Array.isArray(res.trades) && res.trades.length > 0) {
          
          const last30 = res.trades.slice(-30);
          let runningEquity = 0;
          let peak = 0;
          let maxDd = 0;
          let wins = 0;
          let filled = 0;

          const chartBars: ChartBarItem[] = last30.map((trade: any, idx: number) => {
            const pnl = Number(trade.pnl) || 0;
            const isFilled = trade.exitType !== "NO_FILL" && trade.exitType !== "PENDING";
            if (isFilled) {
              filled++;
              if (trade.isWin || pnl > 0) wins++;
            }
            runningEquity += pnl;
            if (runningEquity > peak) peak = runningEquity;
            const dd = runningEquity - peak;
            if (dd < maxDd) maxDd = dd;

            return {
              session: trade.date ? trade.date.slice(5) : `P${idx + 1}`,
              date: trade.date || "",
              pnl: Number(pnl.toFixed(1)),
              equity: Number(runningEquity.toFixed(1)),
              drawdown: Number(dd.toFixed(1)),
            };
          });

          setData(chartBars);
          setStats({
            sessions: last30.length,
            trades: filled,
            winrate: filled > 0 ? Number(((wins / filled) * 100).toFixed(1)) : 0,
            totalPnl: Number(runningEquity.toFixed(1)),
            maxDd: Number(maxDd.toFixed(1)),
          });
        }
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="w-full rounded border border-[#30363d] bg-[#171b23] p-4 text-white shadow-xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d] pb-3">
        <div>
          <h4 className="text-sm font-black tracking-wide text-[#e6edf3]">{chartTitle}</h4>
          <p className="text-xs text-[#8b949e]">
            {stats
              ? t("stats_summary", {
                  sessions: stats.sessions,
                  trades: stats.trades,
                  winrate: stats.winrate,
                  pnl: `${stats.totalPnl > 0 ? "+" : ""}${stats.totalPnl}`,
                  maxDd: stats.maxDd,
                })
              : t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-[#36d399]">
            <span className="h-2 w-2 rounded-full bg-[#36d399]"></span> {t("legend_profit")}
          </span>
          <span className="flex items-center gap-1 text-[#ff5a67]">
            <span className="h-2 w-2 rounded-full bg-[#ff5a67]"></span> {t("legend_loss")}
          </span>
          <span className="flex items-center gap-1 text-[#60a5fa]">
            <span className="h-2 w-2 rounded-full bg-[#60a5fa]"></span> {t("legend_equity")}
          </span>
          <span className="flex items-center gap-1 text-[#fbbf24]">
            <span className="h-2 w-2 rounded-full bg-[#fbbf24]"></span> {t("legend_drawdown")}
          </span>
        </div>
      </div>

      <div className="h-[280px] w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-[#8b949e]">
            Loading...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="session" stroke="#6b7280" fontSize={10} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d1117",
                  borderColor: "#30363d",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <ReferenceLine y={0} stroke="#4b5563" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="drawdown"
                fill="#fbbf24"
                fillOpacity={0.15}
                stroke="#fbbf24"
                strokeWidth={1.5}
                name={t("series_drawdown")}
              />
              <Bar dataKey="pnl" name={t("series_pnl")} radius={[3, 3, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#36d399" : "#ff5a67"} />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="equity"
                stroke="#60a5fa"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: "#60a5fa" }}
                name={t("series_equity")}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
