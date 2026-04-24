# API Health & SLO Baseline Report (Week 10)

## Taxonomy

- Task/Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`
- Initial Week 10 evidence status: `PENDING_EXECUTION`

## Baseline preflight

| Check | Command | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| API health preflight | `python -m pytest tests/observability/test_api.py -q` | API health/WebSocket tests runnable | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-001` |
| Observability preflight | `python -m pytest tests/observability -q` | observability tests runnable | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-002` |
| Health script preflight | `bash scripts/health_check.sh` | runtime services reported | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-003` |

## Command evidence set

| Command group | Command | Expected | Actual | Status | Mapped issue | Evidence ID |
|---|---|---|---|---|---|---|
| API health tests | `python -m pytest tests/observability/test_api.py -q` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W10-ISS-002`,`W10-ISS-003`,`W10-ISS-010` | `EV-W10-101` |
| Observability tests | `python -m pytest tests/observability -q` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W10-ISS-004`,`W10-ISS-006` | `EV-W10-102` |
| Observability integration | `python -m pytest tests/integration/test_observability_integration.py -q` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W10-ISS-007` | `EV-W10-103` |
| Python signal flow regression | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W10-ISS-007` | `EV-W10-104` |
| Rust common tests | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W10-ISS-009` | `EV-W10-105` |
| Rust execution/risk regression | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p execution-engine -p risk-manager` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W10-ISS-007` | `EV-W10-106` |
| Rust workspace check | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W10-ISS-011` | `EV-W10-107` |
| Runtime health | `bash scripts/health_check.sh` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W10-ISS-003` | `EV-W10-108` |
| Compliance audit | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W10-ISS-005` | `EV-W10-109` |
| Correlation source audit | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W10-ISS-005` | `EV-W10-110` |

## API/SLO scenario matrix

| Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|
| `/health` response | status healthy, p95 `<=100ms` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-201` |
| `/health/ready` correctness | 200 ready, 503 not-ready as expected | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-202` |
| `/health/live` correctness | live state + websocket/uptime context | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-203` |
| `/api/system/health` latency/schema | p95 `<=250ms`, stable response | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-204` |
| Component status completeness | required components mapped | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-205` |
| WebSocket heartbeat | ping/pong success `>=99%` sample | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-206` |
| Event-to-alert latency | `<=120s` temporary target | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-207` |
| Alert false-positive sample | `<=15%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-208` |
| Alert false-negative critical | count `0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-209` |
| Alert acknowledgement | structured acknowledgement success | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-210` |
| Dashboard SLO panel availability | `>=95%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-211` |
| Correlation/SLO event context | coverage `>=99%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-212` |
| W05 regression | risk limits observability/SLO preserved | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-213` |
| W06 regression | stop-loss observability/SLO preserved | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-214` |
| W07 regression | circuit breaker observability/SLO preserved | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-215` |
| W08 regression | retry/slippage observability/SLO preserved | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-216` |
| W09 regression | observability contract preserved | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-217` |

## Hardening matrix

| Task | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| `W10-T07` Health endpoint SLO | health/ready/live | latency + correctness pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-301` |
| `W10-T08` Component health SLO | system health/components | component status complete | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-302` |
| `W10-T09` WebSocket SLO | heartbeat + stream cadence | heartbeat pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-303` |
| `W10-T11` Alert profile rehearsal | false-positive/false-negative | alert quality pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-304` |
| `W10-T12` Dashboard SLO panel | SLO panels | panel availability pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-305` |
| `W10-T15` Artifact reconciliation | 5 artifact gate | one final decision | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-306` |

## Governance matrix

| Task | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| `CR-W10-001` API/alert schema change if needed | response/alert shape change | CR recorded before implementation | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-401` |
| `W10-T14` Change budget review | files/LOC net | `<=18 files`, `<=900 LOC net` hoặc escalation record | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W10-402` |

## Decision (current)

- Gate status hiện tại: `PENDING_DECISION`.
- Rule cập nhật:
  - Chỉ set `GO` khi toàn bộ mục bắt buộc `CAPTURED_PASS`.
  - Nếu còn `CAPTURED_FAIL/BLOCKED_ENV` ở mục bắt buộc thì mặc định `NO-GO`.
