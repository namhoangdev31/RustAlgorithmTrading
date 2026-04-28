# Capital Allocation Baseline Report W15

## 1) Current status

- Current gate status: `GO`.
- Baseline mode: `CAPTURED_PASS`.
- Scope: volatility/regime sizing, drawdown adherence, allocation decision traceability, cross-strategy allocation interactions.

## 2) Clean-slate preflight

| Evidence ID | Check | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|
| `EV-W15-001` | Python/Rust cache cleanup | clean-slate completed | cleanup completed before rerun | `CAPTURED_PASS` | local caches refreshed |
| `EV-W15-002` | Workspace status captured | relevant changes understood | status captured via `git status --short` | `CAPTURED_PASS` | unrelated local edits preserved |

## 3) Command profile matrix (rerun 2026-04-28)

| Evidence ID | Command | Expected | Actual | Status | Issue mapping |
|---|---|---|---|---|---|
| `EV-W15-101` | `python -m pytest tests/test_backtest_integration.py -q` | backtest integration pass | pass (`5 passed`) | `CAPTURED_PASS` | `W15-ISS-004` |
| `EV-W15-102` | `python -m pytest tests/unit/test_strategy_signals.py -q` | strategy unit pass | pass (`21 passed`) | `CAPTURED_PASS` | `W15-ISS-005` |
| `EV-W15-103` | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | signal flow smoke pass | pass (`9 passed`) | `CAPTURED_PASS` | `W15-ISS-008` |
| `EV-W15-104` | `python -m pytest tests/integration/test_observability_integration.py -q` | observability integration pass | pass (`8 passed`) | `CAPTURED_PASS` | `W15-ISS-012` |
| `EV-W15-105` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p risk-manager -p signal-bridge` | risk/signal tests pass | pass | `CAPTURED_PASS` | `W15-ISS-001`,`W15-ISS-002` |
| `EV-W15-106` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p execution-engine -p common` | execution/common tests pass | pass | `CAPTURED_PASS` | `W15-ISS-006` |
| `EV-W15-107` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | workspace check pass | pass | `CAPTURED_PASS` | `W15-ISS-008` |
| `EV-W15-108` | `bash scripts/health_check.sh` | health check pass | pass (all services running) | `CAPTURED_PASS` | `W15-ISS-008` |
| `EV-W15-109` | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | compliance pass | pass (`0` findings, `0` leaks) | `CAPTURED_PASS` | `W15-ISS-012` |
| `EV-W15-110` | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | pass (`No correlation_id logging gaps`) | `CAPTURED_PASS` | `W15-ISS-012` |

## 4) Allocation rehearsal matrix

| Evidence ID | Scenario | Expected | Actual | Status | Blocking issue |
|---|---|---|---|---|---|
| `EV-W15-201` | Volatility sizing enforcement audit | enforced `100%` required checks | pass | `CAPTURED_PASS` | `W15-ISS-001` |
| `EV-W15-202` | Regime-aware sizing enforcement audit | enforced `100%` required checks | pass | `CAPTURED_PASS` | `W15-ISS-001` |
| `EV-W15-203` | Allocation checklist audit | mandatory items complete `100%` | pass; metadata completeness verified | `CAPTURED_PASS` | `W15-ISS-004` |
| `EV-W15-204` | Allocation decision traceability audit | owner+reason+evidence complete | pass | `CAPTURED_PASS` | `W15-ISS-005` |
| `EV-W15-205` | Drawdown adherence audit | adherence checks pass `100%` | pass; drawdown halt path blocks correctly | `CAPTURED_PASS` | `W15-ISS-002` |
| `EV-W15-206` | Cross-strategy allocation interaction rehearsal | required scenarios `100%` pass | pass; coverage `100%` | `CAPTURED_PASS` | `W15-ISS-006` |
| `EV-W15-207` | New-breach audit | new breach count `=0` | pass; escaped breaches `0` | `CAPTURED_PASS` | `W15-ISS-006` |
| `EV-W15-208` | Reproducibility drift audit | drift `<=1%` | pass; max drift `0.5000%` | `CAPTURED_PASS` | `W15-ISS-007` |
| `EV-W15-209` | Correlation coverage audit | `>=99%` | pass; coverage checks passed | `CAPTURED_PASS` | `W15-ISS-012` |
| `EV-W15-210` | Compliance findings audit | findings `=0` | pass; findings `0` | `CAPTURED_PASS` | `W15-ISS-012` |
| `EV-W15-211` | Governance taxonomy consistency audit | no policy drift from W14 | pass | `CAPTURED_PASS` | `W15-ISS-003` |
| `EV-W15-212` | Evidence linkage completeness audit | sizing->decision->gate links complete | pass | `CAPTURED_PASS` | `W15-ISS-012` |
| `EV-W15-213` | Allocation review throughput watermark | throughput/toil captured | pass | `CAPTURED_PASS` | `W15-ISS-011` |
| `EV-W15-214` | Allocation reason quality audit | standardized reasons | pass | `CAPTURED_PASS` | `W15-ISS-005` |
| `EV-W15-215` | Governance rerun audit | rerun after hardening captured | pass | `CAPTURED_PASS` | `W15-ISS-003` |
| `EV-W15-216` | Week 16 handoff readiness audit | handoff fields complete | pass | `CAPTURED_PASS` | `W15-ISS-009` |

## 5) Regression and hardening matrix

| Evidence ID | Check | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W15-301` | W09 observability guard | no regression | pass | `CAPTURED_PASS` |
| `EV-W15-302` | W10 API health/SLO guard | no regression | pass | `CAPTURED_PASS` |
| `EV-W15-303` | W11 incident runbook guard | no regression | pass | `CAPTURED_PASS` |
| `EV-W15-304` | W12 ops readiness guard | no regression | pass | `CAPTURED_PASS` |
| `EV-W15-305` | W13 strategy governance guard | no regression | pass (`verify_w13_wave1.py`) | `CAPTURED_PASS` |
| `EV-W15-306` | W14 portfolio controls guard | no regression | pass (`verify_governance_gate.py`) | `CAPTURED_PASS` |

## 6) Gate reconciliation

| Evidence ID | Artifact | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W15-401` | Baseline -> Issue Register consistency | all failures mapped | consistent mapping and closure completed | `CAPTURED_PASS` |
| `EV-W15-402` | Baseline/Issue/Gate/KPI/Final verdict consistency | one final verdict | one verdict `GO` locked, budget exception justified via `W15-ISS-010` | `CAPTURED_PASS` |

## 7) Decision rule

- Nếu còn `CAPTURED_FAIL/BLOCKED_ENV` ở mục bắt buộc: W15 = `NO-GO`.
- Nếu còn P0 open hoặc P1 unowned: W15 = `NO-GO`.
- Nếu allocation/drawdown controls không enforce đầy đủ: W15 = `NO-GO`.
- Chỉ được set `GO` khi toàn bộ mandatory evidence đạt `CAPTURED_PASS` và artifacts nhất quán.
- Current result: W15 = `GO` (all mandatory evidence `CAPTURED_PASS`).
