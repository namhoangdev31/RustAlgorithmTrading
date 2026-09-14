import { prisma } from "@/lib/server/prisma";
import { Prisma } from "@/prisma/generated/client";

export interface CanonicalPlanInput {
  planId?: string;
  date: string;
  side: "LONG" | "SHORT";
  entryPrice: number;
  slPrice: number;
  tpPrice: number;
  reason?: string;
}

export interface TradeSettlementResult {
  date: string;
  side: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  exitType: "TP" | "SL" | "ATC" | "NO_FILL" | "TRAIL" | "BE";
  exitMinute: string;
  pnl: number;
  isWin: boolean;
  tpPrice?: number;
  slPrice?: number;
  notes?: string;
}

/**
 * 1. Lưu hoặc cập nhật Kèo mới vào DB (Trading Plan cho ngày tương lai)
 */
export async function saveDailyPlanToDb(plan: CanonicalPlanInput) {
  const planDate = new Date(`${plan.date}T00:00:00.000Z`);
  const dayOfWeek = planDate.getUTCDay();
  // Bỏ qua không tạo/lưu kèo cho ngày Thứ Bảy (6) hoặc Chủ Nhật (0)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return null;
  }

  return prisma.bfxpsTradingPlan.upsert({
    where: {
      date_engine: {
        date: planDate,
        engine: "CanonicalDirectionalBreakout",
      },
    },
    update: {
      side: plan.side,
      entryPrice: new Prisma.Decimal(plan.entryPrice),
      tpPrice: new Prisma.Decimal(plan.tpPrice),
      slPrice: new Prisma.Decimal(plan.slPrice),
      status: "PENDING",
      r5State: "PRE_OPEN",
      isCanonical: true,
    },
    create: {
      date: planDate,
      engine: "CanonicalDirectionalBreakout",
      profile: "M1_INTRADAY",
      horizon: "INTRADAY",
      side: plan.side,
      entryPrice: new Prisma.Decimal(plan.entryPrice),
      tpPrice: new Prisma.Decimal(plan.tpPrice),
      slPrice: new Prisma.Decimal(plan.slPrice),
      maxCap: new Prisma.Decimal(0.3),
      r5State: "PRE_OPEN",
      status: "PENDING",
      isCanonical: true,
    },
  });
}

/**
 * 2. Báo cáo & Chốt kết quả kèo cuối ngày (EOD Settlement)
 */
export async function settleDailyPlanAtEod(result: TradeSettlementResult) {
  const planDate = new Date(`${result.date}T00:00:00.000Z`);
  const status =
    result.exitType === "NO_FILL"
      ? "NO_FILL"
      : result.isWin
      ? "FILLED_TP"
      : result.exitType === "ATC"
      ? "FILLED_ATC"
      : "FILLED_SL";

  const pnlStatus =
    result.exitType === "NO_FILL"
      ? "NO_FILL"
      : result.isWin
      ? "WIN"
      : "LOSS";

  const notes =
    result.notes ||
    `Tổng kết cuối ngày ${result.date}: Thoát ${result.exitType} lúc ${result.exitMinute || "14:45"}, PnL: ${
      result.pnl > 0 ? "+" + result.pnl : result.pnl
    } điểm`;

  // Cập nhật kết quả vào Trading Plan
  const updatedPlan = await prisma.bfxpsTradingPlan.upsert({
    where: {
      date_engine: {
        date: planDate,
        engine: "CanonicalDirectionalBreakout",
      },
    },
    update: {
      exitPrice: new Prisma.Decimal(result.exitPrice),
      exitType: result.exitType,
      exitMinute: result.exitMinute,
      pnlPoints: new Prisma.Decimal(result.pnl),
      isWin: result.isWin,
      status,
      notes,
      settledAt: new Date(),
    },
    create: {
      date: planDate,
      engine: "CanonicalDirectionalBreakout",
      profile: "M1_INTRADAY",
      horizon: "INTRADAY",
      side: result.side,
      entryPrice: new Prisma.Decimal(result.entryPrice),
      tpPrice: new Prisma.Decimal(result.tpPrice ?? result.exitPrice),
      slPrice: new Prisma.Decimal(result.slPrice ?? result.entryPrice),
      exitPrice: new Prisma.Decimal(result.exitPrice),
      exitType: result.exitType,
      exitMinute: result.exitMinute,
      pnlPoints: new Prisma.Decimal(result.pnl),
      isWin: result.isWin,
      status,
      notes,
      settledAt: new Date(),
    },
  });

  // Ghi nhận vào Sổ cái Live Ledger
  const ledger = await prisma.bfxpsLiveLedger.upsert({
    where: {
      date_engine: {
        date: planDate,
        engine: "CanonicalDirectionalBreakout",
      },
    },
    update: {
      side: result.side,
      avgEntry: new Prisma.Decimal(result.entryPrice),
      exitPrice: new Prisma.Decimal(result.exitPrice),
      exitType: result.exitType,
      pnlPoints: new Prisma.Decimal(result.pnl),
      pnlStatus,
      isSettled: true,
      notes,
    },
    create: {
      date: planDate,
      engine: "CanonicalDirectionalBreakout",
      side: result.side,
      avgEntry: new Prisma.Decimal(result.entryPrice),
      exitPrice: new Prisma.Decimal(result.exitPrice),
      exitType: result.exitType,
      pnlPoints: new Prisma.Decimal(result.pnl),
      pnlStatus,
      size: new Prisma.Decimal(0.3),
      isSettled: true,
      notes,
    },
  });

  return { plan: updatedPlan, ledger };
}

