import random

import numpy as np

from research.repro_manager import ReproducibilityManager


def test_seed_profile_deterministic_for_random_and_numpy():
    manager = ReproducibilityManager()

    manager.apply_seed_profile("seed-profile-1", seed=42)
    random_seq_1 = [random.random() for _ in range(5)]
    np_seq_1 = np.random.rand(5).tolist()

    manager.apply_seed_profile("seed-profile-1", seed=42)
    random_seq_2 = [random.random() for _ in range(5)]
    np_seq_2 = np.random.rand(5).tolist()

    assert random_seq_1 == random_seq_2
    assert np_seq_1 == np_seq_2


def test_drift_calculation_ignores_non_numeric_fields():
    manager = ReproducibilityManager()
    original = {"sharpe": 2.0, "return": 0.10, "label": "A"}
    rerun = {"sharpe": 2.2, "return": 0.11, "label": "B"}
    drift = manager.calculate_drift(original, rerun)

    assert abs(drift - 0.1) < 1e-6


def test_validate_rerun_requires_seed_profile_and_threshold():
    manager = ReproducibilityManager(drift_threshold=0.01)
    assert manager.validate_rerun("missing-profile", 0.0) == "DEFER"

    manager.apply_seed_profile("profile-x", seed=123)
    assert manager.validate_rerun("profile-x", 0.005) == "PASS"
    assert manager.validate_rerun("profile-x", 0.02) == "BLOCKED"


def test_build_record_contains_contract_fields():
    manager = ReproducibilityManager(owner="tester")
    manager.apply_seed_profile("profile-y", seed=7)
    record = manager.build_record(
        run_set_id="run-set-1",
        seed_profile_id="profile-y",
        rerun_profile="DETERMINISTIC_V1",
        drift_value=0.005,
        evidence_ids=["EV-W16-201"],
        status="PASS",
        decision_reason="All reproducibility checks passed",
        next_action="PROCEED",
        eta="IMMEDIATE",
    )

    assert record.repro_check_id
    assert record.run_set_id == "run-set-1"
    assert record.seed_profile_id == "profile-y"
    assert record.rerun_profile == "DETERMINISTIC_V1"
    assert record.status == "PASS"
    assert record.owner == "tester"
    assert record.evidence_ids == ["EV-W16-201"]
    assert record.next_action == "PROCEED"
    assert record.eta == "IMMEDIATE"
