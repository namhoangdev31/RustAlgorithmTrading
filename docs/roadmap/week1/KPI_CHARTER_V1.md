# KPI Charter v1 - Week 1 (No-Date Mode)

## Mục tiêu
Thiết lập bộ KPI đo được theo chu kỳ để làm nền cho gate Go/No-Go W01 và Contract Audit W02.

## Quy tắc chung
- Nguồn dữ liệu phải truy xuất được bằng command hoặc log path cụ thể.
- KPI W01 là baseline, chưa phải target production cuối cùng.
- KPI đỏ phải map vào issue có owner + ETA trong 24h.

## KPI Dictionary

| Nhóm | KPI | Định nghĩa | Data source | Tần suất | Owner |
|---|---|---|---|---|---|
| Reliability | Service Uptime (market-hours) | % thời gian service chạy trong phiên | `scripts/health_check.sh` | theo chu kỳ + EOD | ops |
| Reliability | Incident Count P0/P1 | Tổng incident P0/P1 | issue board + runbook log | EOD | ops |
| Reliability | MTTR Baseline | Thời gian khôi phục sự cố trung bình | incident timeline | EOD | ops |
| Trading Quality | Reject Rate | `rejected_orders / total_orders` | execution log/API metrics | EOD | reviewer |
| Trading Quality | Duplicate Order Rate | % lệnh trùng trên tổng lệnh | execution logs | EOD | reviewer |
| Risk | Risk Breach Count | Số lần vi phạm limit theo loại | risk logs/events | EOD | coder |
| Risk | Daily Loss Guardrail Adherence | Có vượt ngưỡng daily loss không | risk events + PnL report | EOD | coder |
| Engineering | Compile/Static Pass Rate | tỷ lệ pass compile + static checks | `cargo check`, static audit | EOD | tester |
| Engineering | Smoke Runtime Pass Rate | tỷ lệ pass smoke path critical | smoke run logs | EOD | tester |
| Observability | Correlation Coverage | mức hiện diện `correlation_id` xuyên luồng | observability logs + API | EOD | ops |
| Observability | Log Completeness | mức đầy đủ log theo service | `logs/*.log` + service status | EOD | ops |

## KPI Board Layout (chuẩn)
- Cột chính: `KPI`, `Target W01`, `Actual`, `Delta`, `Status`, `Owner`, `Evidence Link`.
- Trạng thái: `GREEN`, `AMBER`, `RED`.
- Evidence bắt buộc: command output/log snapshot hoặc issue ID liên quan.

## Baseline targets W01
- Có dữ liệu cho 100% KPI theo chu kỳ vận hành.
- Không có KPI thiếu evidence ở EOD.
- KPI đỏ phải có mitigation path trước gate cuối tuần.

---
Last updated: W01 no-date mode sync
