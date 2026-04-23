# KPI Charter v2 - Week 2 (No-Date Mode)

## Mục tiêu
Thiết lập bộ KPI contract-focused để đo chất lượng Contract Audit W02 và làm gate Go/No-Go cho W03.

## Quy tắc chung
- KPI W02 phải bám evidence contract audit.
- Mỗi KPI có owner cập nhật theo chu kỳ.
- KPI đỏ phải map vào issue có owner + ETA trong 24h.

## KPI Dictionary

| Nhóm | KPI | Định nghĩa | Data source | Tần suất | Owner |
|---|---|---|---|---|---|
| Reliability | Contract Rerun Stability | % command baseline rerun thành công | baseline report logs | EOD | tester |
| Reliability | P0/P1 Mismatch Count | Tổng mismatch critical | issue register | EOD | planner |
| Reliability | MTTR Contract Blockers | Thời gian xử lý mismatch P0 | issue timeline | EOD | ops |
| Contract Quality | Inventory Coverage | % boundary có owner file + test path | compatibility matrix | EOD | planner |
| Contract Quality | Schema Version Compliance | % payload contract có `schema_version` | audit report + logs | EOD | coder |
| Contract Quality | Mismatch Closure Rate | % mismatch đóng theo severity | issue register v2 | EOD | reviewer |
| Risk | RiskDecision Completeness | tỷ lệ reject có `reason_code` + `limit_snapshot` | payload samples | EOD | coder |
| Engineering | Contract Test Readiness | mức sẵn sàng test theo codebase mới | unit/integration slices | EOD | tester |
| Engineering | Build Compatibility Stability | tỷ lệ pass `cargo check` theo policy | build logs | EOD | tester |
| Observability | Correlation Field Coverage | % event có `correlation_id` + `schema_version` | logs + samples | EOD | ops |
| Observability | Event Envelope Completeness | % event đủ field bắt buộc | audit samples | EOD | ops |

## KPI Board Layout
- Cột chính: `KPI`, `Target W02`, `Actual`, `Delta`, `Status`, `Owner`, `Evidence Link`.
- Trạng thái: `GREEN`, `AMBER`, `RED`.

## Baseline targets W02
- 100% boundary critical có inventory mapping.
- 100% mismatch P0 có owner + ETA + mitigation.
- Contract baseline command set rerun được theo policy đã chốt.

---
Last updated: W02 no-date mode sync
