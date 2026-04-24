# Portfolio Controls Baseline Report W14

## 1) Current status

- Current gate status: `PENDING_DECISION`.
- Baseline mode: `PENDING_EXECUTION`.
- Scope: exposure controls, concentration controls, portfolio decision traceability, cross-strategy risk interactions.

## 2) Clean-slate preflight

| Evidence ID | Check | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|
| `EV-W14-001` | Python/Rust cache cleanup | clean-slate completed | `PENDING_CAPTURE` | `PENDING_EXECUTION` | Run before evidence capture |
| `EV-W14-002` | Workspace status captured | relevant changes understood | `PENDING_CAPTURE` | `PENDING_EXECUTION` | Do not revert unrelated changes |

## 3) Command profile matrix

| Evidence ID | Command | Expected | Actual | Status | Issue mapping |
|---|---|---|---|---|---|
| `EV-W14-101` | `python -m pytest tests/test_backtest_integration.py -q` | backtest integration pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-004` |
| `EV-W14-102` | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | signal flow smoke pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-008` |
| `EV-W14-103` | `python -m pytest tests/integration/test_observability_integration.py -q` | observability integration pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-012` |
| `EV-W14-104` | `python -m pytest tests/unit/test_strategy_signals.py -q` | strategy unit pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-005` |
| `EV-W14-105` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p risk-manager -p execution-engine` | risk/execution tests pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-001`,`W14-ISS-002` |
| `EV-W14-106` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge` | common/signal tests pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-008` |
| `EV-W14-107` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | workspace check pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-008` |
| `EV-W14-108` | `bash scripts/health_check.sh` | health check pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-008` |
| `EV-W14-109` | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | compliance pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-012` |
| `EV-W14-110` | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-012` |

## 4) Controls rehearsal matrix

| Evidence ID | Scenario | Expected | Actual | Status | Blocking issue |
|---|---|---|---|---|---|
| `EV-W14-201` | Exposure control enforcement audit | enforced `100%` required checks | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-001` |
| `EV-W14-202` | Concentration control enforcement audit | enforced `100%` required checks | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-002` |
| `EV-W14-203` | Portfolio-controls checklist audit | mandatory items complete `100%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-004` |
| `EV-W14-204` | Portfolio decision traceability audit | owner+reason+evidence complete | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-005` |
| `EV-W14-205` | Cross-strategy interaction rehearsal | required scenarios `100%` pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-006` |
| `EV-W14-206` | Exposure new-breach audit | new breach count `=0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-001`,`W14-ISS-006` |
| `EV-W14-207` | Concentration new-breach audit | new breach count `=0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-002`,`W14-ISS-006` |
| `EV-W14-208` | Reproducibility drift audit | drift `<=1%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-007` |
| `EV-W14-209` | Correlation coverage audit | `>=99%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-012` |
| `EV-W14-210` | Compliance findings audit | findings `=0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-012` |
| `EV-W14-211` | Governance taxonomy consistency audit | no policy drift from W13 | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-003` |
| `EV-W14-212` | Evidence linkage completeness audit | controls->decision->gate links complete | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-012` |
| `EV-W14-213` | Portfolio review throughput watermark | throughput/toil captured | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-011` |
| `EV-W14-214` | Breach reason quality audit | standardized breach reasons | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-005` |
| `EV-W14-215` | Governance rerun audit | rerun after hardening captured | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-003` |
| `EV-W14-216` | Week 15 handoff readiness audit | handoff fields complete | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W14-ISS-009` |

## 5) Regression and hardening matrix

| Evidence ID | Check | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W14-301` | W09 observability guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W14-302` | W10 API health/SLO guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W14-303` | W11 incident runbook guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W14-304` | W12 ops readiness guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W14-305` | W13 strategy governance guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W14-306` | portfolio-controls hardening guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |

## 6) Gate reconciliation

| Evidence ID | Artifact | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W14-401` | Baseline -> Issue Register consistency | all failures mapped | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W14-402` | Baseline/Issue/Gate/KPI/Final verdict consistency | one final verdict | `PENDING_CAPTURE` | `PENDING_EXECUTION` |

## 7) Decision rule

- Nếu còn `CAPTURED_FAIL/BLOCKED_ENV` ở mục bắt buộc: W14 = `NO-GO`.
- Nếu còn P0 open hoặc P1 unowned: W14 = `NO-GO`.
- Nếu exposure/concentration controls không enforce đầy đủ: W14 = `NO-GO`.
- Chỉ được set `GO` khi toàn bộ mandatory evidence đạt `CAPTURED_PASS` và artifacts nhất quán.
