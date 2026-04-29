# KPI Charter W16 - Research Reproducibility

## 1) Charter scope

W16 đo mức trưởng thành reproducibility của workflow nghiên cứu với trọng tâm seed control, deterministic rerun và governance consistency.

## 2) KPI table

| KPI | Target | Measurement | Actual | Status | Evidence ID | Owner |
|---|---:|---|---|---|---|---|
| Seed-control compliance rate | `100%` | seeded required runs / required runs | `100.0%` | `CAPTURED_PASS` | `EV-W16-201` | `tester` |
| Deterministic rerun profile coverage | `100%` | deterministic rerun scenarios passed / required scenarios | `100.0%` | `CAPTURED_PASS` | `EV-W16-202` | `tester` |
| Reproducibility checklist completeness | `100%` | completed mandatory items / required items | `100.0%` | `CAPTURED_PASS` | `EV-W16-203` | `planner` |
| Reproducibility decision traceability completeness | `100%` | decisions with owner+reason+evidence / total decisions | `100.0%` | `CAPTURED_PASS` | `EV-W16-204`,`EV-W16-214` | `planner` |
| Multi-rerun consistency pass rate | `100%` required scenarios | pass scenarios / required scenarios | `100.0%` | `CAPTURED_PASS` | `EV-W16-205` | `tester` |
| Reproducibility drift | `<=1%` | drift across reruns | `0.000000%` | `CAPTURED_PASS` | `EV-W16-206` | `tester` |
| Exception-handling consistency | `100%` | consistent handling cases / required cases | `100.0%` | `CAPTURED_PASS` | `EV-W16-207` | `ops` |
| Exposure/concentration breach mới | `0` | new breaches attributable to W16 | `0` | `CAPTURED_PASS` | `EV-W16-208` | `ops` |
| Correlation coverage | `>=99%` | critical event sample coverage | `100.0%` | `CAPTURED_PASS` | `EV-W16-209` | `tester` |
| Compliance findings | `0` | findings count | `0` | `CAPTURED_PASS` | `EV-W16-210` | `tester` |
| W09-W15 regression guard | `100%` | required slices pass | `100.0%` | `CAPTURED_PASS` | `EV-W16-301..306` | `tester` |
| Artifact consistency | `100%` | baseline/issue/gate/final same verdict | `100.0%` | `CAPTURED_PASS` | `EV-W16-401`,`EV-W16-402` | `planner` |

## 3) KPI rules

- `CAPTURED_PASS` chỉ hợp lệ khi `actual` có dữ liệu numeric hoặc output command tương ứng.
- `BLOCKED_ENV` bắt buộc có blocker, owner, ETA và điều kiện rerun.
- KPI seed/deterministic controls chỉ pass khi enforcement thực sự diễn ra trên required scenarios.
- KPI artifact consistency không pass nếu có nhiều verdict cuối.

## 4) Evidence source mapping

| Evidence range | Nguồn |
|---|---|
| `EV-W16-101..110` | command profile + clean-slate + baseline audit |
| `EV-W16-201..216` | seed control + deterministic rerun + governance rehearsals |
| `EV-W16-301..306` | W09-W15 regression guard + governance hardening |
| `EV-W16-401..402` | artifact consistency + final verdict lock |
