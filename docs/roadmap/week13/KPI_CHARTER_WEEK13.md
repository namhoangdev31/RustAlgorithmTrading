# KPI Charter W13 - Strategy Governance

## 1) Charter scope

W13 đo mức trưởng thành governance cho strategy lifecycle với trọng tâm OOS/walk-forward enforcement, evidence quality gate và decision traceability.

## 2) KPI table

| KPI | Target | Measurement | Actual | Status | Evidence ID | Owner |
|---|---:|---|---|---|---|---|
| OOS checklist completeness | `100%` | completed mandatory OOS items / required items | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W13-201` | `tester` |
| Walk-forward checklist completeness | `100%` | completed mandatory WF items / required items | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W13-202` | `tester` |
| Strategy evidence gate enforcement | `100%` | missing-evidence strategies blocked / missing-evidence strategies | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W13-203` | `planner` |
| Strategy decision traceability completeness | `100%` | decisions with owner+rationale+evidence / total decisions | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W13-204` | `ops` |
| Reproducibility drift | `<=1%` | drift value across reruns | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W13-205` | `tester` |
| Exposure/concentration breach mới | `0` | new breaches attributable to W13 | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W13-206` | `ops` |
| Correlation coverage | `>=99%` | critical event sample coverage | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W13-207` | `tester` |
| Compliance audit findings | `0` | findings count | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W13-208` | `tester` |
| W09-W12 regression guard | `100%` | required slices pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W13-301..306` | `tester` |
| P0 open count | `0` | count gate cutoff | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W13-209` | `ops` |
| P1 unowned count | `0` | count gate cutoff | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W13-210` | `ops` |
| Artifact consistency | `100%` | baseline/issue/gate/final same verdict | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W13-401`,`EV-W13-402` | `planner` |

## 3) KPI rules

- `CAPTURED_PASS` chỉ hợp lệ khi `actual` có dữ liệu numeric hoặc output command tương ứng.
- `BLOCKED_ENV` bắt buộc có blocker, owner, ETA và điều kiện rerun.
- KPI evidence gate chỉ pass khi strategy thiếu evidence thực sự bị block, không chỉ flagged.
- KPI artifact consistency không pass nếu có nhiều verdict cuối.

## 4) Evidence source mapping

| Evidence range | Nguồn |
|---|---|
| `EV-W13-101..110` | command profile + clean-slate + baseline audit |
| `EV-W13-201..216` | OOS/walk-forward enforcement + governance rehearsals |
| `EV-W13-301..306` | W09-W12 regression guard + governance hardening |
| `EV-W13-401..402` | artifact consistency + final verdict lock |
