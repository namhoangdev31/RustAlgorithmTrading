# KPI Charter W13 - Strategy Governance

## 1) Charter scope

W13 đo mức trưởng thành governance cho strategy lifecycle với trọng tâm OOS/walk-forward enforcement, evidence quality gate và decision traceability.

## 2) KPI table (snapshot 2026-04-27, post-rerun)

| KPI | Target | Measurement | Actual | Status | Evidence ID | Owner |
|---|---:|---|---|---|---|---|
| OOS checklist completeness | `100%` | completed mandatory OOS items / required items | `100%` on audited inventory | `CAPTURED_PASS` | `EV-W13-201` | `tester` |
| Walk-forward checklist completeness | `100%` | completed mandatory WF items / required items | `100%` on audited inventory | `CAPTURED_PASS` | `EV-W13-202` | `tester` |
| Strategy evidence gate enforcement | `100%` | missing-evidence strategies blocked / missing-evidence strategies | `100%` (missing WF evidence blocked by default) | `CAPTURED_PASS` | `EV-W13-203`,`EV-W13-214` | `planner` |
| Strategy decision traceability completeness | `100%` | decisions with owner+rationale+evidence+next_action+eta / total decisions | `100%` (`12/12`) | `CAPTURED_PASS` | `EV-W13-204` | `ops` |
| Reproducibility drift | `<=1%` | drift value across reruns | `0.0772%` | `CAPTURED_PASS` | `EV-W13-205` | `tester` |
| Exposure/concentration breach mới | `0` | new breaches attributable to W13 | `0` | `CAPTURED_PASS` | `EV-W13-206` | `ops` |
| Correlation coverage | `>=99%` | critical event sample coverage | `100%` | `CAPTURED_PASS` | `EV-W13-207` | `tester` |
| Compliance audit findings | `0` | findings count | `0` | `CAPTURED_PASS` | `EV-W13-208` | `tester` |
| W09-W12 regression guard | `100%` | required slices pass | `100%` | `CAPTURED_PASS` | `EV-W13-301..306` | `tester` |
| P0 open count | `0` | count gate cutoff | `0` | `CAPTURED_PASS` | `EV-W13-209` | `ops` |
| P1 unowned count | `0` | count gate cutoff | `0` | `CAPTURED_PASS` | `EV-W13-210` | `ops` |
| Artifact consistency | `100%` | baseline/issue/gate/final same verdict | `GO consistent` | `CAPTURED_PASS` | `EV-W13-401`,`EV-W13-402` | `planner` |

## 3) KPI rules

- `CAPTURED_PASS` chỉ hợp lệ khi `actual` có dữ liệu numeric hoặc output command tương ứng.
- `BLOCKED_ENV` bắt buộc có blocker, owner, ETA và điều kiện rerun.
- KPI evidence gate chỉ pass khi strategy thiếu evidence thực sự bị block, không chỉ flagged.
- KPI artifact consistency không pass nếu có nhiều verdict cuối.

## 4) Evidence source mapping

| Evidence range | Nguồn |
|---|---|
| `EV-W13-101..110` | command profile rerun |
| `EV-W13-201..216` | governance enforcement + traceability/drift/risk rehearsals |
| `EV-W13-301..306` | W09-W12 regression guard rerun |
| `EV-W13-401..402` | artifact consistency + final verdict lock |
