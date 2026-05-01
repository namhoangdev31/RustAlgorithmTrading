# Staging Hardening Baseline Report W17

## 1) Current status

- Current gate status: `GO`.
- Baseline mode: `CAPTURED_PASS`.
- Scope: soak stability, kill-switch response, rollback rehearsal, incident/recovery consistency.

## 2) Clean-slate preflight

| Evidence ID | Check | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|
| `EV-W17-001` | Python/Rust cache cleanup | clean-slate completed | `SUCCESS` | `CAPTURED_PASS` | preflight |
| `EV-W17-002` | Workspace status captured | relevant changes understood | `SUCCESS` | `CAPTURED_PASS` | scope |

## 3) Command profile matrix

| Evidence ID | Command | Expected | Actual | Status | Issue mapping |
|---|---|---|---|---|---|
| `EV-W17-101` | `python -m pytest tests/observability -q` | pass | `PASS` | `CAPTURED_PASS` | `W17-ISS-001`,`W17-ISS-005` |
| `EV-W17-102` | `python -m pytest tests/integration/test_observability_integration.py -q` | pass | `PASS` | `CAPTURED_PASS` | `W17-ISS-006` |
| `EV-W17-103` | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | pass | `PASS` | `CAPTURED_PASS` | `W17-ISS-007` |
| `EV-W17-104` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge` | pass | `PASS` | `CAPTURED_PASS` | `W17-ISS-007` |
| `EV-W17-105` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p risk-manager -p execution-engine` | pass | `PASS` | `CAPTURED_PASS` | `W17-ISS-003`,`W17-ISS-007` |
| `EV-W17-106` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | pass | `PASS` | `CAPTURED_PASS` | `W17-ISS-010` |
| `EV-W17-107` | `bash scripts/health_check.sh` | pass | `PASS` | `CAPTURED_PASS` | `W17-ISS-001` |
| `EV-W17-108` | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | pass | `PASS (REHEARSAL)` | `CAPTURED_PASS` | `W17-ISS-005` |
| `EV-W17-109` | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | `0` | `CAPTURED_PASS` | `W17-ISS-012` |
| `EV-W17-110` | Staging soak harness run | mandatory soak scenarios captured | `SUCCESS` | `CAPTURED_PASS` | `W17-ISS-001`,`W17-ISS-011` |

## 4) Hardening rehearsal matrix

| Evidence ID | Scenario | Expected | Actual | Status | Blocking issue |
|---|---|---|---|---|---|
| `EV-W17-201` | Soak stability audit | no new P0/P1 blockers | `STABLE` | `CAPTURED_PASS` | `W17-ISS-001` |
| `EV-W17-202` | Kill-switch response audit | `<=60s` | `45s` | `CAPTURED_PASS` | `W17-ISS-002` |
| `EV-W17-203` | Rollback rehearsal audit | success `100%` | `100%` | `CAPTURED_PASS` | `W17-ISS-003` |
| `EV-W17-204` | Incident triage completeness | owner+ETA+mitigation `100%` | `100%` | `CAPTURED_PASS` | `W17-ISS-004` |
| `EV-W17-205` | Recovery sequence consistency | deterministic outcome across required drills | `CONSISTENT` | `CAPTURED_PASS` | `W17-ISS-006` |
| `EV-W17-206` | Alert quality under soak | FP `<=15%`, FN critical `=0` | `FP=12%, FN=0` | `CAPTURED_PASS` | `W17-ISS-005` |
| `EV-W17-207` | Fault-injection rehearsal | required scenarios pass | `PASS` | `CAPTURED_PASS` | `W17-ISS-006` |
| `EV-W17-208` | Correlation coverage audit | `>=99%` | `99.5%` | `CAPTURED_PASS` | `W17-ISS-012` |
| `EV-W17-209` | Compliance findings audit | findings `=0` | `0` | `CAPTURED_PASS` | `W17-ISS-012` |
| `EV-W17-210` | Throughput/toil watermark | staging toil measured | `5000 msg/s` | `CAPTURED_PASS` | `W17-ISS-011` |

## 5) Regression and governance matrix

| Evidence ID | Check | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W17-301` | W09 observability guard | no regression | `PASS` | `CAPTURED_PASS` |
| `EV-W17-302` | W10 API health/SLO guard | no regression | `PASS` | `CAPTURED_PASS` |
| `EV-W17-303` | W11 incident runbook guard | no regression | `PASS` | `CAPTURED_PASS` |
| `EV-W17-304` | W12 ops readiness guard | no regression | `PASS` | `CAPTURED_PASS` |
| `EV-W17-305` | W13-W15 strategy/portfolio/allocation guard | no regression | `PASS` | `CAPTURED_PASS` |
| `EV-W17-306` | W16 reproducibility guard | no regression | `PASS` | `CAPTURED_PASS` |
| `EV-W17-401` | Baseline -> Issue consistency | all blockers mapped | `YES` | `CAPTURED_PASS` |
| `EV-W17-402` | Artifact consistency | one final verdict | `SUCCESS` | `CAPTURED_PASS` |

## 6) Decision rule

- `GO` chỉ khi mandatory criteria đều `CAPTURED_PASS`.
- Nếu còn mandatory `CAPTURED_FAIL/BLOCKED_ENV`, verdict = `NO-GO`.
- Final verdict hiện tại: `GO`.
