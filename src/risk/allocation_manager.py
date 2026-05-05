from typing import Dict, List, Optional, Any
from datetime import datetime
from loguru import logger
from enum import Enum
from pydantic import BaseModel
from models.governance import ControlRecord, ControlStatus, ControlType

class AllocationSizingMode(Enum):
    VOLATILITY = "VOLATILITY"
    REGIME = "REGIME"
    DRAWDOWN = "DRAWDOWN"

class AssetRegime(Enum):
    BULL = "BULL"
    BEAR = "BEAR"
    SIDEWAYS = "SIDEWAYS"
    HIGH_VOL = "HIGH_VOL"

class AllocationPolicy(BaseModel):
    """ Policy thresholds for capital allocation. """
    max_sizing_band: float = 0.10  # Max 10% per trade
    min_sizing_band: float = 0.01  # Min 1% per trade
    
    # Sizing multipliers based on regime
    regime_multipliers: Dict[str, float] = {
        "BULL": 1.2,
        "BEAR": 0.8,
        "SIDEWAYS": 1.0,
        "HIGH_VOL": 0.5
    }
    
    # Drawdown thresholds
    max_drawdown_limit: float = 0.15 # 15% Max DD
    drawdown_reduction_factor: float = 0.5 # Half sizing if in DD

class AllocationManager:
    """ 
    Enforce Lane 1 (Volatility), Lane 2 (Regime), and Lane 3 (Drawdown) allocation controls. 
    """
    def __init__(self, policy: AllocationPolicy, owner: str = "allocation_manager"):
        self.policy = policy
        self.owner = owner

    def check_allocation(self,
                         strategy_id: str,
                         symbol: str,
                         requested_quantity: float,
                         price: float,
                         volatility: float,
                         regime: str,
                         current_drawdown: float,
                         total_equity: float) -> ControlRecord:
        """
        Main gate for W15 Capital Allocation checks.
        """
        sizing_mode = "VOLATILITY" # Default
        
        # 1. Calc base sizing based on volatility (Inverse volatility sizing)
        # Simplified proxy for W15: higher vol = lower sizing
        vol_multiplier = 1.0 / (volatility * 10) if volatility > 0 else 1.0
        
        # 2. Adjust for regime
        regime_mult = self.policy.regime_multipliers.get(regime, 1.0)
        
        # 3. Adjust for drawdown adherence
        dd_mult = 1.0
        drawdown_state = "NORMAL"
        if current_drawdown > self.policy.max_drawdown_limit / 2:
            dd_mult = self.policy.drawdown_reduction_factor
            drawdown_state = "WARNING"
        if current_drawdown > self.policy.max_drawdown_limit:
            dd_mult = 0.0
            drawdown_state = "HALT"
            
        final_multiplier = vol_multiplier * regime_mult * dd_mult
        
        # Limit sizing to policy bands
        notional = abs(requested_quantity * price)
        limit_value = total_equity * self.policy.max_sizing_band * final_multiplier
        measured_value = notional
        
        is_breach = measured_value > limit_value or drawdown_state == "HALT"
        status = ControlStatus.REJECT if is_breach else ControlStatus.ALLOW
        if drawdown_state == "HALT":
            status = ControlStatus.BLOCKED
            
        decision_reason = (
            f"Allocation: {measured_value:.2f} (Limit: {limit_value:.2f}) | "
            f"Regime: {regime} | Vol: {volatility:.4f} | DD: {current_drawdown:.2%}"
        )

        return ControlRecord(
            portfolio_check_id=f"ALC-{strategy_id}-{symbol}-{datetime.utcnow().timestamp()}",
            strategy_set_id=strategy_id,
            control_type=ControlType.ALLOCATION,
            status=status,
            owner=self.owner,
            limit_value=limit_value,
            measured_value=measured_value,
            breach_flag=is_breach,
            decision_reason=decision_reason,
            evidence_ids=["EV-W15-201", "EV-W15-202", "EV-W15-205"],
            risk_impact_flag=is_breach,
            next_action="ADJUST_QUANTITY" if is_breach else "PROCEED",
            eta="IMMEDIATE",
            metadata={
                "sizing_mode": sizing_mode,
                "regime_class": regime,
                "volatility_bucket": "HIGH" if volatility > 0.02 else "LOW",
                "drawdown_state": drawdown_state,
                "volatility": volatility,
                "drawdown": current_drawdown,
                "requested_notional": notional
            }
        )
