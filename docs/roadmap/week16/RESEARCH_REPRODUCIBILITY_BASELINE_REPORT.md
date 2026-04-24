# Research Reproducibility Baseline Report W16

## 1) Current status

- Current gate status: `PENDING_DECISION`.
- Baseline mode: `PENDING_EXECUTION`.
- Scope: seed control, deterministic rerun profile, multi-rerun consistency, reproducibility decision traceability.

## 2) Clean-slate preflight

| Evidence ID | Check | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|
| `EV-W16-001` | Python/Rust cache cleanup | clean-slate completed | `PENDING_CAPTURE` | `PENDING_EXECUTION` | Run before evidence capture |
| `EV-W16-002` | Workspace status captured | relevant changes understood | `PENDING_CAPTURE` | `PENDING_EXECUTION` | Do not revert unrelated changes |

## 3) Command profile matrix

| Evidence ID | Command | Expected | Actual | Status | Issue mapping |
|---|---|---|---|---|---|
| `EV-W16-101` | `python -m pytest tests/test_backtest_integration.py -q` | backtest integration pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-004` |
| `EV-W16-102` | `python -m pytest tests/unit/test_strategy_signals.py -q` | strategy unit pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-005` |
| `EV-W16-103` | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | signal flow smoke pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-008` |
| `EV-W16-104` | `python -m pytest tests/integration/test_observability_integration.py -q` | observability integration pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-012` |
| `EV-W16-105` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge` | common/signal tests pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-001`,`W16-ISS-002` |
| `EV-W16-106` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p risk-manager -p execution-engine` | risk/execution tests pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-006` |
| `EV-W16-107` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | workspace check pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-008` |
| `EV-W16-108` | `bash scripts/health_check.sh` | health check pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-008` |
| `EV-W16-109` | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | compliance pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-012` |
| `EV-W16-110` | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-012` |

## 4) Reproducibility rehearsal matrix

| Evidence ID | Scenario | Expected | Actual | Status | Blocking issue |
|---|---|---|---|---|---|
| `EV-W16-201` | Seed-control enforcement audit | compliance `100%` required runs | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-001` |
| `EV-W16-202` | Deterministic rerun profile audit | required scenarios `100%` pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-002` |
| `EV-W16-203` | Reproducibility checklist audit | mandatory items complete `100%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-004` |
| `EV-W16-204` | Reproducibility decision traceability audit | owner+reason+evidence complete | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-005` |
| `EV-W16-205` | Multi-rerun consistency rehearsal | required scenarios `100%` pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-006` |
| `EV-W16-206` | Reproducibility drift audit | drift `<=1%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-002`,`W16-ISS-006` |
| `EV-W16-207` | Exception-handling consistency audit | consistency `100%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-007` |
| `EV-W16-208` | New-breach audit | new breach count `=0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-007` |
| `EV-W16-209` | Correlation coverage audit | `>=99%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-012` |
| `EV-W16-210` | Compliance findings audit | findings `=0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-012` |
| `EV-W16-211` | Governance taxonomy consistency audit | no policy drift from W15 | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-003` |
| `EV-W16-212` | Evidence linkage completeness audit | seed->rerun->decision->gate links complete | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-012` |
| `EV-W16-213` | Rerun throughput watermark | throughput/toil captured | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-011` |
| `EV-W16-214` | Reproducibility reason quality audit | standardized pass/fail reasons | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-005` |
| `EV-W16-215` | Governance rerun audit | rerun after hardening captured | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-003` |
| `EV-W16-216` | Week 17 handoff readiness audit | handoff fields complete | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W16-ISS-009` |

## 5) Regression and hardening matrix

| Evidence ID | Check | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W16-301` | W09 observability guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W16-302` | W10 API health/SLO guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W16-303` | W11 incident runbook guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W16-304` | W12 ops readiness guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W16-305` | W13 strategy governance guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W16-306` | W14/W15 allocation-controls guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |

## 6) Gate reconciliation

| Evidence ID | Artifact | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W16-401` | Baseline -> Issue Register consistency | all failures mapped | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W16-402` | Baseline/Issue/Gate/KPI/Final verdict consistency | one final verdict | `PENDING_CAPTURE` | `PENDING_EXECUTION` |

## 7) Decision rule

- Nếu còn `CAPTURED_FAIL/BLOCKED_ENV` ở mục bắt buộc: W16 = `NO-GO`.
- Nếu còn P0 open hoặc P1 unowned: W16 = `NO-GO`.
- Nếu seed/deterministic controls không enforce đầy đủ: W16 = `NO-GO`.
- Chỉ được set `GO` khi toàn bộ mandatory evidence đạt `CAPTURED_PASS` và artifacts nhất quán.
