# KPI Charter Week 3 (One-pass Cutover)

## Mục tiêu
Định nghĩa KPI cho one-pass cutover: ổn định parser, traceability đầy đủ, và watermark hiệu năng dùng cho 21 tuần tiếp theo.

## KPI dictionary

| Nhóm | KPI | Formula | Ngưỡng | Owner | Gate impact |
|---|---|---|---|---|---|
| Reliability | Contract Rerun Stability | `pass_commands / total_commands` | `< 1.0` là đỏ | tester | blocking |
| Reliability | P0 Open Count | `count(P0 status != DONE)` | `> 0` là đỏ | planner | blocking |
| Reliability | Rollback Recovery Time | `minutes_to_restore_baseline` | `>= 5` là đỏ | ops | blocking |
| Contract | Envelope Compliance | `valid_envelopes / total_envelopes` | `< 1.0` là đỏ | coder | blocking |
| Contract | Parser Error Quality | `errors_with_structured_fields / total_errors` | `< 1.0` là đỏ | coder | blocking |
| Contract | Extreme Negative Safety | `extreme_negative_pass / extreme_negative_total` | `< 1.0` là đỏ | tester | blocking |
| Engineering | Contract Test Pass Rate | `passed_tests / total_tests` | `< 1.0` là đỏ | tester | blocking |
| Engineering | Build Stability | `successful_checks / total_checks` | `< 1.0` là đỏ | tester | blocking |
| Observability | Correlation Coverage | `events_with_correlation_id / total_events` | `< 1.0` là đỏ | ops | blocking |
| Observability | Correlation Audit Leak Count | `findings_from_audit_correlation` | `> 0` là đỏ | ops | blocking |
| Observability | Redaction Compliance | `redacted_payload_logs / payload_logs` | `< 1.0` là đỏ | ops | blocking |
| Drift Control | Drift Velocity | `new_mismatch / planned_mismatch_budget` | `> 0.5` auto `BLOCKED_ENV` | planner | auto-block |
| Drift Control | Mismatch Burn-down | `(closed_mismatch - new_mismatch)/phase` | `<= 0` là amber/red | planner | advisory |
| Performance | Bridge Latency Avg (ms) | `mean(python_serialize_to_rust_deserialize_ms)` | phải capture | tester | blocking |
| Performance | Bridge Latency P95 (ms) | `p95(latency_ms)` | phải capture | tester | blocking |
| Performance | Signal->Ack E2E Avg (ms) | `mean(signal_to_ack_ms)` | phải capture | tester | blocking |
| Performance | Signal->Ack E2E P95 (ms) | `p95(signal_to_ack_ms)` | phải capture | tester | blocking |

## KPI board format
- Cột bắt buộc: `KPI`, `Target`, `Actual`, `Status`, `Owner`, `Evidence ID`, `Action`.
- Status: `GREEN`, `AMBER`, `RED`.
- Không ghi `GREEN` nếu chưa có `Evidence ID`.

## Escalation rule
1. Nếu `Drift Velocity > 0.5` thì đặt trạng thái `BLOCKED_ENV`, dừng rollout lane mới.
2. Nếu `Correlation Audit Leak Count > 0`, gate mặc định `NO-GO`.
3. Nếu rollback recovery time >= 5 phút, bắt buộc rehearsal lại trước khi xét gate.

---
Last updated: W03 no-date mode sync
