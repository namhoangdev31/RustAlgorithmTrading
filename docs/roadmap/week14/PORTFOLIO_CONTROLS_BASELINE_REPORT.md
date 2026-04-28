# Portfolio Controls Baseline Report W14

## 1) Current status

- Current gate status: `GO`.
- Baseline mode: `CAPTURED_PASS`.
- Scope: exposure controls, concentration controls, portfolio decision traceability, cross-strategy risk interactions.

## 2) Clean-slate preflight

| Evidence ID | Check | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|
| `EV-W14-001` | Python/Rust cache cleanup | clean-slate completed | cache cleanup executed | `CAPTURED_PASS` | `__pycache__`/`.pytest_cache` cleaned |
| `EV-W14-002` | Workspace status captured | relevant changes understood | captured via `git status --short` snapshot | `CAPTURED_PASS` | unrelated local edits preserved |

## 3) Command profile matrix (rerun 2026-04-28)

| Evidence ID | Command | Expected | Actual | Status | Issue mapping |
|---|---|---|---|---|---|
| `EV-W14-101` | `python -m pytest tests/test_backtest_integration.py -q` | backtest integration pass | pass (`5 passed`) | `CAPTURED_PASS` | `W14-ISS-004` |
| `EV-W14-102` | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | signal flow smoke pass | pass (`9 passed`) | `CAPTURED_PASS` | `W14-ISS-008` |
| `EV-W14-103` | `python -m pytest tests/integration/test_observability_integration.py -q` | observability integration pass | pass (`8 passed`) | `CAPTURED_PASS` | `W14-ISS-012` |
| `EV-W14-104` | `python -m pytest tests/unit/test_strategy_signals.py -q` | strategy unit pass | pass (`21 passed`) | `CAPTURED_PASS` | `W14-ISS-005` |
| `EV-W14-105` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p risk-manager -p execution-engine` | risk/execution tests pass | pass | `CAPTURED_PASS` | `W14-ISS-001`,`W14-ISS-002` |
| `EV-W14-106` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge` | common/signal tests pass | pass | `CAPTURED_PASS` | `W14-ISS-008` |
| `EV-W14-107` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | workspace check pass | pass | `CAPTURED_PASS` | `W14-ISS-008` |
| `EV-W14-108` | `bash scripts/health_check.sh` | health check pass | pass | `CAPTURED_PASS` | `W14-ISS-008` |
| `EV-W14-109` | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | compliance pass | pass (`0` findings, `0` leaks) | `CAPTURED_PASS` | `W14-ISS-012` |
| `EV-W14-110` | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | pass (`No correlation_id logging gaps`) | `CAPTURED_PASS` | `W14-ISS-012` |

## 4) Controls rehearsal matrix

| Evidence ID | Scenario | Expected | Actual | Status | Blocking issue |
|---|---|---|---|---|---|
| `EV-W14-201` | Exposure control enforcement audit | enforced `100%` required checks | pass; breach scenario rejected (50% > 10%) | `CAPTURED_PASS` | `W14-ISS-001` |
| `EV-W14-202` | Concentration control enforcement audit | enforced `100%` required checks | pass; breach scenario rejected (80% > 20%) | `CAPTURED_PASS` | `W14-ISS-002` |
| `EV-W14-203` | Portfolio-controls checklist audit | mandatory items complete `100%` | pass; mandatory trace fields complete | `CAPTURED_PASS` | `W14-ISS-004` |
| `EV-W14-204` | Portfolio decision traceability audit | owner+reason+evidence complete | pass; decision records complete | `CAPTURED_PASS` | `W14-ISS-005` |
| `EV-W14-205` | Cross-strategy interaction rehearsal | required scenarios `100%` pass | pass; coverage `100%` | `CAPTURED_PASS` | `W14-ISS-006` |
| `EV-W14-206` | Exposure new-breach audit | new breach count `=0` | pass; escaped exposure breaches `0` | `CAPTURED_PASS` | `W14-ISS-001`,`W14-ISS-006` |
| `EV-W14-207` | Concentration new-breach audit | new breach count `=0` | pass; escaped concentration breaches `0` | `CAPTURED_PASS` | `W14-ISS-002`,`W14-ISS-006` |
| `EV-W14-208` | Reproducibility drift audit | drift `<=1%` | pass; max drift `0.5000%` | `CAPTURED_PASS` | `W14-ISS-007` |
| `EV-W14-209` | Correlation coverage audit | `>=99%` | pass; coverage checks passed, no gaps | `CAPTURED_PASS` | `W14-ISS-012` |
| `EV-W14-210` | Compliance findings audit | findings `=0` | pass; findings `0` | `CAPTURED_PASS` | `W14-ISS-012` |
| `EV-W14-211` | Governance taxonomy consistency audit | no policy drift from W13 | pass; taxonomy consistent across W14 artifacts | `CAPTURED_PASS` | `W14-ISS-003` |
| `EV-W14-212` | Evidence linkage completeness audit | controls->decision->gate links complete | pass; linkage completed | `CAPTURED_PASS` | `W14-ISS-012` |
| `EV-W14-213` | Portfolio review throughput watermark | throughput/toil captured | pass; rehearsal cycle throughput captured | `CAPTURED_PASS` | `W14-ISS-011` |
| `EV-W14-214` | Breach reason quality audit | standardized breach reasons | pass; breach reasons standardized in control records | `CAPTURED_PASS` | `W14-ISS-005` |
| `EV-W14-215` | Governance rerun audit | rerun after hardening captured | pass; rerun captured after import/control fixes | `CAPTURED_PASS` | `W14-ISS-003` |
| `EV-W14-216` | Week 15 handoff readiness audit | handoff fields complete | pass; W15 start pack completed | `CAPTURED_PASS` | `W14-ISS-009` |

## 5) Regression and hardening matrix

| Evidence ID | Check | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W14-301` | W09 observability guard | no regression | pass (observability integration rerun passed) | `CAPTURED_PASS` |
| `EV-W14-302` | W10 API health/SLO guard | no regression | pass (health/compliance/correlation checks passed) | `CAPTURED_PASS` |
| `EV-W14-303` | W11 incident runbook guard | no regression | pass (signal-flow integration rerun passed) | `CAPTURED_PASS` |
| `EV-W14-304` | W12 ops readiness guard | no regression | pass (command profile remains green) | `CAPTURED_PASS` |
| `EV-W14-305` | W13 strategy governance guard | no regression | pass (governance verification scripts still pass) | `CAPTURED_PASS` |
| `EV-W14-306` | portfolio-controls hardening guard | no regression | pass (controls rehearsal and unit tests pass) | `CAPTURED_PASS` |

## 6) Gate reconciliation

| Evidence ID | Artifact | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W14-401` | Baseline -> Issue Register consistency | all failures mapped | consistent mapping and closure completed | `CAPTURED_PASS` |
| `EV-W14-402` | Baseline/Issue/Gate/KPI/Final verdict consistency | one final verdict | one verdict `GO` locked, budget exception justified via `W14-ISS-010` | `CAPTURED_PASS` |

## 7) Decision rule

- Nếu còn `CAPTURED_FAIL/BLOCKED_ENV` ở mục bắt buộc: W14 = `NO-GO`.
- Nếu còn P0 open hoặc P1 unowned: W14 = `NO-GO`.
- Nếu exposure/concentration controls không enforce đầy đủ: W14 = `NO-GO`.
- Chỉ được set `GO` khi toàn bộ mandatory evidence đạt `CAPTURED_PASS` và artifacts nhất quán.
- Current result: W14 = `GO` (all mandatory evidence `CAPTURED_PASS`).
