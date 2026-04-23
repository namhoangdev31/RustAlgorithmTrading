# Contract Audit Baseline Validation Report v1 (W02)

**Cycle**: W02 baseline capture
**Harness**: `scripts/contract_audit.sh`
**Evidence Log**: `logs/contract_audit_latest.log`

## Executive Summary
Automated baseline rerun đạt trạng thái `PASSED` ở boundary đã xác minh. Manual deep-dive cho thấy còn mismatch semantics cần xử lý ở W03.

## Boundary Results

| Boundary | Surface | Automated Status | Manual Audit Findings |
|---|---|---|---|
| `W2-BND-001` | Messaging Envelope | `PASSED` | framing và envelope thống nhất |
| `W2-BND-002` | Signal Payload | `PASSED` | mismatch `direction/strength` vs `action/confidence` |
| `W2-BND-003` | Risk Decision | `PASSED` | thiếu `reason_code` và `limit_snapshot` |
| `W2-BND-004` | Execution Ack | `PASSED` | shape giữa Python/Rust chưa đồng bộ hoàn toàn |
| `W2-BND-005` | Observability | `PASSED` | correlation_id implemented and verified across bridge |
| `W2-BND-006` | Runtime Policy | `PASSED` | ABI3 policy áp dụng đúng |

## Critical Mismatches (P0)

### [Signal] Semantic Drift
- Python: `direction`, `strength`
- Rust: `action`, `confidence`
- Impact: parsing drift khi không normalize tại boundary

### [Risk] Missing Context
- Required: `decision`, `reason_code`, `limit_snapshot`
- Actual: `approved`, `reason`
- Impact: auditability không đầy đủ

## Next Steps
1. Triage cluster: `Schema`, `Semantics`, `Observability`.
2. Chốt `INTERFACE_SPEC_DELTA_V1.md`.
3. Gán owners trong `ISSUE_REGISTER_V2.md`.
