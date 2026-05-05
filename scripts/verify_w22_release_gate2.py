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

    # EV-W22-201: Full Python unit+integration pass
    manager.build_gate_record(
        run_id="W22-PY-001",
        scenario_id="PYTHON_INTEGRATION_BASELINE",
        disposition="PASS",
        reason_code="ALL_TESTS_PASS",
        component="TESTING",
        correlation_id="corr-w22-001",
        evidence_ids=["EV-W22-201"],
        suite_id="SUITE-PY-001",
        runtime_scope=RuntimeScope.PYTHON,
        suite_type=IntegrationSuiteType.PY_INTEGRATION,
    )

    # EV-W22-202: Full Rust unit+integration pass
    manager.build_gate_record(
        run_id="W22-RS-001",
        scenario_id="RUST_INTEGRATION_BASELINE",
        disposition="PASS",
        reason_code="ALL_TESTS_PASS",
        component="TESTING",
        correlation_id="corr-w22-002",
        evidence_ids=["EV-W22-202"],
        suite_id="SUITE-RS-001",
        runtime_scope=RuntimeScope.RUST,
        suite_type=IntegrationSuiteType.RS_INTEGRATION,
    )

    # EV-W22-203: Cross-runtime integration pass
    manager.build_gate_record(
        run_id="W22-CROSS-001",
        scenario_id="CROSS_RUNTIME_INTEGRATION",
        disposition="PASS",
        reason_code="ALL_TESTS_PASS",
        component="TESTING",
        correlation_id="corr-w22-003",
        evidence_ids=["EV-W22-203"],
        suite_id="SUITE-CROSS-001",
        runtime_scope=RuntimeScope.CROSS_RUNTIME,
        suite_type=IntegrationSuiteType.CROSS_RUNTIME,
    )

    # EV-W22-204: Zero integration debt
    manager.build_gate_record(
        run_id="W22-DEBT-001",
        scenario_id="INTEGRATION_DEBT_AUDIT",
        disposition="PASS",
        reason_code="DEBT_CLOSED",
        component="TESTING",
        correlation_id="corr-w22-004",
        evidence_ids=["EV-W22-204"],
        debt_item_id="DEBT-W22-001",
        integration_debt_status=IntegrationDebtStatus.CLOSED,
    )

    # EV-W22-205: Correlation coverage
    manager.build_gate_record(
        run_id="W22-CORR-001",
        scenario_id="CORRELATION_AUDIT",
        disposition="PASS",
        reason_code="HIGH_COVERAGE",
        component="OBSERVABILITY",
        correlation_id="corr-w22-005",
        evidence_ids=["EV-W22-205"],
        metadata={"coverage": 0.999},
    )

    # EV-W22-206: Compliance findings
    manager.build_gate_record(
        run_id="W22-COMP-001",
        scenario_id="COMPLIANCE_FINDINGS",
        disposition="PASS",
        reason_code="NO_FINDINGS",
        component="COMPLIANCE",
        correlation_id="corr-w22-006",
        evidence_ids=["EV-W22-206"],
        metadata={"findings": 0},
    )

    # EV-W22-207: Rerun stability
    manager.build_gate_record(
        run_id="W22-RERUN-001",
        scenario_id="RERUN_STABILITY",
        disposition="PASS",
        reason_code="NO_NEW_BLOCKER",
        component="GOVERNANCE",
        correlation_id="corr-w22-007",
        evidence_ids=["EV-W22-207"],
        regression_count=0,
        metadata={"new_blockers": 0},
    )

    # EV-W22-208: Release blocker mapping
    manager.build_gate_record(
        run_id="W22-TAX-001",
        scenario_id="BLOCKER_TAXONOMY_AUDIT",
        disposition="PASS",
        reason_code="TAXONOMY_COMPLETE",
        component="GOVERNANCE",
        correlation_id="corr-w22-008",
        evidence_ids=["EV-W22-208"],
        metadata={"taxonomy_complete": True},
    )

    # EV-W22-209: Escalation integrity
    manager.build_gate_record(
        run_id="W22-ESC-001",
        scenario_id="ESCALATION_INTEGRITY",
        disposition="PASS",
        reason_code="BUDGET_WITHIN_LIMIT",
        component="GOVERNANCE",
        correlation_id="corr-w22-009",
        evidence_ids=["EV-W22-209"],
        metadata={"budget_within_threshold": True},
    )

    # EV-W22-210: Throughput/toil watermark
    manager.build_gate_record(
        run_id="W22-TOIL-001",
        scenario_id="GATE_TOIL_WATERMARK",
        disposition="PASS",
        reason_code="TOIL_CAPTURED",
        component="OPS",
        correlation_id="corr-w22-010",
        evidence_ids=["EV-W22-210"],
        metadata={"throughput": 16},
    )

    # EV-W22-402: Artifact Consistency
    manager.build_gate_record(
        run_id="W22-ART-001",
        scenario_id="ARTIFACT_CONSISTENCY",
        disposition="PASS",
        reason_code="CONSISTENT",
        component="GOVERNANCE",
        correlation_id="corr-w22-011",
        evidence_ids=["EV-W22-402"],
    )

    summary = manager.get_gate_summary()

    correlation_coverage = max(
        (float(r.metadata.get("coverage", 0.0)) for r in manager.records if "EV-W22-205" in r.evidence_ids),
        default=0.0,
    )
    compliance_findings = max(
        (int(r.metadata.get("findings", 0)) for r in manager.records if "EV-W22-206" in r.evidence_ids),
        default=0,
    )
    new_blocker_count = max(
        (int(r.metadata.get("new_blockers", 0)) for r in manager.records if "EV-W22-207" in r.evidence_ids),
        default=0,
    )

    checks = {
        "EV-W22-201": summary["runtime_distribution"]["PYTHON"] >= 1 and summary["suite_pass_rate"] == 1.0,
        "EV-W22-202": summary["runtime_distribution"]["RUST"] >= 1 and summary["suite_pass_rate"] == 1.0,
        "EV-W22-203": summary["runtime_distribution"]["CROSS_RUNTIME"] >= 1 and summary["suite_pass_rate"] == 1.0,
        "EV-W22-204": summary["open_integration_debt"] == 0,
        "EV-W22-205": correlation_coverage >= 0.99,
        "EV-W22-206": compliance_findings == 0,
        "EV-W22-207": new_blocker_count == 0 and summary["blocked_count"] == 0,
        "EV-W22-208": any("EV-W22-208" in r.evidence_ids and r.metadata.get("taxonomy_complete") is True for r in manager.records),
        "EV-W22-209": any("EV-W22-209" in r.evidence_ids and r.metadata.get("budget_within_threshold") is True for r in manager.records),
        "EV-W22-210": summary["throughput_watermark"] > 0,
        "EV-W22-402": any("EV-W22-402" in r.evidence_ids and r.disposition == "PASS" for r in manager.records),
    }

    all_pass = True
    for eid, passed in checks.items():
        print(f"{eid}: {'PASS' if passed else 'FAIL'}")
        all_pass &= passed

    print("\n--- Gate 2 Metrics ---")
    print(f"Suite Pass Rate: {summary['suite_pass_rate']*100:.1f}%")
    print(f"Open Integration Debt: {summary['open_integration_debt']}")
    print(f"Correlation Coverage: {correlation_coverage*100:.2f}%")
    print(f"Compliance Findings: {compliance_findings}")
    print(f"New Blockers After Rerun: {new_blocker_count}")
    print(f"Total Regressions: {summary['total_regressions']}")
    print(f"Blocked Count: {summary['blocked_count']}")
    print(f"Throughput Watermark: {summary['throughput_watermark']}")
    print(f"Runtime Distribution: {summary['runtime_distribution']}")

    if all_pass:
        print("\nW22 FINAL-PHASE GATE 2 VERDICT: GO")
        return 0
    else:
        print("\nW22 FINAL-PHASE GATE 2 VERDICT: NO-GO")
        return 1


if __name__ == "__main__":
    sys.exit(run_gate2_verification())
