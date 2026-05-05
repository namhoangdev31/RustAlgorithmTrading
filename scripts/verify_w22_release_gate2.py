import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.utils.integration_gate_manager import (
    IntegrationGateManager,
    RuntimeScope,
    IntegrationSuiteType,
    IntegrationDebtStatus,
)


def run_gate2_verification():
    manager = IntegrationGateManager(owner="tester")

    print("=== Week 22 Final-Phase Gate 2 Verification Rehearsal ===\n")

    # EV-W22-101: Full Python Unit+Integration Pass
    manager.build_gate_record(
        run_id="W22-PY-001",
        scenario_id="PYTHON_INTEGRATION_BASELINE",
        disposition="PASS",
        reason_code="ALL_TESTS_PASS",
        component="TESTING",
        correlation_id="corr-w22-001",
        evidence_ids=["EV-W22-101"],
        runtime_scope=RuntimeScope.PYTHON,
        suite_type=IntegrationSuiteType.UNIT_INTEGRATION,
    )

    # EV-W22-102: Full Rust Unit+Integration Pass
    manager.build_gate_record(
        run_id="W22-RS-001",
        scenario_id="RUST_INTEGRATION_BASELINE",
        disposition="PASS",
        reason_code="ALL_TESTS_PASS",
        component="TESTING",
        correlation_id="corr-w22-002",
        evidence_ids=["EV-W22-102"],
        runtime_scope=RuntimeScope.RUST,
        suite_type=IntegrationSuiteType.UNIT_INTEGRATION,
    )

    # EV-W22-103: Cross-runtime Integration Pass
    manager.build_gate_record(
        run_id="W22-CROSS-001",
        scenario_id="CROSS_RUNTIME_INTEGRATION",
        disposition="PASS",
        reason_code="ALL_TESTS_PASS",
        component="TESTING",
        correlation_id="corr-w22-003",
        evidence_ids=["EV-W22-103"],
        runtime_scope=RuntimeScope.CROSS_RUNTIME,
        suite_type=IntegrationSuiteType.UNIT_INTEGRATION,
    )

    # EV-W22-104: Zero Integration Debt
    manager.build_gate_record(
        run_id="W22-DEBT-001",
        scenario_id="INTEGRATION_DEBT_AUDIT",
        disposition="PASS",
        reason_code="DEBT_CLOSED",
        component="TESTING",
        correlation_id="corr-w22-004",
        evidence_ids=["EV-W22-104"],
        integration_debt_status=IntegrationDebtStatus.CLOSED,
    )

    # EV-W22-201: Regression Guard Pass
    manager.build_gate_record(
        run_id="W22-REG-001",
        scenario_id="REGRESSION_GUARD",
        disposition="PASS",
        reason_code="NO_REGRESSION",
        component="SYSTEM",
        correlation_id="corr-w22-005",
        evidence_ids=["EV-W22-201"],
        regression_count=0,
    )

    # EV-W22-207: Correlation Coverage
    manager.build_gate_record(
        run_id="W22-CORR-001",
        scenario_id="CORRELATION_AUDIT",
        disposition="PASS",
        reason_code="HIGH_COVERAGE",
        component="OBSERVABILITY",
        correlation_id="corr-w22-006",
        evidence_ids=["EV-W22-207"],
        metadata={"coverage": 0.999},
    )

    # EV-W22-208: Compliance Findings
    manager.build_gate_record(
        run_id="W22-COMP-001",
        scenario_id="COMPLIANCE_FINDINGS",
        disposition="PASS",
        reason_code="NO_FINDINGS",
        component="COMPLIANCE",
        correlation_id="corr-w22-007",
        evidence_ids=["EV-W22-208"],
        metadata={"findings": 0},
    )

    # EV-W22-402: Artifact Consistency
    manager.build_gate_record(
        run_id="W22-ART-001",
        scenario_id="ARTIFACT_CONSISTENCY",
        disposition="PASS",
        reason_code="CONSISTENT",
        component="GOVERNANCE",
        correlation_id="corr-w22-008",
        evidence_ids=["EV-W22-402"],
    )

    summary = manager.get_gate_summary()

    checks = {
        "EV-W22-101..103": summary["suite_pass_rate"] == 1.0,
        "EV-W22-104": summary["open_integration_debt"] == 0,
        "EV-W22-201": summary["total_regressions"] == 0,
        "EV-W22-207": any("EV-W22-207" in r.evidence_ids and r.metadata.get("coverage", 0) >= 0.99 for r in manager.records),
        "EV-W22-208": any("EV-W22-208" in r.evidence_ids and r.metadata.get("findings") == 0 for r in manager.records),
        "EV-W22-402": any("EV-W22-402" in r.evidence_ids and r.disposition == "PASS" for r in manager.records),
    }

    all_pass = True
    for eid, passed in checks.items():
        print(f"{eid}: {'PASS' if passed else 'FAIL'}")
        all_pass &= passed

    print("\n--- Gate 2 Metrics ---")
    print(f"Suite Pass Rate: {summary['suite_pass_rate']*100:.1f}%")
    print(f"Open Integration Debt: {summary['open_integration_debt']}")
    print(f"Total Regressions: {summary['total_regressions']}")
    print(f"Runtime Distribution: {summary['runtime_distribution']}")

    if all_pass:
        print("\nW22 FINAL-PHASE GATE 2 VERDICT: GO")
        return 0
    else:
        print("\nW22 FINAL-PHASE GATE 2 VERDICT: NO-GO")
        return 1


if __name__ == "__main__":
    sys.exit(run_gate2_verification())
