import copy
from typing import Any, Dict, List
from backtesting.risk_integrity import compare_risk_decision_traces


def test_parity_same_trace_has_no_deltas(risk_decision_trace: List[Dict[str, Any]]) -> None:
    """
    Verify that comparing a risk decision trace to itself has 0 differences.
    """
    comparison = compare_risk_decision_traces(risk_decision_trace, risk_decision_trace)

    assert comparison.false_allow_delta == 0
    assert comparison.false_reject_delta == 0
    assert comparison.missing_keys_in_candidate == 0
    assert comparison.extra_keys_in_candidate == 0
    assert comparison.reason_mismatch_count == 0
    assert comparison.baseline_total == len(risk_decision_trace)
    assert comparison.candidate_total == len(risk_decision_trace)


def test_parity_mismatch_detection(risk_decision_trace: List[Dict[str, Any]]) -> None:
    """
    Verify that compare_risk_decision_traces correctly detects differences in decision.
    """
    # Create candidate with a mismatch
    candidate_trace = copy.deepcopy(risk_decision_trace)
    candidate_trace[0]["decision"] = "REJECT"  # originally ALLOW

    comparison = compare_risk_decision_traces(risk_decision_trace, candidate_trace)

    # ALLOW -> REJECT is a false reject
    assert comparison.false_reject_delta == 1
    assert comparison.false_allow_delta == 0
    assert comparison.baseline_total == len(risk_decision_trace)
    assert comparison.candidate_total == len(risk_decision_trace)


def test_parity_missing_key_detection(risk_decision_trace: List[Dict[str, Any]]) -> None:
    """
    Verify that compare_risk_decision_traces detects missing keys.
    """
    # Remove one item in candidate
    candidate_trace = copy.deepcopy(risk_decision_trace)[:-1]

    comparison = compare_risk_decision_traces(risk_decision_trace, candidate_trace)

    assert comparison.missing_keys_in_candidate == 1
    assert comparison.extra_keys_in_candidate == 0
    assert comparison.baseline_total == len(risk_decision_trace)
    assert comparison.candidate_total == len(candidate_trace)
