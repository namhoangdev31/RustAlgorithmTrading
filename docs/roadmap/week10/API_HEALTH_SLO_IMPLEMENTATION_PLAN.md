# API Health & SLO Implementation Plan (Week 10)

## Summary

Triển khai API Health & SLO theo hướng thay đổi tối thiểu, tập trung health/readiness/liveness, component health, WebSocket heartbeat, alert quality, dashboard SLO panels và evidence cho W11 Incident Runbook.

## File-level implementation guide

| File | Cần sửa nếu evidence fail | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `src/observability/api/main.py` | health/ready/live response correctness, latency context | optional SLO metadata if compatible | đổi trading behavior hoặc public envelope | API health tests | `EV-W10-201..203`,`EV-W10-301` |
| `src/observability/api/routes/system.py` | system health/components/alerts schema stability | structured alert acknowledgement if needed | breaking response shape without CR | system route tests | `EV-W10-204..205`,`EV-W10-210` |
| `src/observability/api/websocket_manager.py` | heartbeat/stale connection handling | heartbeat metrics if needed | spam reconnect/alert noise | WebSocket tests | `EV-W10-206`,`EV-W10-303` |
| `src/observability/metrics/system_collector.py` | component readiness/health signal mapping | SLO sample fields if needed | fake healthy status | health/SLO checks | `EV-W10-205`,`EV-W10-302` |
| `src/observability/metrics/*` | SLO metric mapping for dashboard | adapter for SLO panels if needed | rename fields without adapter | dashboard availability | `EV-W10-211`,`EV-W10-305` |
| `src/observability/dashboard/src/*` | SLO panel data binding | API health/component/alert panels if needed | dashboard-only schema drift | panel availability checks | `EV-W10-211`,`EV-W10-305` |
| `scripts/health_check.sh` | health evidence if too shallow | SLO output section if needed | hide failing service | runtime health check | `EV-W10-108` |
| `scripts/compliance_audit.sh` | correlation/version checks for SLO/alerts if weak | W10 alert/SLO mode if needed | pass missing critical context | compliance audit | `EV-W10-109` |
| `scripts/audit_correlation.py` | include API health/alert source paths if weak | SLO/alert source scan if needed | scan generated/build artifacts | source audit | `EV-W10-110` |
| `PLAYBOOK.md` | sync file mapping khi tạo file mới | file role/test mapping | bỏ qua file mới | doc/code/test mapping | `EV-W10-402` |

## Dependency matrix

| Lane | Depends on | Unlocks | Hard stop if fail |
|---|---|---|---|
| Lane 1: Health endpoint SLO | baseline evidence | readiness/live hardening | health endpoints unavailable |
| Lane 2: Component health | Lane 1 | dashboard SLO panel | component status unknown/wrong |
| Lane 3: WebSocket heartbeat | Lane 1 | real-time SLO panel | stale stream undetected |
| Lane 4: Alert quality | W09 taxonomy + lanes 1-3 | W11 runbook | critical false-negative |
| Lane 5: Dashboard SLO | lanes 1-4 | final gate | SLO panels unavailable |

## SLO dictionary

| SLO | Target | Evidence |
|---|---|---|
| API Health Latency | `/health` p95 `<=100ms` | `EV-W10-201` |
| Readiness Correctness | ready/not-ready scenarios `100%` | `EV-W10-202` |
| Liveness Correctness | live state scenarios `100%` | `EV-W10-203` |
| System Health Latency | `/api/system/health` p95 `<=250ms` | `EV-W10-204` |
| WebSocket Heartbeat | success `>=99%` sample | `EV-W10-206` |
| Event-to-alert Latency | `<=120s` temporary W10 target | `EV-W10-207` |
| Alert False Positive | `<=15%` sample | `EV-W10-208` |
| Critical False Negative | `=0` | `EV-W10-209` |
| Dashboard SLO Availability | `>=95%` | `EV-W10-211` |

## Alert profile policy

1. Alerts must reuse W09 taxonomy: `component`, `severity`, `reason_code`, `source_event_id`, optional event-scoped `correlation_id`.
2. `CRITICAL` source events must produce alert evidence; false-negative critical `=0`.
3. Repeated `WARN` events can alert only after threshold; avoid spam alerts.
4. False-positive sample must be measured with sample size and method.
5. Alert acknowledgement must return structured status and alert id.

## Dashboard SLO panel requirements

| Panel | Required source |
|---|---|
| API health status | `/health`, `/health/ready`, `/health/live` |
| Component health | `/api/system/components` or `/api/system/health` |
| Event-to-alert latency | alert sample/events |
| Alert quality | false-positive/false-negative sample |
| WebSocket stream health | `/ws/metrics` heartbeat/stream stats |

## Rollback strategy

| Lane | Rollback trigger | Rollback action | Evidence |
|---|---|---|---|
| Health endpoint SLO | endpoint response regression | revert endpoint adapter only | rerun `EV-W10-201..203` |
| Component health | false healthy/degraded state | revert component mapping, keep failing fixture | rerun `EV-W10-205` |
| WebSocket heartbeat | stale stream or connection regression | revert heartbeat patch, keep stale-stream test | rerun `EV-W10-206` |
| Alert profile | alert spam or critical miss | block gate, patch profile before dashboard polish | rerun `EV-W10-208..210` |
| Dashboard SLO | panel data drift | revert UI adapter, preserve API evidence | rerun `EV-W10-211` |

## Lane outcomes (initial)

| Lane | Outcome | Status | Evidence |
|---|---|---|---|
| Lane 1 | Health endpoint SLO | `PENDING_EXECUTION` | `EV-W10-201..203`,`EV-W10-301` |
| Lane 2 | Component health SLO | `PENDING_EXECUTION` | `EV-W10-204..205`,`EV-W10-302` |
| Lane 3 | WebSocket heartbeat SLO | `PENDING_EXECUTION` | `EV-W10-206`,`EV-W10-303` |
| Lane 4 | Alert quality | `PENDING_EXECUTION` | `EV-W10-207..210`,`EV-W10-304` |
| Lane 5 | Dashboard SLO/artifact reconciliation | `PENDING_EXECUTION` | `EV-W10-211`,`EV-W10-305..306` |
