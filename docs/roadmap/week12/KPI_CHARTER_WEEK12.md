# KPI Charter W12 - Ops Readiness Gate

## 1) Charter scope

W12 đo mức sẵn sàng vận hành tổng hợp từ W09-W11. KPI W12 chỉ cập nhật khi có evidence ID hợp lệ và output kiểm chứng được.

## 2) KPI table

| KPI | Target | Measurement | Actual | Status | Evidence ID | Owner |
|---|---:|---|---|---|---|---|
| Mandatory readiness checklist completeness | `100%` | completed mandatory items / required items | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W12-201` | `planner` |
| P0 open count | `0` | count gate cutoff | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W12-202` | `ops` |
| P1 unowned count | `0` | count gate cutoff | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W12-203` | `ops` |
| Ownership/escalation matrix completeness | `100%` | owner+backup+SLA+ETA coverage | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W12-204` | `ops` |
| API health/SLO readiness rehearsal | `PASS` | rehearsal scenarios pass/fail | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W12-205` | `tester` |
| Incident runbook readiness rehearsal | `PASS` | rehearsal scenarios pass/fail | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W12-206` | `ops` |
| Recovery/rollback readiness rehearsal | `PASS` | rehearsal scenarios pass/fail | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W12-207` | `ops` |
| Correlation coverage | `>=99%` | critical event sample coverage | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W12-208` | `tester` |
| Alert false-positive sample | `<=15%` | sample false positives/total | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W12-209` | `ops` |
| Alert false-negative critical | `0` | missed critical alert count | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W12-210` | `ops` |
| W09-W11 regression guard | `100%` | required slices pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W12-301..306` | `tester` |
| Artifact consistency | `100%` | baseline/issue/gate/final same verdict | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W12-401`,`EV-W12-402` | `planner` |

## 3) KPI rules

- `CAPTURED_PASS` chỉ hợp lệ khi `actual` có dữ liệu đo/command output tương ứng.
- `BLOCKED_ENV` bắt buộc có blocker, owner, ETA và điều kiện rerun.
- KPI P0/P1 ownership không được đánh dấu pass nếu còn issue thiếu owner/ETA.
- KPI artifact consistency không pass nếu xuất hiện nhiều verdict trong gate artifacts.

## 4) Evidence source mapping

| Evidence range | Nguồn |
|---|---|
| `EV-W12-101..110` | command profile + clean-slate + baseline audit |
| `EV-W12-201..216` | readiness rehearsals + ownership/escalation + checklist validation |
| `EV-W12-301..306` | W09-W11 regression guard + governance hardening |
| `EV-W12-401..402` | artifact consistency + final verdict lock |
