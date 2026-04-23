# Execution Plan 24 Tuần (20/04/2026-04/10/2026)

## 1) Tóm tắt điều hành

Mục tiêu của kế hoạch này là đưa hệ thống giao dịch hybrid Python-Rust từ trạng thái "paper-trading ổn định" tới trạng thái "controlled live ready", theo hướng Balanced Delivery:

- Ổn định luồng runtime và contract Python-Rust.
- Hardening Risk/Execution để giảm lỗi vận hành.
- Chuẩn hóa observability và vận hành theo SLO.
- Triển khai canary live có guardrail và rollback rõ ràng.

Khung vận hành xuyên suốt:

- `Doc -> Code -> Test` cho mọi thay đổi.
- Gate hàng tuần (weekly exit criteria).
- Gate theo phase 4 tuần (go/no-go).

## 2) Thay đổi kỹ thuật cốt lõi (interfaces/types)

Các thay đổi dưới đây là deliverable kỹ thuật bắt buộc trong roadmap:

1. `schema_version` cho ZMQ contract giữa các service.
2. Chuẩn hóa `RiskDecision`:

- `decision`: approve/reject
- `reason_code`
- `limit_snapshot`

1. Chuẩn hóa `ExecutionAck`:

- `order_id`
- `route`
- `latency_bucket`
- `retry_count`

1. Chuẩn hóa `ObservabilityEvent` envelope:

- `trace_id`
- `component`
- `severity`
- `timestamp`
- `payload`

## 3) Kế hoạch theo tuần (24 tuần)

| Tuần | Ngày | Trọng tâm | Deliverable tuần | Exit criteria |
|---|---|---|---|---|
| 1 | 20/04-26/04 | Baseline & KPI | Chốt KPI vận hành/research/risk; dashboard baseline | KPI board chạy, số liệu hằng ngày đầy đủ |
| 2 | 27/04-03/05 | Contract audit | Audit Python-Rust contracts + danh sách mismatch | Không còn mismatch P0 chưa owner |
| 3 | 04/05-10/05 | Schema versioning | Thiết kế `schema_version` + migration plan | Contract test pass với versioned schema |
| 4 | 11/05-17/05 | Integration stabilization | Sửa handoff signal/execution path | Integration critical path pass ổn định |
| 5 | 18/05-24/05 | Risk limits v1 | Per-symbol/per-strategy limits | Reject đúng policy trong test suite |
| 6 | 25/05-31/05 | Stop-loss coherence | Đồng bộ stop-loss Python/Rust | Stop-loss regression tests pass |
| 7 | 01/06-07/06 | Circuit breaker hardening | Ngưỡng trip/recover + cooldown rules | Chaos test không gây loop trip |
| 8 | 08/06-14/06 | Execution retry/slippage | Retry policy + slippage guardrails | Retry/slippage tests pass, no duplicate order |
| 9 | 15/06-21/06 | Observability schema | `ObservabilityEvent` envelope thống nhất | Log/metric/tracing mapping đầy đủ |
| 10 | 22/06-28/06 | API health + SLO | SLO cho market/risk/execution/obs APIs | Alert rules hoạt động, no false-positive lớn |
| 11 | 29/06-05/07 | Incident runbook | Runbook P0/P1 + escalation matrix | On-call drill pass trong thời gian mục tiêu |
| 12 | 06/07-12/07 | Ops readiness gate | Gate paper-trading readiness phase 1 | MTTR/alert quality đạt ngưỡng đã chốt |
| 13 | 13/07-19/07 | Strategy governance | Checklist OOS/walk-forward bắt buộc | Strategy nào thiếu OOS bị block deploy |
| 14 | 20/07-26/07 | Portfolio controls | Exposure net/gross + concentration caps | Portfolio risk tests pass |
| 15 | 27/07-02/08 | Capital allocation | Position sizing theo volatility/regime | Drawdown paper giảm theo target |
| 16 | 03/08-09/08 | Research reproducibility | Backtest reproducibility pack + seed control | Re-run sai số trong ngưỡng định nghĩa |
| 17 | 10/08-16/08 | Staging hardening | Staging soak test 5 ngày liên tục | Không lỗi P0/P1 chưa xử lý |
| 18 | 17/08-23/08 | Canary design | Kịch bản canary live (small capital) + rollback | Rollback drill pass end-to-end |
| 19 | 24/08-30/08 | Safety guardrails | Kill-switch + risk-off playbook | Kill-switch test pass < target time |
| 20 | 31/08-06/09 | Canary launch | Bật canary live phạm vi hẹp | Không vi phạm risk boundary |
| 21 | 07/09-13/09 | Canary tuning | Tuning theo slippage/fill-quality thực tế | Fill quality cải thiện tuần-over-tuần |
| 22 | 14/09-20/09 | Scale readiness | Kế hoạch scale symbols/strategies | Capacity test pass theo target throughput |
| 23 | 21/09-27/09 | Reliability hardening | DR drill + backup/restore verification | DR đạt RTO/RPO mục tiêu |
| 24 | 28/09-04/10 | Quarter closeout | Báo cáo tổng kết + kế hoạch Q tiếp theo | Gate "controlled live ready" được thông qua |

