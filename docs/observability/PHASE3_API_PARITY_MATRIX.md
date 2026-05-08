# Phase 3 API Parity Matrix (FastAPI -> Go)

Updated: 2026-05-08
Scope: Control-plane observability API/WebSocket only

Execution status:
- Functional parity run is green (see `docs/roadmap/PHASE3_GO_NO_GO_EVIDENCE.md`).
- Production cutover verdict remains **NO-GO** until soak + rollback drill complete and DuckDB compatibility blocker is resolved.

## Contract Rules

- Strategy/risk/execution trading decisions remain outside Go.
- Public cross-runtime envelope remains unchanged:
  - `schema_version`
  - `correlation_id`
  - `event_type`
  - `timestamp`
  - `payload`

## Endpoint Matrix

| Endpoint | Method | FastAPI v1 | Go v1 | Notes |
|---|---|---|---|---|
| `/` | GET | ✅ | ✅ | Root service metadata |
| `/health` | GET | ✅ | ✅ | Basic health |
| `/health/ready` | GET | ✅ | ✅ | 200/503 readiness |
| `/health/live` | GET | ✅ | ✅ | Liveness + WS count |
| `/api/metrics/current` | GET | ✅ | ✅ | Current snapshot |
| `/api/metrics/history` | POST | ✅ | ✅ | Historical query window |
| `/api/metrics/symbols` | GET | ✅ | ✅ | Symbols list |
| `/api/metrics/summary` | GET | ✅ | ✅ | High-level summary |
| `/api/trades/` | GET | ✅ | ✅ | Trade history filters |
| `/api/trades/{trade_id}` | GET | ✅ | ✅ | 200/404 detail |
| `/api/trades/stats/summary` | GET | ✅ | ✅ | Trade stats |
| `/api/trades/execution/quality` | GET | ✅ | ✅ | Execution quality |
| `/api/system/health` | GET | ✅ | ✅ | System health payload |
| `/api/system/performance` | GET | ✅ | ✅ | Performance history |
| `/api/system/components` | GET | ✅ | ✅ | Component status |
| `/api/system/logs/recent` | GET | ✅ | ✅ | Recent logs |
| `/api/system/alerts/acknowledge/{id}` | POST | ✅ | ✅ | Ack response |
| `/api/system/stats` | GET | ✅ | ✅ | Runtime stats |
| `/ws/metrics` | WS | ✅ | ✅ | 10Hz broadcast + ping/pong |

## Behavior Parity Notes

- Auth policy v1: `X-API-Key` enforced only when `OBSERVABILITY_API_KEY` is configured.
- Rate limiting v1: key/IP scoped limiter (429 JSON response).
- CORS origins v1:
  - `http://localhost:3000`
  - `http://localhost:5173`
- WebSocket parity:
  - initial `connected` payload
  - supports `ping` -> `pong`
  - periodic metrics fanout at 10Hz target.

## Out-of-Scope (Phase 3 v1)

- No Go ownership of strategy generation, risk decisions, order execution, or broker routing.
- No transport migration to gRPC runtime in this phase (evaluation-only).
