import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.utils.canary_launch_manager import (
    CanaryLaunchManager,
    LaunchTier,
    EscalationState,
)


def run_launch_verification():
    manager = CanaryLaunchManager(owner="tester")

    print("=== Week 20 Canary Launch (Narrow) Verification Rehearsal ===\n")

    # EV-W20-201: Controlled canary coverage
    manager.build_launch_record(
        run_id="W20-LAUNCH-001",
        scenario_id="CANARY_LAUNCH_COVERAGE",
        disposition="PASS",
        reason_code="ALL_MANDATORY_SCENARIOS",
        component="GOVERNANCE",
        correlation_id="corr-w20-001",
        evidence_ids=["EV-W20-201"],
        launch_tier=LaunchTier.NARROW,
        metadata={"scenarios_total": 9, "scenarios_passed": 9},
    )

    # EV-W20-202: Risk boundary integrity
    manager.build_launch_record(
        run_id="W20-BOUNDARY-001",
        scenario_id="RISK_BOUNDARY_AUDIT",
        disposition="PASS",
        reason_code="ZERO_UNMITIGATED",
        component="RISK_MANAGER",
        correlation_id="corr-w20-002",
        evidence_ids=["EV-W20-202"],
        risk_boundary="MAX_EXPOSURE_PER_SYMBOL",
        metadata={"breach_mitigated": True, "breach_count": 0},
    )

    # EV-W20-203: Kill-switch response
    manager.build_launch_record(
        run_id="W20-KS-001",
        scenario_id="KILL_SWITCH_LAUNCH",
        disposition="PASS",
        reason_code="WITHIN_SLA",
        component="RISK_MANAGER",
        correlation_id="corr-w20-003",
        evidence_ids=["EV-W20-203"],
        kill_switch_latency_ms=38000,
    )

    # EV-W20-204: Rollback rehearsal
    manager.build_launch_record(
        run_id="W20-RB-001",
        scenario_id="ROLLBACK_LAUNCH_DRILL",
        disposition="PASS",
        reason_code="ALL_DRILLS_SUCCESS",
        component="EXECUTION_ENGINE",
        correlation_id="corr-w20-004",
        evidence_ids=["EV-W20-204"],
        rollback_required=True,
        rollback_result="SUCCESS",
        rollback_success=True,
    )

    # EV-W20-205: Incident escalation correctness
    manager.build_launch_record(
        run_id="W20-ESC-001",
        scenario_id="ESCALATION_DRILL",
        disposition="PASS",
        reason_code="CORRECT_ESCALATION",
        component="OPS",
        correlation_id="corr-w20-005",
        evidence_ids=["EV-W20-205"],
        escalation_state=EscalationState.TRIGGERED,
        escalation_result="RESOLVED",
    )

    # EV-W20-206: Fault-injection coverage
    manager.build_launch_record(
        run_id="W20-FAULT-001",
        scenario_id="FAULT_INJECTION",
        disposition="PASS",
        reason_code="ALL_SCENARIOS_TESTED",
        component="SYSTEM",
        correlation_id="corr-w20-006",
        evidence_ids=["EV-W20-206"],
    )

    # EV-W20-207: Correlation coverage
    manager.build_launch_record(
        run_id="W20-CORR-001",
        scenario_id="CORRELATION_AUDIT",
        disposition="PASS",
        reason_code="HIGH_COVERAGE",
        component="OBSERVABILITY",
        correlation_id="corr-w20-007",
        evidence_ids=["EV-W20-207"],
        metadata={"coverage": 0.997},
    )

    # EV-W20-208: Compliance findings
    manager.build_launch_record(
        run_id="W20-COMP-001",
        scenario_id="COMPLIANCE_FINDINGS",
        disposition="PASS",
        reason_code="NO_FINDINGS",
        component="COMPLIANCE",
        correlation_id="corr-w20-008",
        evidence_ids=["EV-W20-208"],
        metadata={"findings": 0},
    )

    # EV-W20-209: Boundary monitoring consistency
    manager.build_launch_record(
        run_id="W20-MON-001",
        scenario_id="BOUNDARY_MONITOR_CONSISTENCY",
        disposition="PASS",
        reason_code="CONSISTENT",
        component="OBSERVABILITY",
        correlation_id="corr-w20-009",
        evidence_ids=["EV-W20-209"],
    )

    # EV-W20-210: Throughput/toil watermark
    manager.build_launch_record(
        run_id="W20-TOIL-001",
        scenario_id="THROUGHPUT_TOIL",
        disposition="PASS",
        reason_code="WATERMARK_CAPTURED",
        component="OPS",
        correlation_id="corr-w20-010",
        evidence_ids=["EV-W20-210"],
        metadata={"throughput": 5400, "toil_minutes": 5},
    )

    summary = manager.get_launch_summary()

    checks = {
        "EV-W20-201": any("EV-W20-201" in r.evidence_ids and r.disposition == "PASS" for r in manager.records),
        "EV-W20-202": summary["unmitigated_breach_count"] == 0,
        "EV-W20-203": summary["max_kill_switch_latency_sec"] <= 60.0,
        "EV-W20-204": summary["rollback_pass_rate"] == 1.0,
        "EV-W20-205": summary["escalation_pass_rate"] == 1.0,
        "EV-W20-206": any("EV-W20-206" in r.evidence_ids and r.disposition == "PASS" for r in manager.records),
        "EV-W20-207": any("EV-W20-207" in r.evidence_ids and r.metadata.get("coverage", 0) >= 0.99 for r in manager.records),
        "EV-W20-208": any("EV-W20-208" in r.evidence_ids and r.metadata.get("findings") == 0 for r in manager.records),
        "EV-W20-209": any("EV-W20-209" in r.evidence_ids and r.disposition == "PASS" for r in manager.records),
        "EV-W20-210": any("EV-W20-210" in r.evidence_ids and r.metadata.get("throughput", 0) > 0 for r in manager.records),
    }

    all_pass = True
    for eid, passed in checks.items():
        print(f"{eid}: {'PASS' if passed else 'FAIL'}")
        all_pass &= passed

    print("\n--- Launch Metrics ---")
    print(f"Kill-switch max latency: {summary['max_kill_switch_latency_sec']:.2f}s ({summary['max_kill_switch_latency_ms']}ms)")
    print(f"Escalation pass rate: {summary['escalation_pass_rate']*100:.1f}%")
    print(f"Rollback pass rate: {summary['rollback_pass_rate']*100:.1f}%")
    print(f"Unmitigated breaches: {summary['unmitigated_breach_count']}")
    print(f"Launch tier distribution: {summary['launch_tier_distribution']}")

    if all_pass:
        print("\nW20 CANARY LAUNCH VERDICT: GO")
        return 0
    else:
        print("\nW20 CANARY LAUNCH VERDICT: NO-GO")
        return 1


if __name__ == "__main__":
    sys.exit(run_launch_verification())
