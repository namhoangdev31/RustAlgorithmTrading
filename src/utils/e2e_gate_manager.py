from typing import Optional, List, Dict, Any
from enum import Enum
from .staging_manager import StagingHardeningManager, StagingHardeningRecord


class E2ESuiteType(str, Enum):
    E2E = "E2E"
    SOAK = "SOAK"
    FAULT_INJECTION = "FAULT_INJECTION"


class E2EDebtStatus(str, Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    NONE = "NONE"


class E2EGateRecord(StagingHardeningRecord):
    suite_type: Optional[E2ESuiteType] = None
    e2e_debt_status: Optional[E2EDebtStatus] = None
    regression_count: Optional[int] = None


class E2EGateManager(StagingHardeningManager):
    """Manager for Final-Phase Gate 3 verification and evidence capture (W23)."""

    def build_gate_record(
        self,
        run_id: str,
        scenario_id: str,
        disposition: str,
        reason_code: str,
        component: str,
        correlation_id: Optional[str] = None,
        evidence_ids: Optional[List[str]] = None,
        suite_type: Optional[E2ESuiteType] = None,
        e2e_debt_status: Optional[E2EDebtStatus] = None,
        regression_count: Optional[int] = None,
        latency_sec: Optional[float] = None,
        rollback_success: Optional[bool] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> E2EGateRecord:
        metadata = metadata or {}

        # Enforce hard-gate policies
        if e2e_debt_status == E2EDebtStatus.OPEN:
            disposition = "BLOCKED"
            reason_code = "OPEN_E2E_FAULT_DEBT"

        if (
            suite_type in [E2ESuiteType.E2E, E2ESuiteType.SOAK, E2ESuiteType.FAULT_INJECTION]
            and disposition != "PASS"
        ):
            disposition = "BLOCKED"
            reason_code = f"{suite_type.value}_SUITE_FAIL"

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

        gate_record = E2EGateRecord(
            **base_record.model_dump(),
            suite_type=suite_type,
            e2e_debt_status=e2e_debt_status,
            regression_count=regression_count,
        )

        self.records[-1] = gate_record
        return gate_record

    def get_gate_summary(self) -> Dict[str, Any]:
        """Aggregate final-phase gate 3 specific metrics."""
        base_summary = self.get_summary()
        gate_records = [r for r in self.records if isinstance(r, E2EGateRecord)]

        suite_records = [r for r in gate_records if r.suite_type is not None]
        debt_records = [r for r in gate_records if r.e2e_debt_status is not None]

        suite_pass_rate = (
            sum(1 for r in suite_records if r.disposition == "PASS") / len(suite_records)
            if suite_records
            else 0.0
        )

        open_debt_count = sum(1 for r in debt_records if r.e2e_debt_status == E2EDebtStatus.OPEN)
        total_regressions = sum(
            r.regression_count for r in gate_records if r.regression_count is not None
        )

        return {
            **base_summary,
            "suite_pass_rate": suite_pass_rate,
            "open_e2e_fault_debt": open_debt_count,
            "total_regressions": total_regressions,
            "suite_distribution": {
                t.value: len([r for r in gate_records if r.suite_type == t]) for t in E2ESuiteType
            },
        }
