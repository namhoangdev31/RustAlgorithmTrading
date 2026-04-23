# KPI Charter v1 - Week 1 (2026-04-20 to 2026-04-26)

## Mục tiêu
Thiết lập bộ KPI đo được hằng ngày để làm nền cho gate Go/No-Go cuối tuần 1 và Contract Audit tuần 2.

## Quy tắc chung
- Nguồn dữ liệu phải truy xuất được bằng command hoặc log path cụ thể.
- KPI tuần 1 dùng để baseline, chưa phải target production cuối cùng.
- Mọi KPI phải có owner chịu trách nhiệm cập nhật EOD.

## KPI Dictionary

| Nhóm | KPI | Định nghĩa | Data source | Tần suất | Owner |
|---|---|---|---|---|---|
| Reliability | Service Uptime (market-hours) | % thời gian service chạy trong phiên | `scripts/health_check.sh`, process table | 2 lần/ngày + EOD | ops |
| Reliability | Incident Count P0/P1 | Tổng số incident mức P0/P1 trong ngày | Issue board + runbook log | EOD | ops |
| Reliability | MTTR Baseline | Thời gian trung bình khôi phục sự cố | incident timeline | EOD | ops |
| Trading Quality | Reject Rate | `rejected_orders / total_orders` | execution log/API metrics | EOD | reviewer |
| Trading Quality | Duplicate Order Rate | % lệnh trùng trên tổng lệnh | execution log + order IDs | EOD | reviewer |
| Trading Quality | Fill Quality Trend | Biến động chất lượng fill theo ngày | execution metrics | EOD | researcher |
| Risk | Risk Breach Count | Số lần vi phạm limit theo loại | risk-manager logs/events | EOD | coder |
| Risk | Daily Loss Guardrail Adherence | Có vượt ngưỡng daily loss không | risk events + PnL report | EOD | coder |
| Risk | Drawdown Snapshot | Drawdown cao nhất trong ngày | PnL/portfolio reports | EOD | coder |
| Engineering | Unit Pass Rate | tỷ lệ pass unit test theo nhóm | `pytest`, `cargo test` | EOD | tester |
| Engineering | Integration Pass Rate | tỷ lệ pass integration test | `pytest integration`, `cargo test --workspace` | EOD | tester |
| Engineering | Build Stability | Kết quả compile/check workspace | `cargo check --workspace` | EOD | tester |
| Observability | Trace Coverage | mức hiện diện `trace_id` xuyên luồng | observability logs + API | EOD | ops |
| Observability | Alert Freshness | thời gian từ sự kiện tới alert | monitoring/alert logs | EOD | ops |
| Observability | Log Completeness | mức đầy đủ log theo service | `logs/*.log` + service status | EOD | ops |

## KPI Board Layout (chuẩn)
- Cột chính: `KPI`, `Target W1`, `Actual`, `Delta`, `Status`, `Owner`, `Evidence Link`.
- Trạng thái: `green` (đạt), `amber` (lệch nhẹ), `red` (không đạt).
- Evidence bắt buộc: command output/log snapshot hoặc issue ID liên quan.

## Mục tiêu tuần 1 (baseline targets)
- Có đủ dữ liệu cho 100% KPI mỗi ngày.
- Không có KPI thiếu evidence ở EOD.
- Các KPI đỏ phải map vào issue có owner + ETA trong 24h.

---
Last updated: 2026-04-14
