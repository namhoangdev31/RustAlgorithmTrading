export type Direction = "LONG" | "SHORT";

export type R5Action = "KEEP" | "CANCEL" | "FLIP_HINT" | "PRE_OPEN" | "NO_SIGNAL";

export type PlanStatus = "PENDING" | "ACTIVE_TODAY" | "STALE" | "UPCOMING" | "FILLED" | "SETTLED" | "FILLED_SL" | "FILLED_TP" | "FILLED_ATC" | "FILLED_TRAIL" | string;

/**
 * Pha giao dịch trong ngày theo lịch phái sinh VN30F1M (UTC+7):
 * - PRE_ATO: Trước 08:45 — Thị trường chưa mở, kèo dựa trên dữ liệu ngày trước.
 * - ATO_OBSERVATION: 08:45 – 09:15 — Quan sát phiên ATO, kèo chưa chính thức.
 * - CONTINUOUS: 09:15 – 11:30 / 13:00 – 14:30 — Phiên liên tục, kèo chính thức.
 * - LUNCH_BREAK: 11:30 – 13:00 — Nghỉ trưa.
 * - ATC: 14:30 – 14:45 — Phiên ATC đóng cửa.
 * - CLOSED: Sau 14:45 — Thị trường đóng cửa.
 */
export type TradingSessionPhase = "PRE_ATO" | "ATO_OBSERVATION" | "CONTINUOUS" | "LUNCH_BREAK" | "ATC" | "CLOSED";

export interface MarketSnapshot {
  open: number;
  high: number;
  low: number;
  current: number;
  volume: number;
  oi?: number | null;
  basis?: number | null;
  foreignBuy?: number | null;
  foreignSell?: number | null;
  foreignNet?: number | null;
  timestamp: string; // ISO 8601 string
  source: string;
}

export interface LadderStep {
  offsetPoints: number; // Bước lệch so với entryPrice (vd: 0, 1.0, 2.0)
  size: number;         // Khối lượng / tỷ trọng tại nấc này (vd: 0.1)
}

export interface LadderConfig {
  enabled: boolean;
  steps: LadderStep[];
}

export interface TradingPlan {
  id: string;
  date: string; // YYYY-MM-DD
  engine: "simcarrry6" | "AllDaysLadder_CAP0.3" | "12K_AllDay" | "CanonicalDirectionalBreakout" | string;
  profile?: string;
  horizon: "t" | "t+1" | "t+2";
  side: Direction;
  orderType?: "STOP" | "LIMIT";
  entryPrice: number;
  tpPrice: number;
  slPrice: number;
  maxCap: number;
  r5State: R5Action;
  status: PlanStatus;
  isCanonical: boolean;
  consensusWeight?: number; // Trọng số đồng thuận (mặc định 1.0). Engine chính = 2.0, engine phụ = 1.0
  v44Active?: boolean; // V44 Anti-Lookahead Gate: true = kèo bị chặn do kỳ vọng ngược hướng (loại khỏi consensus)
  v44Warning?: string; // Lý do V44 chặn (hiển thị cho trader)
  isOfficial?: boolean; // Kèo đã được khóa chính thức sau ATO 09:15 (false = observation/degraded)
  breakevenTrigger?: number; // Khóa hòa vốn khi giá đi đúng >= X điểm
  expectedHigh?: number;
  expectedLow?: number;
  resolvedSource?: string;
  reason?: string;
  sessionPhase?: TradingSessionPhase;
  ladderConfig?: LadderConfig;
  trailingConfig?: TrailingConfig;
  execution?: ExecutionState;
}

export interface ConsensusResult {
  direction: Direction | "NEUTRAL";
  strength: number; // 0.0 to 1.0
  longCount: number;
  shortCount: number;
  isUnanimous: boolean;
  excludedEngines: string[];
}

export interface ExecutionState {
  planId: string;
  isFilled: boolean;
  fillStages: number; // e.g. 1, 2, 3 nấc
  filledSize: number; // e.g. 0.1, 0.2, 0.3
  avgEntryPrice: number;
  livePnlPoints: number;
  status: "WAIT_ENTRY" | "FILLED" | "TP_EXIT" | "EXIT_SL" | "ATC_EXIT" | "TRAIL_EXIT" | "BE_EXIT";
  exitPrice?: number;
  exitTime?: string;
  settled: boolean;
}

export interface HistoricalPerformance {
  totalRows: number;
  executedTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number; // percentage
  totalPnlPoints: number;
  maxDrawdown: number;
  cancelCount: number;
}

export interface BacktestSummary {
  totalSessions: number;
  totalBars?: number;
  startDate?: string;
  endDate?: string;
  tradedCount: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  totalPnl: number;
  maxDrawdown: number;
}

export interface AdvisorConfig {
  summary?: BacktestSummary | null;
  brokerPlatforms?: string[];
  orderBeforeTime?: string;
  atcTime?: string;
}

export interface TrailingConfig {
  enabled: boolean;
  beTriggerPoints?: number;    // Khóa hòa vốn khi lãi >= X điểm (mặc định 6.0đ)
  trailTriggerPoints?: number; // Kích hoạt Trailing Stop khi lãi >= X điểm (mặc định 12.0đ)
  trailDistance?: number;      // Khoảng cách Trailing Stop bám đỉnh/đáy (mặc định 5.0đ)
}

export interface QuantStrategyConfig {
  atrEntryMultiplier?: number; // Hệ số mở rộng biên (mặc định 0.10)
  tpPoints?: number;           // Mức chốt lời kỳ vọng sóng lớn (mặc định 24.0)
  slPoints?: number;           // Mức cắt lỗ điểm tuyệt đối (mặc định 8.0)
  maxCap?: number;             // Tỷ trọng tối đa (mặc định 1.0)
  trailing?: TrailingConfig;   // Cấu hình Trailing Stop & Khóa hòa vốn
}

export interface LadderStrategyConfig {
  side?: Direction;            // Hướng lệnh (mặc định tự động nhận diện theo giá vs Ref)
  tpPoints?: number;           // Mức chốt lời ngắn hạn (mặc định 4.1)
  maxCap?: number;             // Khống chế tỷ trọng NAV (mặc định 0.3)
}

export interface SimCarryConfig {
  basisThreshold?: number;      // Ngưỡng Basis (mặc định -5.0)
  atrMultiplier?: number;       // Hệ số ATR (mặc định 0.15)
  tpPoints?: number;            // Mức chốt lời (mặc định 22.0)
  maxCap?: number;              // Tỷ trọng tối đa (mặc định 1.0)
  orderType?: "STOP" | "LIMIT"; // Loại lệnh (STOP cho breakout hoặc LIMIT cho đón hồi)
  trailing?: TrailingConfig;    // Cấu hình Trailing Stop & Khóa hòa vốn cho Swing
}

