# Final-Phase Gate 2 Baseline Report W22

## 1) Current status

- Current gate status: `NO-GO`.
- Baseline mode: `EXECUTED` (`NO-GO track` do W21 chưa đạt GO precondition).
- Scope: full Python/Rust unit+integration + integration debt closure.

## 2) Clean-slate preflight

| Evidence ID | Check | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|
| `EV-W22-001` | Python/Rust cache cleanup | clean-slate completed | preflight executed before command profile | `CAPTURED_PASS` | preflight |
| `EV-W22-002` | Workspace status captured | relevant changes understood | workspace scope captured before rerun | `CAPTURED_PASS` | scope |

## 3) Command profile matrix

| Evidence ID | Command | Expected | Actual | Status | Issue mapping |
|---|---|---|---|---|---|
| `EV-W22-101` | `python -m pytest tests/unit -q` | pass | FAIL (`rc=1`): 5 failed, 350 passed, 1 skipped | `CAPTURED_FAIL` | `W22-ISS-001`,`W22-ISS-004` |
| `EV-W22-102` | `python -m pytest tests/integration -q` | pass | FAIL (`rc=1`): 13 failed, 34 passed, 2 skipped (parquet deps + signal enum mismatch) | `CAPTURED_FAIL` | `W22-ISS-001`,`W22-ISS-003` |
| `EV-W22-103` | `python -m pytest tests/observability -q` | pass | PASS (`rc=0`) | `CAPTURED_PASS` | `W22-ISS-006` |
| `EV-W22-104` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test --workspace` | pass | PASS (`rc=0`) | `CAPTURED_PASS` | `W22-ISS-002`,`W22-ISS-003` |
| `EV-W22-105` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | pass | PASS (`rc=0`) | `CAPTURED_PASS` | `W22-ISS-010` |
| `EV-W22-106` | integration debt snapshot capture | debt items mapped | `python scripts/verify_w22_release_gate2.py` PASS (`rc=0`), toil watermark=16 | `CAPTURED_PASS` | `W22-ISS-004`,`W22-ISS-011` |
| `EV-W22-107` | cross-runtime slice profile | pass | PASS (`rc=0`) via `tests/integration/test_backtest_signal_flow.py` | `CAPTURED_PASS` | `W22-ISS-003` |
| `EV-W22-108` | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | pass | PASS (`rc=0`), correlation/schema check pass, redaction findings=0 | `CAPTURED_PASS` | `W22-ISS-006` |
| `EV-W22-109` | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | PASS (`rc=0`), 0 findings | `CAPTURED_PASS` | `W22-ISS-012` |
| `EV-W22-110` | `bash scripts/health_check.sh` | pass | PASS (`rc=0`) | `CAPTURED_PASS` | `W22-ISS-001` |

## 4) Hard-gate2 rehearsal matrix

| Evidence ID | Scenario | Expected | Actual | Status | Blocking issue |
|---|---|---|---|---|---|
| `EV-W22-201` | Full Python unit+integration pass audit | `100%` | FAIL: Python unit+integration chưa đạt | `CAPTURED_FAIL` | `W22-ISS-001` |
| `EV-W22-202` | Full Rust unit+integration pass audit | `100%` | PASS: Rust unit+integration đạt | `CAPTURED_PASS` | `W22-ISS-002` |
| `EV-W22-203` | Cross-runtime integration pass audit | required slices pass | FAIL: full integration suite còn fail dù slice `EV-W22-107` pass | `CAPTURED_FAIL` | `W22-ISS-003` |
| `EV-W22-204` | Integration debt closure audit | open debt `=0` | FAIL: debt chưa thể đóng khi `EV-W22-101/102` fail | `CAPTURED_FAIL` | `W22-ISS-004` |
| `EV-W22-205` | Correlation coverage audit | `>=99%` | PASS: 99.9% | `CAPTURED_PASS` | `W22-ISS-006` |
| `EV-W22-206` | Compliance findings audit | findings `=0` | PASS: findings=0 | `CAPTURED_PASS` | `W22-ISS-012` |
| `EV-W22-207` | Hard-gate rerun stability | no new blocker after rerun | FAIL: còn blocker mandatory `EV-W22-201/203/204` | `CAPTURED_FAIL` | `W22-ISS-003` |
| `EV-W22-208` | Release blocker mapping audit | blockers taxonomy complete | PASS: blockers mapped vào `W22-ISS-001..004` | `CAPTURED_PASS` | `W22-ISS-005` |
| `EV-W22-209` | Escalation record integrity | trigger/owner/mitigation captured | PASS: change footprint trong budget, không cần escalation | `CAPTURED_PASS` | `W22-ISS-010` |
| `EV-W22-210` | Throughput/toil watermark | gate toil measured | PASS: throughput watermark=16 captured | `CAPTURED_PASS` | `W22-ISS-011` |

## 5) Regression and governance matrix

| Evidence ID | Check | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W22-301` | W09 observability guard | no regression | PASS (`pytest tests/observability`) | `CAPTURED_PASS` |
| `EV-W22-302` | W10 API health/SLO guard | no regression | PASS (`test_observability_integration.py`) | `CAPTURED_PASS` |
| `EV-W22-303` | W11-W12 incident/ops guard | no regression | PASS (`test_backtest_signal_flow.py`) | `CAPTURED_PASS` |
| `EV-W22-304` | W13-W16 strategy/portfolio/repro guard | no regression | PASS (`verify_governance_gate.py`) | `CAPTURED_PASS` |
| `EV-W22-305` | W17-W18 staging/canary guard | no regression | FAIL: `verify_w15_capital_allocation.py` fail (`ModuleNotFoundError: models`) | `CAPTURED_FAIL` |
| `EV-W22-306` | W19-W21 safety/gate1 guard | no regression | PASS (`verify_w16..w21` remaining guard verifiers pass) | `CAPTURED_PASS` |
| `EV-W22-401` | Baseline -> Issue consistency | all blockers mapped | PASS: blocker/evidence mapping synchronized | `CAPTURED_PASS` |
| `EV-W22-402` | Artifact consistency | one final verdict | PASS: verdict duy nhất `NO-GO` | `CAPTURED_PASS` |

## 6) Decision rule

- `GO` chỉ khi mandatory criteria đều `CAPTURED_PASS`.
- Nếu còn mandatory `CAPTURED_FAIL/BLOCKED_ENV`, verdict = `NO-GO`.
- Final verdict hiện tại: `NO-GO`.
