import { ConsensusResult, Direction, TradingPlan } from "./types";

export function computeConsensus(plans: TradingPlan[]): ConsensusResult {
  const activePlans = plans.filter(
    (p) => p.status === "ACTIVE_TODAY" && p.r5State !== "CANCEL"
  );

  const eligiblePlans: TradingPlan[] = [];
  const excludedEngines: string[] = [];

  for (const plan of activePlans) {
    
    if (plan.resolvedSource === "PLAN_INVALID") {
      excludedEngines.push(plan.engine);
    } else if (plan.v44Active) {
      
      excludedEngines.push(plan.engine);
    } else {
      eligiblePlans.push(plan);
    }
  }

  if (eligiblePlans.length === 0) {
    return {
      direction: "NEUTRAL",
      strength: 0,
      longCount: 0,
      shortCount: 0,
      isUnanimous: false,
      excludedEngines,
    };
  }

  let longWeight = 0;
  let shortWeight = 0;
  let longCount = 0;
  let shortCount = 0;

  for (const p of eligiblePlans) {
    const w = p.consensusWeight ?? 1.0;
    if (p.side === "LONG") {
      longCount++;
      longWeight += w;
    }
    if (p.side === "SHORT") {
      shortCount++;
      shortWeight += w;
    }
  }

  const totalWeight = longWeight + shortWeight;
  let direction: Direction | "NEUTRAL" = "NEUTRAL";
  let strength = 0;

  if (longWeight > shortWeight) {
    direction = "LONG";
    strength = Number((longWeight / totalWeight).toFixed(2));
  } else if (shortWeight > longWeight) {
    direction = "SHORT";
    strength = Number((shortWeight / totalWeight).toFixed(2));
  } else {
    direction = "NEUTRAL";
    strength = 0; 
  }

  const isUnanimous = longCount === eligiblePlans.length || shortCount === eligiblePlans.length;

  return {
    direction,
    strength,
    longCount,
    shortCount,
    isUnanimous,
    excludedEngines,
  };
}

