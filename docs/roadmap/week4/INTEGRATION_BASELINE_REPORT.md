# Integration Baseline Report (Week 4 Stabilization)

## Baseline preflight (clean-slate)

| Check | Command | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| Python cache cleanup | `find . -name "__pycache__" -exec rm -rf {} +` | cache removed | `SUCCESS` | `CAPTURED_PASS` | `EV-W4-001` |
| Rust clean-slate | `cd rust && cargo clean -p common -p signal-bridge -p risk-manager -p execution-engine` | fresh build state | `SUCCESS (rerun removed 0 files)` | `CAPTURED_PASS` | `EV-W4-002` |

## Command evidence set (Smoke Profile)

| Command group | Command | Expected | Actual | Status | Mapped issue | Evidence ID |
|---|---|---|---|---|---|---|
| Python signal flow | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | pass | `7 passed, 8 warnings` | `CAPTURED_PASS` | `W4-ISS-005` | `EV-W4-101` |
| Python observability flow | `python -m pytest tests/integration/test_observability_integration.py -q` | pass | `7 passed, 11 warnings` | `CAPTURED_PASS` | `W4-ISS-005` | `EV-W4-102` |
| Rust contract suites | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge -p risk-manager -p execution-engine` | pass | `PASS` | `CAPTURED_PASS` | `W4-ISS-005` | `EV-W4-103` |
| Rust workspace check | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | pass | `PASS` | `CAPTURED_PASS` | `W4-ISS-005` | `EV-W4-104` |
| Runtime health | `bash scripts/health_check.sh` | pass | `MarketData, Risk, Execution, Signal running` | `CAPTURED_PASS` | `W4-ISS-005` | `EV-W4-105` |
| Compliance audit | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | pass | `100% coverage hits` | `CAPTURED_PASS` | `W4-ISS-007` | `EV-W4-106` |
| Correlation source audit | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | `0 findings` | `CAPTURED_PASS` | `W4-ISS-007` | `EV-W4-107` |

## Hardening outcome set

| Scenario | Task | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| Reconnect rehearsal | `W4-T07` | pipeline phục hồi không deadlock | `PASS (1MB payload verified, command: PYTHONPATH=src:. python scripts/rehearse_reconnect_w4.py)` | `CAPTURED_PASS` | `EV-W4-301` |
| Rollback rehearsal | `W4-T08` | recovery < 5 phút | `PASS (0.0006s drill duration)` | `CAPTURED_PASS` | `EV-W4-302` |
| Drop-safe check | `W4-T09` | reject không panic | `PASS (3 malformed scenarios, command: PYTHONPATH=. python scripts/rehearse_dropsafe_w4.py)` | `CAPTURED_PASS` | `EV-W4-303` |
| Shadow log audit | `W4-T10` | 5 IDs không đứt trace | `PASS (5 W4 IDs với full 4-hop chain python/zmq/rust/observability)` | `CAPTURED_PASS` | `EV-W4-304` |

## Integration scenario matrix (Gate)

| Category | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| Critical path | Signal -> Risk -> Execution end-to-end | stable, no stall | `PASS (EV-W4-101 + EV-W4-102 + EV-W4-105 đều pass)` | `CAPTURED_PASS` | `EV-W4-201` |
| Resilience | ZMQ disconnect/reconnect drill | reconnect success, no deadlock | `PASS (1MB payload reconnect drill)` | `CAPTURED_PASS` | `EV-W4-202` |
| Resilience | Rollback rehearsal | recover < 5 minutes | `PASS (0.0006s, target < 300s)` | `CAPTURED_PASS` | `EV-W4-203` |
| Safety | Drop-safe mismatch handling | structured reject, no panic | `PASS (malformed JSON + missing field + wrong schema_version)` | `CAPTURED_PASS` | `EV-W4-204` |
| Observability | Correlation continuity (5 IDs) | full chain recovered | `PASS (5 IDs full 4-hop chain trong logs/system/trading.system.log)` | `CAPTURED_PASS` | `EV-W4-205` |
| Governance | Change-budget compliance | within weekly budget | `PASS (scope giữ hardening, không refactor lan rộng)` | `CAPTURED_PASS` | `EV-W4-401` |
| Governance | Artifact consistency | single gate decision | `PASS (pending_count=0, gate_go=1, final_go=1, open_issue_rows=0)` | `CAPTURED_PASS` | `EV-W4-206` |

---
Last updated: 2026-04-23 (W4 Closeout)
