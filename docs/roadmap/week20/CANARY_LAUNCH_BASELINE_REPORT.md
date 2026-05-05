# Canary Launch Baseline Report W20

## 1) Current status

- Current gate status: `GO`.
- Baseline mode: `CAPTURED_PASS`.
- Scope: controlled canary launch, risk boundary checks, escalation correctness, rollback readiness.

## 2) Clean-slate preflight

| Evidence ID | Check | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|
| `EV-W20-001` | Python/Rust cache cleanup | clean-slate completed | no blocking cache/state issue detected | `CAPTURED_PASS` | preflight |
| `EV-W20-002` | Workspace status captured | relevant changes understood | scope locked to W20 controlled launch path | `CAPTURED_PASS` | scope |

## 3) Command profile matrix

| Evidence ID | Command | Expected | Actual | Status | Issue mapping |
|---|---|---|---|---|---|
| `EV-W20-101` | `python -m pytest tests/observability -q` | pass | `138 passed` | `CAPTURED_PASS` | `W20-ISS-004`,`W20-ISS-006` |
| `EV-W20-102` | `python -m pytest tests/integration/test_observability_integration.py -q` | pass | `8 passed` | `CAPTURED_PASS` | `W20-ISS-006` |
| `EV-W20-103` | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | pass | `9 passed` | `CAPTURED_PASS` | `W20-ISS-008` |
| `EV-W20-104` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge` | pass | all tests passed | `CAPTURED_PASS` | `W20-ISS-008` |
| `EV-W20-105` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p risk-manager -p execution-engine` | pass | all tests passed | `CAPTURED_PASS` | `W20-ISS-002`,`W20-ISS-008` |
| `EV-W20-106` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | pass | workspace check passed | `CAPTURED_PASS` | `W20-ISS-011` |
| `EV-W20-107` | `bash scripts/health_check.sh` | pass | 4 core services running | `CAPTURED_PASS` | `W20-ISS-001` |
| `EV-W20-108` | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | pass | compliance passed, 0 leaks | `CAPTURED_PASS` | `W20-ISS-007` |
| `EV-W20-109` | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | no correlation gaps found | `CAPTURED_PASS` | `W20-ISS-013` |
| `EV-W20-110` | `python scripts/verify_w20_canary_launch.py` | mandatory launch scenarios captured | verifier output `GO` | `CAPTURED_PASS` | `W20-ISS-001`,`W20-ISS-012` |

## 4) Canary launch rehearsal matrix

| Evidence ID | Scenario | Expected | Actual | Status | Blocking issue |
|---|---|---|---|---|---|
| `EV-W20-201` | Controlled launch coverage | `100%` mandatory scenarios | `100%` | `CAPTURED_PASS` | `W20-ISS-004` |
| `EV-W20-202` | Risk boundary integrity audit | unmitigated breach `=0` | `0` | `CAPTURED_PASS` | `W20-ISS-001` |
| `EV-W20-203` | Kill-switch response audit | `<=60s` | `38.00s` | `CAPTURED_PASS` | `W20-ISS-002` |
| `EV-W20-204` | Rollback rehearsal audit | success `100%` | `100%` | `CAPTURED_PASS` | `W20-ISS-002` |
| `EV-W20-205` | Incident escalation correctness | required scenarios pass | `100%` mandatory scenarios | `CAPTURED_PASS` | `W20-ISS-003` |
| `EV-W20-206` | Fault-injection rehearsal | required scenarios pass | required scenarios pass | `CAPTURED_PASS` | `W20-ISS-006` |
| `EV-W20-207` | Correlation coverage audit | `>=99%` | `99.8%` | `CAPTURED_PASS` | `W20-ISS-007` |
| `EV-W20-208` | Compliance findings audit | findings `=0` | `0` | `CAPTURED_PASS` | `W20-ISS-013` |
| `EV-W20-209` | Boundary breach handling determinism | deterministic outcomes | deterministic pass | `CAPTURED_PASS` | `W20-ISS-005` |
| `EV-W20-210` | Throughput/toil watermark | launch toil measured | `5400 msgs/sec`, toil `5m` | `CAPTURED_PASS` | `W20-ISS-012` |

## 5) Regression and governance matrix

| Evidence ID | Check | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W20-301` | W09 observability guard | no regression | observability slice pass | `CAPTURED_PASS` |
| `EV-W20-302` | W10 API health/SLO guard | no regression | observability integration pass | `CAPTURED_PASS` |
| `EV-W20-303` | W11 incident runbook guard | no regression | signal-flow integration pass | `CAPTURED_PASS` |
| `EV-W20-304` | W12 ops readiness guard | no regression | governance verifier pass | `CAPTURED_PASS` |
| `EV-W20-305` | W13-W16 strategy/portfolio/repro guard | no regression | W15/W16 verifiers pass | `CAPTURED_PASS` |
| `EV-W20-306` | W17-W19 staging/canary/safety guard | no regression | W17/W18/W19 verifiers pass | `CAPTURED_PASS` |
| `EV-W20-401` | Baseline -> Issue consistency | all blockers mapped | P0/P1 mapped + closed by evidence | `CAPTURED_PASS` |
| `EV-W20-402` | Artifact consistency | one final verdict | all W20 artifacts lock `GO` | `CAPTURED_PASS` |

## 6) Decision rule

- `GO` chỉ khi mandatory criteria đều `CAPTURED_PASS`.
- Nếu còn mandatory `CAPTURED_FAIL/BLOCKED_ENV`, verdict = `NO-GO`.
- Final verdict: `GO`.
