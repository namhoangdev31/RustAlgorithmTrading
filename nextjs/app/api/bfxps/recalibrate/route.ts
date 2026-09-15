import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import {
  getLatestMarketSnapshot,
  getDailyMarketMetrics,
  getIntradayBars,
} from "@/lib/server/market/market-service";
import {
  recalibratePlanAfterStopLoss,
  getVietnamTradingDate,
  generateSimCarry6Plan,
} from "@/lib/server/quant/strategy-engine";
import { replayExecutionCached } from "@/lib/server/quant/execution-tracker";
import { TradingPlan } from "@/lib/server/quant/types";
import { Prisma } from "@/prisma/generated/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/bfxps/recalibrate
 * Kích hoạt thuật toán tái lập / đảo kèo mới sau khi vị thế trong phiên bị đóng do dính Stop Loss.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { cutlossPrice, force = false } = body;

    const [liveSnapshot, metrics, bars] = await Promise.all([
      getLatestMarketSnapshot(),
      getDailyMarketMetrics(),
      getIntradayBars(),
    ]);

    const now = new Date();
    const todayStr = getVietnamTradingDate(now);
    const planDate = new Date(`${todayStr}T00:00:00.000Z`);

    // 1. Tìm kế hoạch hiện tại trong ngày từ CSDL
    const existingPlanDb = await prisma.bfxpsTradingPlan.findFirst({
      where: {
        date: planDate,
        engine: "simcarrry6",
      },
    });

    let currentPlan: TradingPlan;

    if (existingPlanDb) {
      currentPlan = {
        id: existingPlanDb.id,
        date: todayStr,
        engine: "simcarrry6",
        horizon: "t+1",
        side: existingPlanDb.side as "LONG" | "SHORT",
        entryPrice: Number(existingPlanDb.entryPrice.toString()),
        tpPrice: Number(existingPlanDb.tpPrice.toString()),
        slPrice: Number(existingPlanDb.slPrice.toString()),
        maxCap: 0.3,
        r5State: (existingPlanDb.r5State as any) || "FILLED",
        status: (existingPlanDb.status as any) || "ACTIVE_TODAY",
        isCanonical: true,
        resolvedSource: "SIMCARRY6",
      };
    } else {
      currentPlan = generateSimCarry6Plan(
        todayStr,
        liveSnapshot,
        metrics.refPrice,
        metrics.atr5d,
        metrics.swingLow5d,
        metrics.swingHigh5d,
        metrics.swingLow5d,
        undefined,
        undefined,
        metrics.swingHigh5d,
        metrics.ema5,
        metrics.ema10
      );
    }

    // 2. Chạy replay kiểm tra xem đã dính SL hay chưa
    const ticks = bars.map(b => ({ time: b.time, open: b.open, high: b.high, low: b.low, close: b.close }));
    const execState = replayExecutionCached(currentPlan, ticks);
    const isSlHit = execState.status === "EXIT_SL" || existingPlanDb?.exitType === "SL";

    if (!isSlHit && !force) {
      return NextResponse.json(
        {
          ok: false,
          error: "Kèo hiện tại chưa chạm Stop Loss. Thuật toán chỉ kích hoạt khi vị thế bị đóng do SL.",
          currentStatus: execState.status,
        },
        { status: 400 }
      );
    }

    const actualCutloss = cutlossPrice ?? (execState.exitPrice ?? currentPlan.slPrice);

    // 3. Chạy thuật toán tái lập kèo tối ưu dựa trên toàn bộ dữ liệu phiên
    const recalibratedPlan = recalibratePlanAfterStopLoss(
      currentPlan,
      liveSnapshot,
      metrics,
      actualCutloss,
      bars
    );

    // 4. Lưu trực tiếp vào CSDL làm Kèo Chính mới của ngày hôm nay tới khi kết thúc ATC
    await prisma.bfxpsTradingPlan.upsert({
      where: {
        date_engine: {
          date: planDate,
          engine: "simcarrry6",
        },
      },
      create: {
        date: planDate,
        engine: "simcarrry6",
        profile: "M1_INTRADAY",
        horizon: "INTRADAY",
        side: recalibratedPlan.side,
        entryPrice: new Prisma.Decimal(recalibratedPlan.entryPrice),
        tpPrice: new Prisma.Decimal(recalibratedPlan.tpPrice),
        slPrice: new Prisma.Decimal(recalibratedPlan.slPrice),
        maxCap: 0.3,
        r5State: "FILLED",
        status: "ACTIVE_TODAY",
        isCanonical: true,
        notes: recalibratedPlan.reason || "Kèo tối ưu toàn phiên tới khi kết thúc",
      },
      update: {
        side: recalibratedPlan.side,
        entryPrice: new Prisma.Decimal(recalibratedPlan.entryPrice),
        tpPrice: new Prisma.Decimal(recalibratedPlan.tpPrice),
        slPrice: new Prisma.Decimal(recalibratedPlan.slPrice),
        status: "ACTIVE_TODAY",
        exitType: null,
        exitPrice: null,
        exitMinute: null,
        pnlPoints: null,
        isWin: null,
        notes: recalibratedPlan.reason || "Kèo tối ưu toàn phiên tới khi kết thúc",
        settledAt: null,
      },
    });

    // 5. Tính toán execution mới cho kèo vừa tái lập
    const newExec = replayExecutionCached(recalibratedPlan, ticks);
    recalibratedPlan.execution = newExec;

    const actionText =
      recalibratedPlan.side === currentPlan.side
        ? `Tối ưu hướng ${recalibratedPlan.side} (SL chặt)`
        : `Đảo sang ${recalibratedPlan.side}`;

    return NextResponse.json({
      ok: true,
      message: `Đã tính toán toàn bộ phiên: ${actionText} @ ${recalibratedPlan.entryPrice.toFixed(1)}, TP ${recalibratedPlan.tpPrice.toFixed(1)}, SL ${recalibratedPlan.slPrice.toFixed(1)} (Hiệu lực tới kết thúc phiên ATC)`,
      plan: recalibratedPlan,
      execution: newExec,
    });
  } catch (err: any) {
    console.error("[recalibrate] Lỗi tái lập kèo sau SL:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Lỗi hệ thống khi tái lập kèo sau SL" },
      { status: 500 }
    );
  }
}
