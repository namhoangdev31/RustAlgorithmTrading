from typing import Optional, List, Dict, Any
from enum import Enum
from .staging_manager import StagingHardeningManager, StagingHardeningRecord


class SafetyTriggerType(str, Enum):
    KILL_SWITCH = "KILL_SWITCH"
    RISK_OFF = "RISK_OFF"
    ROLLBACK = "ROLLBACK"


class SafetyGuardrailsRecord(StagingHardeningRecord):
    trigger_type: Optional[SafetyTriggerType] = None
    risk_boundary: Optional[str] = None
    rollback_required: Optional[bool] = None
    rollback_result: Optional[str] = None
    kill_switch_latency_ms: Optional[int] = None


class SafetyGuardrailsManager(StagingHardeningManager):
    """Manager for safety guardrails verification and evidence capture (W19)."""

    def build_safety_record(
        self,
        run_id: str,
        scenario_id: str,
        disposition: str,
        reason_code: str,
        component: str,
        correlation_id: Optional[str] = None,
        evidence_ids: Optional[List[str]] = None,
        trigger_type: Optional[SafetyTriggerType] = None,
        risk_boundary: Optional[str] = None,
        rollback_required: Optional[bool] = None,
        rollback_result: Optional[str] = None,
        kill_switch_latency_ms: Optional[int] = None,
        latency_sec: Optional[float] = None,
        rollback_success: Optional[bool] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> SafetyGuardrailsRecord:
        metadata = metadata or {}

        # Enforce safety-specific policies
        if trigger_type == SafetyTriggerType.KILL_SWITCH and kill_switch_latency_ms is None:
            disposition = "BLOCKED"
            reason_code = "MISSING_KILL_SWITCH_TIMING"

        if rollback_required is True and rollback_result is None:
            disposition = "BLOCKED"
            reason_code = "MISSING_ROLLBACK_RESULT"

        if risk_boundary and metadata.get("breach_mitigated") is False:
            disposition = "BLOCKED"
            reason_code = "UNMITIGATED_RISK_BOUNDARY_BREACH"

        # Derive latency_sec from kill_switch_latency_ms for base class compatibility
        if kill_switch_latency_ms is not None and latency_sec is None:
            latency_sec = kill_switch_latency_ms / 1000.0

        # Use base class for core field validation
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
            metadata=metadata,
        )

        safety_record = SafetyGuardrailsRecord(
            **base_record.model_dump(),
            trigger_type=trigger_type,
            risk_boundary=risk_boundary,
            rollback_required=rollback_required,
            rollback_result=rollback_result,
            kill_switch_latency_ms=kill_switch_latency_ms,
        )

        self.records[-1] = safety_record
        return safety_record

    def get_safety_summary(self) -> Dict[str, Any]:
        """Aggregate safety-specific metrics."""
        base_summary = self.get_summary()
        safety_records = [r for r in self.records if isinstance(r, SafetyGuardrailsRecord)]

        kill_switch_records = [
            r
            for r in safety_records
            if r.trigger_type == SafetyTriggerType.KILL_SWITCH
            and r.kill_switch_latency_ms is not None
        ]
        risk_off_records = [
            r for r in safety_records if r.trigger_type == SafetyTriggerType.RISK_OFF
        ]
        rollback_records = [
            r for r in safety_records if r.trigger_type == SafetyTriggerType.ROLLBACK
        ]

        max_kill_switch_ms = max((r.kill_switch_latency_ms for r in kill_switch_records), default=0)
        risk_off_pass_rate = (
            sum(1 for r in risk_off_records if r.disposition == "PASS") / len(risk_off_records)
            if risk_off_records
            else 0.0
        )
        rollback_pass_rate = (
            sum(1 for r in rollback_records if r.disposition == "PASS") / len(rollback_records)
            if rollback_records
            else 0.0
        )
        unmitigated_breaches = sum(
            1
            for r in safety_records
            if r.risk_boundary and r.metadata.get("breach_mitigated") is False
        )

        return {
            **base_summary,
            "max_kill_switch_latency_ms": max_kill_switch_ms,
            "max_kill_switch_latency_sec": max_kill_switch_ms / 1000.0,
            "risk_off_pass_rate": risk_off_pass_rate,
            "rollback_pass_rate": rollback_pass_rate,
            "unmitigated_breach_count": unmitigated_breaches,
            "trigger_distribution": {
                t.value: len([r for r in safety_records if r.trigger_type == t])
                for t in SafetyTriggerType
            },
        }
