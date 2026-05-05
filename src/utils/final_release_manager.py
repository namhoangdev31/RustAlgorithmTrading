from typing import Optional, List, Dict, Any
from enum import Enum
from .staging_manager import StagingHardeningManager, StagingHardeningRecord


class ApprovalState(str, Enum):
    APPROVED = "APPROVED"
    PENDING = "PENDING"
    REJECTED = "REJECTED"


class ReleaseBlockerStatus(str, Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    NONE = "NONE"


class RollbackReadiness(str, Enum):
    READY = "READY"
    NOT_READY = "NOT_READY"


class FinalReleaseRecord(StagingHardeningRecord):
    approval_state: Optional[ApprovalState] = None
    release_blocker_status: Optional[ReleaseBlockerStatus] = None
    rollback_readiness: Optional[RollbackReadiness] = None
    regression_count: Optional[int] = None


class FinalReleaseManager(StagingHardeningManager):
    """Manager for Final-Phase Gate 4 verification and evidence capture (W24)."""

    def build_gate_record(
        self,
        run_id: str,
        scenario_id: str,
        disposition: str,
        reason_code: str,
        component: str,
        correlation_id: Optional[str] = None,
        evidence_ids: Optional[List[str]] = None,
        approval_state: Optional[ApprovalState] = None,
        release_blocker_status: Optional[ReleaseBlockerStatus] = None,
        rollback_readiness: Optional[RollbackReadiness] = None,
        regression_count: Optional[int] = None,
        latency_sec: Optional[float] = None,
        rollback_success: Optional[bool] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> FinalReleaseRecord:
        metadata = metadata or {}

        # Enforce hard-gate policies
        if release_blocker_status == ReleaseBlockerStatus.OPEN:
            disposition = "BLOCKED"
            reason_code = "OPEN_RELEASE_BLOCKER"

        if approval_state in [ApprovalState.PENDING, ApprovalState.REJECTED]:
            disposition = "BLOCKED"
            reason_code = f"APPROVAL_{approval_state.value}"

        if rollback_readiness == RollbackReadiness.NOT_READY:
            disposition = "BLOCKED"
            reason_code = "ROLLBACK_NOT_READY"

        if regression_count is not None and regression_count > 0:
            disposition = "BLOCKED"
            reason_code = "REGRESSION_DETECTED"

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

        gate_record = FinalReleaseRecord(
            **base_record.model_dump(),
            approval_state=approval_state,
            release_blocker_status=release_blocker_status,
            rollback_readiness=rollback_readiness,
            regression_count=regression_count,
        )

        self.records[-1] = gate_record
        return gate_record

    def get_gate_summary(self) -> Dict[str, Any]:
        """Aggregate final-phase gate 4 specific metrics."""
        base_summary = self.get_summary()
        gate_records = [r for r in self.records if isinstance(r, FinalReleaseRecord)]

        approval_records = [r for r in gate_records if r.approval_state is not None]
        blocker_records = [r for r in gate_records if r.release_blocker_status is not None]
        rollback_records = [r for r in gate_records if r.rollback_readiness is not None]
        
        approval_rate = (
            sum(1 for r in approval_records if r.approval_state == ApprovalState.APPROVED) / len(approval_records)
            if approval_records else 0.0
        )
        
        rollback_ready_rate = (
            sum(1 for r in rollback_records if r.rollback_readiness == RollbackReadiness.READY) / len(rollback_records)
            if rollback_records else 0.0
        )

        open_blocker_count = sum(1 for r in blocker_records if r.release_blocker_status == ReleaseBlockerStatus.OPEN)
        total_regressions = sum(r.regression_count for r in gate_records if r.regression_count is not None)

        return {
            **base_summary,
            "approval_rate": approval_rate,
            "rollback_ready_rate": rollback_ready_rate,
            "open_release_blockers": open_blocker_count,
            "total_regressions": total_regressions,
            "blocked_by_approval": len([r for r in gate_records if r.reason_code and r.reason_code.startswith("APPROVAL_")]),
            "blocked_by_rollback": len([r for r in gate_records if r.reason_code == "ROLLBACK_NOT_READY"]),
        }
