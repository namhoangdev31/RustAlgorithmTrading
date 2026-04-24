# Gate Rehearsal Notes (Week 6 Stop-loss Coherence)

## Gate rule

`GO` chỉ khi đồng thời:

1. Compile/static/lint/type `100% pass`.
2. Smoke critical path `>=95%`.
3. Python/Rust stop semantics parity `=100%` trên mandatory scenarios.
4. Numeric trigger tolerance không drift quá `1 tick` hoặc tolerance đã freeze.
5. Price-stream parity harness pass theo `correlation_id`.
6. Immediate stop-loss regression `100% pass`.
7. Duplicate stop-order rate `<=0.1%`.
8. Stop-loss side-effect lớn `=0`.
9. `PositionClosed`/`quantity=0` stale stop cleanup pass.
10. Stop event correlation continuity `=100%`.
11. Stop trigger latency overhead `<=0.2ms` so với W05 watermark nếu measurable.
12. Không còn P0 open, không có P1 unowned.
13. Correlation source audit trả `0 findings`.
14. Không còn `CAPTURED_FAIL/BLOCKED_ENV` ở matrix bắt buộc.
15. Baseline/Issue/Gate/Final report thống nhất một trạng thái cuối.

Nếu thiếu một điều kiện: `NO-GO`.

## Checklist

| Gate item | Expected | Current status | Evidence ID | Verdict | Notes |
|---|---|---|---|---|---|
| Build + static profile | `100% pass` | all mandatory build/test commands exited `0` | `EV-W6-101..106` | `PASS` | `cargo check --workspace` has warnings only, no failure |
| Smoke critical path | `>=95%` | backtest flow `9/9`, observability `8/8` | `EV-W6-102`,`EV-W6-103` | `PASS` | smoke pass rate `100%` for mandatory slices |
| Stop semantics parity | `100%` | 6/6 parity scenarios pass | `EV-W6-201..208` | `PASS` | static/trailing/absolute/max-loss covered |
| Numeric trigger tolerance | `<=1 tick` hoặc frozen tolerance | default tick `1e-8`, `0 drift findings` | `EV-W6-214` | `PASS` | tolerance frozen in parity harness |
| Price-stream parity harness | same stop outcome by `correlation_id` | `python scripts/verify_parity_w6.py --fail-on-drift` pass | `EV-W6-110`,`EV-W6-215`,`EV-W6-307` | `PASS` | `correlation_id=w6-parity-cid` preserved |
| Immediate stop regression | `100% pass` | `5 passed` | `EV-W6-101`,`EV-W6-205` | `PASS` | stop/catastrophic/trailing bypass; take-profit still gated |
| Duplicate stop-order rate | `<=0.1%` | deterministic replay test pass, effective duplicate rate `0%` in test scope | `EV-W6-209`,`EV-W6-302` | `PASS` | stop order id derived from `correlation_id` |
| Stop side-effect count | `0` | risk/execution suites + health pass | `EV-W6-210`,`EV-W6-303` | `PASS` | no major stop-loss side-effect observed |
| Stale stop cleanup | `100% pass` | stop cleanup and LimitChecker update tests pass | `EV-W6-211`,`EV-W6-216`,`EV-W6-303`,`EV-W6-308` | `PASS` | `quantity=0` removes stop state |
| Stop event correlation | `100%` | compliance audit pass; correlation source audit `0 findings` | `EV-W6-108`,`EV-W6-109`,`EV-W6-212` | `PASS` | no ID phụ khác introduced |
| Stop trigger overhead | `<=0.2ms` if measurable | nearest risk overhead guard pass | `EV-W6-306` | `PASS` | no dedicated W06 microbench yet; accepted as W06 guard |
| P0/P1 governance | P0 open `=0`, P1 unowned `=0` | issue register all gate blockers `DONE` | `EV-W6-304` | `PASS` | P2 budget escalation recorded |
| Governance consistency | one-decision gate | baseline/issue/gate/final all `GO` | `EV-W6-304` | `PASS` | no artifact contradiction |

## Rehearsal outcome

- Current status: `GO`.
- Final verdict: `GO`.
- Reason: all mandatory gate items have `CAPTURED_PASS` evidence and no P0/P1 blockers remain.
- Residual watch item: address existing workspace warnings in a later quality pass; they are not W06 stop-loss blockers.
