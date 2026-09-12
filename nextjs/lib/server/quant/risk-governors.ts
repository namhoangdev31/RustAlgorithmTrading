import { Direction, R5Action } from "./types";

/**
 * Bộ lọc R5 (R5 Corrective Overlay):
 * Ưu tiên: CANCEL > FLIP_HINT > KEEP
 */
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
    // 1. Điều kiện CANCEL: ATO Gap down quá sâu hoặc mở cửa chạm ngưỡng cắt lỗ
    if (gap < -6.0 || openPrice <= slPrice + 2.0) {
      return {
        action: "CANCEL",
        reason: `Mở cửa ATO thủng sâu (Gap: ${gap.toFixed(1)}đ, sát SL: ${slPrice.toFixed(1)}đ) -> Hủy lệnh, đứng ngoài.`,
      };
    }

    // 2. Điều kiện FLIP_HINT: Gãy hỗ trợ với Volume đột biến
    if (gap < -4.0 && m15Volume && avgM15Volume && m15Volume > 1.5 * avgM15Volume) {
      return {
        action: "FLIP_HINT",
        reason: `Mở cửa đè bán mạnh kèm Volume x1.5 -> Gợi ý đảo Short với 50% size.`,
      };
    }

    // 3. Điều kiện KEEP: Giá mở cửa an toàn
    return {
      action: "KEEP",
      reason: `Mở cửa bình thường quanh vùng kỳ vọng -> Giữ nguyên kế hoạch LONG.`,
    };
  } else {
    // SHORT
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

/**
 * Quy tắc V44 (Anti-Lookahead & Divergence Gate):
 * LONG mà Expected-High < Ref -> CHẶN
 * SHORT mà Expected-Low > Ref -> CHẶN
 */
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

/**
 * Cơ chế LATEST_SHORT_CUTLOSS_REVERSAL / Cutloss Resolver
 */
export function resolveCutloss(
  side: Direction,
  swingLow5d: number,
  previousFailureCutloss?: number
): number {
  if (side === "LONG") {
    if (previousFailureCutloss && previousFailureCutloss > 0) {
      return Math.min(swingLow5d, previousFailureCutloss);
    }
    return swingLow5d;
  } else {
    return swingLow5d;
  }
}
