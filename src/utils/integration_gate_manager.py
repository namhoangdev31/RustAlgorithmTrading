from typing import Optional, List, Dict, Any
from enum import Enum
from .staging_manager import StagingHardeningManager, StagingHardeningRecord


class RuntimeScope(str, Enum):
    PYTHON = "PYTHON"
    RUST = "RUST"
    CROSS_RUNTIME = "CROSS_RUNTIME"


class IntegrationSuiteType(str, Enum):
    UNIT_INTEGRATION = "UNIT_INTEGRATION"


class IntegrationDebtStatus(str, Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    NONE = "NONE"


class IntegrationGateRecord(StagingHardeningRecord):
    runtime_scope: Optional[RuntimeScope] = None
    suite_type: Optional[IntegrationSuiteType] = None
    integration_debt_status: Optional[IntegrationDebtStatus] = None
    regression_count: Optional[int] = None


class IntegrationGateManager(StagingHardeningManager):
    """Manager for Final-Phase Gate 2 verification and evidence capture (W22)."""

    def build_gate_record(
        self,
        run_id: str,
        scenario_id: str,
        disposition: str,
        reason_code: str,
        component: str,
        correlation_id: Optional[str] = None,
        evidence_ids: Optional[List[str]] = None,
        runtime_scope: Optional[RuntimeScope] = None,
        suite_type: Optional[IntegrationSuiteType] = None,
        integration_debt_status: Optional[IntegrationDebtStatus] = None,
        regression_count: Optional[int] = None,
        latency_sec: Optional[float] = None,
        rollback_success: Optional[bool] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> IntegrationGateRecord:
        metadata = metadata or {}

        # Enforce hard-gate policies
        if integration_debt_status == IntegrationDebtStatus.OPEN:
            disposition = "BLOCKED"
            reason_code = "OPEN_INTEGRATION_DEBT"

        if suite_type == IntegrationSuiteType.UNIT_INTEGRATION and disposition != "PASS":
            disposition = "BLOCKED"
            reason_code = f"{runtime_scope.value}_INTEGRATION_SUITE_FAIL" if runtime_scope else "INTEGRATION_SUITE_FAIL"

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

        gate_record = IntegrationGateRecord(
            **base_record.model_dump(),
            runtime_scope=runtime_scope,
            suite_type=suite_type,
            integration_debt_status=integration_debt_status,
            regression_count=regression_count,
        )

        self.records[-1] = gate_record
        return gate_record

    def get_gate_summary(self) -> Dict[str, Any]:
        """Aggregate final-phase gate 2 specific metrics."""
        base_summary = self.get_summary()
        gate_records = [r for r in self.records if isinstance(r, IntegrationGateRecord)]

        suite_records = [r for r in gate_records if r.suite_type is not None]
        debt_records = [r for r in gate_records if r.integration_debt_status is not None]
        
        suite_pass_rate = (
            sum(1 for r in suite_records if r.disposition == "PASS") / len(suite_records)
            if suite_records else 0.0
        )
        
        open_debt_count = sum(1 for r in debt_records if r.integration_debt_status == IntegrationDebtStatus.OPEN)
        total_regressions = sum(r.regression_count for r in gate_records if r.regression_count is not None)

        return {
            **base_summary,
            "suite_pass_rate": suite_pass_rate,
            "open_integration_debt": open_debt_count,
            "total_regressions": total_regressions,
            "runtime_distribution": {
                t.value: len([r for r in gate_records if r.runtime_scope == t])
                for t in RuntimeScope
            },
        }
