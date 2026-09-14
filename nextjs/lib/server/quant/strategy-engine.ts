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
  config?: SimCarryConfig,
  swingHigh5d?: number
): TradingPlan {
  const basisThreshold = config?.basisThreshold ?? DEFAULT_SIMCARRY_CONFIG.basisThreshold;
  const atrMultiplier = config?.atrMultiplier ?? DEFAULT_SIMCARRY_CONFIG.atrMultiplier;
  const tpPoints = config?.tpPoints ?? DEFAULT_SIMCARRY_CONFIG.tpPoints;
  const maxCap = config?.maxCap ?? DEFAULT_SIMCARRY_CONFIG.maxCap;

  // 1. Xác định hướng (LONG / SHORT) dựa trên Basis và vị thế giá
  const basis = snapshot.basis ?? 0;
  const isPriceStrong = snapshot.current >= refPrice;
  const side: Direction = basis < basisThreshold || isPriceStrong ? "LONG" : "SHORT";

  // 2. Tính mức giá Entry & Order Type thích ứng biên độ thực tế
  // Khi thị trường đã mở cửa: Vào lệnh Limit tại vùng Tham chiếu (như web gốc ai.beefx.com ENTRY 1940.0)
  // hoặc vào theo giá mở cửa nếu chưa có cản
  let entryPrice: number;
  let orderType: "STOP" | "LIMIT" = "LIMIT";

  if (snapshot.open > 0 && Math.abs(snapshot.open - refPrice) >= 2.0) {
    // Phiên có gap: Ưu tiên điểm Limit tại Tham chiếu (đón nhịp hồi test tham chiếu)
    entryPrice = Number(refPrice.toFixed(1));
    orderType = "LIMIT";
  } else {
    const entryDelta = Number((atrMultiplier * atr5d).toFixed(1));
    entryPrice = side === "LONG"
      ? Number((refPrice + entryDelta).toFixed(1))
      : Number((refPrice - entryDelta).toFixed(1));
    orderType = snapshot.current > 0
      ? (side === "SHORT" ? (entryPrice > snapshot.current ? "LIMIT" : "STOP") : (entryPrice < snapshot.current ? "LIMIT" : "STOP"))
      : "STOP";
  }

  // 3. Mục tiêu TP theo cấu hình chiến lược
  const tpPrice = side === "LONG"
    ? Number((entryPrice + tpPoints).toFixed(1))
    : Number((entryPrice - tpPoints).toFixed(1));

  // 4. Mức cắt lỗ SL theo cơ chế LATEST_SHORT_CUTLOSS_REVERSAL & An toàn biên độ thực tế
  let slPrice = resolveCutloss(
    side,
    swingLow5d,
    previousShortCutloss,
    swingHigh5d ?? expectedHigh
  );

  // Đảm bảo khoảng cách SL thích ứng biên độ thực tế (chuẩn 8.0 - 10.0đ, nằm ngoài đỉnh/đáy sáng)
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
    // Với LONG: SL phải dưới đáy sáng và cách entry an toàn
    const sessionLow = Math.min(snapshot.low ?? refPrice, refPrice);
    const bufferLow = Number((sessionLow - 3.3).toFixed(1));
    const minDistanceSl = Number((entryPrice - safeSlDistance).toFixed(1));
    if (previousShortCutloss && previousShortCutloss < entryPrice && previousShortCutloss > 0) {
      slPrice = previousShortCutloss;
    } else {
      slPrice = Math.min(bufferLow, minDistanceSl);
    }
  }

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
    orderType,
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
  // Xác định hướng động (dựa trên cấu hình hoặc vị thế thị trường so với Ref, loại bỏ hardcode thiên vị 1 chiều LONG)
  const side: Direction = config?.side ?? (snapshot.current >= refPrice ? "LONG" : "SHORT");
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
    status: "ACTIVE_TODAY",
    isCanonical: true,
    expectedHigh,
    expectedLow,
    resolvedSource: "ADAPTIVE_LADDER_SCALP",
  };
}

/**
 * HỆ THỐNG PHÁT 1 KÈO DUY NHẤT TRONG NGÀY (CANONICAL SINGLE-PLAN ADVISOR)
 * Hoàn toàn KHÔNG dùng dữ liệu tương lai (Zero Lookahead Barrier):
 * - Kết hợp đa nhân tố: Price Action (Open vs Ref, Current vs Ref), Basis, và ATR(5).
 * - Khắc phục hoàn toàn độ trễ của EMA khi thị trường đảo chiều gấp.
 * - Phát đúng 1 lệnh điều kiện Stop Order trước 09:00:
 *   + Nếu cấu trúc Bán chiếm ưu thế (Open < Ref hoặc Current < Ref kèm Basis âm) -> Kèo SHORT: Stop Sell tại RefPrice - (atrEntryMultiplier * ATR5)
 *   + Nếu cấu trúc Mua chiếm ưu thế (Open > Ref hoặc Current >= Ref kèm Basis dương) -> Kèo LONG: Stop Buy tại RefPrice + (atrEntryMultiplier * ATR5)
 * - Tỷ lệ R:R = 1:3.0 (TP 24.0đ, SL 8.0đ), tích hợp Trailing Stop & BE Lock tự động.
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

  // Xác định xu hướng chuẩn xác theo Price Action & Vị thế giá so với tham chiếu:
  let side: Direction;
  if (snapshot) {
    const gap = snapshot.open - refPrice;
    const isUnderRef = snapshot.current < refPrice;
    const isNegativeBasis = (snapshot.basis ?? 0) < -1.5;

    if (gap < -2.0 || (isUnderRef && isNegativeBasis)) {
      side = "SHORT";
    } else if (gap > 2.0 || (!isUnderRef && !isNegativeBasis)) {
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
  }
): TradingPlan[] {
  const { refPrice, atr5d, swingLow5d, swingHigh5d, ema5, ema10 } = metrics;

  // 1. Kèo Chính Swing t+1: simcarrry6
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
    swingHigh5d
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

  // 3. Kèo Breakout Chuẩn Tắc: CanonicalDirectionalBreakout
  const canonicalPlan = generateCanonicalQuantPlan(
    dateStr,
    refPrice,
    atr5d,
    ema5,
    ema10,
    undefined,
    snapshot
  );
  canonicalPlan.consensusWeight = 1.5;

  return [simCarryPlan, ladderPlan, canonicalPlan];
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
 * Kiểm tra xem ngày có rơi vào ngày cuối tuần (Thứ 7 / Chủ Nhật) không
 */
export function isWeekend(dateStr: string): boolean {
  const parts = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}
