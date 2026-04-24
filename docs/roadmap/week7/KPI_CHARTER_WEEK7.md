# KPI Charter Week 7 (Circuit Breaker Hardening)

## Purpose

Khóa KPI vận hành cho W07 để đo độ ổn định circuit breaker, tính an toàn risk-off, chất lượng recovery/cooldown và evidence trước khi mở W08 Execution Retry/Slippage.

## KPI matrix

| KPI | Target | Actual | Status | Evidence ID | Owner |
|---|---|---|---|---|---|
| Compile/static/lint/type profile | `100% pass` | command profile pass; warnings pre-existing/non-blocking | `GREEN` | `EV-W7-103`,`EV-W7-104` | `tester` |
| Critical path smoke pass rate | `>=95%` | Python integration critical slices pass | `GREEN` | `EV-W7-101`,`EV-W7-102` | `tester` |
| Circuit breaker transition coverage | `100%` mandatory transitions | 12/12 circuit breaker tests pass | `GREEN` | `EV-W7-201..209`,`EV-W7-301` | `coder` |
| Trip trigger correctness | `100%` mandatory triggers | manual/system-health/repeated trip behavior covered | `GREEN` | `EV-W7-202`,`EV-W7-204` | `tester` |
| Cooldown enforcement | false reset `=0` | early reset denied, cooldown transition pass | `GREEN` | `EV-W7-205`,`EV-W7-206` | `tester` |
| Recovery correctness | `HALF_OPEN/CLOSED` policy pass | approved reset + probe pass/fail pass | `GREEN` | `EV-W7-207..209` | `coder` |
| Loop-trip count | `0` in stress scenario | stress repeated trip/recover pass | `GREEN` | `EV-W7-212`,`EV-W7-302` | `tester` |
| Risk-off bypass count | `0` | open breaker rejects before downstream execution | `GREEN` | `EV-W7-203`,`EV-W7-303` | `tester` |
| Duplicate order/risk side-effect rate | `<=0.1%` | execution/risk regression suite pass | `GREEN` | `EV-W7-103`,`EV-W7-303` | `tester` |
| W05/W06 regression guard | `100% pass` required slices | backtest, risk/reload/limits/stop and execution slices pass | `GREEN` | `EV-W7-101`,`EV-W7-103`,`EV-W7-211` | `tester` |
| Circuit breaker correlation continuity | `100%` | correlation audit `0 findings`; reject path preserves ID | `GREEN` | `EV-W7-106`,`EV-W7-107`,`EV-W7-213` | `ops` |
| Metrics scrape completeness | trips/status metrics present | Prometheus text metric assertion pass | `GREEN` | `EV-W7-108`,`EV-W7-214` | `ops` |
| Runbook reset drill | reset approval/evidence complete | cooldown -> approval -> half-open -> probe covered | `GREEN` | `EV-W7-206..208`,`EV-W7-215`,`EV-W7-304` | `ops` |
| Circuit breaker overhead | no W07 blocker | targeted suites show no overhead blocker | `GREEN` | `EV-W7-306` | `ops` |
| Change budget compliance | `<=15 files`, `<=800 LOC net` or justified | scoped to circuit breaker/risk/metrics/tests/docs | `GREEN` | `EV-W7-402` | `planner` |
| Artifact consistency | one final decision | baseline/issue/gate/KPI/final aligned to `GO` | `GREEN` | `EV-W7-305` | `planner` |

## KPI interpretation

- `GREEN`: target met with valid evidence ID.
- `YELLOW`: target partially met or pending rerun, no open P0.
- `RED`: target failed, P0 open, P1 unowned, or evidence missing for mandatory gate item.

## Gate KPI minimum

W07 đạt `GO` vì:

1. Tất cả KPI mandatory ở trạng thái `GREEN`.
2. Không còn P0 open.
3. Không có P1 unowned.
4. Không còn `CAPTURED_FAIL/BLOCKED_ENV` ở matrix bắt buộc.
5. Baseline, issue register, gate notes và final report cùng quyết định cuối: `GO`.
