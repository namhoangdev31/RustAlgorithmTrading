import { NextResponse } from "next/server";
import { getTradingHistoryFromDb } from "@/lib/server/quant/db-plan-service";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Ưu tiên lấy từ Database
    try {
      const dbHistory = await getTradingHistoryFromDb();
      if (dbHistory && dbHistory.trades.length > 0) {
        return NextResponse.json({
          ok: true,
          source: "DATABASE_POSTGRESQL",
          summary: dbHistory.summary,
          monthlyPnl: dbHistory.monthlyPnl,
          trades: dbHistory.trades,
        });
      }
    } catch (dbErr) {
      // Fallback sang canonical cache nếu DB serverless không khả dụng
    }

    // 2. Fallback sang file canonical_1plan_report.json nếu DB chưa có
    const reportPath = path.resolve(process.cwd(), "scripts/canonical_1plan_report.json");
    if (fs.existsSync(reportPath)) {
      const data = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
      return NextResponse.json({
        ok: true,
        source: "LOCAL_CANONICAL_CACHE",
        summary: data.summary,
        monthlyPnl: data.monthlyPnl,
        trades: data.trades || [],
      });
    }

    return NextResponse.json({
      ok: true,
      source: "EMPTY",
      summary: { totalSessions: 0, tradedCount: 0, wins: 0, losses: 0, winRate: 0, totalPnl: 0, maxDrawdown: 0 },
      monthlyPnl: {},
      trades: [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Lỗi truy vấn lịch sử" },
      { status: 500 }
    );
  }
}
