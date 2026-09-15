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
    beTriggerPoints: 8.0,     
    trailTriggerPoints: 14.0, 
    trailDistance: 6.0,       
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
  // Xác định hướng theo Open (đã đóng băng sau ATO) — KHÔNG dùng `current` để tránh lật kèo intraday.
  // Ưu tiên config.side nếu caller chỉ định; ngược lại so Open vs Ref.
  const refOpen = snapshot.open > 0 ? snapshot.open : snapshot.current;
  const side: Direction = config?.side ?? (refOpen >= refPrice ? "LONG" : "SHORT");
  const entryPrice = Number(refPrice.toFixed(1));
  const tpDelta = config?.tpPoints ?? DEFAULT_LADDER_CONFIG.tpPoints;
  const tpPrice = side === "LONG"
    ? Number((entryPrice + tpDelta).toFixed(1))
    : Number((entryPrice - tpDelta).toFixed(1));
  const maxCap = config?.maxCap ?? DEFAULT_LADDER_CONFIG.maxCap;

  // Tính SL an toàn cho AllDaysLadder:
  // SL KHÔNG ĐƯỢC trùng entryPrice. Phải nằm ngoài toàn bộ các nấc rải + buffer an toàn (>= 6.0đ từ WAP)
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

/**
 * HỆ THỐNG PHÁT 1 KÈO DUY NHẤT TRONG NGÀY (CANONICAL SINGLE-PLAN ADVISOR)
 * Hoàn toàn KHÔNG dùng dữ liệu tương lai (Zero Lookahead Barrier):
 * - Kết hợp đa nhân tố đã ĐÓNG BĂNG sau ATO: Price Action (Open vs Ref), Basis, ATR(5), EMA5/EMA10.
 *   KHÔNG dùng `current` (biến động mỗi tick) -> kèo không bị lật LONG<->SHORT intraday.
 * - Phát đúng 1 lệnh điều kiện Stop Order sau khi xác nhận Open (09:15):
 *   + Cấu trúc Bán ưu thế (Gap < -2đ, hoặc Open < Ref kèm Basis âm) -> SHORT: Stop Sell tại Ref - (mult*ATR5)
 *   + Cấu trúc Mua ưu thế (Gap > +2đ, hoặc Open >= Ref kèm Basis không âm) -> LONG: Stop Buy tại Ref + (mult*ATR5)
 * - Tỷ lệ R:R = 1:3.0 (TP 24.0đ, SL 8.0đ), tích hợp Trailing Stop & BE Lock tự động.
 */
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

  // Xác định xu hướng theo Price Action đã ĐÓNG BĂNG sau ATO (Open vs Ref) + Basis + ATR.
  // KHÔNG dùng `current` (biến động mỗi tick) để tránh lật kèo intraday.
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
      // Vùng giằng co quanh Ref: dùng EMA5 vs EMA10 làm bộ lọc thứ cấp
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

/**
 * TỔ HỢP ĐA CHIẾN LƯỢC BFXPS (MULTI-ENGINE ENSEMBLE PORTFOLIO)
 * Tổ hợp đầy đủ 3 Engine tiêu chuẩn tương tự web gốc ai.beefx.com:
 * 1. simcarrry6 t+1: Kèo Chính Swing (trọng số 2.0)
 * 2. AllDaysLadder_CAP0.3: Kèo Intraday Scalp rải nấc (trọng số 1.0)
 * 3. CanonicalDirectionalBreakout: Kèo Breakout Intraday chuẩn tắc (trọng số 1.5)
 */
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

  // 1. Kèo Chính Swing t+1: simcarrry6 (truyền ema5/ema10 cho dead-zone resolver)
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

  // 2. Kèo Phụ Intraday Scalp: AllDaysLadder_CAP0.3
  const ladderPlan = generateAllDaysLadderPlan(
    dateStr,
    snapshot,
    refPrice,
    simCarryPlan.slPrice,
    swingHigh5d,
    swingLow5d
  );
  ladderPlan.consensusWeight = 1.0;

  // 3. Kèo Breakout Chuẩn Tắc: CanonicalDirectionalBreakout (truyền expectedHigh/Low cho V44)
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

  // Inject pha giao dịch + cờ official (kèo đã khóa sau ATO 09:15 hay chỉ là observation)
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

/**
 * Xác định pha giao dịch hiện tại theo lịch phái sinh VN30F1M (UTC+7)
 * - PRE_ATO:          < 08:45
 * - ATO_OBSERVATION:  08:45 – 09:15 (quan sát, chưa chốt kèo)
 * - CONTINUOUS:       09:15 – 11:30 & 13:00 – 14:30 (kèo chính thức)
 * - LUNCH_BREAK:      11:30 – 13:00
 * - ATC:              14:30 – 14:45
 * - CLOSED:           ≥ 14:45
 */
