# Interface Spec Delta v1

This document outlines the required changes to unify the Python and Rust contracts as identified in the Week 2 Audit.

## [Signal] Unification
**Target**: `W2-BND-002`

| Field | Current (Py) | Current (Rust) | v1 Standard (Chốt) |
|---|---|---|---|
| **Action** | `direction` | `action` | `action` |
| **Confidence** | `strength` | `confidence` | `confidence` |
| **Timestamp** | `int` (ms) | `DateTime` | `ISO-8601 String` |
| **Side Map** | `long/short` | `Buy/Sell` | `Buy/Sell/Hold` |

### Action Item
- [ ] Update `src/bridge/zmq_bridge.py` to use `action` instead of `direction`.
- [ ] Update `ZMQPublisher.publish_signal` to convert `timestamp` to ISO string.

## [RiskDecision] Unification
**Target**: `W2-BND-003`

| Field | Current (Rust) | v1 Standard (Chốt) |
|---|---|---|
| **Decision** | `approved` (bool) | `decision` (enum: `APPROVED`, `REJECTED`) |
| **Reason Code** | `reason` (string) | `reason_code` (enum: `MAX_POS_EXCEEDED`, etc.) |
| **Snapshot** | N/A | `limit_snapshot` (Dict of checked limits) |

### Action Item
- [ ] Update `rust/common/src/messaging.rs` and `risk-manager` to return the new struct.

## [Observability] Unification
**Target**: `W2-BND-005`

| Field | Current (Py) | Current (Rust) | v1 Standard (Chốt) |
|---|---|---|---|
| **ID** | `correlation_id` | `trace_id` | `trace_id` |
| **Time** | `float` | `DateTime` | `ISO-8601 String` |

### Action Item
- [ ] Update `src/observability/logging/structured_logger.py` to use `trace_id`.
