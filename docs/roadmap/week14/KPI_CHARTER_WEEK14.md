# KPI Charter W14 - Portfolio Controls

## 1) Charter scope

W14 đo mức trưởng thành của portfolio controls với trọng tâm exposure/concentration enforcement, cross-strategy risk interaction và governance consistency.

## 2) KPI table

| KPI | Target | Measurement | Actual | Status | Evidence ID | Owner |
|---|---:|---|---|---|---|---|
| Exposure control enforcement rate | `100%` | enforced exposure checks / required checks | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-201` | `ops` |
| Concentration control enforcement rate | `100%` | enforced concentration checks / required checks | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-202` | `ops` |
| Portfolio controls checklist completeness | `100%` | completed mandatory items / required items | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-203` | `tester` |
| Portfolio decision traceability completeness | `100%` | decisions with owner+reason+evidence / total decisions | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-204` | `planner` |
| Cross-strategy interaction coverage | `100%` | rehearsed required scenarios / total required scenarios | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-205` | `ops` |
| Exposure breach mới | `0` | new exposure breaches attributable to W14 | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-206` | `ops` |
| Concentration breach mới | `0` | new concentration breaches attributable to W14 | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-207` | `ops` |
| Reproducibility drift | `<=1%` | drift across reruns | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-208` | `tester` |
| Correlation coverage | `>=99%` | critical event sample coverage | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-209` | `tester` |
| Compliance findings | `0` | findings count | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-210` | `tester` |
| W09-W13 regression guard | `100%` | required slices pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-301..306` | `tester` |
| Artifact consistency | `100%` | baseline/issue/gate/final same verdict | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-401`,`EV-W14-402` | `planner` |

## 3) KPI rules

- `CAPTURED_PASS` chỉ hợp lệ khi `actual` có dữ liệu numeric hoặc output command tương ứng.
- `BLOCKED_ENV` bắt buộc có blocker, owner, ETA và điều kiện rerun.
- KPI enforcement chỉ pass khi controls thực sự chặn đúng policy, không chỉ ghi log.
- KPI artifact consistency không pass nếu có nhiều verdict cuối.

## 4) Evidence source mapping

| Evidence range | Nguồn |
|---|---|
| `EV-W14-101..110` | command profile + clean-slate + baseline audit |
| `EV-W14-201..216` | portfolio-controls enforcement + governance rehearsals |
| `EV-W14-301..306` | W09-W13 regression guard + governance hardening |
| `EV-W14-401..402` | artifact consistency + final verdict lock |
