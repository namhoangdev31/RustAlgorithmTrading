export type Direction = "LONG" | "SHORT";

export type R5Action = "KEEP" | "CANCEL" | "FLIP_HINT" | "PRE_OPEN" | "NO_SIGNAL";

export type PlanStatus = "PENDING" | "ACTIVE_TODAY" | "STALE" | "UPCOMING" | "FILLED" | "SETTLED";

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

export interface TradingPlan {
  id: string;
  date: string; // YYYY-MM-DD
  engine: "simcarrry6" | "AllDaysLadder_CAP0.3" | "12K_AllDay" | string;
  profile?: string;
  horizon: "t" | "t+1" | "t+2";
  side: Direction;
  entryPrice: number;
  tpPrice: number;
  slPrice: number;
  maxCap: number;
  r5State: R5Action;
  status: PlanStatus;
  isCanonical: boolean;
  breakevenTrigger?: number; // Khóa hòa vốn khi giá đi đúng >= X điểm
  expectedHigh?: number;
  expectedLow?: number;
  resolvedSource?: string;
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
  status: "WAIT_ENTRY" | "FILLED" | "TP_EXIT" | "EXIT_SL" | "ATC_EXIT";
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
