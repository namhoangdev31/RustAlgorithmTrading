# Circuit Breaker Baseline Report (Week 7)

## Taxonomy

- Task/Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`
- Final Week 7 evidence status: `CAPTURED_PASS`

## Baseline preflight

| Check | Command | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| Python integration preflight | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | critical flow runnable | `9 passed, 8 warnings` | `CAPTURED_PASS` | `EV-W7-001` |
| Observability preflight | `python -m pytest tests/integration/test_observability_integration.py -q` | observability slice runnable | `8 passed, 12 warnings` | `CAPTURED_PASS` | `EV-W7-002` |
| Rust targeted preflight | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p risk-manager` | risk-manager test slice pass | `14 unit + 12 circuit breaker + 5 reload + 3 BVA + 8 regression + 1 stop tests passed` | `CAPTURED_PASS` | `EV-W7-003` |

## Command evidence set

| Command group | Command | Expected | Actual | Status | Mapped issue | Evidence ID |
|---|---|---|---|---|---|---|
| Python signal flow | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | pass | `9 passed, 8 warnings` | `CAPTURED_PASS` | `W7-ISS-007` | `EV-W7-101` |
| Python observability flow | `python -m pytest tests/integration/test_observability_integration.py -q` | pass | `8 passed, 12 warnings` | `CAPTURED_PASS` | `W7-ISS-005`,`W7-ISS-009` | `EV-W7-102` |
| Rust execution/risk suites | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p execution-engine -p risk-manager` | pass | execution-engine `13 passed`; risk-manager full slice passed | `CAPTURED_PASS` | `W7-ISS-002`,`W7-ISS-007` | `EV-W7-103` |
| Rust workspace check | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | pass | pass with pre-existing warnings in execution-engine, market-data, signal-bridge | `CAPTURED_PASS` | `W7-ISS-011` | `EV-W7-104` |
| Runtime health | `bash scripts/health_check.sh` | pass | market-data/risk-manager/execution-engine/signal-bridge running | `CAPTURED_PASS` | `W7-ISS-002` | `EV-W7-105` |
| Compliance audit | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | pass | correlation coverage passed, schema_version coverage passed, redaction leak count `0` | `CAPTURED_PASS` | `W7-ISS-005` | `EV-W7-106` |
| Correlation source audit | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | scanned `76` files, `0 findings` | `CAPTURED_PASS` | `W7-ISS-005` | `EV-W7-107` |
| Circuit breaker metric labels | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common metrics` | metric labels render in Prometheus text | `4 metrics tests passed`, includes circuit breaker trip/status labels | `CAPTURED_PASS` | `W7-ISS-009` | `EV-W7-108` |

## Circuit breaker scenario matrix

| Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|
| `CLOSED` allows valid order | order allowed if risk limits pass | `test_cb_closed_allows_valid_order` passed | `CAPTURED_PASS` | `EV-W7-201` |
| Manual trip | `CLOSED -> OPEN` | `test_cb_trip_to_open_rejects_orders` passed | `CAPTURED_PASS` | `EV-W7-202` |
| `OPEN` reject before execution | reject with `CircuitBreakerTripped` and `correlation_id` | `test_cb_trip_to_open_rejects_orders` + execution/risk suite passed | `CAPTURED_PASS` | `EV-W7-203` |
| Idempotent repeated trip | repeated trip does not reset cooldown | `test_cb_idempotent_trip_does_not_reset_cooldown` passed | `CAPTURED_PASS` | `EV-W7-204` |
| Reset before cooldown | deny reset, keep `OPEN` | `test_cb_reset_before_cooldown_is_denied` passed | `CAPTURED_PASS` | `EV-W7-205` |
| Cooldown expiry | `OPEN -> RESET_PENDING` after cooldown | `test_cb_after_cooldown_moves_to_reset_pending` passed | `CAPTURED_PASS` | `EV-W7-206` |
| Approved reset | `RESET_PENDING -> HALF_OPEN` | `test_cb_approved_reset_moves_to_half_open` passed | `CAPTURED_PASS` | `EV-W7-207` |
| Half-open probe pass | `HALF_OPEN -> CLOSED` | `test_cb_probe_success_to_closed` passed | `CAPTURED_PASS` | `EV-W7-208` |
| Half-open probe fail | `HALF_OPEN -> OPEN` | `test_cb_probe_fail_to_open` passed | `CAPTURED_PASS` | `EV-W7-209` |
| Disabled config | disabled breaker does not trip or reject | `test_cb_disabled_config` passed | `CAPTURED_PASS` | `EV-W7-210` |
| Hot reload while `OPEN` | reload cannot close/disable active breaker | `test_cb_hot_reload_does_not_disable_open_breaker` passed | `CAPTURED_PASS` | `EV-W7-211` |
| Stress repeated trip/recover | loop-trip count `0`, no flapping | `test_cb_stress_repeated_trip_recover_has_no_loop_trip` passed | `CAPTURED_PASS` | `EV-W7-212` |
| Correlation preservation | reject report preserves request `correlation_id` | `test_cb_reject_path_preserves_correlation_id` passed | `CAPTURED_PASS` | `EV-W7-213` |
| Metrics scrape text | trip/status metrics present with canonical label | `test_circuit_breaker_metric_labels` passed | `CAPTURED_PASS` | `EV-W7-214` |
| Manual reset drill | cooldown -> approval -> half-open -> probe pass | reset flow covered by `EV-W7-206..208` | `CAPTURED_PASS` | `EV-W7-215` |

## Hardening matrix

| Task | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| `W7-T07` State machine hardening | mandatory state transitions | transition matrix pass | `EV-W7-201..209` passed | `CAPTURED_PASS` | `EV-W7-301` |
| `W7-T12` Stress/no loop-trip | repeated trip/recover | loop-trip count `0` | stress integration test passed | `CAPTURED_PASS` | `EV-W7-302` |
| `W7-T09` Execution side-effect guard | breaker open + order validation | no execution side-effect, reject before execution | `EV-W7-203` + `EV-W7-103` passed | `CAPTURED_PASS` | `EV-W7-303` |
| `W7-T11` Runbook reset drill | operator reset after cooldown/root-cause review | reset controlled + logged | service reset/probe drill passed | `CAPTURED_PASS` | `EV-W7-304` |
| `W7-T15` Artifact reconciliation | baseline/issue/gate/final | one final decision | artifact sync completed to `GO` | `CAPTURED_PASS` | `EV-W7-305` |
| `W7-T13` Performance/side-effect guard | breaker check path | no measurable regression in targeted suites | command profile passed; no extra runtime blocker | `CAPTURED_PASS` | `EV-W7-306` |

## Governance matrix

| Task | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| `CR-W07-001` Internal API change | `validate_order(&self)` -> `validate_order(&mut self)` | stateful breaker update recorded | internal-only change, public envelope unchanged | `CAPTURED_PASS` | `EV-W7-401` |
| `W7-T14` Change budget review | files/LOC net | within W07 budget or justified | implementation kept to risk/common/test/docs scope | `CAPTURED_PASS` | `EV-W7-402` |

## Decision

- Gate status: `GO`.
- Rationale: all mandatory command, scenario, hardening and governance evidence rows are `CAPTURED_PASS`; P0 open `=0`; P1 unowned `=0`; public envelope remains unchanged.
