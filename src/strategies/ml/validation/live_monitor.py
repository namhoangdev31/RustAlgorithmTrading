"""
Live Governance Monitor

Tracks real-time drift between live trading and OOS/baseline performance.
Enforces the 1% drift threshold during active execution.
"""

import time
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from loguru import logger
from .drift_detector import DriftDetector

class LiveGovernanceMonitor:
    """
    Monitors a running strategy for performance drift and risk violations.
    """
    
    def __init__(self, strategy_id: str, baseline_metrics: Dict[str, Any], drift_tolerance: float = 0.01):
        self.strategy_id = strategy_id
        self.baseline = baseline_metrics
        self.detector = DriftDetector(tolerance=drift_tolerance)
        self.live_returns: List[float] = []
        self.window_size = 50  # Rolling window for drift calculation
        self.last_check = datetime.utcnow()
        self.drift_history: List[Dict] = []
        
        logger.info(f"Initialized Live Monitor for {strategy_id} | Tolerance: {drift_tolerance:.2%}")

    def record_trade(self, return_pct: float, metadata: Optional[Dict] = None):
        """Records a completed trade's return and checks for drift."""
        self.live_returns.append(return_pct)
        if len(self.live_returns) > self.window_size:
            self.live_returns.pop(0)
            
        self._check_drift(metadata)

    def _check_drift(self, metadata: Optional[Dict] = None):
        """Calculates current drift vs baseline and alerts if needed."""
        if len(self.live_returns) < 5:  # Need minimum data
            return

        current_avg_return = sum(self.live_returns) / len(self.live_returns)
        baseline_avg_return = self.baseline.get('avg_return', 0.0)
        
        drift = current_avg_return - baseline_avg_return
        abs_drift = abs(drift)
        
        status = "OK"
        if abs_drift > self.detector.tolerance:
            status = "CRITICAL_DRIFT"
            logger.warning(
                f"[LIVE_GOVERNANCE] ALERT: Significant drift detected for {self.strategy_id}! "
                f"Drift: {abs_drift:.4f} > {self.detector.tolerance:.4f} | "
                f"Current: {current_avg_return:.4f}, Baseline: {baseline_avg_return:.4f}"
            )
            # In a real system, this could trigger a kill-switch or notify a dashboard
        
        record = {
            'timestamp': datetime.utcnow().isoformat(),
            'drift': drift,
            'abs_drift': abs_drift,
            'status': status,
            'metadata': metadata or {}
        }
        self.drift_history.append(record)

    def get_status(self) -> Dict[str, Any]:
        """Returns the current status of the monitor."""
        if not self.drift_history:
            return {'status': 'PENDING', 'message': 'Insufficient data'}
            
        latest = self.drift_history[-1]
        return {
            'strategy_id': self.strategy_id,
            'current_status': latest['status'],
            'last_drift': latest['drift'],
            'data_points': len(self.live_returns),
            'timestamp': latest['timestamp']
        }

    def export_governance_report(self, path: str):
        """Exports the drift history to a JSON report."""
        import json
        os.makedirs(os.path.dirname(path), exist_ok=True)
        report = {
            'strategy_id': self.strategy_id,
            'baseline': self.baseline,
            'drift_history': self.drift_history,
            'exported_at': datetime.utcnow().isoformat()
        }
        with open(path, 'w') as f:
            json.dump(report, f, indent=2)
        logger.info(f"Governance report exported to {path}")
