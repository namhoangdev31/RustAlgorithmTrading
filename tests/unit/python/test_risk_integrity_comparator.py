from backtesting.risk_integrity import compare_risk_decision_traces


def test_risk_integrity_comparator_zero_delta_for_identical_trace():
    baseline = [
        {
            "timestamp": "2024-01-01T00:00:00+00:00",
            "symbol": "AAPL",
            "signal_type": "LONG",
            "strategy_id": "S1",
            "sequence_no": 1,
            "decision": "ALLOW",
            "reason_code": "NONE",
        },
        {
            "timestamp": "2024-01-01T00:01:00+00:00",
            "symbol": "AAPL",
            "signal_type": "LONG",
            "strategy_id": "S1",
            "sequence_no": 2,
            "decision": "REJECT",
            "reason_code": "SYMBOL_POSITION_LIMIT_EXCEEDED",
        },
    ]
    candidate = [dict(row) for row in baseline]

    result = compare_risk_decision_traces(baseline, candidate)
    assert result.false_allow_delta == 0
    assert result.false_reject_delta == 0
    assert result.blocked_delta == 0
    assert result.missing_keys_in_candidate == 0
    assert result.extra_keys_in_candidate == 0
    assert result.reason_mismatch_count == 0


def test_risk_integrity_comparator_detects_false_allow_and_false_reject():
    baseline = [
        {
            "timestamp": "2024-01-01T00:00:00+00:00",
            "symbol": "AAPL",
            "signal_type": "LONG",
            "strategy_id": "S1",
            "sequence_no": 1,
            "decision": "REJECT",
            "reason_code": "SYMBOL_VOLUME_LIMIT_EXCEEDED",
        },
        {
            "timestamp": "2024-01-01T00:01:00+00:00",
            "symbol": "AAPL",
            "signal_type": "LONG",
            "strategy_id": "S1",
            "sequence_no": 2,
            "decision": "ALLOW",
            "reason_code": "NONE",
        },
    ]
    candidate = [
        {
            "timestamp": "2024-01-01T00:00:00+00:00",
            "symbol": "AAPL",
            "signal_type": "LONG",
            "strategy_id": "S1",
            "sequence_no": 1,
            "decision": "ALLOW",
            "reason_code": "NONE",
        },
        {
            "timestamp": "2024-01-01T00:01:00+00:00",
            "symbol": "AAPL",
            "signal_type": "LONG",
            "strategy_id": "S1",
            "sequence_no": 2,
            "decision": "REJECT",
            "reason_code": "SYMBOL_POSITION_LIMIT_EXCEEDED",
        },
    ]

    result = compare_risk_decision_traces(baseline, candidate)
    assert result.false_allow_delta == 1
    assert result.false_reject_delta == 1
    assert result.blocked_delta == 0
