import {
  Direction,
  MarketSnapshot,
  TradingPlan,
  TradingSessionPhase,
  QuantStrategyConfig,
  LadderStrategyConfig,
  SimCarryConfig,
  LadderConfig,
} from "./types";
import { evaluateR5, evaluateV44, resolveCutloss } from "./risk-governors";
import { DailyMarketMetrics, IntradayBar } from "../market/market-service";

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
  orderType: "STOP",
  trailing: {
    enabled: true,
    beTriggerPoints: 8.0,     // Swing: khóa BE muộn hơn Canonical (8đ thay vì 6đ)
    trailTriggerPoints: 14.0, // Swing: kích trail muộn hơn (14đ thay vì 12đ)
    trailDistance: 6.0,       // Swing: khoảng trail rộng hơn (6đ thay vì 5đ)
  },
};

export const LIVE_CUTOFF_DATE = "2026-09-14";

const SIMCARRY_MOMENTUM_WEIGHT = 0.6; 
const SIMCARRY_CARRY_WEIGHT = 0.4;    
const SIMCARRY_SATURATION_ATR = 0.5;  
const SIMCARRY_DEAD_ZONE = 0.15;      

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function resolveSimCarryDirection(
  snapshot: MarketSnapshot,
  refPrice: number,
  atr5d: number,
  ema5?: number,
  ema10?: number
): Direction {
  const open = snapshot.open > 0 ? snapshot.open : snapshot.current;
  const atr = atr5d > 0 ? atr5d : 1;
  const basis = snapshot.basis ?? 0;

  const momentum = clamp((open - refPrice) / atr / SIMCARRY_SATURATION_ATR, -1, 1);
  const carry = clamp(-basis / atr / SIMCARRY_SATURATION_ATR, -1, 1);
  const score = SIMCARRY_MOMENTUM_WEIGHT * momentum + SIMCARRY_CARRY_WEIGHT * carry;

  if (score > SIMCARRY_DEAD_ZONE) return "LONG";
  if (score < -SIMCARRY_DEAD_ZONE) return "SHORT";

  if (ema5 !== undefined && ema10 !== undefined) {
    return ema5 >= ema10 ? "LONG" : "SHORT";
  }
  return open >= refPrice ? "LONG" : "SHORT";
}

export function generateSimCarry6Plan(
  dateStr: string,
  snapshot: MarketSnapshot,
  refPrice: number,
  atr5d: number,
  swingLow5d: number,
  expectedHigh?: number,
  expectedLow?: number,
  previousShortCutloss?: number,
  config?: SimCarryConfig,
  swingHigh5d?: number,
  ema5?: number,
  ema10?: number
): TradingPlan {
  const atrMultiplier = config?.atrMultiplier ?? DEFAULT_SIMCARRY_CONFIG.atrMultiplier;
  const tpPoints = config?.tpPoints ?? DEFAULT_SIMCARRY_CONFIG.tpPoints;
  const maxCap = config?.maxCap ?? DEFAULT_SIMCARRY_CONFIG.maxCap;

  const side: Direction = resolveSimCarryDirection(snapshot, refPrice, atr5d, ema5, ema10);

  let entryPrice: number;
  let orderType: "STOP" | "LIMIT" = config?.orderType ?? "STOP";

  if (snapshot.open > 0 && Math.abs(snapshot.open - refPrice) >= 2.0) {
    
    entryPrice = Number(refPrice.toFixed(1));
    orderType = config?.orderType ?? "LIMIT";
  } else {
    const entryDelta = Number((atrMultiplier * atr5d).toFixed(1));
    entryPrice = side === "LONG"
      ? Number((refPrice + entryDelta).toFixed(1))
      : Number((refPrice - entryDelta).toFixed(1));
    orderType = config?.orderType ?? "STOP";
  }

  const tpPrice = side === "LONG"
    ? Number((entryPrice + tpPoints).toFixed(1))
    : Number((entryPrice - tpPoints).toFixed(1));

  let slPrice = resolveCutloss(
    side,
    swingLow5d,
    previousShortCutloss,
    swingHigh5d ?? expectedHigh
  );

  const safeSlDistance = Math.min(12.0, Math.max(8.0, Number((0.35 * atr5d).toFixed(1))));
  if (side === "SHORT") {
    const sessionHigh = Math.max(snapshot.high ?? refPrice, refPrice);
    const bufferHigh = Number((sessionHigh + 3.3).toFixed(1));
    const minDistanceSl = Number((entryPrice + safeSlDistance).toFixed(1));
    slPrice = Math.max(bufferHigh, minDistanceSl);
    if (previousShortCutloss && previousShortCutloss > entryPrice && previousShortCutloss < entryPrice + 15.0) {
      slPrice = Math.max(slPrice, previousShortCutloss);
    }
  } else {
    
    const sessionLow = Math.min(snapshot.low ?? refPrice, refPrice);
    const bufferLow = Number((sessionLow - 3.3).toFixed(1));
    const minDistanceSl = Number((entryPrice - safeSlDistance).toFixed(1));
    if (previousShortCutloss && previousShortCutloss < entryPrice && previousShortCutloss > 0) {
      slPrice = previousShortCutloss;
    } else {
      const baseSl = swingLow5d > 0 && swingLow5d < entryPrice ? swingLow5d : Math.min(bufferLow, minDistanceSl);
      slPrice = Math.min(baseSl, bufferLow, minDistanceSl);
    }
  }

  const r5Eval = evaluateR5(side, snapshot.open, refPrice, slPrice);

  const v44Eval = evaluateV44(side, refPrice, expectedHigh ?? swingHigh5d, expectedLow ?? swingLow5d);

  const trailingConfig = config?.trailing ?? DEFAULT_SIMCARRY_CONFIG.trailing;

  return {
    id: `plan_simcarry6_${dateStr}`,
    date: dateStr,
    engine: "simcarrry6",
    profile: "SWING_T1",
    horizon: "t+1",
    side,
    orderType,
    entryPrice,
    tpPrice,
    slPrice,
    maxCap,
    r5State: r5Eval.action,
    v44Active: v44Eval.isV44Active,
    v44Warning: v44Eval.warning,
    status: "ACTIVE_TODAY",
    isCanonical: true,
    trailingConfig,
    breakevenTrigger: trailingConfig.beTriggerPoints,
    expectedHigh,
    expectedLow,
    resolvedSource: previousShortCutloss ? "LATEST_SHORT_CUTLOSS_REVERSAL" : "ADAPTIVE_VOLATILITY_SWING",
  };
}

