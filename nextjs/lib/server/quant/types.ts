export type Direction = "LONG" | "SHORT";

export type R5Action = "KEEP" | "CANCEL" | "FLIP_HINT" | "PRE_OPEN" | "NO_SIGNAL";

export type PlanStatus = "PENDING" | "ACTIVE_TODAY" | "STALE" | "UPCOMING" | "FILLED" | "SETTLED" | "FILLED_SL" | "FILLED_TP" | "FILLED_ATC" | "FILLED_TRAIL" | string;

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
  timestamp: string; 
  source: string;
}

export interface LadderStep {
  offsetPoints: number; 
  size: number;         
}

export interface LadderConfig {
  enabled: boolean;
  steps: LadderStep[];
}

export interface TradingPlan {
  id: string;
  date: string; 
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
  consensusWeight?: number; 
  v44Active?: boolean; 
  v44Warning?: string; 
  isOfficial?: boolean; 
  breakevenTrigger?: number; 
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
  strength: number; 
  longCount: number;
  shortCount: number;
  isUnanimous: boolean;
  excludedEngines: string[];
}

export interface ExecutionState {
  planId: string;
  isFilled: boolean;
  fillStages: number; 
  filledSize: number; 
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
  winRate: number; 
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
  beTriggerPoints?: number;    
  trailTriggerPoints?: number; 
  trailDistance?: number;      
}

export interface QuantStrategyConfig {
  atrEntryMultiplier?: number; 
  tpPoints?: number;           
  slPoints?: number;           
  maxCap?: number;             
  trailing?: TrailingConfig;   
}

export interface LadderStrategyConfig {
  side?: Direction;            
  tpPoints?: number;           
  maxCap?: number;             
}

export interface SimCarryConfig {
  basisThreshold?: number;      
  atrMultiplier?: number;       
  tpPoints?: number;            
  maxCap?: number;              
  orderType?: "STOP" | "LIMIT"; 
  trailing?: TrailingConfig;    
}

