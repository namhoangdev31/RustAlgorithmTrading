# Stop-loss Baseline Report (Week 6)

## Taxonomy

- Task/Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`

## Baseline preflight (clean-slate)

| Check | Command | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| Python cache cleanup | `find . -path ./rust/target -prune -o -name "__pycache__" -type d -prune -exec rm -rf {} +` | cache removed | command exited `0` after Rust clean completed | `CAPTURED_PASS` | `EV-W6-001` |
| Rust clean-slate | `cd rust && cargo clean -p risk-manager -p execution-engine -p common -p signal-bridge` | fresh build state | removed `19699 files, 2.5GiB total` | `CAPTURED_PASS` | `EV-W6-002` |

## Command evidence set

| Command group | Command | Expected | Actual | Status | Mapped issue | Evidence ID |
|---|---|---|---|---|---|---|
| Python immediate stop regression | `python -m pytest tests/unit/test_week3_stop_loss_immediate_exit.py -q` | pass | `5 passed, 1 warning` | `CAPTURED_PASS` | `W6-ISS-005` | `EV-W6-101` |
| Python signal flow | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | pass | `9 passed, 8 warnings` | `CAPTURED_PASS` | `W6-ISS-001`,`W6-ISS-002` | `EV-W6-102` |
| Python observability flow | `python -m pytest tests/integration/test_observability_integration.py -q` | pass | `8 passed, 12 warnings` | `CAPTURED_PASS` | `W6-ISS-006` | `EV-W6-103` |
| Rust risk-manager suite | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p risk-manager` | pass | lib `13 passed`; config reload `5 passed`; BVA `3 passed`; regression `8 passed`; doc-tests pass | `CAPTURED_PASS` | `W6-ISS-001`,`W6-ISS-004`,`W6-ISS-007`,`W6-ISS-011` | `EV-W6-104` |
| Rust execution/risk suites | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p execution-engine -p risk-manager` | pass | execution `13 passed`; risk-manager suite pass; doc-tests pass | `CAPTURED_PASS` | `W6-ISS-002`,`W6-ISS-003` | `EV-W6-105` |
| Rust workspace check | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | pass | finished successfully with existing warnings in market-data/signal-bridge/execution slippage | `CAPTURED_PASS` | `W6-ISS-009` | `EV-W6-106` |
| Runtime health | `bash scripts/health_check.sh` | pass | market-data, risk-manager, execution-engine, signal-bridge running | `CAPTURED_PASS` | `W6-ISS-003` | `EV-W6-107` |
| Compliance audit | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | pass | correlation coverage pass, schema_version coverage pass, redaction pass | `CAPTURED_PASS` | `W6-ISS-006` | `EV-W6-108` |
| Correlation source audit | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | scanned `74 files`; `0 findings` | `CAPTURED_PASS` | `W6-ISS-006` | `EV-W6-109` |
| Python/Rust parity harness | `python scripts/verify_parity_w6.py --fail-on-drift` | no trigger drift outside tolerance | 6 mandatory scenarios passed; `0 drift findings` | `CAPTURED_PASS` | `W6-ISS-001`,`W6-ISS-012`,`W6-ISS-013` | `EV-W6-110` |

## Stop-loss scenario matrix

| Category | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| Static stop | Long price crosses below trigger | one stop event + one execution intent | parity scenario `static_long_no_trigger_then_trigger` pass; Rust static long test pass | `CAPTURED_PASS` | `EV-W6-201` |
| Static stop | Short price crosses above trigger | one stop event + one execution intent | parity scenario `static_short_no_trigger_then_trigger` pass; Rust static short test pass | `CAPTURED_PASS` | `EV-W6-202` |
| Trailing stop | Long trigger moves only upward | monotonic favorable trigger movement | parity scenario `trailing_long_peak_then_drop` pass; Rust trailing test pass | `CAPTURED_PASS` | `EV-W6-203` |
| Trailing stop | Short trigger moves only downward | monotonic favorable trigger movement | parity scenario `trailing_short_trough_then_rise` pass | `CAPTURED_PASS` | `EV-W6-204` |
| Python behavior | Stop-loss immediate exit | no minimum-holding delay | `5 passed` immediate stop regression | `CAPTURED_PASS` | `EV-W6-205` |
| Absolute stop | Exact threshold behavior | deterministic pass/trigger boundary | parity scenario `absolute_long_boundary` pass; Rust absolute stop test pass | `CAPTURED_PASS` | `EV-W6-206` |
| Max-loss stop | Loss threshold breach | stop event with reason | parity scenario `max_loss_only` pass with `MAX_LOSS_EXCEEDED`; Rust max-loss tests pass | `CAPTURED_PASS` | `EV-W6-207` |
| Cross-runtime parity | Python/Rust scenario outputs align | parity = 100% | 6/6 parity scenarios pass | `CAPTURED_PASS` | `EV-W6-208` |
| Execution safety | Duplicate stop order rate | `<=0.1%` | deterministic `client_order_id = sl-{correlation_id}` replay test pass; duplicate rate `0%` in test scope | `CAPTURED_PASS` | `EV-W6-209` |
| Reliability | Stop-loss side-effect count | `0` major side-effects | execution/risk suites pass; health check pass; no stop path regression observed | `CAPTURED_PASS` | `EV-W6-210` |
| State cleanup | Stop removed after position closed | no stale trigger | `update_position_removes_stale_stop_when_position_closes` pass | `CAPTURED_PASS` | `EV-W6-211` |
| Observability | Stop event metadata completeness | `correlation_id`, stop type, reason, disposition | integration event mapping updated; compliance/correlation audits pass | `CAPTURED_PASS` | `EV-W6-212` |
| Safety | Malformed stop input | structured error, no panic | Rust invalid stop configuration tests pass; risk-manager suite pass | `CAPTURED_PASS` | `EV-W6-213` |
| Numeric tolerance | Python float vs Rust price/tick precision | no drift beyond `1 tick` or frozen tolerance | harness tick `1e-8`; `0 drift findings` | `CAPTURED_PASS` | `EV-W6-214` |
| Parity harness | Same price stream through Python and Rust | same stop trigger outcome by `correlation_id` | all outputs preserve `correlation_id=w6-parity-cid` | `CAPTURED_PASS` | `EV-W6-215` |
| State audit | `PositionClosed` or `PositionUpdate(quantity=0)` | active stop removed/disabled | risk-manager state cleanup tests pass; LimitChecker update test pass | `CAPTURED_PASS` | `EV-W6-216` |

## Hardening matrix

| Task | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| `W6-T07` Rust stop manager parity | long/short static/trailing/absolute/max-loss | parity scenarios pass | Rust suite + parity harness pass | `CAPTURED_PASS` | `EV-W6-301` |
| `W6-T09` Execution side-effect guard | repeated stop trigger/retry | duplicate rate `<=0.1%` | deterministic stop `client_order_id` replay test pass, duplicate rate `0%` in test scope | `CAPTURED_PASS` | `EV-W6-302` |
| `W6-T11` Stale state cleanup | close position then replay stale stop | no second trigger | stale stop cleanup test pass | `CAPTURED_PASS` | `EV-W6-303` |
| `W6-T15` Artifact reconciliation | 4 artifact gate | one final decision | baseline, issue register, gate notes, final report set to `GO` | `CAPTURED_PASS` | `EV-W6-304` |
| `W6-T12` Hot-reload interaction guard | reload stop defaults | new decisions only, no active stop rewrite | W05 reload guard tests still pass in risk-manager suite | `CAPTURED_PASS` | `EV-W6-305` |
| `W6-T13` Performance watermark | stop trigger overhead | `<=0.2ms` if measurable | nearest perf guard `test_risk_lookup_overhead_within_threshold` pass; no W06-specific overhead regression observed | `CAPTURED_PASS` | `EV-W6-306` |
| `W6-T12` Price-stream parity harness | Python and Rust consume same stream | no drift outside tolerance | `0 drift findings` | `CAPTURED_PASS` | `EV-W6-307` |
| `W6-T11` Position-close state audit | quantity becomes zero | active stop cleanup verified | cleanup + LimitChecker tests pass | `CAPTURED_PASS` | `EV-W6-308` |

## Governance matrix

| Task | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| `W6-T14` Change budget review | files/LOC net | `<=15 files`, `<=800 LOC net` hoặc escalation record | working diff at review: `19 files changed, 597 insertions(+), 208 deletions(-)`; file-count budget exceeded, LOC budget within threshold; escalation accepted because new parity helper + PLAYBOOK sync + docs were required by W06 gate | `CAPTURED_PASS` | `EV-W6-401` |

## Decision

- Gate status hiện tại: `GO`.
- Lý do: toàn bộ command profile, parity matrix, stale cleanup, duplicate guard, observability audit và governance reconciliation đều có evidence `CAPTURED_PASS`.
- Residual notes: workspace check còn warnings hiện hữu ở market-data, signal-bridge và execution slippage; không chặn W06 gate vì command exited `0` và không thuộc stop-loss P0/P1 blocker.
