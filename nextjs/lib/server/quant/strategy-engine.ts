import {
  Direction,
  MarketSnapshot,
  TradingPlan,
  QuantStrategyConfig,
  LadderStrategyConfig,
  SimCarryConfig,
  LadderConfig,
} from "./types";
import { evaluateR5, evaluateV44, resolveCutloss } from "./risk-governors";

export const DEFAULT_CANONICAL_CONFIG: Required<QuantStrategyConfig> = {
  atrEntryMultiplier: 0.10,
  tpPoints: 24.0,
  slPoints: 8.0,
  maxCap: 1.0,
  trailing: {
    enabled: true,
    beTriggerPoints: 6.0,
    trailTriggerPoints: 12.0,
    trailDistance: 5.0,
  },
};

export const DEFAULT_LADDER_CONFIG: Required<Omit<LadderStrategyConfig, "side">> & { side?: Direction } = {
  side: undefined,
  tpPoints: 4.1,
  maxCap: 0.3,
};

export const DEFAULT_SIMCARRY_CONFIG: Required<SimCarryConfig> = {
  basisThreshold: -5.0,
  atrMultiplier: 0.15,
  tpPoints: 22.0,
  maxCap: 1.0,
  trailing: {
    enabled: true,
    beTriggerPoints: 8.0,     // Swing: khóa BE muộn hơn Canonical (8đ thay vì 6đ)
    trailTriggerPoints: 14.0, // Swing: kích trail muộn hơn (14đ thay vì 12đ)
    trailDistance: 6.0,       // Swing: khoảng trail rộng hơn (6đ thay vì 5đ)
  },
};

/**
 * Tính toán Kèo Chính Swing t+1: simcarrry6
 */
export function generateSimCarry6Plan(
  dateStr: string,
  snapshot: MarketSnapshot,
  refPrice: number,
  atr5d: number,
  swingLow5d: number,
  expectedHigh?: number,
  expectedLow?: number,
  previousShortCutloss?: number,
  config?: SimCarryConfig
): TradingPlan {
  const basisThreshold = config?.basisThreshold ?? DEFAULT_SIMCARRY_CONFIG.basisThreshold;
  const atrMultiplier = config?.atrMultiplier ?? DEFAULT_SIMCARRY_CONFIG.atrMultiplier;
  const tpPoints = config?.tpPoints ?? DEFAULT_SIMCARRY_CONFIG.tpPoints;
  const maxCap = config?.maxCap ?? DEFAULT_SIMCARRY_CONFIG.maxCap;

  // 1. Xác định hướng (LONG / SHORT) dựa trên Basis và vị thế giá
  const basis = snapshot.basis ?? 0;
  const isPriceStrong = snapshot.current >= refPrice;
  const side: Direction = basis < basisThreshold || isPriceStrong ? "LONG" : "SHORT";

  // 2. Tính mức giá Entry
  const entryDelta = Number((atrMultiplier * atr5d).toFixed(1));
  const entryPrice = side === "LONG"
    ? Number((refPrice + entryDelta).toFixed(1))
    : Number((refPrice - entryDelta).toFixed(1));

  // 3. Mục tiêu TP theo cấu hình chiến lược
  const tpPrice = side === "LONG"
    ? Number((entryPrice + tpPoints).toFixed(1))
    : Number((entryPrice - tpPoints).toFixed(1));

  // 4. Mức cắt lỗ SL theo cơ chế LATEST_SHORT_CUTLOSS_REVERSAL
  const slPrice = resolveCutloss(side, swingLow5d, previousShortCutloss);

  // 5. Đánh giá R5 tại Open
  const r5Eval = evaluateR5(side, snapshot.open, refPrice, slPrice);

  const trailingConfig = config?.trailing ?? DEFAULT_SIMCARRY_CONFIG.trailing;

  return {
    id: `plan_simcarry6_${dateStr}`,
    date: dateStr,
    engine: "simcarrry6",
    profile: "SWING_T1",
    horizon: "t+1",
    side,
    orderType: "STOP",
    entryPrice,
    tpPrice,
    slPrice,
    maxCap,
    r5State: r5Eval.action,
    status: "ACTIVE_TODAY",
    isCanonical: true,
    trailingConfig,
    breakevenTrigger: trailingConfig.beTriggerPoints,
    expectedHigh,
    expectedLow,
    resolvedSource: previousShortCutloss ? "LATEST_SHORT_CUTLOSS_REVERSAL" : "SWING_LOW_5D",
  };
}

/**
 * Tính toán Kèo Phụ Intraday Scalp: AllDaysLadder_CAP0.3
 */
