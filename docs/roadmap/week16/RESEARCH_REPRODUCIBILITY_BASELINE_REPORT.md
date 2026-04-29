# Research Reproducibility Baseline Report W16

## 1) Current status

- Current gate status: `GO`.
- Baseline mode: `CAPTURED_PASS`.
- Scope: seed control, deterministic rerun profile, multi-rerun consistency, reproducibility decision traceability.

## 2) Clean-slate preflight

| Evidence ID | Check | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|
| `EV-W16-001` | Python/Rust cache cleanup | clean-slate completed | cleanup executed before command profile | `CAPTURED_PASS` | preflight done |
| `EV-W16-002` | Workspace status captured | relevant changes understood | `git status` captured and mapped to W16 artifacts | `CAPTURED_PASS` | scope confirmed |

## 3) Command profile matrix

| Evidence ID | Command | Expected | Actual | Status | Issue mapping |
|---|---|---|---|---|---|
| `EV-W16-101` | `python -m pytest tests/test_backtest_integration.py -q` | backtest integration pass | pass (`5 passed`) | `CAPTURED_PASS` | `W16-ISS-004` |
| `EV-W16-102` | `python -m pytest tests/unit/test_strategy_signals.py -q` | strategy unit pass | pass (`21 passed`) | `CAPTURED_PASS` | `W16-ISS-005` |
| `EV-W16-103` | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | signal flow smoke pass | pass (`9 passed`) | `CAPTURED_PASS` | `W16-ISS-008` |
| `EV-W16-104` | `python -m pytest tests/integration/test_observability_integration.py -q` | observability integration pass | pass (`8 passed`) | `CAPTURED_PASS` | `W16-ISS-012` |
| `EV-W16-105` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge` | common/signal tests pass | pass (all tests/doc-tests pass) | `CAPTURED_PASS` | `W16-ISS-001`,`W16-ISS-002` |
| `EV-W16-106` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p risk-manager -p execution-engine` | risk/execution tests pass | pass (`risk-manager` + `execution-engine`) | `CAPTURED_PASS` | `W16-ISS-006` |
| `EV-W16-107` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | workspace check pass | pass (`Finished dev profile`) | `CAPTURED_PASS` | `W16-ISS-008` |
| `EV-W16-108` | `bash scripts/health_check.sh` | health check pass | pass (4 core services healthy) | `CAPTURED_PASS` | `W16-ISS-008` |
| `EV-W16-109` | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | compliance pass | pass (`correlation_id` + `schema_version` checks pass) | `CAPTURED_PASS` | `W16-ISS-012` |
| `EV-W16-110` | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | pass (`No correlation_id logging gaps found`) | `CAPTURED_PASS` | `W16-ISS-012` |

## 4) Reproducibility rehearsal matrix

| Evidence ID | Scenario | Expected | Actual | Status | Blocking issue |
|---|---|---|---|---|---|
| `EV-W16-201` | Seed-control enforcement audit | compliance `100%` required runs | pass (`100.0%`) from `scripts/verify_w16_reproducibility.py` | `CAPTURED_PASS` | `W16-ISS-001` |
| `EV-W16-202` | Deterministic rerun profile audit | required scenarios `100%` pass | pass (`100.0%` deterministic coverage) | `CAPTURED_PASS` | `W16-ISS-002` |
| `EV-W16-203` | Reproducibility checklist audit | mandatory items complete `100%` | pass (`checklist_complete = true`) | `CAPTURED_PASS` | `W16-ISS-004` |
| `EV-W16-204` | Reproducibility decision traceability audit | owner+reason+evidence complete | pass (record contract fields complete) | `CAPTURED_PASS` | `W16-ISS-005` |
| `EV-W16-205` | Multi-rerun consistency rehearsal | required scenarios `100%` pass | pass (`multi_rerun_consistency = true`) | `CAPTURED_PASS` | `W16-ISS-006` |
| `EV-W16-206` | Reproducibility drift audit | drift `<=1%` | pass (`max_drift = 0.000000%`) | `CAPTURED_PASS` | `W16-ISS-002`,`W16-ISS-006` |
| `EV-W16-207` | Exception-handling consistency audit | consistency `100%` | pass (exception policy consistency true) | `CAPTURED_PASS` | `W16-ISS-007` |
| `EV-W16-208` | New-breach audit | new breach count `=0` | pass (`new_breach_count = 0`) | `CAPTURED_PASS` | `W16-ISS-007` |
| `EV-W16-209` | Correlation coverage audit | `>=99%` | pass (`100%` sampled critical events) | `CAPTURED_PASS` | `W16-ISS-012` |
| `EV-W16-210` | Compliance findings audit | findings `=0` | pass (`0` findings from compliance + correlation audits) | `CAPTURED_PASS` | `W16-ISS-012` |
| `EV-W16-211` | Governance taxonomy consistency audit | no policy drift from W15 | pass (taxonomy synced across baseline/issue/KPI/gate/final) | `CAPTURED_PASS` | `W16-ISS-003` |
| `EV-W16-212` | Evidence linkage completeness audit | seed->rerun->decision->gate links complete | pass (all mandatory rows linked to issue + evidence IDs) | `CAPTURED_PASS` | `W16-ISS-012` |
| `EV-W16-213` | Rerun throughput watermark | throughput/toil captured | pass (`verify_w16_reproducibility real=0.15s`) | `CAPTURED_PASS` | `W16-ISS-011` |
| `EV-W16-214` | Reproducibility reason quality audit | standardized pass/fail reasons | pass (`PASS/DEFER/BLOCKED` reason contract enforced) | `CAPTURED_PASS` | `W16-ISS-005` |
| `EV-W16-215` | Governance rerun audit | rerun after hardening captured | pass (command profile rerun completed after import/governance hardening) | `CAPTURED_PASS` | `W16-ISS-003` |
| `EV-W16-216` | Week 17 handoff readiness audit | handoff fields complete | pass (W17 start-pack priorities + guardrails finalized) | `CAPTURED_PASS` | `W16-ISS-009` |

## 5) Regression and hardening matrix

| Evidence ID | Check | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W16-301` | W09 observability guard | no regression | pass (`test_observability_integration` + correlation audit pass) | `CAPTURED_PASS` |
| `EV-W16-302` | W10 API health/SLO guard | no regression | pass (`health_check` + compliance audit pass) | `CAPTURED_PASS` |
| `EV-W16-303` | W11 incident runbook guard | no regression | pass (health path + escalation path remain healthy, no blocker reopened) | `CAPTURED_PASS` |
| `EV-W16-304` | W12 ops readiness guard | no regression | pass (command profile and ownership gates all green) | `CAPTURED_PASS` |
| `EV-W16-305` | W13 strategy governance guard | no regression | pass (`python scripts/verify_governance_gate.py`) | `CAPTURED_PASS` |
| `EV-W16-306` | W14/W15 allocation-controls guard | no regression | pass (`python scripts/verify_w15_capital_allocation.py`) | `CAPTURED_PASS` |

## 6) Gate reconciliation

| Evidence ID | Artifact | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W16-401` | Baseline -> Issue Register consistency | all failures mapped | pass (mandatory evidence rows mapped to closed issues) | `CAPTURED_PASS` |
| `EV-W16-402` | Baseline/Issue/Gate/KPI/Final verdict consistency | one final verdict | pass (single verdict `GO`) | `CAPTURED_PASS` |

## 7) Decision rule

- Mandatory criteria đạt đầy đủ `CAPTURED_PASS`.
- `P0 open = 0`, `P1 unowned = 0`.
- Reproducibility controls enforce đúng policy.
- W16 final verdict locked: `GO`.
