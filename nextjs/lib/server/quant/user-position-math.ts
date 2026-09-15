export const CONTRACT_MULTIPLIER = 100000; // 100,000 VND / point for VN30F1M

export type MarginTier = 0.03 | 0.05 | 0.18;

export interface PositionCalculationInput {
  side: "LONG" | "SHORT";
  matchedPrice: number;
  matchedVolume: number;
  marginRate: MarginTier;
  currentPrice: number;
}

export interface PositionCalculationResult {
  pnlPoints: number;
  pnlMoney: number;
  requiredMargin: number;
  roiPercent: number;
  isProfit: boolean;
}

export function calculatePositionMetrics(input: PositionCalculationInput): PositionCalculationResult {
  const isLong = input.side === "LONG";
  const pnlPoints = isLong
    ? input.currentPrice - input.matchedPrice
    : input.matchedPrice - input.currentPrice;

  const pnlMoney = pnlPoints * CONTRACT_MULTIPLIER * input.matchedVolume;
  const requiredMargin = input.matchedPrice * CONTRACT_MULTIPLIER * input.matchedVolume * input.marginRate;
  const roiPercent = requiredMargin > 0 ? (pnlMoney / requiredMargin) * 100 : 0;

  return {
    pnlPoints: Math.round(pnlPoints * 10) / 10,
    pnlMoney: Math.round(pnlMoney),
    requiredMargin: Math.round(requiredMargin),
    roiPercent: Math.round(roiPercent * 10) / 10,
    isProfit: pnlMoney >= 0,
  };
}

export interface PositionWarning {
  type: "error" | "warning" | "info";
  code: "DIRECTION_MISMATCH" | "SLIPPAGE" | "SL_NEAR" | "TP_REACHED";
  title: string;
  message: string;
}

export interface WarningEvaluationInput {
  positionSide: "LONG" | "SHORT";
  matchedPrice: number;
  currentPrice: number;
  planSide?: "LONG" | "SHORT";
  planEntry?: number;
  planTp?: number;
  planSl?: number;
}

export function evaluatePositionWarnings(input: WarningEvaluationInput): PositionWarning[] {
  const warnings: PositionWarning[] = [];

  // 1. Direction Mismatch
  if (input.planSide && input.positionSide !== input.planSide) {
    warnings.push({
      type: "error",
      code: "DIRECTION_MISMATCH",
      title: "Cảnh Báo Lệch Hướng Kèo Hệ Thống",
      message: `Vị thế của bạn là [${input.positionSide}], ngược hướng Kèo hệ thống [${input.planSide}] (Entry: ${input.planEntry?.toFixed(1) || "--"}). Rủi ro rất cao!`,
    });
  } else if (input.planEntry != null) {
    // 2. Slippage Warning
    const slippage = input.positionSide === "LONG"
      ? input.matchedPrice - input.planEntry
      : input.planEntry - input.matchedPrice;

    if (slippage > 0.5) {
      warnings.push({
        type: "warning",
        code: "SLIPPAGE",
        title: "Cảnh Báo Trượt Giá Vào Lệnh",
        message: `Giá khớp bị trượt +${slippage.toFixed(1)} điểm so với Entry Kèo hệ thống (${input.planEntry.toFixed(1)}). Biên độ an toàn cắn SL bị thu hẹp!`,
      });
    }
  }

  // 3. SL Near / Hit Warning
  if (input.planSl != null) {
    const distanceToSl = Math.abs(input.currentPrice - input.planSl);
    const isPastSl = input.positionSide === "LONG"
      ? input.currentPrice <= input.planSl
      : input.currentPrice >= input.planSl;

    if (isPastSl) {
      warnings.push({
        type: "error",
        code: "SL_NEAR",
        title: "Cảnh Báo Chạm Cắt Lỗ Hệ Thống",
        message: `Giá hiện tại (${input.currentPrice.toFixed(1)}) đã chạm/vượt mức SL hệ thống (${input.planSl.toFixed(1)}). Khuyến nghị kỷ luật cắt lỗ!`,
      });
    } else if (distanceToSl <= 2.0) {
      warnings.push({
        type: "warning",
        code: "SL_NEAR",
        title: "Cảnh Báo Vùng Nguy Hiểm SL",
        message: `Giá hiện tại (${input.currentPrice.toFixed(1)}) đang cách Stop Loss hệ thống (${input.planSl.toFixed(1)}) chỉ ${distanceToSl.toFixed(1)} điểm. Cẩn trọng!`,
      });
    }
  }

  // 4. TP Reached Warning
  if (input.planTp != null) {
    const isTpReached = input.positionSide === "LONG"
      ? input.currentPrice >= input.planTp
      : input.currentPrice <= input.planTp;

    if (isTpReached) {
      warnings.push({
        type: "info",
        code: "TP_REACHED",
        title: "Đạt Mục Tiêu Take Profit",
        message: `Giá đã chạm mục tiêu TP hệ thống (${input.planTp.toFixed(1)}). Khuyến nghị chủ động chốt lời hoặc dời SL về hòa vốn (BE)!`,
      });
    }
  }

  return warnings;
}

export function calculateRealizedPnL(
  side: "LONG" | "SHORT",
  matchedPrice: number,
  exitPrice: number,
  volume: number,
  marginRate: MarginTier
) {
  return calculatePositionMetrics({
    side,
    matchedPrice,
    matchedVolume: volume,
    marginRate,
    currentPrice: exitPrice,
  });
}
