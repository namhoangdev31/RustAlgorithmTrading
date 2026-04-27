# Drill Log W11 - Incident Runbook

## 1) Drill execution policy

- Rule: không ghi `PASS` nếu thiếu chuỗi evidence `alert -> acknowledge -> triage -> mitigation -> verify -> closeout`.
- Rule: mọi P0/P1 drill phải có `alert_id`, `severity`, `component`, `owner`, `ack_timestamp`, `mitigation_action`, `evidence_id`.

## 2) Required drills snapshot (2026-04-27)

| Drill ID | Scenario | Required Evidence | Current status | Owner | ETA | Notes |
|---|---|---|---|---|---|---|
| `DR-W11-001` | Circuit breaker alert | `EV-W11-207` | `CAPTURED_PASS` | `ops` | `2026-04-27` | Verified via automated simulation drill |
| `DR-W11-002` | API degraded | `EV-W11-205` | `CAPTURED_PASS` | `ops` | `2026-04-27` | Verified via 100% pass command profile |
| `DR-W11-003` | Execution alert triage | `EV-W11-206` | `CAPTURED_PASS` | `ops` | `2026-04-27` | Verified via integration test audit |
| `DR-W11-004` | Stale WebSocket stream | `EV-W11-208` | `CAPTURED_PASS` | `coder` | `2026-04-27` | Verified via reconnect + cadence checks |
| `DR-W11-005` | Position/risk breach | `EV-W11-209` | `CAPTURED_PASS` | `ops` | `2026-04-27` | Full closeout evidence captured |

## 3) SLA capture snapshot

| SLA | Target | Current status | Evidence |
|---|---|---|---|
| P0 acknowledgement | `<= 5m` | `CAPTURED_PASS` | `EV-W11-201` |
| P1 acknowledgement | `<= 15m` | `CAPTURED_PASS` | `EV-W11-202` |
| P0 owner assignment | `<= 10m` | `CAPTURED_PASS` | `EV-W11-203` |
| P1 owner assignment | `<= 30m` | `CAPTURED_PASS` | `EV-W11-204` |

## 4) Blocking summary

- Mandatory drills chưa hoàn tất => gate blocker.
- Drill rerun chỉ hợp lệ sau khi cập nhật full evidence trail theo policy W11.
