# KPI Charter W17 - Staging Hardening

## 1) Charter scope

W17 đo mức trưởng thành staging hardening với trọng tâm soak stability, kill-switch latency, rollback recoverability và governance consistency.

## 2) KPI table

| KPI | Target | Measurement | Actual | Status | Evidence ID | Owner |
|---|---:|---|---|---|---|---|
| Soak stability pass rate | no new gate-blocking P0/P1 | pass scenarios / required scenarios | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W17-201` | `tester` |
| Kill-switch response | `<=60s` | max response latency | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W17-202` | `ops` |
| Rollback rehearsal success | `100%` | successful rollback drills / required drills | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W17-203` | `coder` |
| Incident triage completeness | `100%` | triaged incidents with owner+ETA+mitigation / total incidents | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W17-204` | `planner` |
| Recovery sequence consistency | `100%` required scenarios | pass consistency checks / required checks | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W17-205` | `tester` |
| Alert quality under soak | FP<=15%, FN critical=0 | sampled FP/FN metrics | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W17-206` | `ops` |
| Fault-injection coverage | `100%` required scenarios | covered scenarios / required scenarios | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W17-207` | `tester` |
| Correlation coverage | `>=99%` | critical event sample coverage | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W17-208` | `tester` |
| Compliance findings | `0` | findings count | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W17-209` | `tester` |
| W09-W16 regression guard | `100%` | required slices pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W17-301..306` | `tester` |
| Artifact consistency | `100%` | baseline/issue/KPI/gate/final same verdict | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W17-401`,`EV-W17-402` | `planner` |

## 3) KPI rules

- `CAPTURED_PASS` chỉ hợp lệ khi `actual` có dữ liệu numeric hoặc output command tương ứng.
- `BLOCKED_ENV` bắt buộc có blocker, owner, ETA và điều kiện rerun.
- KPI mandatory fail/block thì verdict mặc định `NO-GO`.
