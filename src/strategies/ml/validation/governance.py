"""
Strategy Governance Framework

Enforces mandatory OOS/Walk-forward checklists and provides decision traceability
for strategy promotion/rejection.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum
from loguru import logger
import json
import os
import tomllib
from pathlib import Path

class GovernanceStatus(Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    BLOCKED = "BLOCKED"

@dataclass
class GovernanceEvidence:
    """Evidence required for strategy governance."""
    oos_results: Dict[str, Any] = field(default_factory=dict)
    walk_forward_results: Dict[str, Any] = field(default_factory=dict)
    drift_metrics: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)
    correlation_id: Optional[str] = None

@dataclass
class StrategyDecision:
    strategy_id: str
    verdict: GovernanceStatus
    rationale: str
    owner: str
    evidence_links: List[str]
    timestamp: datetime = field(default_factory=datetime.utcnow)
    block_reason: Optional[str] = None
    drift_value: float = 0.0
    risk_impact_flag: bool = False
    next_action: Optional[str] = None
    eta: Optional[str] = None

class StrategyGovernanceGate:
    def __init__(self, threshold_configs: Optional[Dict] = None, risk_config_path: Optional[str] = None):
        self.thresholds = threshold_configs or {
            'min_oos_sharpe': 1.5,
            'max_oos_drawdown': 0.15,
            'min_wf_consistency': 0.7,
            'max_drift_pct': 0.01
        }
        self.risk_limits = self._load_risk_limits(risk_config_path)

    def _load_risk_limits(self, path: Optional[str]) -> Dict[str, Any]:
        """Load risk limits from TOML file."""
        if not path:
            path = os.path.join(os.getcwd(), "config", "risk_limits.toml")
        
        if not os.path.exists(path):
            logger.warning(f"Risk config not found at {path}, using default empty limits.")
            return {}
            
        try:
            with open(path, "rb") as f:
                return tomllib.load(f)
        except Exception as e:
            logger.error(f"Failed to load risk limits from {path}: {e}")
            return {}

    def evaluate_strategy(self, strategy_id: str, evidence: GovernanceEvidence) -> StrategyDecision:
        issues = []

        if not evidence.oos_results:
            issues.append("MISSING_OOS_EVIDENCE")
        else:
            sharpe = evidence.oos_results.get('sharpe_ratio', 0)
            if sharpe < self.thresholds['min_oos_sharpe']:
                issues.append(f"INSUFFICIENT_OOS_SHARPE: {sharpe:.2f} < {self.thresholds['min_oos_sharpe']}")

        if not evidence.walk_forward_results:
            issues.append("MISSING_WF_EVIDENCE")
        else:
            consistency = evidence.walk_forward_results.get('consistency_score', 0)
            if consistency < self.thresholds['min_wf_consistency']:
                issues.append(f"INSUFFICIENT_WF_CONSISTENCY: {consistency:.2f} < {self.thresholds['min_wf_consistency']}")

        drift_value = float(evidence.drift_metrics.get("max_pct_drift", 0.0))
        if drift_value > self.thresholds["max_drift_pct"]:
            issues.append(f"EXCESSIVE_REPRODUCIBILITY_DRIFT: {drift_value:.4f} > {self.thresholds['max_drift_pct']:.4f}")

        risk_impact_flag = bool(evidence.drift_metrics.get("risk_impact_flag", False))
        
        # Real Risk Limit Checks
        if self.risk_limits:
            oos_drawdown = evidence.oos_results.get('max_drawdown', 0.0)
            allowed_drawdown = self.risk_limits.get('loss_limits', {}).get('drawdown_threshold_percent', 10.0) / 100.0
            
            if oos_drawdown > allowed_drawdown:
                issues.append(f"RISK_LIMIT_EXCEEDED_DRAWDOWN: {oos_drawdown:.2%} > {allowed_drawdown:.2%}")
                risk_impact_flag = True

            # Check stop loss consistency
            strategy_sl = evidence.oos_results.get('stop_loss_pct', 0.0)
            max_sl = self.risk_limits.get('stop_loss', {}).get('max_stop_loss_percent', 10.0) / 100.0
            if strategy_sl > max_sl:
                issues.append(f"RISK_LIMIT_EXCEEDED_STOPLOSS: {strategy_sl:.2%} > {max_sl:.2%}")
                risk_impact_flag = True

        if risk_impact_flag and "RISK_IMPACT_FLAGGED" not in issues:
            issues.append("RISK_IMPACT_FLAGGED")

        block_reason = ",".join(issues) if issues else None
        if issues:
            verdict = GovernanceStatus.BLOCKED
            rationale = f"Strategy blocked due to governance findings: {', '.join(issues)}"
            next_action = "Remediate missing evidence or improve model performance (OOS/WF)."
            eta = "T+2D"
        else:
            verdict = GovernanceStatus.APPROVED
            rationale = "Strategy passed all mandatory governance checks."
            next_action = "Promote to pre-production/paper-trading."
            eta = "T+1D"

        evidence_links = [
            "checklist:oos",
            "checklist:walk_forward",
            f"drift:max_pct={drift_value:.6f}",
        ]
        if evidence.correlation_id:
            evidence_links.append(f"correlation_id:{evidence.correlation_id}")

        return StrategyDecision(
            strategy_id=strategy_id,
            verdict=verdict,
            rationale=rationale,
            owner="SYSTEM_GOVERNANCE",
            evidence_links=evidence_links,
            block_reason=block_reason,
            drift_value=drift_value,
            risk_impact_flag=risk_impact_flag,
            next_action=next_action,
            eta=eta
        )

    def log_decision(self, decision: StrategyDecision, log_path: str):
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
        
        log_entry = {
            "timestamp": decision.timestamp.isoformat(),
            "strategy_id": decision.strategy_id,
            "verdict": decision.verdict.value,
            "rationale": decision.rationale,
            "owner": decision.owner,
            "evidence_links": decision.evidence_links,
            "block_reason": decision.block_reason,
            "drift_value": decision.drift_value,
            "risk_impact_flag": decision.risk_impact_flag,
            "next_action": decision.next_action,
            "eta": decision.eta
        }

        with open(log_path, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
