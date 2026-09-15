import { createHash } from "crypto";
import { prisma } from "@/lib/server/prisma";
import { Prisma } from "@/prisma/generated/client";

import { ExecutionState, MarketSnapshot } from "./types";
import { getVnDateString, isWeekend, LIVE_CUTOFF_DATE } from "./strategy-engine";

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

/**
 * ID tất định cho bản ghi khóa ngữ cảnh ATO theo ngày (YYYY-MM-DD).
 * sha256 -> 16 byte đầu -> format UUID (cột id là @db.Uuid). Cùng ngày -> cùng ID
 * -> dùng làm PK để DB tự chống trùng (atomic insert-once/ngày), không cần SELECT-then-INSERT.
 */
export function deriveLockId(dateVn: string): string {
  const h = createHash("sha256").update(`bfxps-ato-lock:${dateVn}`).digest("hex");
  // 32 hex đầu -> 8-4-4-4-12
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/**
 * Đọc ngữ cảnh market đã khóa lúc 09:15 (nguồn sự thật cho kèo chính thức).
 * Trả null nếu chưa khóa / không có.
 */
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

/**
 * Khóa ngữ cảnh market lần đầu trong ngày (ATOMIC, chống race):
 * createMany(skipDuplicates) -> ON CONFLICT (id) DO NOTHING. Hai request đồng thời 09:15
 * chỉ ghi được 1 row; cả hai đọc lại cùng row THẮNG -> kèo tất định, không phân kỳ.
 */
export async function saveLockedContext(
  dateVn: string,
  snapshot: MarketSnapshot
): Promise<MarketSnapshot | null> {
  const lockId = deriveLockId(dateVn);
  await prisma.bfxpsMarketSnapshot.createMany({
    data: [
      {
        id: lockId,
        // Mốc 09:15 VN — giờ kèo chính thức được chốt (UTC+7)
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
  // Đọc lại row thắng (do request này HOẶC request đồng thời khác ghi)
  return getLockedContext(dateVn);
}

/**
 * Settlement đã persist chưa? NGUỒN SỰ THẬT DUY NHẤT = cột settledAt
 * (do chính settleDailyPlanAtEod set). KHÔNG suy ra từ status/FILLED_*.
 */
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

/**
 * 1. Tự động Lưu hoặc Cập nhật Kèo & Trạng thái Khớp Lệnh Realtime vào DB (Hoàn toàn tự động hóa)
 */
export async function saveDailyPlanToDb(plan: CanonicalPlanInput) {
  // Bỏ qua không tạo/lưu kèo cho ngày Thứ Bảy hoặc Chủ Nhật theo múi giờ Việt Nam
  if (isWeekend(plan.date)) {
    return null;
  }
  const planDate = new Date(`${plan.date}T00:00:00.000Z`);
  const targetEngine = plan.engine || "simcarrry6";

  const exec = plan.execution;
  let status = "PENDING";
  let exitType: string | null = null;
  let exitPrice: number | null = null;
  let exitMinute: string | null = null;
  let pnlPoints: number | null = null;
  let isWin: boolean | null = null;
  let notes = plan.reason || "Kèo định lượng thực chiến tự động";

  if (exec && exec.isFilled) {
    pnlPoints = exec.livePnlPoints ?? 0;
    isWin = pnlPoints > 0;
    if (exec.settled) {
      status =
        exec.status === "TP_EXIT"
          ? "FILLED_TP"
          : exec.status === "EXIT_SL"
          ? "FILLED_SL"
          : exec.status === "ATC_EXIT"
          ? "FILLED_ATC"
          : "FILLED_TRAIL";
      exitType =
        exec.status === "TP_EXIT"
          ? "TP"
          : exec.status === "EXIT_SL"
          ? "SL"
          : exec.status === "BE_EXIT"
          ? "BE"
          : exec.status === "TRAIL_EXIT"
          ? "TRAIL"
          : "ATC";
      exitPrice = exec.exitPrice ?? null;
      exitMinute = exec.exitTime ?? "14:45";
      notes = `Tự động chốt vị thế ${exitType} lúc ${exitMinute}, PnL: ${pnlPoints > 0 ? "+" : ""}${pnlPoints}đ`;
    } else {
      status = "FILLED";
      exitType = "FILLED";
      exitMinute = exec.exitTime || "11:30";
      notes = `Tự động khớp vị thế ${plan.side} @ ${exec.avgEntryPrice.toFixed(1)}, PnL Live: ${pnlPoints > 0 ? "+" : ""}${pnlPoints}đ`;
    }
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
      entryPrice: new Prisma.Decimal(plan.entryPrice),
      tpPrice: new Prisma.Decimal(plan.tpPrice),
      slPrice: new Prisma.Decimal(plan.slPrice),
      status,
      r5State: exec?.isFilled ? "FILLED" : "PRE_OPEN",
      isCanonical: true,
      exitType: exitType ?? null,
      exitPrice: exitPrice != null ? new Prisma.Decimal(exitPrice) : null,
      exitMinute: exitMinute ?? null,
      pnlPoints: pnlPoints != null ? new Prisma.Decimal(pnlPoints) : null,
      isWin: isWin != null ? isWin : null,
      notes,
    },
    create: {
      date: planDate,
      engine: targetEngine,
      profile: "M1_INTRADAY",
      horizon: "INTRADAY",
      side: plan.side,
      entryPrice: new Prisma.Decimal(plan.entryPrice),
      tpPrice: new Prisma.Decimal(plan.tpPrice),
      slPrice: new Prisma.Decimal(plan.slPrice),
      maxCap: new Prisma.Decimal(0.3),
      r5State: exec?.isFilled ? "FILLED" : "PRE_OPEN",
      status,
      isCanonical: true,
      exitType,
      exitPrice: exitPrice != null ? new Prisma.Decimal(exitPrice) : null,
      exitMinute,
      pnlPoints: pnlPoints != null ? new Prisma.Decimal(pnlPoints) : null,
      isWin,
      notes,
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

  const targetEngine = result.engine || "simcarrry6";

  // Cập nhật kết quả vào Trading Plan
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

  // Ghi nhận vào Sổ cái Live Ledger
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

  // Buộc tính lại lịch sử để summary trên UI/dashboard không stale sau khi chốt phiên
  invalidateTradingHistoryCache();

  return { plan: updatedPlan, ledger };
}

/**
 * 3. Lấy toàn bộ lịch sử giao dịch từ Database.
 * Cache ngắn hạn (~60s): lịch sử không đổi intraday, giảm tải DB khi UI poll /health mỗi 4s.
 */
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

/** Buộc tính lại lịch sử ở lần gọi kế (dùng sau khi settle để summary không stale) */
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

  // Tự động dọn dẹp các bản ghi rơi vào cuối tuần theo múi giờ Việt Nam
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

  // Nếu cùng một ngày có cả simcarrry6 và CanonicalDirectionalBreakout -> ưu tiên Kèo Chính simcarrry6
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

    const isLive = dateStr >= LIVE_CUTOFF_DATE;
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

  const startDate = validPlans[0]?.date ? getVnDateString(validPlans[0].date) : undefined;
  const endDate = validPlans[validPlans.length - 1]?.date ? getVnDateString(validPlans[validPlans.length - 1].date) : undefined;

  const liveCount = validPlans.filter((p) => getVnDateString(p.date) >= LIVE_CUTOFF_DATE).length;
  const backtestCount = validPlans.filter((p) => getVnDateString(p.date) < LIVE_CUTOFF_DATE).length;

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