export function generateAllDaysLadderPlan(
  dateStr: string,
  snapshot: MarketSnapshot,
  refPrice: number,
  slPrice: number,
  expectedHigh?: number,
  expectedLow?: number,
  config?: LadderStrategyConfig
): TradingPlan {

  const refOpen = snapshot.open > 0 ? snapshot.open : snapshot.current;
  const side: Direction = config?.side ?? (refOpen >= refPrice ? "LONG" : "SHORT");
  const entryPrice = Number(refPrice.toFixed(1));
  const tpDelta = config?.tpPoints ?? DEFAULT_LADDER_CONFIG.tpPoints;
  const tpPrice = side === "LONG"
    ? Number((entryPrice + tpDelta).toFixed(1))
    : Number((entryPrice - tpDelta).toFixed(1));
  const maxCap = config?.maxCap ?? DEFAULT_LADDER_CONFIG.maxCap;

  let ladderSlPrice: number;
  if (side === "SHORT") {
    const highestStep = entryPrice + 4.0;
    const peakHigh = Math.max(highestStep, snapshot.high ?? entryPrice);
    ladderSlPrice = Math.max(Number((peakHigh + 3.3).toFixed(1)), slPrice > entryPrice ? slPrice : entryPrice + 8.0);
  } else {
    if (slPrice < entryPrice && slPrice > 0) {
      ladderSlPrice = slPrice;
    } else {
      const lowestStep = entryPrice - 4.0;
      const valleyLow = Math.min(lowestStep, snapshot.low ?? entryPrice);
      ladderSlPrice = Math.min(Number((valleyLow - 3.3).toFixed(1)), entryPrice - 8.0);
    }
  }

  const r5Eval = evaluateR5(side, snapshot.open, refPrice, ladderSlPrice);
  const v44Eval = evaluateV44(side, refPrice, expectedHigh, expectedLow);

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
    slPrice: ladderSlPrice,
    maxCap,
    r5State: r5Eval.action,
    v44Active: v44Eval.isV44Active,
    v44Warning: v44Eval.warning,
    status: "ACTIVE_TODAY",
    isCanonical: false,
    expectedHigh,
    expectedLow,
    resolvedSource: "ADAPTIVE_LADDER_SCALP",
  };
}

