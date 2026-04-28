# KPI Charter W15 - Capital Allocation

## 1) Charter scope

W15 đo mức trưởng thành capital allocation với trọng tâm position sizing theo volatility/regime, drawdown adherence và governance consistency.

## 2) KPI table (snapshot 2026-04-28, post-rerun)

| KPI | Target | Measurement | Actual | Status | Evidence ID | Owner |
|---|---:|---|---|---|---|---|
| Volatility sizing enforcement rate | `100%` | enforced volatility sizing checks / required checks | `100%` | `CAPTURED_PASS` | `EV-W15-201` | `ops` |
| Regime-aware sizing enforcement rate | `100%` | enforced regime sizing checks / required checks | `100%` | `CAPTURED_PASS` | `EV-W15-202` | `ops` |
| Allocation checklist completeness | `100%` | completed mandatory items / required items | `100%` | `CAPTURED_PASS` | `EV-W15-203` | `tester` |
| Allocation decision traceability completeness | `100%` | decisions with owner+reason+evidence / total decisions | `100%` | `CAPTURED_PASS` | `EV-W15-204` | `planner` |
| Drawdown policy adherence | `100%` | adherence checks pass / required checks | `100%` | `CAPTURED_PASS` | `EV-W15-205` | `ops` |
| Cross-strategy allocation interaction coverage | `100%` | rehearsed required scenarios / total required scenarios | `100%` | `CAPTURED_PASS` | `EV-W15-206` | `ops` |
| Exposure/concentration breach mới | `0` | new breaches attributable to W15 | `0` | `CAPTURED_PASS` | `EV-W15-207` | `ops` |
| Reproducibility drift | `<=1%` | drift across reruns | `0.5000%` | `CAPTURED_PASS` | `EV-W15-208` | `tester` |
| Correlation coverage | `>=99%` | critical event sample coverage | `100%` | `CAPTURED_PASS` | `EV-W15-209` | `tester` |
| Compliance findings | `0` | findings count | `0` | `CAPTURED_PASS` | `EV-W15-210` | `tester` |
| W09-W14 regression guard | `100%` | required slices pass | `100%` | `CAPTURED_PASS` | `EV-W15-301..306` | `tester` |
| Artifact consistency | `100%` | baseline/issue/gate/final same verdict | `GO consistent` | `CAPTURED_PASS` | `EV-W15-401`,`EV-W15-402` | `planner` |

## 3) KPI rules

- `CAPTURED_PASS` chỉ hợp lệ khi `actual` có dữ liệu numeric hoặc output command tương ứng.
- `BLOCKED_ENV` bắt buộc có blocker, owner, ETA và điều kiện rerun.
- KPI enforcement chỉ pass khi sizing/drawdown policy thực sự chặn đúng behavior theo policy.
- KPI artifact consistency không pass nếu có nhiều verdict cuối.

## 4) Evidence source mapping

| Evidence range | Nguồn |
|---|---|
| `EV-W15-101..110` | command profile + clean-slate + baseline audit |
| `EV-W15-201..216` | allocation enforcement + governance rehearsals |
| `EV-W15-301..306` | W09-W14 regression guard + governance hardening |
| `EV-W15-401..402` | artifact consistency + final verdict lock |