export function generateAllDaysLadderPlan(
  dateStr: string,
  snapshot: MarketSnapshot,
  refPrice: number,
  slPrice: number,
  expectedHigh?: number,
  expectedLow?: number,
  config?: LadderStrategyConfig
): TradingPlan {
  // Xác định hướng động (dựa trên cấu hình hoặc vị thế thị trường so với Ref, loại bỏ hardcode thiên vị 1 chiều LONG)
  const side: Direction = config?.side ?? (snapshot.current >= refPrice ? "LONG" : "SHORT");
  const entryPrice = Number(refPrice.toFixed(1));
  const tpDelta = config?.tpPoints ?? DEFAULT_LADDER_CONFIG.tpPoints;
  const tpPrice = side === "LONG"
    ? Number((entryPrice + tpDelta).toFixed(1))
    : Number((entryPrice - tpDelta).toFixed(1));
  const maxCap = config?.maxCap ?? DEFAULT_LADDER_CONFIG.maxCap;

  const r5Eval = evaluateR5(side, snapshot.open, refPrice, slPrice);

  const ladderConfig: LadderConfig = {
    enabled: true,
    steps: [
      { offsetPoints: 0.0, size: 0.1 },
      { offsetPoints: 1.0, size: 0.2 },
      { offsetPoints: 2.0, size: 0.3 },
    ],
  };

  return {
    id: `plan_ladder_${dateStr}`,
    date: dateStr,
    engine: "AllDaysLadder_CAP0.3",
    profile: "INTRADAY_LADDER",
    horizon: "t",
    side,
    orderType: "LIMIT",
    ladderConfig,
    entryPrice,
    tpPrice,
    slPrice,
    maxCap,
    r5State: r5Eval.action,
    status: "ACTIVE_TODAY",
    isCanonical: true,
    expectedHigh,
    expectedLow,
    resolvedSource: "CANONICAL_NATIVE",
  };
}

/**
 * HỆ THỐNG PHÁT 1 KÈO DUY NHẤT TRONG NGÀY (CANONICAL SINGLE-PLAN ADVISOR)
 * Hoàn toàn KHÔNG dùng dữ liệu tương lai (Zero Lookahead Barrier):
 * - Bắt buộc truyền các tham số thị trường thực tế: RefPrice, ATR(5), EMA(5), EMA(10).
 * - Phát đúng 1 lệnh điều kiện Stop Order trước 09:00:
 *   + Nếu EMA(5) >= EMA(10) -> Kèo LONG: Stop Buy tại RefPrice + (atrEntryMultiplier * ATR5), TP +tpPoints, SL -slPoints
 *   + Nếu EMA(5) < EMA(10)  -> Kèo SHORT: Stop Sell tại RefPrice - (atrEntryMultiplier * ATR5), TP -tpPoints, SL +slPoints
 * - Cho phép tùy chỉnh linh hoạt qua QuantStrategyConfig, r5State được đánh giá động qua snapshot.
 */
export function generateCanonicalQuantPlan(
  dateStr: string,
  refPrice: number,
  atr5d: number,
  ema5: number,
  ema10: number,
  config?: QuantStrategyConfig,
  snapshot?: MarketSnapshot
): TradingPlan {
  const atrEntryMultiplier = config?.atrEntryMultiplier ?? DEFAULT_CANONICAL_CONFIG.atrEntryMultiplier;
  const tpPoints = config?.tpPoints ?? DEFAULT_CANONICAL_CONFIG.tpPoints;
  const slPoints = config?.slPoints ?? DEFAULT_CANONICAL_CONFIG.slPoints;
  const maxCap = config?.maxCap ?? DEFAULT_CANONICAL_CONFIG.maxCap;

  const isBull = ema5 >= ema10;
  const side: Direction = isBull ? "LONG" : "SHORT";
  const delta = Number((atrEntryMultiplier * atr5d).toFixed(1));

  const entryPrice = side === "LONG"
    ? Number((refPrice + delta).toFixed(1))
    : Number((refPrice - delta).toFixed(1));

  const tpPrice = side === "LONG"
    ? Number((entryPrice + tpPoints).toFixed(1))
    : Number((entryPrice - tpPoints).toFixed(1));

  const slPrice = side === "LONG"
    ? Number((entryPrice - slPoints).toFixed(1))
    : Number((entryPrice + slPoints).toFixed(1));

  const r5State = snapshot
    ? evaluateR5(side, snapshot.open, refPrice, slPrice).action
    : "KEEP";

  const trailingConfig = config?.trailing ?? DEFAULT_CANONICAL_CONFIG.trailing;

  return {
    id: `plan_canonical_${dateStr}`,
    date: dateStr,
    engine: "CanonicalDirectionalBreakout",
    profile: "KE_DUY_NHAT_TRONG_NGAY",
    horizon: "t",
    side,
    orderType: "STOP",
    entryPrice,
    tpPrice,
    slPrice,
    maxCap,
    r5State,
    trailingConfig,
    breakevenTrigger: trailingConfig.beTriggerPoints,
    status: "ACTIVE_TODAY",
    isCanonical: true,
    resolvedSource: "CANONICAL_PRE_OPEN_VOLATILITY_EXPANSION",
  };
}
