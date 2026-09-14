import { NextResponse } from "next/server";
import {
  getLatestMarketSnapshot,
  getDailyMarketMetrics,
} from "@/lib/server/market/market-service";
import {
  generateMultiEnginePortfolio,
  getVietnamTradingDate,
} from "@/lib/server/quant/strategy-engine";
import { computeConsensus } from "@/lib/server/quant/consensus";
import { saveDailyPlanToDb, getTradingHistoryFromDb } from "@/lib/server/quant/db-plan-service";
import { IntradayExecutionTracker } from "@/lib/server/quant/execution-tracker";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [snapshot, metrics] = await Promise.all([
      getLatestMarketSnapshot(),
      getDailyMarketMetrics(),
    ]);
    const todayStr = getVietnamTradingDate();

    // Sinh tổ hợp 3 Engine định lượng đầy đủ (simcarrry6, AllDaysLadder, CanonicalBreakout)
    const rawPlans = generateMultiEnginePortfolio(todayStr, snapshot, metrics);
    const consensus = computeConsensus(rawPlans);

    const tickTime = snapshot.timestamp
      ? new Intl.DateTimeFormat("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date(snapshot.timestamp))
      : "11:30:00";

    const liveTick = {
      time: tickTime,
      open: snapshot.open,
      high: snapshot.high,
      low: snapshot.low,
      close: snapshot.current,
    };

    const plans = rawPlans.map((plan) => {
      const tracker = new IntradayExecutionTracker(plan);
      const execution = tracker.updateTick(liveTick);
      return {
        ...plan,
        execution,
      };
    });

    // Kèo chuẩn tắc CanonicalBreakout để lưu DB và quản trị thực thi
    const canonicalPlan = plans.find((p) => p.engine === "CanonicalDirectionalBreakout") || plans[0];

    // Tự động lưu kèo chủ đạo vào Database (BfxpsTradingPlan)
    try {
      await saveDailyPlanToDb(canonicalPlan);
    } catch (dbErr: any) {
      console.warn("DB save plan warning:", dbErr?.message);
    }

    let historySummary = null;
    try {
      const history = await getTradingHistoryFromDb();
      if (history) historySummary = history.summary;
    } catch { }

    return NextResponse.json(
      {
        ok: true,
        service: "Lepos Trading Bot Advisor",
        version: "10.3.0",
        live_market: snapshot,
        metrics,
        freshness: {
          level: "GREEN",
          status: "FRESH",
          reference_date: todayStr,
        },
        plans,
        consensus,
        summary: historySummary,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Lỗi kiểm tra hệ thống" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
