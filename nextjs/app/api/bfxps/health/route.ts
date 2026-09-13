import { NextResponse } from "next/server";
import { getLatestMarketSnapshot } from "@/lib/server/market/market-service";
import {
  generateCanonicalQuantPlan,
  getVietnamTradingDate,
} from "@/lib/server/quant/strategy-engine";
import { computeConsensus } from "@/lib/server/quant/consensus";
import { saveDailyPlanToDb, getTradingHistoryFromDb } from "@/lib/server/quant/db-plan-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getLatestMarketSnapshot();
    const todayStr = getVietnamTradingDate();

    // Tạo đúng 1 kèo duy nhất chuẩn bị cho phiên hôm nay
    const canonicalPlan = generateCanonicalQuantPlan(
      todayStr,
      snapshot.current || 1940.0,
      26.5,
      1944.0,
      1938.0,
      undefined,
      snapshot
    );

    // Tự động lưu kèo vào Database (BfxpsTradingPlan)
    try {
      await saveDailyPlanToDb(canonicalPlan);
    } catch (dbErr: any) {
      console.warn("DB save plan warning:", dbErr?.message);
    }

    const plans = [canonicalPlan];
    const consensus = computeConsensus(plans);

    let historySummary = null;
    try {
      const history = await getTradingHistoryFromDb();
      if (history) historySummary = history.summary;
    } catch {}

    return NextResponse.json({
      ok: true,
      service: "Lepos Trading Bot Advisor",
      version: "10.0.1",
      live_market: snapshot,
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
