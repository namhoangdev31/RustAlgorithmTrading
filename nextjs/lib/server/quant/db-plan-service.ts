import { createHash } from "crypto";
import { prisma } from "@/lib/server/prisma";
import { Prisma } from "@/prisma/generated/client";

import { ExecutionState, MarketSnapshot } from "./types";
import { getVnDateString, getVietnamTradingDate, isWeekend, LIVE_CUTOFF_DATE } from "./strategy-engine";

export interface CanonicalPlanInput {
  planId?: string;
  date: string;
  engine?: string;
  side: "LONG" | "SHORT";
  entryPrice: number;
  slPrice: number;
  tpPrice: number;
  reason?: string;
  execution?: ExecutionState;
}

export interface TradeSettlementResult {
  date: string;
  engine?: string;
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

export function deriveLockId(dateVn: string): string {
  const h = createHash("sha256").update(`bfxps-ato-lock:${dateVn}`).digest("hex");
  
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

export async function getLockedContext(dateVn: string): Promise<MarketSnapshot | null> {
  const row = await prisma.bfxpsMarketSnapshot.findUnique({
    where: { id: deriveLockId(dateVn) },
  });
  if (!row) return null;
  return {
    open: Number(row.open.toString()),
    high: Number(row.high.toString()),
    low: Number(row.low.toString()),
    current: Number(row.current.toString()),
    volume: Number(row.volume.toString()),
    oi: row.oi != null ? Number(row.oi.toString()) : null,
    basis: row.basis != null ? Number(row.basis.toString()) : null,
    foreignBuy: null,
    foreignSell: null,
    foreignNet: null,
    timestamp: row.timestamp.toISOString(),
    source: "ATO_LOCKED_CONTEXT",
  };
}

export async function saveLockedContext(
  dateVn: string,
  snapshot: MarketSnapshot
): Promise<MarketSnapshot | null> {
  const lockId = deriveLockId(dateVn);
  await prisma.bfxpsMarketSnapshot.createMany({
    data: [
      {
        id: lockId,
        
        timestamp: new Date(`${dateVn}T09:15:00+07:00`),
        open: new Prisma.Decimal(snapshot.open),
        high: new Prisma.Decimal(snapshot.high),
        low: new Prisma.Decimal(snapshot.low),
        current: new Prisma.Decimal(snapshot.current),
        volume: new Prisma.Decimal(snapshot.volume),
        oi: snapshot.oi != null ? new Prisma.Decimal(snapshot.oi) : null,
        basis: snapshot.basis != null ? new Prisma.Decimal(snapshot.basis) : null,
        foreignBuy: null,
        foreignSell: null,
        source: "ATO_LOCKED_CONTEXT",
      },
    ],
    skipDuplicates: true,
  });
  
  return getLockedContext(dateVn);
}

export async function isCanonicalSettlementDone(dateVn: string, engine = "simcarrry6"): Promise<boolean> {
  const row = await prisma.bfxpsTradingPlan.findFirst({
    where: {
      date: new Date(`${dateVn}T00:00:00.000Z`),
      engine: { in: [engine, "simcarrry6", "CanonicalDirectionalBreakout"] },
      settledAt: { not: null },
    },
    select: { settledAt: true },
  });
  return row?.settledAt != null;
}

export async function saveDailyPlanToDb(plan: CanonicalPlanInput) {
  
  if (isWeekend(plan.date)) {
    return null;
  }
  const planDate = new Date(`${plan.date}T00:00:00.000Z`);
  const targetEngine = plan.engine || "simcarrry6";

  const isRecalibrated =
    (plan as any).profile === "RECALIBRATED_AFTER_SL" ||
    (plan as any).resolvedSource?.includes("REVERSAL") ||
    (plan as any).resolvedSource?.includes("SESSION_OPTIMAL") ||
    plan.reason?.includes("tái lập sau Stop Loss") ||
    plan.reason?.includes("Tối ưu toàn phiên");

  const exec = plan.execution;
  let status = "ACTIVE_TODAY";
  let notes = plan.reason || "Kèo định lượng thực chiến tự động";

  if (exec && exec.isFilled) {
    if (exec.status === "EXIT_SL") {
      status = "EXIT_SL";
      const execNote = `Phiên sáng: Đã chạm SL lúc ${exec.exitTime || "09:xx"} (${exec.livePnlPoints}đ). Chờ tổng kết cuối phiên lúc 14:45.`;
      const baseReason = (plan.reason || "")
        .replace(/^(\[Tối ưu toàn phiên\]\s*)+/, "")
        .replace(/\s*\|\s*Tự động (chốt|khớp) vị thế.*$/, "")
        .trim();
      notes = isRecalibrated
        ? `[Tối ưu toàn phiên] ${baseReason ? baseReason + " | " : ""}${execNote}`
        : execNote;
    } else {
      status = "FILLED";
      const execNote = `Đang giữ vị thế ${plan.side} @ ${exec.avgEntryPrice.toFixed(1)} (PnL Live: ${exec.livePnlPoints > 0 ? "+" : ""}${exec.livePnlPoints}đ). Chờ đóng phiên ATC.`;
      const baseReason = (plan.reason || "")
        .replace(/^(\[Tối ưu toàn phiên\]\s*)+/, "")
        .replace(/\s*\|\s*Tự động (chốt|khớp) vị thế.*$/, "")
        .trim();
      notes = isRecalibrated
        ? `[Tối ưu toàn phiên] ${baseReason ? baseReason + " | " : ""}${execNote}`
        : execNote;
    }
  } else if (isRecalibrated && !notes.includes("Tối ưu toàn phiên")) {
    notes = `[Tối ưu toàn phiên] ${notes}`;
  }

  return prisma.bfxpsTradingPlan.upsert({
    where: {
      date_engine: {
        date: planDate,
        engine: targetEngine,
      },
    },
    update: {
      side: plan.side,
      ...(isRecalibrated ? { profile: "RECALIBRATED_AFTER_SL" } : {}),
      entryPrice: new Prisma.Decimal(plan.entryPrice),
      tpPrice: new Prisma.Decimal(plan.tpPrice),
      slPrice: new Prisma.Decimal(plan.slPrice),
      status,
      r5State: exec?.isFilled ? "FILLED" : "PRE_OPEN",
      isCanonical: true,
      exitType: null,
      exitPrice: null,
      exitMinute: null,
      pnlPoints: null,
      isWin: null,
      notes,
    },
    create: {
      date: planDate,
      engine: targetEngine,
      profile: isRecalibrated ? "RECALIBRATED_AFTER_SL" : "M1_INTRADAY",
      horizon: "INTRADAY",
      side: plan.side,
      entryPrice: new Prisma.Decimal(plan.entryPrice),
      tpPrice: new Prisma.Decimal(plan.tpPrice),
      slPrice: new Prisma.Decimal(plan.slPrice),
      maxCap: new Prisma.Decimal(0.3),
      r5State: exec?.isFilled ? "FILLED" : "PRE_OPEN",
      status,
      isCanonical: true,
      exitType: null,
      exitPrice: null,
      exitMinute: null,
      pnlPoints: null,
      isWin: null,
      notes,
    },
  });
}

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

  const targetEngine = result.engine || "simcarrry6";

  const updatedPlan = await prisma.bfxpsTradingPlan.upsert({
    where: {
      date_engine: {
        date: planDate,
        engine: targetEngine,
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
      engine: targetEngine,
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

  const ledger = await prisma.bfxpsLiveLedger.upsert({
    where: {
      date_engine: {
        date: planDate,
        engine: targetEngine,
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
      engine: targetEngine,
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

  invalidateTradingHistoryCache();

  return { plan: updatedPlan, ledger };
}

type TradingHistory = Awaited<ReturnType<typeof computeTradingHistory>>;
let cachedHistory: { value: TradingHistory | null; at: number } | null = null;
const HISTORY_CACHE_TTL_MS = 60_000;

export async function getTradingHistoryFromDb(): Promise<TradingHistory | null> {
  const now = Date.now();
  if (cachedHistory && now - cachedHistory.at < HISTORY_CACHE_TTL_MS) {
    return cachedHistory.value;
  }
  const value = await computeTradingHistory();
  cachedHistory = { value, at: now };
  return value;
}

export function invalidateTradingHistoryCache() {
  cachedHistory = null;
}

async function computeTradingHistory() {
  const rawPlans = await prisma.bfxpsTradingPlan.findMany({
    where: { engine: { in: ["simcarrry6", "CanonicalDirectionalBreakout"] } },
    orderBy: { date: "asc" },
  });

  if (rawPlans.length === 0) {
    return null;
  }

  const todayStr = getVietnamTradingDate(new Date());

  const weekendPlans = rawPlans.filter((p) => {
    const dStr = getVnDateString(p.date);
    return isWeekend(dStr);
  });

  if (weekendPlans.length > 0) {
    prisma.bfxpsTradingPlan
      .deleteMany({
        where: {
          id: { in: weekendPlans.map((p) => p.id) },
        },
      })
      .catch((e) => console.warn("[db] Dọn dẹp kèo cuối tuần thất bại:", (e as Error)?.message));
  }

  try {
    await prisma.bfxpsTradingPlan.updateMany({
      where: {
        date: new Date(`${todayStr}T00:00:00.000Z`),
        settledAt: null,
        OR: [
          { exitType: { not: null } },
          { status: { in: ["FILLED_TP", "FILLED_SL", "FILLED_ATC", "FILLED_TRAIL"] } },
        ],
      },
      data: {
        exitType: null,
        exitPrice: null,
        exitMinute: null,
        pnlPoints: null,
        isWin: null,
        status: "ACTIVE_TODAY",
      },
    });
  } catch (err: any) {
    console.warn("[db] Reset kèo hôm nay chưa settle:", err?.message);
  }

  const planByDate = new Map<string, (typeof rawPlans)[0]>();
  for (const p of rawPlans) {
    const dStr = getVnDateString(p.date);
    if (isWeekend(dStr)) continue;
    const existing = planByDate.get(dStr);
    if (!existing || p.engine === "simcarrry6") {
      planByDate.set(dStr, p);
    }
  }

  const validPlans = Array.from(planByDate.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

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
    const dateStr = getVnDateString(p.date);
    const pnl = p.pnlPoints ? Number(p.pnlPoints.toString()) : 0;
    const isToday = dateStr === todayStr;
    const isSettled = p.settledAt != null || (!isToday && dateStr < todayStr);
    const isFilled = p.status !== "PENDING" && p.exitType !== "NO_FILL" && p.exitType !== "INTRADAY";

    if (isSettled && isFilled) {
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

      cumulativePnl += pnl;
      if (cumulativePnl > peak) peak = cumulativePnl;
      const dd = cumulativePnl - peak;
      if (dd < maxDrawdown) maxDrawdown = dd;
    }

    const isLive = dateStr >= LIVE_CUTOFF_DATE;
    const mode = isLive ? "LIVE" : "BACKTEST";

    if (!isSettled) {
      
      return {
        date: dateStr,
        mode,
        isLive: true,
        side: p.side as "LONG" | "SHORT",
        entryPrice: Number(p.entryPrice.toString()),
        slPrice: Number(p.slPrice.toString()),
        tpPrice: Number(p.tpPrice.toString()),
        exitPrice: 0,
        exitType: "INTRADAY",
        exitMinute: "Chờ ATC (14:45)",
        pnl: 0,
        isWin: false,
        cumulativePnl: Number(cumulativePnl.toFixed(1)), // Giữ nguyên mức đã chốt của hôm trước
        status: "INTRADAY",
        notes: `[Đang trong phiên] Kèo hôm nay đang giao dịch — chỉ chốt Lời/Lỗ chính thức sau phiên ATC (14:45). ${p.notes || ""}`.trim(),
      };
    }

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

  const settledPlans = validPlans.filter(
    (p) => p.settledAt != null || getVnDateString(p.date) < todayStr
  );
  const winRate = tradedCount > 0 ? Number(((wins / tradedCount) * 100).toFixed(1)) : 0;
  const profitFactor = totalLossPoints > 0 ? Number((totalWinPoints / totalLossPoints).toFixed(2)) : (totalWinPoints > 0 ? 99.0 : 0);

  const startDate = settledPlans[0]?.date ? getVnDateString(settledPlans[0].date) : undefined;
  const endDate = settledPlans[settledPlans.length - 1]?.date
    ? getVnDateString(settledPlans[settledPlans.length - 1].date)
    : undefined;

  const liveCount = settledPlans.filter((p) => getVnDateString(p.date) >= LIVE_CUTOFF_DATE).length;
  const backtestCount = settledPlans.filter((p) => getVnDateString(p.date) < LIVE_CUTOFF_DATE).length;

  return {
    summary: {
      totalSessions: settledPlans.length,
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

export async function getTodayRecalibratedPlan(dateVn: string, engine = "simcarrry6") {
  const planDate = new Date(`${dateVn}T00:00:00.000Z`);
  return prisma.bfxpsTradingPlan.findFirst({
    where: {
      date: planDate,
      engine,
      OR: [
        { profile: "RECALIBRATED_AFTER_SL" },
        { profile: { contains: "RECALIBRAT" } },
        { notes: { contains: "tái lập sau Stop Loss" } },
        { notes: { contains: "Tối ưu toàn phiên" } },
        { notes: { contains: "kết thúc phiên ATC" } },
      ],
    },
  });
}
