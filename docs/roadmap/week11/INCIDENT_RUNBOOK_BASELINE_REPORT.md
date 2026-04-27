# Incident Runbook Baseline Report W11

## 1) Current status

- Current gate status: `OPEN`.
- Baseline mode: `CAPTURED_PASS`.
- Scope: Incident Runbook P0/P1, escalation matrix, drills, closeout evidence và postmortem readiness.

## 2) Clean-slate preflight

| Evidence ID | Check | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|
| `EV-W11-001` | Python/Rust cache cleanup | clean-slate completed | `pass` | `CAPTURED_PASS` | Run before evidence capture |
| `EV-W11-002` | Workspace status captured | relevant changes understood | `pass` | `CAPTURED_PASS` | Do not revert unrelated changes |

## 3) Command profile matrix

| Evidence ID | Command | Expected | Actual | Status | Issue mapping |
|---|---|---|---|---|---|
| `EV-W11-101` | `python -m pytest tests/observability/test_api.py -q` | API/alert route tests pass | `pass` | `CAPTURED_PASS` | `W11-ISS-005` |
| `EV-W11-102` | `python -m pytest tests/observability -q` | observability slice pass | `pass` | `CAPTURED_PASS` | `W11-ISS-005`,`W11-ISS-008` |
| `EV-W11-103` | `python -m pytest tests/integration/test_observability_integration.py -q` | obs integration pass | `pass` | `CAPTURED_PASS` | `W11-ISS-003` |
| `EV-W11-104` | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | critical smoke pass | `pass` | `CAPTURED_PASS` | `W11-ISS-009` |
| `EV-W11-105` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common` | common tests pass | `pass` | `CAPTURED_PASS` | `W11-ISS-009` |
| `EV-W11-106` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p execution-engine -p risk-manager` | risk/execution tests pass | `pass` | `CAPTURED_PASS` | `W11-ISS-006`,`W11-ISS-007` |
| `EV-W11-107` | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | workspace check pass | `pass` | `CAPTURED_PASS` | `W11-ISS-009` |
| `EV-W11-108` | `bash scripts/health_check.sh` | health check pass | `pass` | `CAPTURED_PASS` | `W11-ISS-005` |
| `EV-W11-109` | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | compliance pass | `pass` | `CAPTURED_PASS` | `W11-ISS-004` |
| `EV-W11-110` | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | `pass` | `CAPTURED_PASS` | `W11-ISS-004` |

## 4) Incident drill matrix

| Evidence ID | Scenario | Expected | Actual | Status | Blocking issue |
|---|---|---|---|---|---|
| `EV-W11-201` | P0 acknowledgement drill | ack `<=5m` | `pass` | `CAPTURED_PASS` | `W11-ISS-003` |
| `EV-W11-202` | P1 acknowledgement drill | ack `<=15m` | `pass` | `CAPTURED_PASS` | `W11-ISS-004` |
| `EV-W11-203` | P0 owner assignment drill | owner assigned `<=10m` | `pass` | `CAPTURED_PASS` | `W11-ISS-002` |
| `EV-W11-204` | P1 owner assignment drill | owner assigned `<=30m` | `pass` | `CAPTURED_PASS` | `W11-ISS-002` |
| `EV-W11-205` | API degraded drill | alert -> mitigation -> verify pass | `pass` | `CAPTURED_PASS` | `W11-ISS-005` |
| `EV-W11-206` | Execution alert drill | triage + side-effect check pass | `pass` | `CAPTURED_PASS` | `W11-ISS-006` |
| `EV-W11-207` | Circuit breaker drill | trip/reset/approval evidence captured | `pass` | `CAPTURED_PASS` | `W11-ISS-007` |
| `EV-W11-208` | Stale WebSocket stream drill | stale detect + reconnect verify pass | `pass` | `CAPTURED_PASS` | `W11-ISS-008` |
| `EV-W11-209` | Position/risk breach drill | risk mitigation + verify pass | `pass` | `CAPTURED_PASS` | `W11-ISS-003` |
| `EV-W11-210` | Closeout evidence audit | `100%` resolved have verify evidence | `pass` | `CAPTURED_PASS` | `W11-ISS-001` |
| `EV-W11-211` | Postmortem template audit | `100%` P0/P1 complete required fields | `pass` | `CAPTURED_PASS` | `W11-ISS-001` |
| `EV-W11-212` | Escalation matrix audit | owner/backup/SLA/ETA complete | `pass` | `CAPTURED_PASS` | `W11-ISS-002` |
| `EV-W11-213` | Critical false-negative audit | count `=0` | `pass` | `CAPTURED_PASS` | `W11-ISS-003` |
| `EV-W11-214` | Alert false-positive sample | rate `<=15%` | `pass` | `CAPTURED_PASS` | `W11-ISS-003` |
| `EV-W11-215` | Incident timeline completeness | required steps `100%` | `pass` | `CAPTURED_PASS` | `W11-ISS-001` |
| `EV-W11-216` | Manual toil watermark | steps/time captured | `pass` | `CAPTURED_PASS` | `W11-ISS-012` |

## 5) Regression and hardening matrix

| Evidence ID | Check | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W11-301` | W05 risk limits guard | no regression | `pass` | `CAPTURED_PASS` |
| `EV-W11-302` | W06 stop-loss guard | no regression | `pass` | `CAPTURED_PASS` |
| `EV-W11-303` | W07 circuit breaker guard | no regression | `pass` | `CAPTURED_PASS` |
| `EV-W11-304` | W08 retry/slippage guard | no regression | `pass` | `CAPTURED_PASS` |
| `EV-W11-305` | W09 observability guard | no regression | `pass` | `CAPTURED_PASS` |
| `EV-W11-306` | W10 API health/SLO guard | no regression | `pass` | `CAPTURED_PASS` |

## 6) Gate reconciliation

| Evidence ID | Artifact | Expected | Actual | Status |
|---|---|---|---|---|
| `EV-W11-401` | Baseline -> Issue Register consistency | all failures mapped | `pass` | `CAPTURED_PASS` |
| `EV-W11-402` | Baseline/Issue/Gate/KPI/Final verdict consistency | one final verdict | `pass` | `CAPTURED_PASS` |

## 7) Decision rule

- Nếu còn `CAPTURED_FAIL/BLOCKED_ENV` ở mục bắt buộc: W11 = `NO-GO`.
- Nếu còn P0 open hoặc P1 unowned: W11 = `NO-GO`.
- Nếu drill P0/P1 thiếu evidence: W11 = `NO-GO`.
- Chỉ được set `GO` khi toàn bộ mandatory evidence đạt `CAPTURED_PASS` và artifact nhất quán.
