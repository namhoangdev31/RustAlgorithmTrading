from typing import Dict
from datetime import datetime
from ..models.governance import ControlRecord, ControlStatus, ControlType

class PortfolioPolicy:
    """ Chứa các ngưỡng limit cho danh mục. """
    def __init__(self, 
                 max_exposure_per_symbol_pct: float = 0.05,
                 max_exposure_per_sector_pct: float = 0.20,
                 max_concentration_top_10_pct: float = 0.40):
        self.max_exposure_per_symbol_pct = max_exposure_per_symbol_pct
        self.max_exposure_per_sector_pct = max_exposure_per_sector_pct
        self.max_concentration_top_10_pct = max_concentration_top_10_pct

class RiskControlManager:
    """ Enforce portfolio controls with structured traceability. """
    def __init__(self, policy: PortfolioPolicy, owner: str = "risk_manager"):
        self.policy = policy
        self.owner = owner

    def check_exposure(self, 
                       strategy_id: str,
                       symbol: str, 
                       quantity: float, 
                       price: float, 
                       total_equity: float,
                       current_positions: Dict[str, float]) -> ControlRecord:
        """ Kiểm tra giới hạn exposure và trả về ControlRecord. """
        notional = abs(quantity * price)
        measured_pct = notional / total_equity if total_equity > 0 else 0
        limit_pct = self.policy.max_exposure_per_symbol_pct
        
        is_breach = measured_pct > limit_pct
        status = ControlStatus.REJECT if is_breach else ControlStatus.ALLOW
        
        return ControlRecord(
            portfolio_check_id=f"EXP-{strategy_id}-{symbol}-{datetime.utcnow().timestamp()}",
            strategy_set_id=strategy_id,
            control_type=ControlType.EXPOSURE,
            status=status,
            owner=self.owner,
            limit_value=limit_pct,
            measured_value=measured_pct,
            breach_flag=is_breach,
            decision_reason=f"Exposure for {symbol} is {measured_pct:.2%} (Limit: {limit_pct:.2%})",
            evidence_ids=["EV-W14-201"],
            risk_impact_flag=is_breach,
            next_action="BLOCK_ORDER" if is_breach else "PROCEED",
            eta="IMMEDIATE",
            metadata={
                "symbol": symbol,
                "quantity": quantity,
                "price": price,
                "notional": notional,
                "current_positions": current_positions,
            }
        )

    def check_concentration(self, 
                            strategy_id: str,
                            positions: Dict[str, float], 
                            total_equity: float) -> ControlRecord:
        """ Kiểm tra độ tập trung của danh mục. """
        if not positions:
            return self._allow_record(strategy_id, ControlType.CONCENTRATION, "Empty positions")
            
        values = sorted([abs(v) for v in positions.values()], reverse=True)
        # Check Top 1 concentration as proxy for simplicity
        top_1_val = values[0] if values else 0
        measured_pct = top_1_val / total_equity if total_equity > 0 else 0
        limit_pct = self.policy.max_concentration_top_10_pct
        
        is_breach = measured_pct > limit_pct
        status = ControlStatus.REJECT if is_breach else ControlStatus.ALLOW
        
        return ControlRecord(
            portfolio_check_id=f"CON-{strategy_id}-{datetime.utcnow().timestamp()}",
            strategy_set_id=strategy_id,
            control_type=ControlType.CONCENTRATION,
            status=status,
            owner=self.owner,
            limit_value=limit_pct,
            measured_value=measured_pct,
            breach_flag=is_breach,
            decision_reason=f"Top concentration is {measured_pct:.2%} (Limit: {limit_pct:.2%})",
            evidence_ids=["EV-W14-202"],
            risk_impact_flag=is_breach,
            next_action="BLOCK_PORTFOLIO" if is_breach else "PROCEED",
            eta="IMMEDIATE",
            metadata={
                "position_count": len(positions),
                "top_1_value": top_1_val,
                "total_equity": total_equity,
            }
        )

    def _allow_record(self, strategy_id: str, ctrl_type: ControlType, reason: str) -> ControlRecord:
        evidence_id = "EV-W14-201" if ctrl_type == ControlType.EXPOSURE else "EV-W14-202"
        return ControlRecord(
            portfolio_check_id=f"{ctrl_type.value[:3]}-{strategy_id}-{datetime.utcnow().timestamp()}",
            strategy_set_id=strategy_id,
            control_type=ctrl_type,
            status=ControlStatus.ALLOW,
            owner=self.owner,
            limit_value=0,
            measured_value=0,
            breach_flag=False,
            decision_reason=reason,
            evidence_ids=[evidence_id],
            risk_impact_flag=False,
            next_action="PROCEED",
            eta="IMMEDIATE"
        )
