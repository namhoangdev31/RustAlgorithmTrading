# KPI Charter W18 - Canary Design

## 1) Charter scope

W18 đo mức trưởng thành canary design với trọng tâm scenario coverage, rollback recoverability, breach handling determinism và governance consistency.

## 2) KPI table

| KPI | Target | Measurement | Actual | Status | Evidence ID | Owner |
|---|---:|---|---|---|---|---|
| Canary scenario coverage | `100%` mandatory scenarios | covered mandatory scenarios / required scenarios | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W18-201` | `tester` |
| Rollback rehearsal success | `100%` | successful rollback drills / required drills | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W18-202` | `coder` |
| Breach handling determinism | `100%` required drills | deterministic outcomes / required drills | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W18-203` | `ops` |
| Kill-switch response | `<=60s` | max response latency | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W18-204` | `ops` |
| Risk boundary integrity | unmitigated breach `=0` | unmitigated breaches count | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W18-205` | `planner` |
| Fault-injection coverage | `100%` required scenarios | covered scenarios / required scenarios | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W18-206` | `tester` |
| Correlation coverage | `>=99%` | critical event sample coverage | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W18-207` | `tester` |
| Compliance findings | `0` | findings count | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W18-208` | `tester` |
| W09-W17 regression guard | `100%` | required slices pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W18-301..306` | `tester` |
| Artifact consistency | `100%` | baseline/issue/KPI/gate/final same verdict | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W18-401`,`EV-W18-402` | `planner` |

## 3) KPI rules

- `CAPTURED_PASS` chỉ hợp lệ khi `actual` có dữ liệu numeric hoặc output command tương ứng.
- `BLOCKED_ENV` bắt buộc có blocker, owner, ETA và điều kiện rerun.
- KPI mandatory fail/block thì verdict mặc định `NO-GO`.
