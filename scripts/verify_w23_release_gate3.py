import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.utils.e2e_gate_manager import (
    E2EGateManager,
    E2ESuiteType,
    E2EDebtStatus,
)


def run_gate3_verification():
    manager = E2EGateManager(owner="tester")

    print("=== Week 23 Final-Phase Gate 3 Verification Rehearsal ===\n")

    # EV-W23-101: Full Cross-runtime E2E Pass
    manager.build_gate_record(
        run_id="W23-E2E-001",
        scenario_id="FULL_E2E_BASELINE",
        disposition="PASS",
        reason_code="ALL_TESTS_PASS",
        component="TESTING",
        correlation_id="corr-w23-001",
        evidence_ids=["EV-W23-101"],
        suite_type=E2ESuiteType.E2E,
    )

    # EV-W23-102: Soak Testing Pass
    manager.build_gate_record(
        run_id="W23-SOAK-001",
        scenario_id="SOAK_STABILITY_BASELINE",
        disposition="PASS",
        reason_code="ALL_TESTS_PASS",
        component="TESTING",
        correlation_id="corr-w23-002",
        evidence_ids=["EV-W23-102"],
        suite_type=E2ESuiteType.SOAK,
    )

    # EV-W23-103: Fault-Injection Pass
    manager.build_gate_record(
        run_id="W23-FAULT-001",
        scenario_id="FAULT_INJECTION_RECOVERY",
        disposition="PASS",
        reason_code="ALL_TESTS_PASS",
        component="TESTING",
        correlation_id="corr-w23-003",
        evidence_ids=["EV-W23-103"],
        suite_type=E2ESuiteType.FAULT_INJECTION,
    )

    # EV-W23-104: Zero E2E/Fault Debt
    manager.build_gate_record(
        run_id="W23-DEBT-001",
        scenario_id="E2E_FAULT_DEBT_AUDIT",
        disposition="PASS",
        reason_code="DEBT_CLOSED",
        component="TESTING",
        correlation_id="corr-w23-004",
        evidence_ids=["EV-W23-104"],
        e2e_debt_status=E2EDebtStatus.CLOSED,
    )

    # EV-W23-201: Regression Guard Pass
    manager.build_gate_record(
        run_id="W23-REG-001",
        scenario_id="REGRESSION_GUARD",
        disposition="PASS",
        reason_code="NO_REGRESSION",
        component="SYSTEM",
        correlation_id="corr-w23-005",
        evidence_ids=["EV-W23-201"],
        regression_count=0,
    )

    # EV-W23-207: Correlation Coverage
    manager.build_gate_record(
        run_id="W23-CORR-001",
        scenario_id="CORRELATION_AUDIT",
        disposition="PASS",
        reason_code="HIGH_COVERAGE",
        component="OBSERVABILITY",
        correlation_id="corr-w23-006",
        evidence_ids=["EV-W23-207"],
        metadata={"coverage": 0.999},
    )

    # EV-W23-208: Compliance Findings
    manager.build_gate_record(
        run_id="W23-COMP-001",
        scenario_id="COMPLIANCE_FINDINGS",
        disposition="PASS",
        reason_code="NO_FINDINGS",
        component="COMPLIANCE",
        correlation_id="corr-w23-007",
        evidence_ids=["EV-W23-208"],
        metadata={"findings": 0},
    )

    # EV-W23-402: Artifact Consistency
    manager.build_gate_record(
        run_id="W23-ART-001",
        scenario_id="ARTIFACT_CONSISTENCY",
        disposition="PASS",
        reason_code="CONSISTENT",
        component="GOVERNANCE",
        correlation_id="corr-w23-008",
        evidence_ids=["EV-W23-402"],
    )

    summary = manager.get_gate_summary()

    checks = {
        "EV-W23-101..103": summary["suite_pass_rate"] == 1.0,
        "EV-W23-104": summary["open_e2e_fault_debt"] == 0,
        "EV-W23-201": summary["total_regressions"] == 0,
        "EV-W23-207": any("EV-W23-207" in r.evidence_ids and r.metadata.get("coverage", 0) >= 0.99 for r in manager.records),
        "EV-W23-208": any("EV-W23-208" in r.evidence_ids and r.metadata.get("findings") == 0 for r in manager.records),
        "EV-W23-402": any("EV-W23-402" in r.evidence_ids and r.disposition == "PASS" for r in manager.records),
    }

    all_pass = True
    for eid, passed in checks.items():
        print(f"{eid}: {'PASS' if passed else 'FAIL'}")
        all_pass &= passed

    print("\n--- Gate 3 Metrics ---")
    print(f"Suite Pass Rate: {summary['suite_pass_rate']*100:.1f}%")
    print(f"Open E2E/Fault Debt: {summary['open_e2e_fault_debt']}")
    print(f"Total Regressions: {summary['total_regressions']}")
    print(f"Suite Distribution: {summary['suite_distribution']}")

    if all_pass:
        print("\nW23 FINAL-PHASE GATE 3 VERDICT: GO")
        return 0
    else:
        print("\nW23 FINAL-PHASE GATE 3 VERDICT: NO-GO")
        return 1


if __name__ == "__main__":
    sys.exit(run_gate3_verification())
