from typing import Optional, List, Dict, Any
from enum import Enum
from .staging_manager import StagingHardeningManager, StagingHardeningRecord

class ExposureTier(str, Enum):
    T1 = "T1" # Low exposure
    T2 = "T2" # Medium exposure
    T3 = "T3" # High exposure / Full canary

class BreachClass(str, Enum):
    LATENCY = "LATENCY"
    DRIFT = "DRIFT"
    ERROR_RATE = "ERROR_RATE"
    RISK_LIMIT = "RISK_LIMIT"

class CanaryDesignRecord(StagingHardeningRecord):
    exposure_tier: Optional[ExposureTier] = None
    breach_class: Optional[BreachClass] = None
    rollback_disposition: Optional[str] = "AUTO"

class CanaryDesignManager(StagingHardeningManager):
    """Manager for canary design verification and evidence capture."""

    def build_canary_record(
        self,
        run_id: str,
        scenario_id: str,
        disposition: str,
        reason_code: str,
        component: str,
        correlation_id: Optional[str] = None,
        evidence_ids: Optional[List[str]] = None,
        exposure_tier: Optional[ExposureTier] = None,
        breach_class: Optional[BreachClass] = None,
        rollback_disposition: str = "AUTO",
        latency_sec: Optional[float] = None,
        rollback_success: Optional[bool] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> CanaryDesignRecord:
        metadata = metadata or {}
        
        # Enforce canary-specific policies
        if "CANARY" in scenario_id.upper() and exposure_tier is None:
            disposition = "BLOCKED"
            reason_code = "MISSING_EXPOSURE_TIER"
            
        if "BREACH" in scenario_id.upper() and breach_class is None:
            disposition = "BLOCKED"
            reason_code = "MISSING_BREACH_CLASS"

        # Use the base class logic for core fields
        base_record = self.build_record(
            run_id=run_id,
            scenario_id=scenario_id,
            disposition=disposition,
            reason_code=reason_code,
            component=component,
            correlation_id=correlation_id,
            evidence_ids=evidence_ids,
            latency_sec=latency_sec,
            rollback_success=rollback_success,
            metadata=metadata
        )

        # Upgrade to CanaryDesignRecord
        canary_record = CanaryDesignRecord(
            **base_record.model_dump(),
            exposure_tier=exposure_tier,
            breach_class=breach_class,
            rollback_disposition=rollback_disposition
        )
        
        # Update the list (base class stores base records, we might want to keep it typed or sync)
        # For simplicity, we just replace the last record in self.records if needed, 
        # but build_record already added it. Let's fix the storage.
        self.records[-1] = canary_record
        
        return canary_record

    def get_canary_summary(self) -> Dict[str, Any]:
        """Aggregate canary-specific metrics."""
        base_summary = self.get_summary()
        canary_records = [r for r in self.records if isinstance(r, CanaryDesignRecord)]
        
        return {
            **base_summary,
            "canary_scenario_count": len([r for r in canary_records if "CANARY" in r.scenario_id.upper()]),
            "breach_handling_count": len([r for r in canary_records if "BREACH" in r.scenario_id.upper()]),
            "tier_distribution": {
                tier.value: len([r for r in canary_records if r.exposure_tier == tier])
                for tier in ExposureTier
            }
        }
