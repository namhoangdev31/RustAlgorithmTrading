# Observability Baseline + SLO Draft (W01)

## Baseline snapshot

Input evidence:

- `bash scripts/health_check.sh`
- `docs/operations/OPERATIONS_RUNBOOK.md`

Current observed state:

- Core runtime cần theo dõi liên tục theo chu kỳ.
- Health script cung cấp trạng thái service và nguồn dữ liệu cơ bản.
- Runbook vẫn cần hoàn thiện một số bước vận hành.

## Gaps identified

| Gap ID | Gap | Severity | Owner | ETA |
|---|---|---|---|---|
| `W1-GAP-OBS-001` | Service status chưa ổn định ở mọi chu kỳ | P0 | ops | `W01-D3` |
| `W1-GAP-OBS-002` | Procedure check circuit breaker chưa đầy đủ | P1 | ops | `W01-D5` |
| `W1-GAP-OBS-003` | Thiếu evidence correlation continuity xuyên signal->execution | P1 | reviewer | `W01-D6` |

## SLO draft (temporary for W01)

### SLO-R1: Runtime availability (market-hours)

- Objective: >= 95% (W01 temporary)
- Measurement: process health snapshots + service logs
- Alert: bất kỳ service core down > 5 phút

### SLO-O1: Alert freshness

- Objective: event-to-alert <= 2 phút (W01 temporary)
- Measurement: timestamp trong logs/alerts
- Alert: p95 > 2 phút

### SLO-I1: Incident response latency

- Objective: MTTR baseline <= 60 phút (W01 temporary)
- Measurement: incident timeline từ open đến mitigated
- Alert: incident > 60 phút chưa mitigated

### SLO-T1: Correlation coverage

- Objective: >= 80% events có `correlation_id` (W01 temporary)
- Measurement: sampled log events (`grep -r "correlation_id" logs/`)
- Actual W01: `0%` (Evidence: baseline grep findings 0 lines)
- Alert: coverage < 80%

## Operationalization tasks

- **P0**: Bổ sung `correlation_id` vào middleware/bridge logs ngay trong D1-W02.
- Bổ sung command kiểm tra circuit breaker status vào runbook.
- Chạy smoke runtime ít nhất 1 lần/chu kỳ và ghi evidence path.
- Chuẩn hóa log snapshot format trong EOD report.

---
Last updated: W01 no-date mode sync
