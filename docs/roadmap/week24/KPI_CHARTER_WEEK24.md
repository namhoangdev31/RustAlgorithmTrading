# KPI Charter W24 - Final-Phase Gate 4

## 1) Charter scope

W24 do muc san sang release cuoi voi trong tam full regression rerun, controlled live ready gate, rollback readiness va final approval.

## 2) KPI table

| KPI | Target | Measurement | Actual | Status | Evidence ID | Owner |
|---|---:|---|---|---|---|---|
| Full regression rerun pass | `100%` | passed regression suites / required suites | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W24-201` | `tester` |
| Controlled live ready gate | `100%` | passed release checks / required checks | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W24-202` | `planner` |
| Rollback readiness | `100%` | passed rollback checks / required checks | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W24-203` | `ops` |
| Release blocker open count | `0` | open blockers at gate lock | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W24-204` | `planner` |
| Final approval completeness | `100%` | completed approvals / required approvals | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W24-205` | `planner` |
| Correlation/compliance | coverage>=99%, findings=0 | audit output | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W24-206` | `tester` |
| W09-W23 regression guard | `100%` | required slices pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W24-301..306` | `tester` |
| Artifact consistency | `100%` | baseline/issue/KPI/gate/final same verdict | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W24-401`,`EV-W24-402` | `planner` |

## 3) KPI rules

- `CAPTURED_PASS` chi hop le khi `actual` co du lieu numeric hoac output command tuong ung.
- `BLOCKED_ENV` bat buoc co blocker, owner, ETA va dieu kien rerun.
- KPI mandatory fail/block thi verdict mac dinh `NO-GO`.
