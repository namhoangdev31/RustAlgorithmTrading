# KPI Charter W22 - Final-Phase Gate 2

## 1) Charter scope

W22 đo mức sẵn sàng hard-gate 2 với trọng tâm full Python/Rust unit+integration và debt closure.

## 2) KPI table

| KPI | Target | Measurement | Actual | Status | Evidence ID | Owner |
|---|---:|---|---|---|---|---|
| Full Python unit+integration pass | `100%` | passed python suites / required suites | `0%` (unit+integration profile fail) | `CAPTURED_FAIL` | `EV-W22-201` | `tester` |
| Full Rust unit+integration pass | `100%` | passed rust suites / required suites | `100%` | `CAPTURED_PASS` | `EV-W22-202` | `tester` |
| Cross-runtime integration pass | `100%` required slices | passed slices / required slices | `partial` (slice pass nhưng full integration fail) | `CAPTURED_FAIL` | `EV-W22-203` | `coder` |
| Integration debt closure | debt open `=0` | open debt items at gate lock | `>0` (blocked bởi `EV-W22-101/102`) | `CAPTURED_FAIL` | `EV-W22-204` | `tester` |
| Correlation coverage | `>=99%` | critical event sample coverage | `99.9%` | `CAPTURED_PASS` | `EV-W22-205` | `tester` |
| Compliance findings | `0` | findings count | `0` | `CAPTURED_PASS` | `EV-W22-206` | `tester` |
| W09-W21 regression guard | `100%` | required slices pass | `partial` (`EV-W22-305` fail) | `CAPTURED_FAIL` | `EV-W22-301..306` | `tester` |
| Artifact consistency | `100%` | baseline/issue/KPI/gate/final same verdict | `100%` (`NO-GO` thống nhất) | `CAPTURED_PASS` | `EV-W22-401`,`EV-W22-402` | `planner` |

## 3) KPI rules

- `CAPTURED_PASS` chỉ hợp lệ khi `actual` có dữ liệu numeric hoặc output command tương ứng.
- `BLOCKED_ENV` bắt buộc có blocker, owner, ETA và điều kiện rerun.
- KPI mandatory fail/block thì verdict mặc định `NO-GO`.
