"""
Validation and Governance Utilities

Provides tools for verifying strategy governance, drift detection,
and automated validation reports.
"""

import os
import json
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime
from loguru import logger


def run_governance_verification(validator, model, X, y) -> Dict:
    """
    Runs a standardized governance verification for a strategy.

    Checks both Train/Test and Walk-Forward scenarios.

    Returns:
        Summary of results
    """
    logger.info(f"Starting governance verification for {model.name}")

    # 1. Train/Test scenario
    tt_results = validator.validate_model(model, X, y, method="train_test")
    tt_decision = tt_results.get("governance_decision", {})

    # 2. Walk-Forward scenario
    wf_results = validator.validate_model(model, X, y, method="walk_forward", n_splits=5)
    wf_decision = wf_results.get("governance_decision", {})

    summary = {
        "strategy_id": model.name,
        "timestamp": datetime.utcnow().isoformat(),
        "train_test_verdict": tt_decision.get("verdict"),
        "walk_forward_verdict": wf_decision.get("verdict"),
        "max_drift": wf_decision.get("drift_value", 0.0),
        "risk_impact": wf_decision.get("risk_impact_flag", False),
        "is_compliant": wf_decision.get("verdict") == "APPROVED",
    }

    return summary


def generate_governance_watermark(summary: Dict) -> str:
    """Generates a verifiable watermark for a governance report."""
    watermark_data = {
        "v": "1.0",
        "sid": summary["strategy_id"],
        "ts": summary["timestamp"],
        "cmp": summary["is_compliant"],
    }
    # Simple hash-like representation (in production this would be a signature)
    import hashlib

    marker = hashlib.sha256(json.dumps(watermark_data, sort_keys=True).encode()).hexdigest()[:12]
    return f"W13-WATERMARK-{marker.upper()}"
