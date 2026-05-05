# KPI Charter W24 - Final-Phase Gate 4

## 1) Charter scope

W24 measures final release readiness through full regression, controlled-live-ready, rollback readiness, final approval, and hard-gate governance.

## 2) KPI table

| KPI | Target | Measurement | Actual | Status | Evidence ID | Owner |
|---|---:|---|---|---|---|---|
| Full regression rerun pass | `100%` | passed regression suites / required suites | `100%` command profile pass | `CAPTURED_PASS` | `EV-W24-201` | `tester` |
| Controlled live ready gate | `100%` | passed release checks / required checks | FAIL: W23 precondition + W21 guard block release | `CAPTURED_FAIL` | `EV-W24-202` | `planner` |
| Rollback readiness | `100%` | passed rollback checks / required checks | `100%` W17-W20 rollback/safety/canary guards pass | `CAPTURED_PASS` | `EV-W24-203` | `ops` |
| Release blocker open count | `0` | open blockers at gate lock | `2` (`W23_PRECONDITION`, `REGRESSION_GUARD`) | `CAPTURED_FAIL` | `EV-W24-204` | `planner` |
| Final approval completeness | `100%` | completed approvals / required approvals | `0%`, approval blocked by mandatory fails | `CAPTURED_FAIL` | `EV-W24-205` | `planner` |
| Correlation/compliance | coverage>=99%, findings=0 | audit output | pass, `0 findings` | `CAPTURED_PASS` | `EV-W24-206` | `tester` |
| W09-W23 regression guard | `100%` | required slices pass | FAIL: W21 gate1 guard `NO-GO` | `CAPTURED_FAIL` | `EV-W24-301..306` | `tester` |
| Artifact consistency | `100%` | baseline/issue/KPI/gate/final same verdict | `NO-GO` consistent after reconciliation | `CAPTURED_PASS` | `EV-W24-401`,`EV-W24-402` | `planner` |

## 3) KPI rules

- `GO` is blocked by any mandatory `CAPTURED_FAIL`.
- Current KPI verdict: `NO-GO`.