## 4) Phase gate theo chu kỳ 4 tuần

- Phase 1 (Tuần 1-4): Contract + integration baseline gate.
- Phase 2 (Tuần 5-8): Risk + execution hardening gate.
- Phase 3 (Tuần 9-12): Observability + operations readiness gate.
- Phase 4 (Tuần 13-16): Strategy governance + portfolio controls gate.
- Phase 5 (Tuần 17-20): Staging hardening + canary launch gate.
- Phase 6 (Tuần 21-24): Canary tuning + reliability + closeout gate.

Mỗi gate gồm:

1. Đánh giá KPI.
2. Tổng hợp lỗi P0/P1 còn mở.
3. Quyết định Go/No-Go.
4. Action list cho phase kế tiếp.

## 5) Test plan và kịch bản nghiệm thu

Mức tối thiểu mỗi tuần:

- Unit tests (Python + Rust).
- Integration tests theo module thay đổi.
- Targeted performance checks cho luồng bị tác động.

Kịch bản bắt buộc xuyên suốt:

1. Signal handoff integrity (Python <-> Rust).
2. Risk reject/allow correctness.
3. Retry/slippage/order lifecycle correctness.
4. Observability completeness (traceability từ signal tới execution).
5. Incident + rollback drill (từ tuần 11 trở đi).

Điều kiện hoàn thành roadmap:

- Không còn P0 mở quá 7 ngày.
- Canary/live không vượt risk boundary.
- Dashboard SLO + runbook vận hành đạt tiêu chuẩn tuần 1.

## 6) KPI vận hành đề xuất theo dõi hằng tuần

- Reliability:
- service uptime trong market hours
- incident P0/P1 count
- MTTR
- Trading quality:
- reject rate
- duplicate order rate
- fill quality trend
- Risk:
- breach count theo limit type
- drawdown và daily loss guardrail adherence
- Engineering quality:
- pass rate unit/integration
- regression count sau release
- Observability:
- coverage của trace_id qua các service
- alert precision (false-positive/false-negative)

## 7) Assumptions và defaults đã khóa

- Hướng triển khai: Balanced Delivery.
- Scope docs: tạo file roadmap mới + cập nhật index links.
- Mốc thời gian: bắt đầu Thứ Hai 20/04/2026, kéo dài 24 tuần.
- Ngôn ngữ tài liệu: tiếng Việt, ưu tiên dễ chuyển thành báo cáo kỹ thuật.

## Companion plans

- [WEEK1_OPERATIONS_PLAN_2026-04-20_to_2026-04-26.md](WEEK1_OPERATIONS_PLAN_2026-04-20_to_2026-04-26.md)

---

Last updated: 2026-04-14