export function generateCanonicalQuantPlan(
  dateStr: string,
  refPrice: number,
  atr5d: number,
  ema5: number,
  ema10: number,
  config?: QuantStrategyConfig,
  snapshot?: MarketSnapshot,
  expectedHigh?: number,
  expectedLow?: number
): TradingPlan {
  const atrEntryMultiplier = config?.atrEntryMultiplier ?? DEFAULT_CANONICAL_CONFIG.atrEntryMultiplier;
  const tpPoints = config?.tpPoints ?? DEFAULT_CANONICAL_CONFIG.tpPoints;
  const slPoints = config?.slPoints ?? DEFAULT_CANONICAL_CONFIG.slPoints;
  const maxCap = config?.maxCap ?? DEFAULT_CANONICAL_CONFIG.maxCap;

  let side: Direction;
  if (snapshot) {
    const gap = snapshot.open - refPrice;
    const isOpenUnderRef = snapshot.open < refPrice;
    const isNegativeBasis = (snapshot.basis ?? 0) < -1.5;

    if (gap < -2.0 || (isOpenUnderRef && isNegativeBasis)) {
      side = "SHORT";
    } else if (gap > 2.0 || (!isOpenUnderRef && !isNegativeBasis)) {
      side = "LONG";
    } else {
      
      side = ema5 >= ema10 ? "LONG" : "SHORT";
    }
  } else {
    side = ema5 >= ema10 ? "LONG" : "SHORT";
  }

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

  const v44Eval = evaluateV44(side, refPrice, expectedHigh, expectedLow);

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
    v44Active: v44Eval.isV44Active,
    v44Warning: v44Eval.warning,
    expectedHigh,
    expectedLow,
    trailingConfig,
    breakevenTrigger: trailingConfig.beTriggerPoints,
    status: "ACTIVE_TODAY",
    isCanonical: false,
    resolvedSource: "CANONICAL_PRE_OPEN_VOLATILITY_EXPANSION",
  };
}

export function generateMultiEnginePortfolio(
  dateStr: string,
  snapshot: MarketSnapshot,
  metrics: {
    refPrice: number;
    atr5d: number;
    swingLow5d: number;
    swingHigh5d: number;
    ema5: number;
    ema10: number;
  },
  options?: { isOfficial?: boolean; phase?: TradingSessionPhase }
): TradingPlan[] {
  const { refPrice, atr5d, swingLow5d, swingHigh5d, ema5, ema10 } = metrics;

  const simCarryPlan = generateSimCarry6Plan(
    dateStr,
    snapshot,
    refPrice,
    atr5d,
    swingLow5d,
    swingHigh5d,
    swingLow5d,
    undefined,
    undefined,
    swingHigh5d,
    ema5,
    ema10
  );
  simCarryPlan.consensusWeight = 2.0;

  const ladderPlan = generateAllDaysLadderPlan(
    dateStr,
    snapshot,
    refPrice,
    simCarryPlan.slPrice,
    swingHigh5d,
    swingLow5d
  );
  ladderPlan.consensusWeight = 1.0;

  const canonicalPlan = generateCanonicalQuantPlan(
    dateStr,
    refPrice,
    atr5d,
    ema5,
    ema10,
    undefined,
    snapshot,
    swingHigh5d,
    swingLow5d
  );
  canonicalPlan.consensusWeight = 1.5;

  const phase = options?.phase ?? getTradingSessionPhase();
  const inOfficialWindow = phase !== "PRE_ATO" && phase !== "ATO_OBSERVATION";
  const isOfficial = options?.isOfficial ?? inOfficialWindow;
  const plans = [simCarryPlan, ladderPlan, canonicalPlan];
  simCarryPlan.isCanonical = true;
  ladderPlan.isCanonical = false;
  canonicalPlan.isCanonical = false;
  for (const p of plans) {
    p.sessionPhase = phase;
    p.isOfficial = isOfficial;
  }

  return plans;
}

export function getTradingSessionPhase(date: Date = new Date()): TradingSessionPhase {
  const vnTimeStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
  
  const [h, m] = vnTimeStr.split(":").map(Number);
  const minuteOfDay = h * 60 + m;

  if (minuteOfDay < 8 * 60 + 45) return "PRE_ATO";
  if (minuteOfDay < 9 * 60 + 15) return "ATO_OBSERVATION";
  if (minuteOfDay < 11 * 60 + 30) return "CONTINUOUS";
  if (minuteOfDay < 13 * 60) return "LUNCH_BREAK";
  if (minuteOfDay < 14 * 60 + 30) return "CONTINUOUS";
  if (minuteOfDay < 14 * 60 + 45) return "ATC";
  return "CLOSED";
}

