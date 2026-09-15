import { Direction, R5Action } from "./types";

export function evaluateR5(
  side: Direction,
  openPrice: number,
  refPrice: number,
  slPrice: number,
  m15Volume?: number,
  avgM15Volume?: number
): { action: R5Action; reason: string } {
  const gap = openPrice - refPrice;

  if (side === "LONG") {
    
    if (gap < -6.0 || openPrice <= slPrice + 2.0) {
      return {
        action: "CANCEL",
        reason: `Mở cửa ATO thủng sâu (Gap: ${gap.toFixed(1)}đ, sát SL: ${slPrice.toFixed(1)}đ) -> Hủy lệnh, đứng ngoài.`,
      };
    }

    if (gap < -4.0 && m15Volume && avgM15Volume && m15Volume > 1.5 * avgM15Volume) {
      return {
        action: "FLIP_HINT",
        reason: `Mở cửa đè bán mạnh kèm Volume x1.5 -> Gợi ý đảo Short với 50% size.`,
      };
    }

    return {
      action: "KEEP",
      reason: `Mở cửa bình thường quanh vùng kỳ vọng -> Giữ nguyên kế hoạch LONG.`,
    };
  } else {
    
    if (gap > 6.0 || openPrice >= slPrice - 2.0) {
      return {
        action: "CANCEL",
        reason: `Mở cửa ATO Gap up quá lớn (Gap: +${gap.toFixed(1)}đ) -> Hủy lệnh SHORT.`,
      };
    }

    if (gap > 4.0 && m15Volume && avgM15Volume && m15Volume > 1.5 * avgM15Volume) {
      return {
        action: "FLIP_HINT",
        reason: `Lực cầu đánh thốc vượt cản -> Gợi ý đảo Long với 50% size.`,
      };
    }

    return {
      action: "KEEP",
      reason: `Mở cửa bình thường -> Giữ nguyên kế hoạch SHORT.`,
    };
  }
}

export function evaluateV44(
  side: Direction,
  refPrice: number,
  expectedHigh?: number,
  expectedLow?: number
): { isV44Active: boolean; warning?: string } {
  if (side === "LONG" && expectedHigh !== undefined) {
    if (expectedHigh < refPrice) {
      return {
        isV44Active: true,
        warning: `V44 ACTIVE: Kỳ vọng cao nhất (${expectedHigh.toFixed(1)}) nằm dưới tham chiếu (${refPrice.toFixed(1)}). Nguy cơ thua lỗ bền vững -> Không mua đuổi, không nhồi lệnh.`,
      };
    }
  }

  if (side === "SHORT" && expectedLow !== undefined) {
    if (expectedLow > refPrice) {
      return {
        isV44Active: true,
        warning: `V44 ACTIVE: Kỳ vọng thấp nhất (${expectedLow.toFixed(1)}) nằm trên tham chiếu (${refPrice.toFixed(1)}). Nguy cơ bật đáy -> Không bán đuổi.`,
      };
    }
  }

  return { isV44Active: false };
}

export function resolveCutloss(
  side: Direction,
  swingLow5d: number,
  previousFailureCutloss?: number,
  swingHigh5d?: number
): number {
  if (side === "LONG") {
    if (previousFailureCutloss && previousFailureCutloss > 0) {
      return Math.min(swingLow5d, previousFailureCutloss);
    }
    return swingLow5d;
  } else {
    
    const baseHigh = swingHigh5d ?? swingLow5d;
    if (previousFailureCutloss && previousFailureCutloss > 0) {
      return Math.max(baseHigh, previousFailureCutloss);
    }
    return baseHigh;
  }
}
