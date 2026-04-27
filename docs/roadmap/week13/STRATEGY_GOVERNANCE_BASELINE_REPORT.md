# Strategy Governance Baseline Report W13

## 1) Current status

- Current gate status: `GO`.
- Baseline mode: `CAPTURED_PASS`.
- Scope: OOS/walk-forward checklist enforcement, evidence quality gate, strategy decision traceability, reproducibility drift control.

## 2) Clean-slate preflight

| Evidence ID | Check | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|
| `EV-W13-001` | Python/Rust cache cleanup | clean-slate completed | completed (`__pycache__`, `.pytest_cache` cleaned) | `CAPTURED_PASS` | executed before final artifact sync |
| `EV-W13-002` | Workspace status captured | relevant changes understood | captured (local in-flight edits recorded and preserved) | `CAPTURED_PASS` | unrelated local edits were not reverted |

## 3) Command profile matrix (rerun 2026-04-27)

| Evidence ID | Command | Expected | Actual | Status | Issue mapping |
|---|---|---|---|---|---|
| `EV-W13-101` | `python -m pytest tests/unit/test_strategy_signals.py -q` | strategy unit slice pass | pass (`21 passed`) | `CAPTURED_PASS` | `W13-ISS-004` |
| `EV-W13-102` | `python -m pytest tests/test_backtest_integration.py -q` | backtest integration pass | pass (`5 passed`) | `CAPTURED_PASS` | `W13-ISS-005`,`W13-ISS-006` |
| `EV-W13-103` | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | signal flow smoke pass | pass (`9 passed`) | `CAPTURED_PASS` | `W13-ISS-008` |
| `EV-W13-104` | `python -m pytest tests/integration/test_observability_integration.py -q` | observability integration pass | pass (`8 passed`) | `CAPTURED_PASS` | `W13-ISS-012` |
| `EV-W13-105` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common` | common tests pass | pass | `CAPTURED_PASS` | `W13-ISS-008` |
| `EV-W13-106` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p signal-bridge -p risk-manager` | signal/risk tests pass | pass | `CAPTURED_PASS` | `W13-ISS-007` |
| `EV-W13-107` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | workspace check pass | pass | `CAPTURED_PASS` | `W13-ISS-008` |
| `EV-W13-108` | `bash scripts/health_check.sh` | health check pass | pass | `CAPTURED_PASS` | `W13-ISS-008` |
| `EV-W13-109` | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | compliance pass | pass (`0` findings) | `CAPTURED_PASS` | `W13-ISS-012` |
| `EV-W13-110` | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | pass (`No correlation_id logging gaps`) | `CAPTURED_PASS` | `W13-ISS-012` |

## 4) Governance rehearsal matrix

| Evidence ID | Scenario | Expected | Actual | Status | Blocking issue |
|---|---|---|---|---|---|
| `EV-W13-201` | OOS checklist enforcement audit | mandatory OOS items complete | pass; OOS checklist enforced on audited submissions | `CAPTURED_PASS` | `W13-ISS-004` |
| `EV-W13-202` | Walk-forward checklist enforcement audit | mandatory WF items complete | pass; WF checklist enforced on audited submissions | `CAPTURED_PASS` | `W13-ISS-005` |
| `EV-W13-203` | Strategy evidence gate enforcement audit | missing evidence strategies blocked | pass; missing WF evidence path blocked by default | `CAPTURED_PASS` | `W13-ISS-001` |
| `EV-W13-204` | Strategy decision traceability audit | owner+rationale+evidence+next_action+eta complete | pass; decision log completeness `12/12 = 100%` | `CAPTURED_PASS` | `W13-ISS-002` |
| `EV-W13-205` | Reproducibility drift audit | drift `<=1%` | pass; measured drift `0.0772%` | `CAPTURED_PASS` | `W13-ISS-006` |
| `EV-W13-206` | Exposure/concentration guard audit | new breach `=0` | pass; new exposure/concentration breaches `0` | `CAPTURED_PASS` | `W13-ISS-007` |
| `EV-W13-207` | Correlation coverage audit | `>=99%` | `100%` | `CAPTURED_PASS` | `W13-ISS-012` |
| `EV-W13-208` | Compliance findings audit | findings `=0` | `0` findings | `CAPTURED_PASS` | `W13-ISS-012` |
| `EV-W13-209` | P0 open count audit | `0` | `0` | `CAPTURED_PASS` | `W13-ISS-003` |
| `EV-W13-210` | P1 unowned count audit | `0` | `0` | `CAPTURED_PASS` | `W13-ISS-003` |
| `EV-W13-211` | Governance taxonomy consistency audit | no policy drift | taxonomy consistent across baseline/issue/KPI/gate/final | `CAPTURED_PASS` | `W13-ISS-003` |
| `EV-W13-212` | Evidence linkage completeness audit | checklist->decision->gate links complete | pass; linkage complete (`100%`) | `CAPTURED_PASS` | `W13-ISS-012` |
| `EV-W13-213` | Strategy review throughput watermark | throughput/toil captured | pass; throughput watermark captured from decision inventory | `CAPTURED_PASS` | `W13-ISS-011` |
| `EV-W13-214` | Decision block reason quality audit | standardized block reasons | pass (`MISSING_WF_EVIDENCE` standardized) | `CAPTURED_PASS` | `W13-ISS-001` |
| `EV-W13-215` | Governance rerun audit | rerun after hardening captured | pass; governance rerun completed after hardening | `CAPTURED_PASS` | `W13-ISS-003` |
| `EV-W13-216` | Week 14 handoff readiness audit | handoff fields complete | pass; W14 start-pack aligned with final verdict | `CAPTURED_PASS` | `W13-ISS-009` |

## 5) Regression and hardening matrix

| Evidence ID | Check | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W13-301` | W09 observability guard | no regression | pass (observability integration rerun passed) | `CAPTURED_PASS` |
| `EV-W13-302` | W10 API health/SLO guard | no regression | pass (backtest integration + health/compliance rerun passed) | `CAPTURED_PASS` |
| `EV-W13-303` | W11 incident runbook guard | no regression | pass (signal flow integration rerun passed) | `CAPTURED_PASS` |
| `EV-W13-304` | W12 ops readiness guard | no regression | pass (full command profile `10/10`) | `CAPTURED_PASS` |
| `EV-W13-305` | strategy governance hardening guard | no regression | pass (governance verification rerun success) | `CAPTURED_PASS` |
| `EV-W13-306` | governance artifact guard | no regression | pass (artifacts reconciled to one verdict) | `CAPTURED_PASS` |

## 6) Gate reconciliation

| Evidence ID | Artifact | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W13-401` | Baseline -> Issue Register consistency | all failures/issues mapped and closed/reconciled | consistent mapping completed | `CAPTURED_PASS` |
| `EV-W13-402` | Baseline/Issue/Gate/KPI/Final verdict consistency | one final verdict | `GO` locked | `CAPTURED_PASS` |

## 7) Decision rule

- Nếu còn `CAPTURED_FAIL/BLOCKED_ENV` ở mục bắt buộc: W13 = `NO-GO`.
- Nếu còn P0 open hoặc P1 unowned: W13 = `NO-GO`.
- Nếu strategy evidence gate không enforce đầy đủ: W13 = `NO-GO`.
- Chỉ được set `GO` khi toàn bộ mandatory evidence đạt `CAPTURED_PASS` và artifacts nhất quán.
- Current result: W13 = `GO` (all mandatory evidence `CAPTURED_PASS`).
