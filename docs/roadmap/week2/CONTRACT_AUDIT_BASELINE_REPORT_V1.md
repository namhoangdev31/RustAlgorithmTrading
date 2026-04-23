# Contract Audit Baseline Validation Report v1

**Date**: 2026-04-23
**Harness**: `scripts/contract_audit.sh`
**Evidence Log**: `logs/contract_audit_20260423_094256.log`

## Executive Summary
The automated baseline rerun **PASSED** across all 6 verified boundaries. However, a manual deep-dive into the code revealed significant **semantic and field-level mismatches** that must be resolved in Phase 3 (v1 Interface Spec).

## Boundary Results

| Boundary | Surface | Automated Status | Manual Audit Findings |
|---|---|---|---|
| `W2-BND-001` | Messaging Envelope | `PASSED` | Framing and JSON envelope unified. |
| `W2-BND-002` | Signal Payload | `PASSED` | **MISMATCH**: `direction`/`strength` (Py) vs `action`/`confidence` (Rust). |
| `W2-BND-003` | Risk Decision | `PASSED` | **MISMATCH**: missing `reason_code` and `limit_snapshot` in Rust struct. |
| `W2-BND-004` | Execution Ack | `PASSED` | **MISMATCH**: Python `FillEvent` structure is flatter than Rust `AlpacaOrderResponse`. |
| `W2-BND-005` | Observability | `PASSED` | **MISMATCH**: `correlation_id` (Py) vs `trace_id` (Rust). Timestamp precision drift. |
| `W2-BND-006` | Runtime Policy | `PASSED` | ABI3 policy applied correctly. |

## Critical Mismatches (P0)

### [Signal] Semantic Drift
- **Python**: `Signal(symbol, direction, strength, timestamp)`
- **Rust**: `Signal { symbol, action, confidence, features, timestamp }`
- **Impact**: JSON parsing will fail due to field name mismatch (`direction` vs `action`).

### [Risk] Missing Context
- **Matrix V1 Req**: `decision`, `reason_code`, `limit_snapshot`.
- **Rust Actual**: `approved` (bool), `reason` (Option<String>).
- **Impact**: Auditability and limit verification logic in Python is stalled.

## Next Steps
1. **Triage Cluster**: Group mismatches into `Schema`, `Semantics`, and `Observability`.
2. **Spec Delta**: Draft `INTERFACE_SPEC_DELTA_V1.md` to unify these fields.
3. **Issue Update**: Assign owners in `ISSUE_REGISTER_V2.md`.
