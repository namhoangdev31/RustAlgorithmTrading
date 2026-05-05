# KPI Charter W20 - Canary Launch (Hẹp)

## 1) Charter scope

W20 đo mức trưởng thành controlled canary launch với trọng tâm boundary integrity, escalation correctness, rollback recoverability và governance consistency.

## 2) KPI table

| KPI | Target | Measurement | Actual | Status | Evidence ID | Owner |
|---|---:|---|---|---|---|---|
| Controlled canary coverage | `100%` mandatory scenarios | covered mandatory scenarios / required scenarios | `100%` | `CAPTURED_PASS` | `EV-W20-201` | `tester` |
| Risk boundary integrity | unmitigated breach `=0` | unmitigated breaches count | `0` | `CAPTURED_PASS` | `EV-W20-202` | `ops` |
| Kill-switch response | `<=60s` | max response latency | `38.00s` | `CAPTURED_PASS` | `EV-W20-203` | `ops` |
| Rollback rehearsal success | `100%` | successful rollback drills / required drills | `100%` | `CAPTURED_PASS` | `EV-W20-204` | `coder` |
| Incident escalation correctness | `100%` mandatory scenarios | pass scenarios / required scenarios | `100%` | `CAPTURED_PASS` | `EV-W20-205` | `tester` |
| Fault-injection coverage | `100%` required scenarios | covered scenarios / required scenarios | `100%` | `CAPTURED_PASS` | `EV-W20-206` | `tester` |
| Correlation coverage | `>=99%` | critical event sample coverage | `99.8%` | `CAPTURED_PASS` | `EV-W20-207` | `tester` |
| Compliance findings | `0` | findings count | `0` | `CAPTURED_PASS` | `EV-W20-208` | `tester` |
| W09-W19 regression guard | `100%` | required slices pass | `100%` | `CAPTURED_PASS` | `EV-W20-301..306` | `tester` |
| Artifact consistency | `100%` | baseline/issue/KPI/gate/final same verdict | `100%` | `CAPTURED_PASS` | `EV-W20-401..402` | `planner` |

## 3) KPI rules

- `CAPTURED_PASS` chỉ hợp lệ khi `actual` có dữ liệu numeric hoặc output command tương ứng.
- `BLOCKED_ENV` bắt buộc có blocker, owner, ETA và điều kiện rerun.
- KPI mandatory fail/block thì verdict mặc định `NO-GO`.
