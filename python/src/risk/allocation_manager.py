from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from uuid import uuid4
from models.governance import ControlRecord, ControlStatus, ControlType


class AllocationPolicy:
    """
    Policy defining allocation risk parameters.
    """

    def __init__(
        self,
        max_sizing_band: float = 0.10,
        max_drawdown_limit: float = 0.15,
        **kwargs,
    ):
        self.max_sizing_band = max_sizing_band
        self.max_drawdown_limit = max_drawdown_limit
        self.extra_config = kwargs


class AllocationManager:
    """
    Manager to enforce allocation rules and output ControlRecords.
    """

    def __init__(self, policy: Optional[AllocationPolicy] = None, owner: str = "ops"):
        self.policy = policy or AllocationPolicy()
        self.owner = owner

    def check_allocation(
        self,
        strategy_id: str,
        symbol: str,
        requested_quantity: float,
        price: float,
        volatility: float,
        regime: str,
        current_drawdown: float,
        total_equity: float,
    ) -> ControlRecord:
        requested_val = requested_quantity * price
        measured_val = requested_val / total_equity if total_equity > 0 else 0.0
        limit_val = self.policy.max_sizing_band

        drawdown_state = "HALT" if current_drawdown > self.policy.max_drawdown_limit else "NORMAL"

        # Sizing mode and volatility bucket determination
        sizing_mode = "PERCENT_EQUITY"
        volatility_bucket = "HIGH_VOL" if volatility > 0.02 else "LOW_VOL"

        metadata = {
            "sizing_mode": sizing_mode,
            "regime_class": regime,
            "volatility_bucket": volatility_bucket,
            "drawdown_state": drawdown_state,
        }

        # Rules evaluation
        if drawdown_state == "HALT":
            status = ControlStatus.BLOCKED
            breach_flag = True
            reason = f"Drawdown halt triggered: current drawdown {current_drawdown} exceeds limit {self.policy.max_drawdown_limit}"
        elif measured_val > limit_val:
            status = ControlStatus.REJECT
            breach_flag = True
            reason = (
                f"Requested allocation {measured_val:.4f} exceeds max sizing band {limit_val:.4f}"
            )
        else:
            status = ControlStatus.ALLOW
            breach_flag = False
            reason = "Allocation within policy limit"

        return ControlRecord(
            portfolio_check_id=f"PC-{uuid4().hex[:8].upper()}",
            timestamp=datetime.now(timezone.utc),
            strategy_set_id=strategy_id,
            control_type=ControlType.ALLOCATION,
            status=status,
            owner=self.owner,
            limit_value=limit_val,
            measured_value=measured_val,
            breach_flag=breach_flag,
            decision_reason=reason,
            reason_code="ALLOC_OK" if not breach_flag else "ALLOC_BREACH",
            evidence_ids=[f"EV-ALLOC-{uuid4().hex[:8].upper()}"],
            risk_impact_flag=breach_flag,
            next_action="BLOCK_ORDER" if breach_flag else "NONE",
            eta="IMMEDIATE",
            metadata=metadata,
        )
