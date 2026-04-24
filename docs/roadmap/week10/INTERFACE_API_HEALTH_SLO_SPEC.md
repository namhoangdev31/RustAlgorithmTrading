# Interface API Health & SLO Spec (Week 10)

## 1) Contract freeze

Public envelope giữ nguyên:

```json
{
  "schema_version": "v1.0.0",
  "correlation_id": "string",
  "event_type": "string",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

W10 không đổi public wire-shape. Nếu cần đổi API response shape hoặc alert schema để đạt correctness, mở `CR-W10-001` và ưu tiên compatibility adapter.

## 2) API health endpoint contract

| Endpoint | Required behavior | Required evidence |
|---|---|---|
| `/health` | returns service status, no dependency-heavy checks | `EV-W10-201` |
| `/health/ready` | returns 200 only when required collectors/dependencies ready; 503 otherwise | `EV-W10-202` |
| `/health/live` | returns process liveness, websocket connection count, uptime context | `EV-W10-203` |
| `/api/system/health` | returns comprehensive system health with stable schema | `EV-W10-204` |
| `/api/system/components` | returns component status and degraded/error reason | `EV-W10-205` |
| `/api/system/alerts/acknowledge/{alert_id}` | returns structured acknowledgement and alert id | `EV-W10-210` |
| `/ws/metrics` | supports heartbeat ping/pong and stream cadence evidence | `EV-W10-206` |

## 3) SLO dictionary

- API health p95 latency: `/health <=100ms` local/test profile.
- System health p95 latency: `/api/system/health <=250ms` local/test profile.
- Readiness correctness: `100%` expected ready/not-ready scenarios.
- Liveness correctness: `100%` expected live scenarios.
- WebSocket heartbeat success: `>=99%` sample or no missed heartbeat in test slice.
- Event-to-alert latency: `<=120s` temporary W10 target.
- Alert false-positive sample: `<=15%`.
- Critical alert false-negative: `=0`.
- Dashboard SLO panel availability: `>=95%`.

## 4) Alert profile contract

Alert events must reuse W09 observability taxonomy:

- `component`
- `severity`
- `reason_code`
- `source_event_id`
- `correlation_id` if alert is scoped to a request/order/signal/risk/execution event
- `timestamp`
- `disposition` if alert comes from allow/retry/reject/drop-safe state

Rules:

1. `CRITICAL` source events must not be missed.
2. Repeated `WARN` alerts need thresholding to avoid spam.
3. Acknowledgement must be traceable by alert id.
4. Alert sample methodology must be recorded in baseline/final report.

## 5) File-level edit contract

| File/path | Allowed change | Forbidden change |
|---|---|---|
| `src/observability/api/main.py` | health/readiness/liveness metadata and correctness hardening | changing trading behavior |
| `src/observability/api/routes/system.py` | component health/alert acknowledgement schema adapters | breaking response shape without `CR-W10-001` |
| `src/observability/api/websocket_manager.py` | heartbeat/stale stream SLO checks | noisy reconnect or spam alert behavior |
| `src/observability/metrics/system_collector.py` | component readiness/health data mapping | fake healthy state |
| `src/observability/dashboard/src/*` | SLO panel data binding | dashboard-only schema drift |
| `scripts/health_check.sh` | clearer SLO evidence output | hiding failing service |
| `scripts/compliance_audit.sh` | stronger alert/SLO audit checks | pass missing critical fields |

## 6) Error-handling protocol

- Không panic.
- Readiness must fail closed if dependencies are unknown or unavailable.
- Liveness must stay lightweight; do not add dependency-heavy checks to `/health/live`.
- Alerts must include enough context to support W11 incident runbook.
- Alert spam and critical false-negative both block W10 gate.