export function getTradingSessionPhase(date: Date = new Date()): TradingSessionPhase {
  const vnTimeStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
  // vnTimeStr = "HH:MM:SS" or "HH:MM:SS"
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

/**
 * Lấy ngày giao dịch hiện tại hoặc kế tiếp theo múi giờ Việt Nam (Asia/Ho_Chi_Minh - UTC+7)
 * Tự động bỏ qua Thứ 7 & Chủ Nhật (thị trường phái sinh VN30F nghỉ) -> chuyển sang Thứ 2 tiếp theo.
 */
export function getVietnamTradingDate(date: Date = new Date()): string {
  const vnFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = vnFormatter.format(date); // YYYY-MM-DD
  const parts = dateStr.split("-").map(Number);
  const vnDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const dayOfWeek = vnDate.getUTCDay(); // 0 = Chủ Nhật, 6 = Thứ 7

  if (dayOfWeek === 6) {
    vnDate.setUTCDate(vnDate.getUTCDate() + 2); // Thứ 7 -> Thứ 2
  } else if (dayOfWeek === 0) {
    vnDate.setUTCDate(vnDate.getUTCDate() + 1); // Chủ Nhật -> Thứ 2
  }

  const y = vnDate.getUTCFullYear();
  const m = String(vnDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(vnDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Chuyển đổi Date sang định dạng YYYY-MM-DD theo đúng múi giờ Việt Nam (UTC+7 / Asia/Ho_Chi_Minh)
 */
export function getVnDateString(date: Date = new Date()): string {
  const vnFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return vnFormatter.format(date);
}

/**
 * Kiểm tra xem ngày có rơi vào ngày cuối tuần (Thứ 7 / Chủ Nhật) không theo múi giờ Việt Nam
 */
export function isWeekend(dateStr: string): boolean {
  const parts = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

/**
/**
 * THUẬT TOÁN TỐI ƯU KÈO TOÀN BỘ PHIÊN (KHI ĐƯỢC KÍCH HOẠT NHẤN NÚT)
 * 
 * Khi người dùng nhấn nút tái tính toán:
 * 1. Quét toàn bộ nến trong phiên (session bars từ 09:00 tới hiện tại):
 *    - Session High, Session Low, Range, Session VWAP.
 *    - Xác định hành vi giá sau điểm quét SL:
 *      + Kịch bản 1: Quét thanh khoản giả / Rút chân (Bull Trap / Bear Trap). Giá chỉ nhú qua SL rồi quay trở lại bên trong biên độ phiên hoặc dưới/trên VWAP -> Đưa ra kèo Counter-Trend (Re-entry hướng ban đầu với SL cực chặt tại đỉnh/đáy phiên vừa tạo, R:R tối ưu).
 *      + Kịch bản 2: Bứt phá / Gãy nền tiếp diễn thật sự (True Breakout / Breakdown). Giá duy trì sức ép và đóng nến xa điểm SL theo hướng phá vỡ -> Đảo chiều vị thế bám theo đà sóng bứt phá.
 * 2. Đưa ra Kèo Hợp Lý Nhất duy trì hiệu lực tới khi kết thúc phiên (14:30 - 14:45 ATC).
 */
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

  // Nếu có dữ liệu nến toàn bộ phiên:
  if (bars && bars.length > 0) {
    const sessionHigh = Math.max(...bars.map((b) => b.high));
    const sessionLow = Math.min(...bars.map((b) => b.low));
    
    // Tính VWAP phiên
    let sumTypicalPrice = 0;
    for (const b of bars) {
      sumTypicalPrice += (b.high + b.low + b.close) / 3;
    }
    const sessionVwap = Number((sumTypicalPrice / bars.length).toFixed(1));

    // Lấy 15 nến gần nhất để đánh giá momentum
    const recentBars = bars.slice(-15);
    const recentClose = recentBars[recentBars.length - 1]?.close ?? livePrice;

    if (originalPlan.side === "SHORT") {
      // SL của SHORT bị dính (giá tăng lên quét SL tại actualCutloss)
      // Kiểm tra: Giá có bị tụt ngược lại dưới actualCutloss hoặc dưới VWAP không?
      const isBullTrap = recentClose < actualCutloss || (sessionHigh > actualCutloss && livePrice < actualCutloss - 0.3);

      if (isBullTrap) {
        // Quét râu thanh khoản đỉnh (Bull Trap) rồi thoái lui -> Kèo hợp lý nhất: SHORT lại với SL ngay trên đỉnh phiên vừa quét
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
        // Bứt phá đỉnh thật sự -> Đảo sang LONG bám theo sóng tăng tới hết phiên
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
      // SL của LONG bị dính (giá giảm xuống quét SL tại actualCutloss)
      // Kiểm tra: Giá có rút chân hồi phục ngược lại lên trên actualCutloss hoặc trên VWAP không?
      const isBearTrap = recentClose > actualCutloss || (sessionLow < actualCutloss && livePrice > actualCutloss + 0.3);

      if (isBearTrap) {
        // Quét râu đáy rút chân (Bear Trap) -> Kèo hợp lý nhất: LONG lại với SL ngay dưới đáy phiên vừa quét
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
        // Gãy nền thật sự -> Đảo sang SHORT bám theo sóng xả tới hết phiên
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

  // Fallback (khi không có danh sách nến chi tiết, ví dụ unit test hoặc cold-start)
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

