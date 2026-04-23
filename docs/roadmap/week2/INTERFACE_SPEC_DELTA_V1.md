# Interface Spec Delta v1 (W02)

This document outlines required changes to unify Python and Rust contracts based on W02 audit findings.

## [Signal] Unification
**Target**: `W2-BND-002`

| Field | Current (Py) | Current (Rust) | v1 Standard |
|---|---|---|---|
| Action | `direction` | `action` | `action` |
| Confidence | `strength` | `confidence` | `confidence` |
| Timestamp | `int` (ms) | `DateTime` | ISO-8601 string |
| Side Map | `long/short` | `Buy/Sell` | `Buy/Sell/Hold` |

### Action Items
- [ ] Update `src/bridge/zmq_bridge.py` to use `action` instead of `direction`.
- [ ] Update timestamp publish format to ISO-8601.

## [RiskDecision] Unification
**Target**: `W2-BND-003`

| Field | Current (Rust) | v1 Standard |
|---|---|---|
| Decision | `approved` (bool) | `decision` (enum) |
| Reason Code | `reason` (string) | `reason_code` (enum/string set) |
| Snapshot | N/A | `limit_snapshot` |

### Action Items
- [ ] Update `rust/common/src/messaging.rs` and risk-manager structures.

## [Observability] Unification
**Target**: `W2-BND-005`

| Field | Current (Py) | Current (Rust) | v1 Standard |
|---|---|---|---|
| ID | `correlation_id` | legacy alias present | `correlation_id` |
| Time | `float` | `DateTime` | ISO-8601 string |

### Action Items
- [ ] Keep canonical key as `correlation_id` across all logging layers.
- [ ] Legacy ID alias path (if any) must map at boundary only.
