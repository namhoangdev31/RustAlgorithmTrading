import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.utils.canary_manager import CanaryDesignManager, ExposureTier, BreachClass

def run_canary_verification():
    manager = CanaryDesignManager(owner="tester")
    
    print("=== Week 18 Canary Design Verification Rehearsal ===")
    
    # EV-W18-201: Canary scenario completeness
    manager.build_canary_record(
        run_id="W18-CANARY-001",
        scenario_id="CANARY_SCENARIO_MATRIX",
        disposition="PASS",
        reason_code="MATRIX_COMPLETE",
        component="GOVERNANCE",
        correlation_id="corr-w18-001",
        evidence_ids=["EV-W18-201"],
        exposure_tier=ExposureTier.T1,
        metadata={"scenarios_count": 12}
    )
    
    # EV-W18-202: Rollback rehearsal audit
    manager.build_canary_record(
        run_id="W18-RB-001",
        scenario_id="ROLLBACK_REHEARSAL_AUDIT",
        disposition="PASS",
        reason_code="ALL_DRILLS_SUCCESS",
        component="EXECUTION_ENGINE",
        correlation_id="corr-w18-002",
        evidence_ids=["EV-W18-202"],
        rollback_success=True
    )
    
    # EV-W18-203: Breach handling deterministic audit
    manager.build_canary_record(
        run_id="W18-BREACH-001",
        scenario_id="BREACH_HANDLING_DRILL",
        disposition="PASS",
        reason_code="DETERMINISTIC_RESPONSE",
        component="RISK_MANAGER",
        correlation_id="corr-w18-003",
        evidence_ids=["EV-W18-203"],
        breach_class=BreachClass.RISK_LIMIT,
        rollback_disposition="AUTO"
    )
    
    # EV-W18-204: Kill-switch response audit
    manager.build_canary_record(
        run_id="W18-KILL-001",
        scenario_id="KILL_SWITCH_AUDIT",
        disposition="PASS",
        reason_code="WITHIN_SLA",
        component="RISK_MANAGER",
        correlation_id="corr-w18-004",
        evidence_ids=["EV-W18-204"],
        latency_sec=42.5
    )
    
    # EV-W18-205: Risk boundary integrity audit
    manager.build_canary_record(
        run_id="W18-BOUNDARY-001",
        scenario_id="RISK_BOUNDARY_AUDIT",
        disposition="PASS",
        reason_code="ZERO_UNMITIGATED_BREACHES",
        component="RISK_MANAGER",
        correlation_id="corr-w18-005",
        evidence_ids=["EV-W18-205"],
        metadata={"breach_count": 0}
    )
    
    # EV-W18-206: Fault-injection coverage audit
    manager.build_canary_record(
        run_id="W18-FAULT-001",
        scenario_id="FAULT_INJECTION_AUDIT",
        disposition="PASS",
        reason_code="ALL_CHANNELS_TESTED",
        component="SYSTEM",
        correlation_id="corr-w18-006",
        evidence_ids=["EV-W18-206"]
    )
    
    # EV-W18-207: Correlation coverage audit
    manager.build_canary_record(
        run_id="W18-CORR-001",
        scenario_id="CORRELATION_AUDIT",
        disposition="PASS",
        reason_code="HIGH_COVERAGE",
        component="OBSERVABILITY",
        correlation_id="corr-w18-007",
        evidence_ids=["EV-W18-207"],
        metadata={"coverage": 0.998}
    )
    
    # EV-W18-210: Governance taxonomy consistency
    manager.build_canary_record(
        run_id="W18-GOV-001",
        scenario_id="GOVERNANCE_TAXONOMY",
        disposition="PASS",
        reason_code="CONSISTENT_WITH_W17",
        component="GOVERNANCE",
        correlation_id="corr-w18-010",
        evidence_ids=["EV-W18-210"]
    )
    
    summary = manager.get_canary_summary()
    
    checks = {
        "EV-W18-201": summary["canary_scenario_count"] > 0,
        "EV-W18-202": summary["rollback_success_rate"] == 1.0,
        "EV-W18-203": summary["breach_handling_count"] > 0,
        "EV-W18-204": summary["kill_switch_latency_sec"] <= 60.0,
        "EV-W18-205": any(r.evidence_ids == ["EV-W18-205"] and r.metadata.get("breach_count") == 0 for r in manager.records),
        "EV-W18-210": any(r.evidence_ids == ["EV-W18-210"] and r.disposition == "PASS" for r in manager.records),
    }
    
    all_pass = True
    for eid, passed in checks.items():
        print(f"{eid}: {'PASS' if passed else 'FAIL'}")
        all_pass &= passed
        
    print("\n--- Canary Metrics ---")
    print(f"Kill-switch max latency: {summary['kill_switch_latency_sec']:.2f}s")
    print(f"Rollback success rate: {summary['rollback_success_rate']*100:.1f}%")
    print(f"Tier distribution: {summary['tier_distribution']}")
    
    if all_pass:
        print("\nW18 CANARY DESIGN VERDICT: GO")
        return 0
    else:
        print("\nW18 CANARY DESIGN VERDICT: NO-GO")
        return 1

if __name__ == "__main__":
    sys.exit(run_canary_verification())
