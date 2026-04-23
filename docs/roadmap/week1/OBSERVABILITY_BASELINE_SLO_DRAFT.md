# Observability Baseline + SLO Draft (Week 1)

## Baseline snapshot

Input evidence:
- `bash scripts/health_check.sh`
- `docs/operations/OPERATIONS_RUNBOOK.md`

Current observed state:
- Runtime services (`market-data`, `risk-manager`, `execution-engine`, `signal-bridge`) chưa chạy.
- health script đọc config thành công, nhưng chưa có runtime metrics/log throughput để đánh giá sâu.
- Runbook có gap TODO: check circuit breaker status API call.

## Gaps identified

| Gap ID | Gap | Severity | Owner | Target |
|---|---|---|---|---|
| `W1-GAP-OBS-001` | Service status red (all core services down) | P0 | ops | 22/04 |
| `W1-GAP-OBS-002` | Circuit breaker check procedure còn TODO trong runbook | P1 | ops | 24/04 |
| `W1-GAP-OBS-003` | Chưa có trace coverage evidence xuyên signal->execution | P1 | reviewer | 25/04 |

## SLO draft (temporary for week 1)

### SLO-R1: Runtime availability (market-hours)
- Objective: >= 95% (week-1 temporary)
- Measurement: process health snapshots + service logs
- Alert: bất kỳ service core down > 5 phút

### SLO-O1: Alert freshness
- Objective: event-to-alert <= 2 phút (week-1 temporary)
- Measurement: timestamp trong logs/alerts
- Alert: p95 > 2 phút

### SLO-I1: Incident response latency
- Objective: MTTR baseline <= 60 phút (week-1 temporary)
- Measurement: incident timeline từ open đến mitigated
- Alert: incident > 60 phút chưa mitigated

### SLO-T1: Trace coverage
- Objective: >= 80% events có trace_id (week-1 temporary)
- Measurement: sampled log events
- Alert: coverage < 80%

## Operationalization tasks for week 1
- Bổ sung command kiểm tra circuit breaker status vào runbook.
- Chạy smoke runtime ít nhất 1 lần/ngày và ghi evidence path.
- Chuẩn hóa log snapshot format trong EOD report.

---
Last updated: 2026-04-14
