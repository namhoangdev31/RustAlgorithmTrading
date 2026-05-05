# KPI Charter W23 - Final-Phase Gate 3

## 1) Charter scope

W23 do muc san sang hard-gate 3 voi trong tam cross-runtime/e2e, soak, fault-injection va debt closure.

## 2) KPI table

| KPI | Target | Measurement | Actual | Status | Evidence ID | Owner |
|---|---:|---|---|---|---|---|
| Full cross-runtime/e2e pass | `100%` | passed e2e suites / required suites | `100%` | `CAPTURED_PASS` | `EV-W23-201` | `tester` |
| Soak scenario pass | `100%` | passed soak scenarios / required scenarios | `100%` | `CAPTURED_PASS` | `EV-W23-202` | `ops` |
| Fault-injection pass | `100%` | passed fault scenarios / required scenarios | `100%` | `CAPTURED_PASS` | `EV-W23-203` | `coder` |
| E2E/fault debt closure | debt open `=0` | open debt items at gate lock | `0` | `CAPTURED_PASS` | `EV-W23-204` | `tester` |
| Correlation coverage | `>=99%` | critical event sample coverage | `100%` | `CAPTURED_PASS` | `EV-W23-205` | `tester` |
| Compliance findings | `0` | findings count | `0` | `CAPTURED_PASS` | `EV-W23-206` | `tester` |
| W09-W22 regression guard | `100%` | required slices pass | `100%` | `CAPTURED_PASS` | `EV-W23-301..306` | `tester` |
| Artifact consistency | `100%` | baseline/issue/KPI/gate/final same verdict | `100%` | `CAPTURED_PASS` | `EV-W23-401`,`EV-W23-402` | `planner` |

## 3) KPI rules

- `CAPTURED_PASS` chi hop le khi `actual` co du lieu numeric hoac output command tuong ung.
- `BLOCKED_ENV` bat buoc co blocker, owner, ETA va dieu kien rerun.
- KPI mandatory fail/block thi verdict mac dinh `NO-GO`.
