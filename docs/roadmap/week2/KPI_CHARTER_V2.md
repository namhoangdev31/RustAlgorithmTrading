# KPI Charter v2 - Week 2 (2026-04-27 to 2026-05-03)

## Mục tiêu
Thiết lập bộ KPI contract-focused để đo chất lượng Contract Audit tuần 2 và làm gate Go/No-Go cho tuần 3 (Schema Versioning).

## Quy tắc chung
- KPI tuần 2 phải bám trực tiếp vào evidence contract audit (command output/log/spec delta/issue register).
- Mỗi KPI phải có owner cập nhật EOD.
- KPI đỏ phải map vào issue có owner + ETA trong 24h.

## KPI Dictionary

| Nhóm | KPI | Định nghĩa | Data source | Tần suất | Owner |
|---|---|---|---|---|---|
| Reliability | Contract Rerun Stability | % command baseline rerun thành công theo ngày | baseline report command logs | EOD | tester |
| Reliability | P0/P1 Mismatch Count | Tổng mismatch critical theo ngày | issue register | EOD | planner |
| Reliability | MTTR Contract Blockers | Thời gian xử lý mismatch P0 | issue timeline | EOD | ops |
| Contract Quality | Inventory Coverage | % boundary Python-Rust có owner file + test path | compatibility matrix | EOD | planner |
| Contract Quality | Schema Version Compliance | % payload contract có `schema_version` theo audit sample | audit report + logs | EOD | coder |
| Contract Quality | Mismatch Closure Rate | % mismatch đóng theo severity | issue register v2 | EOD | reviewer |
| Risk | RiskDecision Completeness | Tỷ lệ reject có `reason_code` + `limit_snapshot` | audit sample payload | EOD | coder |
| Risk | Risk Contract Drift Count | Số mismatch semantics trong risk contract | issue register v2 | EOD | reviewer |
| Engineering | Contract Test Pass Rate | tỷ lệ pass contract-related tests | `pytest`, `cargo test` slices | EOD | tester |
| Engineering | Build Compatibility Stability | tỷ lệ pass `cargo check` theo policy đã chốt | `cargo check` logs | EOD | tester |
| Engineering | Regression Count | số regression sau cập nhật spec/policy | test rerun summary | EOD | tester |
| Observability | Trace Field Coverage | % event có `trace_id` + `schema_version` | logs + observability samples | EOD | ops |
| Observability | Event Envelope Completeness | % event có đủ field bắt buộc | audit samples | EOD | ops |
| Observability | Severity Mapping Consistency | mức nhất quán severity theo mapping chuẩn | logs + spec delta | EOD | reviewer |

## KPI Board Layout (chuẩn)
- Cột chính: `KPI`, `Target W2`, `Actual`, `Delta`, `Status`, `Owner`, `Evidence Link`.
- Trạng thái: `green`, `amber`, `red`.
- Evidence bắt buộc: command output/log snapshot hoặc issue ID liên quan.

## Mục tiêu tuần 2 (baseline targets)
- 100% boundary critical có inventory mapping.
- 100% mismatch P0 có owner + ETA + mitigation.
- Contract baseline command set rerun được theo policy đã chốt.

---
Last updated: 2026-04-23
