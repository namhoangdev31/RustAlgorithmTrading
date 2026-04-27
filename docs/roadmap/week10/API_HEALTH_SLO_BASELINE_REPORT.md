# API Health & SLO Baseline Report (Week 10)

## Taxonomy

- Task/Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`
- Run date: `2026-04-27`
- Run mode: clean-slate command profile + targeted scenario probes

## Baseline preflight

| Check | Command | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| API health preflight | `python -m pytest tests/observability/test_api.py -q` | API health/WebSocket tests runnable | `12 passed in 41.14s` | `CAPTURED_PASS` | `EV-W10-001` |
| Observability preflight | `python -m pytest tests/observability -q` | observability tests runnable | `136 collected; 130 passed; 6 failed` | `CAPTURED_FAIL` | `EV-W10-002` |
| Health script preflight | `bash scripts/health_check.sh` | runtime services reported | `4 services running; health check completed` | `CAPTURED_PASS` | `EV-W10-003` |

## Command evidence set

| Command group | Command | Expected | Actual | Status | Mapped issue | Evidence ID |
|---|---|---|---|---|---|---|
| API health tests | `python -m pytest tests/observability/test_api.py -q` | pass | `12 passed` | `CAPTURED_PASS` | `W10-ISS-002`,`W10-ISS-003`,`W10-ISS-010` | `EV-W10-101` |
| Observability tests | `python -m pytest tests/observability -q` | pass | `130 passed, 6 failed (perf/throughput slices)` | `CAPTURED_FAIL` | `W10-ISS-004`,`W10-ISS-006`,`W10-ISS-012` | `EV-W10-102` |
| Observability integration | `python -m pytest tests/integration/test_observability_integration.py -q` | pass | `8 passed` | `CAPTURED_PASS` | `W10-ISS-007` | `EV-W10-103` |
| Python signal flow regression | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | pass | `9 passed` | `CAPTURED_PASS` | `W10-ISS-007` | `EV-W10-104` |
| Rust common tests | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common` | pass | `48 passed total across unit/integration/parser/fuzz` | `CAPTURED_PASS` | `W10-ISS-009` | `EV-W10-105` |
| Rust execution/risk regression | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p execution-engine -p risk-manager` | pass | `59 passed; 0 failed` | `CAPTURED_PASS` | `W10-ISS-007` | `EV-W10-106` |
| Rust workspace check | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | pass | `check passed (warnings only)` | `CAPTURED_PASS` | `W10-ISS-011` | `EV-W10-107` |
| Runtime health | `bash scripts/health_check.sh` | pass | `market-data/risk-manager/execution-engine/signal-bridge running` | `CAPTURED_PASS` | `W10-ISS-003` | `EV-W10-108` |
| Compliance audit | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | pass | `correlation/schema/redaction checks passed` | `CAPTURED_PASS` | `W10-ISS-005` | `EV-W10-109` |
| Correlation source audit | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | `0 findings` | `CAPTURED_PASS` | `W10-ISS-005` | `EV-W10-110` |

## API/SLO scenario matrix

| Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|
| `/health` response | status healthy, p95 `<=100ms` | `40/40 200; p95=0.96ms` | `CAPTURED_PASS` | `EV-W10-201` |
| `/health/ready` correctness | 200 ready, 503 not-ready as expected | endpoint contract + field checks pass | `CAPTURED_PASS` | `EV-W10-202` |
| `/health/live` correctness | live state + websocket/uptime context | endpoint contract + field checks pass | `CAPTURED_PASS` | `EV-W10-203` |
| `/api/system/health` latency/schema | p95 `<=250ms`, stable response | `40/40 200; p95=0.61ms` | `CAPTURED_PASS` | `EV-W10-204` |
| Component status completeness | required components mapped | `execution/market_data/strategy/system/websocket present` | `CAPTURED_PASS` | `EV-W10-205` |
| WebSocket heartbeat | ping/pong success `>=99%` sample | streaming/realtime slices hit close `1012 service restart`; high-concurrency success `32%` in one run | `CAPTURED_FAIL` | `EV-W10-206` |
| Event-to-alert latency | `<=120s` temporary target | no deterministic replay harness for event->alert timing in W10 pack | `BLOCKED_ENV` | `EV-W10-207` |
| Alert false-positive sample | `<=15%` | no labeled sample set bound to W10 alert profile | `BLOCKED_ENV` | `EV-W10-208` |
| Alert false-negative critical | count `0` | no critical incident replay sample in W10 baseline | `BLOCKED_ENV` | `EV-W10-209` |
| Alert acknowledgement | structured acknowledgement success | `POST /api/system/alerts/acknowledge/test-alert-id => 200` | `CAPTURED_PASS` | `EV-W10-210` |
| Dashboard SLO panel availability | `>=95%` | no dashboard runtime probe captured in W10 command profile | `BLOCKED_ENV` | `EV-W10-211` |
| Correlation/SLO event context | coverage `>=99%` | compliance/source audit pass, but no coverage denominator for critical event set | `BLOCKED_ENV` | `EV-W10-212` |
| W05 regression | risk limits observability/SLO preserved | risk-manager limit suites pass | `CAPTURED_PASS` | `EV-W10-213` |
| W06 regression | stop-loss observability/SLO preserved | stop-loss suites pass | `CAPTURED_PASS` | `EV-W10-214` |
| W07 regression | circuit breaker observability/SLO preserved | CB state-machine suites pass | `CAPTURED_PASS` | `EV-W10-215` |
| W08 regression | retry/slippage observability/SLO preserved | execution retry/slippage suites pass | `CAPTURED_PASS` | `EV-W10-216` |
| W09 regression | observability contract preserved | observability integration slice pass | `CAPTURED_PASS` | `EV-W10-217` |

## Hardening matrix

| Task | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| `W10-T07` Health endpoint SLO | health/ready/live | latency + correctness pass | pass (`EV-W10-201..203`) | `CAPTURED_PASS` | `EV-W10-301` |
| `W10-T08` Component health SLO | system health/components | component status complete | pass (`EV-W10-204..205`) | `CAPTURED_PASS` | `EV-W10-302` |
| `W10-T09` WebSocket SLO | heartbeat + stream cadence | heartbeat pass | stream close `1012` and cadence instability captured | `CAPTURED_FAIL` | `EV-W10-303` |
| `W10-T11` Alert profile rehearsal | false-positive/false-negative | alert quality pass | sample/harness unavailable in current environment | `BLOCKED_ENV` | `EV-W10-304` |
| `W10-T12` Dashboard SLO panel | SLO panels | panel availability pass | no dashboard runtime capture in this run | `BLOCKED_ENV` | `EV-W10-305` |
| `W10-T15` Artifact reconciliation | 5 artifact gate | one final decision | synchronized to single verdict `NO-GO` | `CAPTURED_PASS` | `EV-W10-306` |

## Governance matrix

| Task | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| `CR-W10-001` API/alert schema change if needed | response/alert shape change | CR recorded before implementation | no public shape change required | `CAPTURED_PASS` | `EV-W10-401` |
| `W10-T14` Change budget review | files/LOC net | `<=18 files`, `<=900 LOC net` hoặc escalation record | within budget in this sync pass | `CAPTURED_PASS` | `EV-W10-402` |

## Decision (current)

- Gate status hiện tại: `NO-GO`.
- Lý do chính:
  1. `EV-W10-206` = `CAPTURED_FAIL` (WebSocket heartbeat/stream stability).
  2. `EV-W10-207..209,211,212` = `BLOCKED_ENV` ở mục bắt buộc.
  3. `EV-W10-102` = `CAPTURED_FAIL` (observability performance/throughput slices).
