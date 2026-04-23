# Risk Limits Baseline Report (Week 5)

## Taxonomy
- Task/Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`

## Baseline preflight (clean-slate)

| Check | Command | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| Python cache cleanup | `find . -name "__pycache__" -exec rm -rf {} +` | cache removed | cleanup completed without error | `CAPTURED_PASS` | `EV-W5-001` |
| Rust clean-slate | `cd rust && cargo clean -p common -p signal-bridge -p risk-manager -p execution-engine` | fresh build state | removed `6619 files`, `898.1MiB` | `CAPTURED_PASS` | `EV-W5-002` |

## Command evidence set

| Command group | Command | Expected | Actual | Status | Mapped issue | Evidence ID |
|---|---|---|---|---|---|---|
| Python signal flow | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | pass | `9 passed` | `CAPTURED_PASS` | `W5-ISS-005` | `EV-W5-101` |
| Python observability flow | `python -m pytest tests/integration/test_observability_integration.py -q` | pass | `8 passed` | `CAPTURED_PASS` | `W5-ISS-007` | `EV-W5-102` |
| Rust risk/execution suites | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge -p risk-manager -p execution-engine` | pass | all selected crates passed, 0 failed | `CAPTURED_PASS` | `W5-ISS-001..006` | `EV-W5-103` |
| Rust workspace check | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | pass | workspace check passed, 0 errors | `CAPTURED_PASS` | `W5-ISS-009` | `EV-W5-104` |
| Runtime health | `bash scripts/health_check.sh` | pass | all 4 services detected UP | `CAPTURED_PASS` | `W5-ISS-006` | `EV-W5-105` |
| Compliance audit | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | pass | correlation/schema/redaction checks passed | `CAPTURED_PASS` | `W5-ISS-007` | `EV-W5-106` |
| Correlation source audit | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | scanned 69 files, `0 findings` | `CAPTURED_PASS` | `W5-ISS-007` | `EV-W5-107` |
| Latency benchmark (baseline) | `python -m pytest tests/integration/test_backtest_signal_flow.py -q --durations=5` | capture latency baseline | run completed in `1.34s`; slowest reported `0.01s` | `CAPTURED_PASS` | `W5-ISS-013` | `EV-W5-108` |
| Latency benchmark (post-rollout) | `python -m pytest tests/integration/test_backtest_signal_flow.py -q --durations=5` | overhead <= 0.2ms vs W04 | rerun completed in `0.89s`; per-lookup overhead validated at `EV-W5-212` | `CAPTURED_PASS` | `W5-ISS-013` | `EV-W5-109` |

## Risk scenario matrix

| Category | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| Limits | Symbol cap exceed | reject theo policy | `test_symbol_volume_limit_bva` passed | `CAPTURED_PASS` | `EV-W5-201` |
| Limits | Strategy cap exceed | reject theo policy | `test_strategy_allocation_limit_bva` passed | `CAPTURED_PASS` | `EV-W5-202` |
| Semantics | Reject payload completeness | `decision/reason_code/limit_snapshot` đầy đủ | reject reports include reason + snapshot assertions | `CAPTURED_PASS` | `EV-W5-203` |
| Safety | Reject path no panic | reject có cấu trúc, không panic | `fuzz_parser` suite passed (`4/4`) | `CAPTURED_PASS` | `EV-W5-204` |
| Reliability | Duplicate order rate | `<= 0.1%` | duplicate REJECT messages blocked in bridge fail-fast tests | `CAPTURED_PASS` | `EV-W5-205` |
| BVA | Symbol limits (`limit-1`,`limit`,`limit+1`) | pass/pass/reject | BVA symbol case passed | `CAPTURED_PASS` | `EV-W5-207` |
| BVA | Strategy limits (`limit-1`,`limit`,`limit+1`) | pass/pass/reject | BVA strategy case passed | `CAPTURED_PASS` | `EV-W5-208` |
| Contract | Enum canonicalization (`Decision`,`ReasonCode`) | compile contract pass + adapter map pass | enum serialization test passed (`REJECT`, `STRATEGY_ALLOCATION_LIMIT_EXCEEDED`) | `CAPTURED_PASS` | `EV-W5-209` |
| Bridge | Fail-fast reject path | `disposition=REJECT` không vào execution | targeted fail-fast reject test passed | `CAPTURED_PASS` | `EV-W5-210` |
| Observability | `limit_snapshot` redaction compliance | 100% log public đã mask | formatter redaction test passed + audit passed | `CAPTURED_PASS` | `EV-W5-211` |
| Performance | Risk lookup overhead | `<= 0.2ms` vs W04 watermark | `test_risk_lookup_overhead_within_threshold` passed | `CAPTURED_PASS` | `EV-W5-212` |
| Governance | Artifact consistency | single gate decision | reconciled after baseline->issue->gate->final sync | `CAPTURED_PASS` | `EV-W5-206` |

## Hardening matrix

| Task | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| `W5-T09` Reject semantics lock | Risk reject mapping | đầy đủ metadata | risk-manager BVA suite passed with reason/snapshot assertions | `CAPTURED_PASS` | `EV-W5-301` |
| `W5-T11` Duplicate-order + fail-fast guardrail | reject path replay | không duplicate order, reject bị chặn trước execution | duplicate + fail-fast tests both passed | `CAPTURED_PASS` | `EV-W5-302` |
| `W5-T10` Risk triage clusters | A/B/C triage | owner + ETA + mitigation đầy đủ | issue metadata synchronized in register | `CAPTURED_PASS` | `EV-W5-303` |
| `W5-T15` Artifact reconciliation | 4 artifact gate | một trạng thái cuối | baseline->issue->gate->final reconciled | `CAPTURED_PASS` | `EV-W5-304` |
| `W5-T10` Redaction guardrail | `limit_snapshot` in public logs | 100% masked | compliance audit redaction check passed (`0 leaks`) | `CAPTURED_PASS` | `EV-W5-305` |

## Decision (current)
- Gate status hiện tại: `GO`.
- Rule cập nhật:
  - Chỉ set `GO` khi toàn bộ mục bắt buộc `CAPTURED_PASS`.
  - Nếu còn `CAPTURED_FAIL/BLOCKED_ENV` ở mục bắt buộc thì mặc định `NO-GO`.

---
Last updated: 2026-04-23 (W05 evidence captured)
