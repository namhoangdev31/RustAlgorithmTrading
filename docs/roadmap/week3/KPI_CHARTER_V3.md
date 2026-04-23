# KPI Charter v3 - Week 3 (Schema Versioning)

## Mục tiêu
Thiết lập KPI cho implementation `schema_version v1`, đo chất lượng migration `v0 -> v1`, và kiểm soát drift trong quá trình rollout.

## Quy tắc chung
- KPI tuần 3 phải bám evidence từ baseline/migration/issue/gate.
- KPI đỏ bắt buộc map vào issue có owner + ETA + mitigation.
- Không chốt `GO` nếu KPI gate-critical chưa đạt threshold.

## KPI dictionary

| Nhóm | KPI | Formula | Data source | Ngưỡng cảnh báo | Owner | Gate impact |
|---|---|---|---|---|---|---|
| Reliability | Schema Rerun Stability | `pass_commands / total_commands` | baseline report | < 1.0 | tester | blocking |
| Reliability | P0 Open Count | `count(P0 where status != DONE)` | issue register | > 0 | planner | blocking |
| Reliability | MTTR Schema Blockers | `sum(close_time - open_time)/closed_blockers` | issue timeline | vượt SLA pha | ops | advisory |
| Contract Quality | V1 Envelope Compliance | `valid_v1_messages / total_messages` | contract tests | < 1.0 | coder | blocking |
| Contract Quality | Migration Success Rate | `v0_to_v1_pass / v0_to_v1_total` | migration tests | < 1.0 | coder | blocking |
| Contract Quality | Mismatch Closure Rate | `closed_mismatch / total_mismatch` | issue register | < 0.8 | reviewer | advisory |
| Risk | RiskDecision Completeness | `reject_with_reason_snapshot / reject_total` | risk tests | < 1.0 | coder | blocking |
| Engineering | Contract Test Pass Rate | `passed_tests / total_tests` | pytest + cargo test | < 1.0 | tester | blocking |
| Engineering | Build Compatibility Stability | `successful_checks / total_checks` | cargo check | < 1.0 | tester | blocking |
| Observability | Trace Envelope Coverage | `events_with_trace_schema / total_events` | observability logs | < 1.0 | ops | blocking |
| Observability | Severity Mapping Consistency | `consistent_events / sampled_events` | logs + spec | < 0.95 | ops | advisory |
| Drift Control | Drift Velocity | `new_mismatch_in_phase / planned_mismatch_budget` | issue register | > 0.5 | planner | auto BLOCKED_ENV |
| Drift Control | Mismatch Burn-down Rate | `(closed_mismatch - new_mismatch) / phase` | issue timeline | <= 0 | planner | advisory |

## Auto-block rule
- Nếu `Drift Velocity > 0.5` trong Pha 3: set trạng thái pha = `BLOCKED_ENV`, dừng merge lane mới và quay lại soát spec.

## KPI board layout
- Cột bắt buộc: `KPI`, `Target`, `Actual`, `Status`, `Owner`, `Evidence ID`, `Action`.
- Trạng thái: `GREEN`, `AMBER`, `RED`.

---
Last updated: 2026-04-23
