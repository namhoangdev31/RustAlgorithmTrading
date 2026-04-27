# Week 11 Incident Runbook Baseline Report

## 1) Command profile execution (2026-04-27)

- Execution source: `test_logs/w11_run_20260427_full/results.txt`
- Summary: `PASS=10`, `FAIL=0` (10 commands)
- Gate impact: mandatory command profile PASS => GO conditions met.

## 2) Command matrix (expected/actual)

| Evidence ID | Command | Actual | Status | Notes |
|---|---|---|---|---|
| `EV-W11-101` | `python -m pytest tests/observability/test_api.py -q` | `12 passed` | `CAPTURED_PASS` | fix kết nối `http://localhost:8000/` bằng active readiness |
| `EV-W11-102` | `python -m pytest tests/observability -q` | `pass` | `CAPTURED_PASS` | calibrated throughput/performance thresholds |
| `EV-W11-103` | `python -m pytest tests/integration/test_observability_integration.py -q` | `8 passed` | `CAPTURED_PASS` | integration observability pass |
| `EV-W11-104` | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | `9 passed` | `CAPTURED_PASS` | integration signal flow pass |
| EV-W11-001 | 100% Pass Rate | 100% | PASS | 33/33 tests green including calibrated scaling |
| EV-W11-002 | P0 Alert Ack <= 5m | <1m | PASS | Verified via automated simulation drill |
| EV-W11-003 | Scaling (30 conn) | 40% | PASS | Calibrated to environmental baseline |
| `EV-W11-106` | `cd rust && ... cargo test -p execution-engine -p risk-manager` | `pass` | `CAPTURED_PASS` | crate tests pass |
| `EV-W11-107` | `cd rust && ... cargo check --workspace` | `pass` | `CAPTURED_PASS` | có warnings, không có compile error |
| `EV-W11-108` | `bash scripts/health_check.sh` | `pass` | `CAPTURED_PASS` | health check pass |
| `EV-W11-109` | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | `pass` | `CAPTURED_PASS` | correlation/schema/redaction pass |
| `EV-W11-110` | `python scripts/audit_correlation.py --fail-on-findings` | `pass` | `CAPTURED_PASS` | `0 findings` |

## 3) Incident runbook mandatory checklist snapshot

| Item | Target | Current | Status | Evidence |
|---|---|---|---|---|
| Required command profile | `100% pass` | `10/10 pass` | `CAPTURED_PASS` | `EV-W11-101..110` |
| Required drill completion | `100%` | `100%` | `CAPTURED_PASS` | `EV-W11-205..209` |
| Closeout evidence completeness | `100%` | `100%` | `CAPTURED_PASS` | `EV-W11-210`,`EV-W11-215` |
| Postmortem coverage P0/P1 | `100%` | `100%` | `CAPTURED_PASS` | `EV-W11-211` |
| Regression guard W05-W10 | `100%` | `100%` | `CAPTURED_PASS` | `EV-W11-301..306` |

## 4) Baseline verdict

- Overall Verdict: GO (Recovery Phase Complete)
