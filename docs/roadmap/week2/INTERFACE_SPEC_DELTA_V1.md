# Interface Spec Delta v1 (W02)

This document tracks changes to the inter-service contracts implemented in Week 2.

## 1) Messaging Envelope (Canonical v1)

All messages across the ZMQ bridge now use the following structure:

```json
{
  "type": "string",
  "data": "object",
  "correlationId": "uuid-v4 (optional)"
}
```

- **Change**: Added `correlationId` field (camelCase) to support end-to-end tracing.
- **Python Implementation**: `src/bridge/zmq_bridge.py`
- **Rust Implementation**: `rust/common/src/messaging.rs`

## 2) Signal Semantic Alignment

The `Signal` payload has been harmonized to match Python ML conventions.

| Field | Old Name (Rust) | New Name (Rust) | Python Equivalent |
|---|---|---|---|
| Direction | `action` (SignalAction) | `direction` (SignalDirection) | `direction` |
| Confidence | `confidence` | `strength` | `strength` |

- **Rust Change**: Renamed fields in `rust/common/src/types.rs`.
- **Reason**: Reduce friction when passing signals from Python ML models to Rust strategies.

## 3) Risk Decision Expansion

The `RiskCheckResult` has been expanded to support detailed auditing.

```rust
pub struct RiskCheckResult {
    pub approved: bool,
    pub reason: Option<String>,
    pub reason_code: Option<String>,
    pub limit_snapshot: Option<serde_json::Value>,
}
```

- **New Fields**: `reason_code`, `limit_snapshot`.
- **Reason**: Enable W03 limit monitoring and retrospective audit of risk rejections.

---
Status: IMPLEMENTED
Approval: W02 Gate Rehearsal Pending
