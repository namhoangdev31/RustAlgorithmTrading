import { NextRequest, NextResponse } from "next/server";
import { settleDailyPlanAtEod, TradeSettlementResult } from "@/lib/server/quant/db-plan-service";
import { prisma } from "@/lib/server/prisma";

/**
 * POST /api/bfxps/settlement
 * Báo cáo kết quả kèo mỗi cuối ngày và lưu vào DB (BfxpsTradingPlan & BfxpsLiveLedger)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, exitType, exitPrice, exitMinute, pnl, isWin, notes } = body;

    if (!date) {
      return NextResponse.json({ ok: false, error: "Thiếu ngày giao dịch (date)" }, { status: 400 });
    }

    const planDate = new Date(`${date}T00:00:00.000Z`);
    const targetEngine = body.engine || "simcarrry6";
    const existingPlan =
      (await prisma.bfxpsTradingPlan.findUnique({
        where: {
          date_engine: {
            date: planDate,
            engine: targetEngine,
          },
        },
      })) ||
      (await prisma.bfxpsTradingPlan.findFirst({
        where: {
          date: planDate,
          engine: { in: ["simcarrry6", "CanonicalDirectionalBreakout"] },
        },
        orderBy: { createdAt: "desc" },
      }));

    if (!existingPlan) {
      return NextResponse.json(
        { ok: false, error: `Không tìm thấy kèo cho ngày ${date} trong CSDL.` },
        { status: 404 }
      );
    }

    const side = existingPlan.side as "LONG" | "SHORT";
    const entryPrice = Number(existingPlan.entryPrice.toString());
    const finalPnl = pnl !== undefined ? Number(pnl) : (
      exitType === "NO_FILL" ? 0 :
      side === "LONG" ? (exitPrice - entryPrice) : (entryPrice - exitPrice)
    );
    const win = isWin !== undefined ? Boolean(isWin) : finalPnl > 0;

    const settlementResult: TradeSettlementResult = {
      date,
      engine: existingPlan.engine,
      side,
      entryPrice,
      exitPrice: exitPrice || 0,
      exitType: exitType || "ATC",
      exitMinute: exitMinute || "14:45",
      pnl: Number(finalPnl.toFixed(1)),
      isWin: win,
      notes: notes || `Báo cáo chốt phiên ${date}: Thoát ${exitType} lúc ${exitMinute || "14:45"}, PnL: ${finalPnl > 0 ? "+" + finalPnl.toFixed(1) : finalPnl.toFixed(1)}đ`,
    };

    const outcome = await settleDailyPlanAtEod(settlementResult);

    return NextResponse.json({
      ok: true,
      message: `Đã lưu báo cáo kết quả phiên ${date} thành công vào CSDL.`,
      settlement: outcome,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Lỗi cập nhật báo cáo kết quả cuối ngày" },
      { status: 500 }
    );
  }
}
