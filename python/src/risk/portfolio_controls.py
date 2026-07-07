from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from uuid import uuid4
from models.governance import ControlRecord, ControlStatus, ControlType


class PortfolioPolicy:
    """
    Policy defining portfolio limits including exposure and concentration bounds.
    """

    def __init__(
        self,
        max_exposure_per_symbol_pct: float = 0.10,
        max_concentration_top_10_pct: float = 0.20,
        **kwargs,
    ):
        self.max_exposure_per_symbol_pct = max_exposure_per_symbol_pct
        self.max_concentration_top_10_pct = max_concentration_top_10_pct
        self.extra_config = kwargs


class RiskControlManager:
    """
    Manager to enforce portfolio controls (exposure and concentration checks).
    """

    def __init__(self, policy: Optional[PortfolioPolicy] = None, owner: str = "ops"):
        self.policy = policy or PortfolioPolicy()
        self.owner = owner

    def check_exposure(
        self,
        strategy_id: str,
        symbol: str,
        quantity: float,
        price: float,
        total_equity: float,
        current_positions: Dict[str, float],
    ) -> ControlRecord:
        new_value = quantity * price
        current_val = current_positions.get(symbol, 0.0)
        total_val = new_value + current_val

        measured_val = total_val / total_equity if total_equity > 0 else 0.0
        limit_val = self.policy.max_exposure_per_symbol_pct

        breach_flag = measured_val > limit_val
        status = ControlStatus.REJECT if breach_flag else ControlStatus.ALLOW
        reason = (
            f"Exposure to {symbol} ({measured_val:.4f}) exceeds limit ({limit_val:.4f})"
            if breach_flag
            else "Exposure within limit"
        )

        return ControlRecord(
            portfolio_check_id=f"PC-EXP-{uuid4().hex[:8].upper()}",
            timestamp=datetime.now(timezone.utc),
            strategy_set_id=strategy_id,
            control_type=ControlType.EXPOSURE,
            status=status,
            owner=self.owner,
            limit_value=limit_val,
            measured_value=measured_val,
            breach_flag=breach_flag,
            decision_reason=reason,
            reason_code="EXPOSURE_REJECT" if breach_flag else "EXPOSURE_ALLOW",
            evidence_ids=["EV-W14-201"],
            risk_impact_flag=breach_flag,
            next_action="BLOCK_ORDER" if breach_flag else "NONE",
            eta="IMMEDIATE",
            metadata={},
        )

    def check_concentration(
        self,
        strategy_id: str,
        positions: Dict[str, float],
        total_equity: float,
    ) -> ControlRecord:
        # Sum top 10 positions
        sorted_pos = sorted(positions.values(), reverse=True)
        top_10_sum = sum(sorted_pos[:10])

        measured_val = top_10_sum / total_equity if total_equity > 0 else 0.0
        limit_val = self.policy.max_concentration_top_10_pct

        breach_flag = measured_val > limit_val
        status = ControlStatus.REJECT if breach_flag else ControlStatus.ALLOW
        reason = (
            f"Top 10 concentration ({measured_val:.4f}) exceeds limit ({limit_val:.4f})"
            if breach_flag
            else "Top 10 concentration within limit"
        )

        return ControlRecord(
            portfolio_check_id=f"PC-CONC-{uuid4().hex[:8].upper()}",
            timestamp=datetime.now(timezone.utc),
            strategy_set_id=strategy_id,
            control_type=ControlType.CONCENTRATION,
            status=status,
            owner=self.owner,
            limit_value=limit_val,
            measured_value=measured_val,
            breach_flag=breach_flag,
            decision_reason=reason,
            reason_code="CONCENTRATION_REJECT" if breach_flag else "CONCENTRATION_ALLOW",
            evidence_ids=["EV-W14-202"],
            risk_impact_flag=breach_flag,
            next_action="BLOCK_PORTFOLIO" if breach_flag else "NONE",
            eta="IMMEDIATE",
            metadata={},
        )
