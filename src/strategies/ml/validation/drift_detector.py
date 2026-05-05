"""
Drift Detection Module

Provides tools to detect:
- Reproducibility drift: difference between two runs of the same strategy.
- Performance drift: difference between OOS and live performance.
"""

import numpy as np
from typing import Dict, Any, List


class DriftDetector:
    """
    Detects drift in strategy performance and execution.
    """

    def __init__(self, tolerance: float = 0.01):
        self.tolerance = tolerance

    def calculate_reproducibility_drift(
        self, run1_metrics: Dict[str, Any], run2_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compares two runs of the same strategy for drift.
        """
        drifts = {}
        for key in run1_metrics:
            if key in run2_metrics and isinstance(run1_metrics[key], (int, float)):
                diff = abs(run1_metrics[key] - run2_metrics[key])
                pct_diff = diff / max(abs(run1_metrics[key]), 1e-9)
                drifts[key] = {
                    "absolute_diff": diff,
                    "pct_diff": pct_diff,
                    "exceeds_tolerance": pct_diff > self.tolerance,
                }

        total_violations = sum(1 for d in drifts.values() if d["exceeds_tolerance"])

        return {
            "metrics_drift": drifts,
            "total_violations": total_violations,
            "status": "PASS" if total_violations == 0 else "FAIL",
        }

    def detect_performance_drift(
        self, baseline_metrics: Dict[str, Any], current_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Detects drift between a baseline (e.g., OOS) and current performance.
        """
        # Similar logic but potentially higher tolerance
        drifts = {}
        # Focus on key metrics like Sharpe, Drawdown
        keys_to_check = ["sharpe_ratio", "max_drawdown", "win_rate"]

        for key in keys_to_check:
            if key in baseline_metrics and key in current_metrics:
                b_val = baseline_metrics[key]
                c_val = current_metrics[key]
                pct_change = (c_val - b_val) / max(abs(b_val), 1e-9)
                drifts[key] = pct_change

        return drifts
