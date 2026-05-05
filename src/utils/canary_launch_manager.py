from typing import Optional, List, Dict, Any
from enum import Enum
from .staging_manager import StagingHardeningManager, StagingHardeningRecord


class LaunchTier(str, Enum):
    NARROW = "NARROW"       # W20: controlled narrow canary
    EXPANDED = "EXPANDED"   # Future: broader canary
    FULL = "FULL"           # Future: full production


class EscalationState(str, Enum):
    NONE = "NONE"
    TRIGGERED = "TRIGGERED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class CanaryLaunchRecord(StagingHardeningRecord):
    launch_tier: Optional[LaunchTier] = None
    risk_boundary: Optional[str] = None
    rollback_required: Optional[bool] = None
    rollback_result: Optional[str] = None
    kill_switch_latency_ms: Optional[int] = None
    escalation_state: Optional[EscalationState] = None
    escalation_result: Optional[str] = None


class CanaryLaunchManager(StagingHardeningManager):
    """Manager for controlled canary launch verification and evidence capture (W20)."""

    def build_launch_record(
        self,
        run_id: str,
        scenario_id: str,
        disposition: str,
        reason_code: str,
        component: str,
        correlation_id: Optional[str] = None,
        evidence_ids: Optional[List[str]] = None,
        launch_tier: Optional[LaunchTier] = None,
        risk_boundary: Optional[str] = None,
        rollback_required: Optional[bool] = None,
        rollback_result: Optional[str] = None,
        kill_switch_latency_ms: Optional[int] = None,
        escalation_state: Optional[EscalationState] = None,
        escalation_result: Optional[str] = None,
        latency_sec: Optional[float] = None,
        rollback_success: Optional[bool] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> CanaryLaunchRecord:
        metadata = metadata or {}

        # Enforce launch-specific policies
        if escalation_state == EscalationState.TRIGGERED and escalation_result is None:
            disposition = "BLOCKED"
            reason_code = "MISSING_ESCALATION_RESULT"

        if rollback_required is True and rollback_result is None:
            disposition = "BLOCKED"
            reason_code = "MISSING_ROLLBACK_RESULT"

        if risk_boundary and metadata.get("breach_mitigated") is False:
            disposition = "BLOCKED"
            reason_code = "UNMITIGATED_BOUNDARY_BREACH"

        # Derive latency_sec from kill_switch_latency_ms
        if kill_switch_latency_ms is not None and latency_sec is None:
            latency_sec = kill_switch_latency_ms / 1000.0

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

        launch_record = CanaryLaunchRecord(
            **base_record.model_dump(),
            launch_tier=launch_tier,
            risk_boundary=risk_boundary,
            rollback_required=rollback_required,
            rollback_result=rollback_result,
            kill_switch_latency_ms=kill_switch_latency_ms,
            escalation_state=escalation_state,
            escalation_result=escalation_result,
        )

        self.records[-1] = launch_record
        return launch_record

    def get_launch_summary(self) -> Dict[str, Any]:
        """Aggregate canary-launch-specific metrics."""
        base_summary = self.get_summary()
        launch_records = [r for r in self.records if isinstance(r, CanaryLaunchRecord)]

        ks_records = [r for r in launch_records if r.kill_switch_latency_ms is not None]
        esc_records = [r for r in launch_records if r.escalation_state is not None]
        rb_records = [r for r in launch_records if r.rollback_required is True]

        max_ks_ms = max((r.kill_switch_latency_ms for r in ks_records), default=0)
        escalation_pass_rate = (
            sum(1 for r in esc_records if r.disposition == "PASS") / len(esc_records)
            if esc_records else 0.0
        )
        rollback_pass_rate = (
            sum(1 for r in rb_records if r.rollback_result == "SUCCESS") / len(rb_records)
            if rb_records else 0.0
        )
        unmitigated = sum(
            1 for r in launch_records
            if r.risk_boundary and r.metadata.get("breach_mitigated") is False
        )

        return {
            **base_summary,
            "max_kill_switch_latency_ms": max_ks_ms,
            "max_kill_switch_latency_sec": max_ks_ms / 1000.0,
            "escalation_pass_rate": escalation_pass_rate,
            "rollback_pass_rate": rollback_pass_rate,
            "unmitigated_breach_count": unmitigated,
            "launch_tier_distribution": {
                t.value: len([r for r in launch_records if r.launch_tier == t])
                for t in LaunchTier
            },
        }
