# KPI Charter v3 - Week 3 (Schema Versioning)

## Mục tiêu
Thiết lập KPI cho tuần implementation `schema_version v1`, đo chất lượng migration `v0 -> v1` và mức ổn định contract handshake Python-Rust.

## Quy tắc chung
- KPI tuần 3 phải bám evidence từ schema baseline report, migration plan, issue register, và gate notes.
- KPI đỏ bắt buộc map vào issue có owner + mitigation trong 24h.
- KPI phải cập nhật theo pha, không phụ thuộc lịch thực tế.

## KPI Dictionary

| Nhóm | KPI | Định nghĩa | Data source | Tần suất | Owner |
|---|---|---|---|---|---|
| Reliability | Schema Rerun Stability | % command profile pass theo pha | baseline report command logs | mỗi pha | tester |
| Reliability | P0/P1 Contract Blockers | số mismatch critical còn mở | issue register v3 | mỗi pha | planner |
| Reliability | MTTR Schema Blockers | thời gian xử lý blockers P0 | issue timeline | mỗi pha | ops |
| Contract Quality | V1 Envelope Compliance | % payload có đủ 5 field bắt buộc v1 | audit samples + tests | mỗi pha | coder |
| Contract Quality | Migration Success Rate | % luồng `v0 -> v1` pass compatibility checks | migration validation report | mỗi pha | coder |
| Contract Quality | Mismatch Closure Rate | % mismatch đóng theo severity | issue register v3 | mỗi pha | reviewer |
| Risk | RiskDecision Completeness | % reject có `reason_code` + `limit_snapshot` | risk contract tests | mỗi pha | coder |
| Risk | Reject/Allow Consistency | mức nhất quán quyết định risk theo scenarios | integration results | mỗi pha | reviewer |
| Engineering | Contract Test Pass Rate | tỷ lệ pass tests cho common/signal/risk/execution | `pytest`, `cargo test` | mỗi pha | tester |
| Engineering | Build Compatibility Stability | tỷ lệ pass `cargo check --workspace` | cargo logs | mỗi pha | tester |
| Observability | Trace Envelope Coverage | % events có `trace_id` + `schema_version` | observability logs | mỗi pha | ops |
| Observability | Severity Mapping Consistency | độ nhất quán severity mapping cross-service | logs + spec evidence | mỗi pha | ops |

## KPI Board Layout (chuẩn)
- Cột chính: `KPI`, `Target W3`, `Actual`, `Delta`, `Status`, `Owner`, `Evidence Link`.
- Trạng thái: `green`, `amber`, `red`.
- Evidence bắt buộc: test logs, baseline output hoặc issue ID liên quan.

## Mục tiêu tuần 3
- 100% P0 có owner + mitigation.
- 100% command profile baseline rerun được.
- `W3-ISS-009` đóng trước gate tuần 3.

---
Last updated: 2026-04-23
