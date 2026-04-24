# Strategy Governance Baseline Report W13

## 1) Current status

- Current gate status: `PENDING_DECISION`.
- Baseline mode: `PENDING_EXECUTION`.
- Scope: OOS/walk-forward checklist enforcement, evidence quality gate, strategy decision traceability, reproducibility drift control.

## 2) Clean-slate preflight

| Evidence ID | Check | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|
| `EV-W13-001` | Python/Rust cache cleanup | clean-slate completed | `PENDING_CAPTURE` | `PENDING_EXECUTION` | Run before evidence capture |
| `EV-W13-002` | Workspace status captured | relevant changes understood | `PENDING_CAPTURE` | `PENDING_EXECUTION` | Do not revert unrelated changes |

## 3) Command profile matrix

| Evidence ID | Command | Expected | Actual | Status | Issue mapping |
|---|---|---|---|---|---|
| `EV-W13-101` | `python -m pytest tests/unit/test_strategy_signals.py -q` | strategy unit slice pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-004` |
| `EV-W13-102` | `python -m pytest tests/test_backtest_integration.py -q` | backtest integration pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-005`,`W13-ISS-006` |
| `EV-W13-103` | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | signal flow smoke pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-008` |
| `EV-W13-104` | `python -m pytest tests/integration/test_observability_integration.py -q` | observability integration pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-012` |
| `EV-W13-105` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common` | common tests pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-008` |
| `EV-W13-106` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p signal-bridge -p risk-manager` | signal/risk tests pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-007` |
| `EV-W13-107` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | workspace check pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-008` |
| `EV-W13-108` | `bash scripts/health_check.sh` | health check pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-008` |
| `EV-W13-109` | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | compliance pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-012` |
| `EV-W13-110` | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-012` |

## 4) Governance rehearsal matrix

| Evidence ID | Scenario | Expected | Actual | Status | Blocking issue |
|---|---|---|---|---|---|
| `EV-W13-201` | OOS checklist enforcement audit | mandatory OOS items complete | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-004` |
| `EV-W13-202` | Walk-forward checklist enforcement audit | mandatory WF items complete | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-005` |
| `EV-W13-203` | Strategy evidence gate enforcement audit | missing evidence strategies blocked | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-001` |
| `EV-W13-204` | Strategy decision traceability audit | owner+rationale+evidence complete | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-002` |
| `EV-W13-205` | Reproducibility drift audit | drift `<=1%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-006` |
| `EV-W13-206` | Exposure/concentration guard audit | new breach `=0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-007` |
| `EV-W13-207` | Correlation coverage audit | `>=99%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-012` |
| `EV-W13-208` | Compliance findings audit | findings `=0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-012` |
| `EV-W13-209` | P0 open count audit | `0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-003` |
| `EV-W13-210` | P1 unowned count audit | `0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-003` |
| `EV-W13-211` | Governance taxonomy consistency audit | no policy drift | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-003` |
| `EV-W13-212` | Evidence linkage completeness audit | checklist->decision->gate links complete | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-012` |
| `EV-W13-213` | Strategy review throughput watermark | throughput/toil captured | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-011` |
| `EV-W13-214` | Decision block reason quality audit | standardized block reasons | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-001` |
| `EV-W13-215` | Governance rerun audit | rerun after hardening captured | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-003` |
| `EV-W13-216` | Week 14 handoff readiness audit | handoff fields complete | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W13-ISS-009` |

## 5) Regression and hardening matrix

| Evidence ID | Check | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W13-301` | W09 observability guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W13-302` | W10 API health/SLO guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W13-303` | W11 incident runbook guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W13-304` | W12 ops readiness guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W13-305` | strategy governance hardening guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W13-306` | governance artifact guard | no regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` |

## 6) Gate reconciliation

| Evidence ID | Artifact | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W13-401` | Baseline -> Issue Register consistency | all failures mapped | `PENDING_CAPTURE` | `PENDING_EXECUTION` |
| `EV-W13-402` | Baseline/Issue/Gate/KPI/Final verdict consistency | one final verdict | `PENDING_CAPTURE` | `PENDING_EXECUTION` |

## 7) Decision rule

- Nếu còn `CAPTURED_FAIL/BLOCKED_ENV` ở mục bắt buộc: W13 = `NO-GO`.
- Nếu còn P0 open hoặc P1 unowned: W13 = `NO-GO`.
- Nếu strategy evidence gate không enforce đầy đủ: W13 = `NO-GO`.
- Chỉ được set `GO` khi toàn bộ mandatory evidence đạt `CAPTURED_PASS` và artifacts nhất quán.
