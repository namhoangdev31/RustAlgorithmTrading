import os
import random
from datetime import datetime, timezone
from typing import Optional, Dict, Any

import numpy as np
from loguru import logger
from pydantic import BaseModel, Field


class ReproducibilityRecord(BaseModel):
    repro_check_id: str
    run_set_id: str
    seed_profile_id: str
    rerun_profile: str
    status: str
    owner: str
    drift_value: float
    threshold_value: float
    decision_reason: str
    evidence_ids: list[str]
    risk_impact_flag: bool
    next_action: str
    eta: str
    exception_reason: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ReproducibilityManager:
    """Manager for deterministic reruns and reproducibility drift control."""

    def __init__(self, drift_threshold: float = 0.01, owner: str = "tester"):
        self.drift_threshold = drift_threshold
        self.owner = owner
        self.active_seeds: Dict[str, int] = {}

    def apply_seed_profile(self, profile_id: str, seed: Optional[int] = None) -> int:
        """Apply seed profile across python/numpy random generators."""
        if seed is None:
            seed = int.from_bytes(os.urandom(4), "big")

        self.active_seeds[profile_id] = seed
        random.seed(seed)
        np.random.seed(seed)
        logger.info(f"applied seed profile {profile_id}: {seed} (REPRO-GATED)")
        return seed

    def has_seed_profile(self, profile_id: str) -> bool:
        return profile_id in self.active_seeds

    def calculate_drift(self, original_results: Dict[str, Any], rerun_results: Dict[str, Any]) -> float:
        """Calculate mean relative drift over numeric metrics only."""
        total_drift = 0.0
        count = 0
        for key, original in original_results.items():
            rerun = rerun_results.get(key)
            if not isinstance(original, (int, float)) or not isinstance(rerun, (int, float)):
                continue
            if original != 0:
                total_drift += abs((rerun - original) / original)
            elif rerun != 0:
                total_drift += 1.0
            count += 1
        return total_drift / count if count > 0 else 0.0

    def validate_rerun(self, profile_id: str, drift: float) -> str:
        """Validate rerun against drift threshold."""
        if not self.has_seed_profile(profile_id):
            return "DEFER"
        if drift > self.drift_threshold:
            logger.warning(f"drift limit exceeded for {profile_id}: {drift:.6f} > {self.drift_threshold}")
            return "BLOCKED"
        return "PASS"

    def build_record(
        self,
        run_set_id: str,
        seed_profile_id: str,
        rerun_profile: str,
        drift_value: float,
        evidence_ids: list[str],
        status: str,
        decision_reason: str,
        next_action: str = "RERUN",
        eta: str = "IMMEDIATE",
        exception_reason: Optional[str] = None,
    ) -> ReproducibilityRecord:
        if exception_reason and not evidence_ids:
            status = "BLOCKED"
            decision_reason = "Exception without evidence is blocked by policy"

        return ReproducibilityRecord(
            repro_check_id=f"RPR-{run_set_id}-{datetime.now(timezone.utc).timestamp()}",
            run_set_id=run_set_id,
            seed_profile_id=seed_profile_id,
            rerun_profile=rerun_profile,
            status=status,
            owner=self.owner,
            drift_value=drift_value,
            threshold_value=self.drift_threshold,
            decision_reason=decision_reason,
            evidence_ids=evidence_ids,
            risk_impact_flag=status in ("FAIL", "BLOCKED"),
            next_action=next_action,
            eta=eta,
            exception_reason=exception_reason,
            metadata={
                "deterministic": rerun_profile.upper().startswith("DETERMINISTIC"),
            },
        )
