"""
Risk decision trace normalization and parity comparison for Phase 2 gates.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Any, Iterable


CANONICAL_DECISIONS = {"ALLOW", "REJECT", "BLOCKED"}


def _canonical_reason_code(value: Any) -> str:
    if value is None:
        return "NONE"
    text = str(value).strip()
    if not text:
        return "NONE"
    return text.upper()


def _canonical_decision(value: Any) -> str:
    text = str(value).strip().upper()
    if text in CANONICAL_DECISIONS:
        return text
    raise ValueError(f"Unsupported risk decision token: {value}")


def _canonical_timestamp(value: Any) -> str:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).isoformat()
    text = str(value).strip()
    if not text:
        raise ValueError("timestamp is required for risk decision trace")
    try:
        normalized = text.replace("Z", "+00:00") if text.endswith("Z") else text
        parsed = datetime.fromisoformat(normalized)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc).isoformat()
    except ValueError:
        return text


@dataclass(frozen=True)
class RiskDecisionRecord:
    timestamp: str
    symbol: str
    signal_type: str
    strategy_id: str
    sequence_no: int
    decision: str
    reason_code: str

    def key(self) -> tuple[str, str, str, str, int]:
        return (
            self.timestamp,
            self.symbol,
            self.signal_type,
            self.strategy_id,
            self.sequence_no,
        )

    def asdict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class RiskIntegrityComparison:
    false_allow_delta: int
    false_reject_delta: int
    blocked_delta: int
    missing_keys_in_candidate: int
    extra_keys_in_candidate: int
    reason_mismatch_count: int
    baseline_total: int
    candidate_total: int
    details: list[dict[str, Any]]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def normalize_risk_decision_trace(
    rows: Iterable[dict[str, Any]],
) -> list[RiskDecisionRecord]:
    normalized: list[RiskDecisionRecord] = []

    for row in rows:
        normalized.append(
            RiskDecisionRecord(
                timestamp=_canonical_timestamp(row["timestamp"]),
                symbol=str(row["symbol"]).strip(),
                signal_type=str(row["signal_type"]).strip().upper(),
                strategy_id=str(row["strategy_id"]).strip(),
                sequence_no=int(row["sequence_no"]),
                decision=_canonical_decision(row["decision"]),
                reason_code=_canonical_reason_code(row.get("reason_code")),
            )
        )

    return sorted(normalized, key=lambda record: record.key())


def compare_risk_decision_traces(
    baseline_rows: Iterable[dict[str, Any]],
    candidate_rows: Iterable[dict[str, Any]],
) -> RiskIntegrityComparison:
    """
    Compare candidate (Rust) decisions against baseline (Python/live semantics).
    """
    baseline = normalize_risk_decision_trace(baseline_rows)
    candidate = normalize_risk_decision_trace(candidate_rows)

    baseline_map = {row.key(): row for row in baseline}
    candidate_map = {row.key(): row for row in candidate}

    baseline_keys = set(baseline_map.keys())
    candidate_keys = set(candidate_map.keys())

    common_keys = sorted(baseline_keys & candidate_keys)
    missing_keys = sorted(baseline_keys - candidate_keys)
    extra_keys = sorted(candidate_keys - baseline_keys)

    false_allow_delta = 0
    false_reject_delta = 0
    reason_mismatch_count = 0
    details: list[dict[str, Any]] = []

    for key in common_keys:
        baseline_row = baseline_map[key]
        candidate_row = candidate_map[key]

        if candidate_row.decision == "ALLOW" and baseline_row.decision in {"REJECT", "BLOCKED"}:
            false_allow_delta += 1
            details.append(
                {
                    "type": "false_allow",
                    "key": key,
                    "baseline": baseline_row.asdict(),
                    "candidate": candidate_row.asdict(),
                }
            )
        if candidate_row.decision in {"REJECT", "BLOCKED"} and baseline_row.decision == "ALLOW":
            false_reject_delta += 1
            details.append(
                {
                    "type": "false_reject",
                    "key": key,
                    "baseline": baseline_row.asdict(),
                    "candidate": candidate_row.asdict(),
                }
            )
        if baseline_row.decision == candidate_row.decision and (
            baseline_row.reason_code != candidate_row.reason_code
        ):
            reason_mismatch_count += 1
            details.append(
                {
                    "type": "reason_mismatch",
                    "key": key,
                    "baseline": baseline_row.asdict(),
                    "candidate": candidate_row.asdict(),
                }
            )

    baseline_blocked = sum(1 for row in baseline if row.decision == "BLOCKED")
    candidate_blocked = sum(1 for row in candidate if row.decision == "BLOCKED")
    blocked_delta = abs(candidate_blocked - baseline_blocked)

    for key in missing_keys:
        details.append(
            {
                "type": "missing_in_candidate",
                "key": key,
                "baseline": baseline_map[key].asdict(),
            }
        )
    for key in extra_keys:
        details.append(
            {
                "type": "extra_in_candidate",
                "key": key,
                "candidate": candidate_map[key].asdict(),
            }
        )

    return RiskIntegrityComparison(
        false_allow_delta=false_allow_delta,
        false_reject_delta=false_reject_delta,
        blocked_delta=blocked_delta,
        missing_keys_in_candidate=len(missing_keys),
        extra_keys_in_candidate=len(extra_keys),
        reason_mismatch_count=reason_mismatch_count,
        baseline_total=len(baseline),
        candidate_total=len(candidate),
        details=details,
    )
