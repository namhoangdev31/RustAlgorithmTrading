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

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [snapshot, metrics] = await Promise.all([
      getLatestMarketSnapshot(),
      getDailyMarketMetrics(),
    ]);
    const todayStr = getVietnamTradingDate();

    // Sinh tổ hợp 3 Engine định lượng đầy đủ (simcarrry6, AllDaysLadder, CanonicalBreakout)
    const plans = generateMultiEnginePortfolio(todayStr, snapshot, metrics);
    const consensus = computeConsensus(plans);

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
    } catch {}

    return NextResponse.json({
      ok: true,
      service: "Lepos Trading Bot Advisor",
      version: "10.2.0",
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
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Lỗi kiểm tra hệ thống" },
      { status: 500 }
    );
  }
}
