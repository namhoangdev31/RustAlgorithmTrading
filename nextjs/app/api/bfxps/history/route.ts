import { NextResponse } from "next/server";
import { getTradingHistoryFromDb } from "@/lib/server/quant/db-plan-service";

export const dynamic = "force-dynamic";

export async function GET() {
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

    return NextResponse.json({
      ok: true,
      source: "DATABASE_POSTGRESQL",
      summary: { totalSessions: 0, tradedCount: 0, wins: 0, losses: 0, winRate: 0, totalPnl: 0, maxDrawdown: 0 },
      monthlyPnl: {},
      trades: [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Lỗi truy vấn lịch sử từ CSDL" },
      { status: 500 }
    );
  }
}