export function getVietnamTradingDate(date: Date = new Date()): string {
  const vnFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = vnFormatter.format(date); 
  const parts = dateStr.split("-").map(Number);
  const vnDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const dayOfWeek = vnDate.getUTCDay(); 

  if (dayOfWeek === 6) {
    vnDate.setUTCDate(vnDate.getUTCDate() + 2); 
  } else if (dayOfWeek === 0) {
    vnDate.setUTCDate(vnDate.getUTCDate() + 1); 
  }

  const y = vnDate.getUTCFullYear();
  const m = String(vnDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(vnDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getVnDateString(date: Date = new Date()): string {
  const vnFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return vnFormatter.format(date);
}

export function isWeekend(dateStr: string): boolean {
  const parts = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

export function recalibratePlanAfterStopLoss(
  originalPlan: TradingPlan,
  snapshot: MarketSnapshot,
  metrics: DailyMarketMetrics,
  cutlossPrice?: number,
  bars?: IntradayBar[]
): TradingPlan {
  const actualCutloss = cutlossPrice ?? originalPlan.slPrice;
  const { refPrice, atr5d } = metrics;
  const safeAtr = atr5d > 0 ? atr5d : 10.0;
  const livePrice = snapshot.current > 0 ? snapshot.current : actualCutloss;

  if (bars && bars.length > 0) {
    const sessionHigh = Math.max(...bars.map((b) => b.high));
    const sessionLow = Math.min(...bars.map((b) => b.low));

    let sumTypicalPrice = 0;
    for (const b of bars) {
      sumTypicalPrice += (b.high + b.low + b.close) / 3;
    }
    const sessionVwap = Number((sumTypicalPrice / bars.length).toFixed(1));

    const recentBars = bars.slice(-15);
    const recentClose = recentBars[recentBars.length - 1]?.close ?? livePrice;

    if (originalPlan.side === "SHORT") {

      const isBullTrap = recentClose < actualCutloss || (sessionHigh > actualCutloss && livePrice < actualCutloss - 0.3);

      if (isBullTrap) {
        
        const newSide: Direction = "SHORT";
        const entryPrice = Number(livePrice.toFixed(1));
        const tpTarget = Math.max(sessionLow, sessionVwap - 0.5 * safeAtr);
        const tpPrice = Number(Math.min(entryPrice - 6.0, tpTarget).toFixed(1));
        const slPrice = Number(Math.max(entryPrice + 3.5, sessionHigh + 0.8).toFixed(1));

        return {
          ...originalPlan,
          side: newSide,
          entryPrice,
          tpPrice,
          slPrice,
          status: "ACTIVE_TODAY",
          orderType: "STOP",
          isCanonical: true,
          resolvedSource: "SESSION_OPTIMAL_SWEEP_RE_SHORT",
          reason: `Tối ưu toàn phiên: Phát hiện Quét thanh khoản đỉnh (Bull Trap qua ${actualCutloss.toFixed(1)}). Giá thoái lui dưới VWAP (${sessionVwap.toFixed(1)}). Tiếp tục SHORT @ ${entryPrice.toFixed(1)}, TP ${tpPrice.toFixed(1)}, SL chặt @ ${slPrice.toFixed(1)} tới khi đóng phiên ATC.`,
          execution: undefined,
        };
      } else {
        
        const newSide: Direction = "LONG";
        const entryPrice = Number(livePrice.toFixed(1));
        const tpDistance = Number(Math.max(12.0, 1.0 * safeAtr).toFixed(1));
        const tpPrice = Number((entryPrice + tpDistance).toFixed(1));
        const slRef = Math.max(sessionLow, Math.min(sessionVwap, actualCutloss - 3.0));
        const slPrice = Number(Math.min(entryPrice - 5.0, slRef).toFixed(1));

        return {
          ...originalPlan,
          side: newSide,
          entryPrice,
          tpPrice,
          slPrice,
          status: "ACTIVE_TODAY",
          orderType: "STOP",
          isCanonical: true,
          resolvedSource: "LATEST_SHORT_CUTLOSS_REVERSAL",
          reason: `Tối ưu toàn phiên: Lực mua bứt phá cản SL ${actualCutloss.toFixed(1)} giữ vững trên VWAP (${sessionVwap.toFixed(1)}). Đảo chiều sang LONG @ ${entryPrice.toFixed(1)}, TP ${tpPrice.toFixed(1)}, SL @ ${slPrice.toFixed(1)} nắm giữ tới kết thúc phiên ATC.`,
          execution: undefined,
        };
      }
    } else {

      const isBearTrap = recentClose > actualCutloss || (sessionLow < actualCutloss && livePrice > actualCutloss + 0.3);

      if (isBearTrap) {
        
        const newSide: Direction = "LONG";
        const entryPrice = Number(livePrice.toFixed(1));
        const tpTarget = Math.min(sessionHigh, sessionVwap + 0.5 * safeAtr);
        const tpPrice = Number(Math.max(entryPrice + 6.0, tpTarget).toFixed(1));
        const slPrice = Number(Math.min(entryPrice - 3.5, sessionLow - 0.8).toFixed(1));

        return {
          ...originalPlan,
          side: newSide,
          entryPrice,
          tpPrice,
          slPrice,
          status: "ACTIVE_TODAY",
          orderType: "STOP",
          isCanonical: true,
          resolvedSource: "SESSION_OPTIMAL_SWEEP_RE_LONG",
          reason: `Tối ưu toàn phiên: Phát hiện Rút chân quét thanh khoản đáy (Bear Trap qua ${actualCutloss.toFixed(1)}). Lực mua kéo giá vượt trên VWAP (${sessionVwap.toFixed(1)}). Tiếp tục LONG @ ${entryPrice.toFixed(1)}, TP ${tpPrice.toFixed(1)}, SL chặt @ ${slPrice.toFixed(1)} tới khi đóng phiên ATC.`,
          execution: undefined,
        };
      } else {
        
        const newSide: Direction = "SHORT";
        const entryPrice = Number(livePrice.toFixed(1));
        const tpDistance = Number(Math.max(12.0, 1.0 * safeAtr).toFixed(1));
        const tpPrice = Number((entryPrice - tpDistance).toFixed(1));
        const slRef = Math.min(sessionHigh, Math.max(sessionVwap, actualCutloss + 3.0));
        const slPrice = Number(Math.max(entryPrice + 5.0, slRef).toFixed(1));

        return {
          ...originalPlan,
          side: newSide,
          entryPrice,
          tpPrice,
          slPrice,
          status: "ACTIVE_TODAY",
          orderType: "STOP",
          isCanonical: true,
          resolvedSource: "LATEST_LONG_CUTLOSS_REVERSAL",
          reason: `Tối ưu toàn phiên: Áp lực bán thủng hỗ trợ SL ${actualCutloss.toFixed(1)} ép giá dưới VWAP (${sessionVwap.toFixed(1)}). Đảo chiều sang SHORT @ ${entryPrice.toFixed(1)}, TP ${tpPrice.toFixed(1)}, SL @ ${slPrice.toFixed(1)} nắm giữ tới kết thúc phiên ATC.`,
          execution: undefined,
        };
      }
    }
  }

  if (originalPlan.side === "SHORT") {
    const newSide: Direction = "LONG";
    const entryPrice = Number(actualCutloss.toFixed(1));
    const tpDistance = Number(Math.max(15.0, 1.2 * safeAtr).toFixed(1));
    const tpPrice = Number((entryPrice + tpDistance).toFixed(1));
    const slDistance = Math.min(10.0, Math.max(7.5, Number((0.35 * safeAtr).toFixed(1))));
    const slPrice = Number(Math.max(refPrice, entryPrice - slDistance).toFixed(1));

    return {
      ...originalPlan,
      side: newSide,
      entryPrice,
      tpPrice,
      slPrice,
      status: "ACTIVE_TODAY",
      orderType: "STOP",
      isCanonical: true,
      resolvedSource: "LATEST_SHORT_CUTLOSS_REVERSAL",
      reason: `Kèo tái lập sau Stop Loss: Đảo chiều sang LONG @ ${entryPrice.toFixed(1)} đón sóng bứt phá đỉnh (SL cũ: ${actualCutloss.toFixed(1)})`,
      execution: undefined,
    };
  } else {
    const newSide: Direction = "SHORT";
    const entryPrice = Number(actualCutloss.toFixed(1));
    const tpDistance = Number(Math.max(15.0, 1.2 * safeAtr).toFixed(1));
    const tpPrice = Number((entryPrice - tpDistance).toFixed(1));
    const slDistance = Math.min(10.0, Math.max(7.5, Number((0.35 * safeAtr).toFixed(1))));
    const slPrice = Number(Math.min(refPrice, entryPrice + slDistance).toFixed(1));

    return {
      ...originalPlan,
      side: newSide,
      entryPrice,
      tpPrice,
      slPrice,
      status: "ACTIVE_TODAY",
      orderType: "STOP",
      isCanonical: true,
      resolvedSource: "LATEST_LONG_CUTLOSS_REVERSAL",
      reason: `Kèo tái lập sau Stop Loss: Đảo chiều sang SHORT @ ${entryPrice.toFixed(1)} đón nhịp gãy đáy (SL cũ: ${actualCutloss.toFixed(1)})`,
      execution: undefined,
    };
  }
}

