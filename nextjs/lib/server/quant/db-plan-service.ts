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
  exitType: "TP" | "SL" | "ATC" | "NO_FILL";
  exitMinute: string;
  pnl: number;
  isWin: boolean;
  notes?: string;
}

/**
 * 1. Lưu hoặc cập nhật Kèo mới vào DB (Trading Plan cho ngày tương lai)
 */
export async function saveDailyPlanToDb(plan: CanonicalPlanInput) {
  const planDate = new Date(`${plan.date}T00:00:00.000Z`);

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
      tpPrice: new Prisma.Decimal(result.isWin ? result.exitPrice : result.entryPrice + 16),
      slPrice: new Prisma.Decimal(result.entryPrice - 8),
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

  const trades = plans.map((p) => {
    const dateStr = p.date.toISOString().slice(0, 10);
    const pnl = p.pnlPoints ? Number(p.pnlPoints.toString()) : 0;
    const isFilled = p.status !== "PENDING" && p.exitType !== "NO_FILL";

    if (isFilled) {
      tradedCount++;
      totalPnl += pnl;
      const m = dateStr.slice(0, 7);
      monthlyPnl[m] = (monthlyPnl[m] || 0) + pnl;

      if (p.isWin || pnl > 0) {
        wins++;
        totalWinPoints += pnl;
      } else if (pnl < 0) {
        losses++;
        totalLossPoints += Math.abs(pnl);
      }

      cumulativePnl += pnl;
      if (cumulativePnl > peak) peak = cumulativePnl;
      const dd = cumulativePnl - peak;
      if (dd < maxDrawdown) maxDrawdown = dd;
    }

    return {
      date: dateStr,
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

  return {
    summary: {
      totalSessions: plans.length,
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
