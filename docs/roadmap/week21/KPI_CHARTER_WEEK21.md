# KPI Charter W21 - Final-Phase Gate 1

## 1) Charter scope

W21 đo mức sẵn sàng hard-gate 1 với trọng tâm full lint/type/static, full unit baseline và debt closure.

## 2) KPI table

| KPI | Target | Measurement | Actual | Status | Evidence ID | Owner |
|---|---:|---|---|---|---|---|
| Full lint pass | `100%` | passed lint checks / required lint checks | `0%` (profile fail: missing Python lint tools + rust fmt/clippy fail) | `CAPTURED_FAIL` | `EV-W21-201` | `coder` |
| Full type/static pass | `100%` | passed type/static checks / required checks | `0%` (mypy fail + pyright missing) | `CAPTURED_FAIL` | `EV-W21-202` | `coder` |
| Full unit baseline pass | `100%` | passed unit suites / required suites | `0%` (`pytest tests/unit` fail at collection) | `CAPTURED_FAIL` | `EV-W21-203` | `tester` |
| Test debt closure | debt open `=0` | open debt items at gate lock | `>0` (blocked by `EV-W21-101`) | `CAPTURED_FAIL` | `EV-W21-204` | `tester` |
| Correlation coverage | `>=99%` | critical event sample coverage | `99.9%` | `CAPTURED_PASS` | `EV-W21-205` | `tester` |
| Compliance findings | `0` | findings count | `0` | `CAPTURED_PASS` | `EV-W21-206` | `tester` |
| W09-W20 regression guard | `100%` | required slices pass | `100%` | `CAPTURED_PASS` | `EV-W21-301..306` | `tester` |
| Artifact consistency | `100%` | baseline/issue/KPI/gate/final same verdict | `100%` (`NO-GO` thống nhất) | `CAPTURED_PASS` | `EV-W21-401..402` | `planner` |

## 3) KPI rules

- `CAPTURED_PASS` chỉ hợp lệ khi `actual` có dữ liệu numeric hoặc output command tương ứng.
- `BLOCKED_ENV` bắt buộc có blocker, owner, ETA và điều kiện rerun.
- KPI mandatory fail/block thì verdict mặc định `NO-GO`.