/**
 * 3. Lấy toàn bộ lịch sử giao dịch từ Database
 */
export async function getTradingHistoryFromDb() {
  const plans = await prisma.bfxpsTradingPlan.findMany({
    where: { engine: "CanonicalDirectionalBreakout" },
    orderBy: { date: "asc" },
  });

  if (plans.length === 0) {
    return null;
  }

  // Tự động dọn dẹp các bản ghi rơi vào cuối tuần nếu có (do lệch múi giờ server)
  const weekendPlans = plans.filter((p) => {
    const day = p.date.getUTCDay();
    return day === 0 || day === 6;
  });

  if (weekendPlans.length > 0) {
    prisma.bfxpsTradingPlan.deleteMany({
      where: {
        id: { in: weekendPlans.map((p) => p.id) },
      },
    }).catch(() => {});
  }

  // Chỉ lấy các phiên hợp lệ trong tuần (Thứ 2 đến Thứ 6)
  const validPlans = plans.filter((p) => {
    const day = p.date.getUTCDay();
    return day !== 0 && day !== 6;
  });

  if (validPlans.length === 0) {
    return null;
  }

  let cumulativePnl = 0;
  let wins = 0;
  let losses = 0;
  let tradedCount = 0;
  let totalPnl = 0;
  let totalWinPoints = 0;
  let totalLossPoints = 0;
  let peak = 0;
  let maxDrawdown = 0;
  const monthlyPnl: Record<string, number> = {};

  const trades = validPlans.map((p) => {
    const dateStr = p.date.toISOString().slice(0, 10);
    const pnl = p.pnlPoints ? Number(p.pnlPoints.toString()) : 0;
    const isFilled = p.status !== "PENDING" && p.exitType !== "NO_FILL";

    if (isFilled) {
      tradedCount++;
      totalPnl += pnl;
      const m = dateStr.slice(0, 7);
      monthlyPnl[m] = (monthlyPnl[m] || 0) + pnl;

      if (pnl > 0) {
        wins++;
        totalWinPoints += pnl;
      } else if (pnl < 0) {
        losses++;
        totalLossPoints += Math.abs(pnl);
      }
      // pnl === 0 → Break-Even (BE_EXIT), đếm vào tradedCount nhưng không đếm thắng/thua

      cumulativePnl += pnl;
      if (cumulativePnl > peak) peak = cumulativePnl;
      const dd = cumulativePnl - peak;
      if (dd < maxDrawdown) maxDrawdown = dd;
    }

    const isLive = dateStr >= "2026-09-14";
    const mode = isLive ? "LIVE" : "BACKTEST";

    return {
      date: dateStr,
      mode,
      isLive,
      side: p.side as "LONG" | "SHORT",
      entryPrice: Number(p.entryPrice.toString()),
      slPrice: Number(p.slPrice.toString()),
      tpPrice: Number(p.tpPrice.toString()),
      exitPrice: p.exitPrice ? Number(p.exitPrice.toString()) : 0,
      exitType: (p.exitType || (p.status === "PENDING" ? "PENDING" : "NO_FILL")) as any,
      exitMinute: p.exitMinute || "",
      pnl: Number(pnl.toFixed(1)),
      isWin: Boolean(p.isWin),
      cumulativePnl: Number(cumulativePnl.toFixed(1)),
      status: p.status,
      notes: p.notes,
    };
  });

  const winRate = tradedCount > 0 ? Number(((wins / tradedCount) * 100).toFixed(1)) : 0;
  const profitFactor = totalLossPoints > 0 ? Number((totalWinPoints / totalLossPoints).toFixed(2)) : (totalWinPoints > 0 ? 99.0 : 0);

  const startDate = validPlans[0]?.date ? validPlans[0].date.toISOString().slice(0, 10) : undefined;
  const endDate = validPlans[validPlans.length - 1]?.date ? validPlans[validPlans.length - 1].date.toISOString().slice(0, 10) : undefined;

  const liveCount = validPlans.filter((p) => p.date.toISOString().slice(0, 10) >= "2026-09-14").length;
  const backtestCount = validPlans.filter((p) => p.date.toISOString().slice(0, 10) < "2026-09-14").length;

  return {
    summary: {
      totalSessions: validPlans.length,
      liveCount,
      backtestCount,
      totalBars: undefined, // Tính từ nguồn dữ liệu thực tế, không ước lượng
      startDate,
      endDate,
      tradedCount,
      wins,
      losses,
      winRate,
      profitFactor,
      totalPnl: Number(totalPnl.toFixed(1)),
      maxDrawdown: Number(maxDrawdown.toFixed(1)),
    },
    monthlyPnl,
    trades,
  };
}
