from typing import Optional, List, Dict, Any
from enum import Enum
from .staging_manager import StagingHardeningManager, StagingHardeningRecord


class ExposureTier(str, Enum):
    T1 = "T1"  # Low exposure
    T2 = "T2"  # Medium exposure
    T3 = "T3"  # High exposure / Full canary


class BreachClass(str, Enum):
    LATENCY = "LATENCY"
    DRIFT = "DRIFT"
    ERROR_RATE = "ERROR_RATE"
    RISK_LIMIT = "RISK_LIMIT"


class CanaryDesignRecord(StagingHardeningRecord):
    canary_tier: Optional[str] = None
    exposure_tier: Optional[ExposureTier] = None
    risk_boundary: Optional[str] = None
    breach_class: Optional[BreachClass] = None
    rollback_required: bool = False
    rollback_result: Optional[str] = None
    rollback_disposition: Optional[str] = "AUTO"
    kill_switch_latency_ms: Optional[int] = None


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
        canary_tier: Optional[str] = None,
        exposure_tier: Optional[ExposureTier] = None,
        risk_boundary: Optional[str] = None,
        breach_class: Optional[BreachClass] = None,
        rollback_required: bool = False,
        rollback_result: Optional[str] = None,
        rollback_disposition: str = "AUTO",
        kill_switch_latency_ms: Optional[int] = None,
        latency_sec: Optional[float] = None,
        rollback_success: Optional[bool] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> CanaryDesignRecord:
        metadata = metadata or {}
        effective_tier = canary_tier or (exposure_tier.value if exposure_tier else None)

        # Support both latency fields, keeping canonical W18 field in record.
        effective_latency_ms = kill_switch_latency_ms
        if effective_latency_ms is None and latency_sec is not None:
            effective_latency_ms = int(round(latency_sec * 1000))
        effective_latency_sec = latency_sec
        if effective_latency_sec is None and effective_latency_ms is not None:
            effective_latency_sec = effective_latency_ms / 1000.0

        # Enforce canary-specific policies
        scenario_key = scenario_id.upper()
        if "CANARY" in scenario_key and effective_tier is None:
            disposition = "BLOCKED"
            reason_code = "MISSING_EXPOSURE_TIER"

        if rollback_required and not rollback_result:
            disposition = "BLOCKED"
            reason_code = "MISSING_ROLLBACK_RESULT"

        if "BREACH" in scenario_key:
            if breach_class is None:
                disposition = "BLOCKED"
                reason_code = "MISSING_BREACH_CLASS"
            if effective_latency_ms is None:
                disposition = "BLOCKED"
                reason_code = "MISSING_KILL_SWITCH_TIMING"
            if (
                metadata.get("mitigation_evidence_missing")
                or metadata.get("breach_mitigated") is False
            ):
                disposition = "BLOCKED"
                reason_code = "MISSING_MITIGATION_EVIDENCE"

        # Use the base class logic for core fields
        base_record = self.build_record(
            run_id=run_id,
            scenario_id=scenario_id,
            disposition=disposition,
            reason_code=reason_code,
            component=component,
            correlation_id=correlation_id,
            evidence_ids=evidence_ids,
            latency_sec=effective_latency_sec,
            rollback_success=rollback_success,
            metadata=metadata,
        )

        # W18-specific reason codes override base generic rollback reason.
        if rollback_required and not rollback_result:
            base_record.disposition = "BLOCKED"
            base_record.reason_code = "MISSING_ROLLBACK_RESULT"

        # Upgrade to CanaryDesignRecord
        canary_record = CanaryDesignRecord(
            **base_record.model_dump(),
            canary_tier=effective_tier,
            exposure_tier=exposure_tier,
            risk_boundary=risk_boundary,
            breach_class=breach_class,
            rollback_required=rollback_required,
            rollback_result=rollback_result,
            rollback_disposition=rollback_disposition,
            kill_switch_latency_ms=effective_latency_ms,
        )

        self.records[-1] = canary_record
        return canary_record

    def get_canary_summary(self) -> Dict[str, Any]:
        """Aggregate canary-specific metrics."""
        base_summary = self.get_summary()
        canary_records = [r for r in self.records if isinstance(r, CanaryDesignRecord)]
        correlation_coverage = next(
            (
                float(r.metadata.get("coverage", 0.0))
                for r in canary_records
                if "CORRELATION" in r.scenario_id.upper()
            ),
            0.0,
        )
        throughput_watermark = max(
            (int(r.metadata.get("throughput", 0)) for r in canary_records), default=0
        )
        compliance_findings = next(
            (
                int(r.metadata.get("findings", -1))
                for r in canary_records
                if "COMPLIANCE" in r.scenario_id.upper()
            ),
            -1,
        )
        max_latency_ms = max((r.kill_switch_latency_ms or 0 for r in canary_records), default=0)
        rollback_required_records = [r for r in canary_records if r.rollback_required]
        rollback_pass_count = sum(
            1 for r in rollback_required_records if (r.rollback_result or "").upper() == "SUCCESS"
        )
        rollback_success_rate = (
            rollback_pass_count / len(rollback_required_records)
            if rollback_required_records
            else base_summary["rollback_success_rate"]
        )
        unmitigated_breach_count = sum(
            1
            for r in canary_records
            if "BREACH" in r.scenario_id.upper() and r.metadata.get("breach_mitigated") is False
        )

        return {
            **base_summary,
            "canary_scenario_count": len(
                [r for r in canary_records if "CANARY" in r.scenario_id.upper()]
            ),
            "breach_handling_count": len(
                [r for r in canary_records if "BREACH" in r.scenario_id.upper()]
            ),
            "kill_switch_latency_ms": max_latency_ms,
            "kill_switch_latency_sec": (
                max_latency_ms / 1000.0
                if max_latency_ms
                else base_summary["kill_switch_latency_sec"]
            ),
            "rollback_success_rate": rollback_success_rate,
            "correlation_coverage": correlation_coverage,
            "compliance_findings": compliance_findings,
            "throughput_watermark": throughput_watermark,
            "unmitigated_breach_count": unmitigated_breach_count,
            "tier_distribution": {
                tier.value: len(
                    [
                        r
                        for r in canary_records
                        if r.canary_tier == tier.value or r.exposure_tier == tier
                    ]
                )
                for tier in ExposureTier
            },
        }
