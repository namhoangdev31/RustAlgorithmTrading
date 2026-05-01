# KPI Charter W19 - Safety Guardrails

## 1) Charter scope

W19 đo mức trưởng thành safety guardrails với trọng tâm kill-switch response, risk-off determinism, rollback recoverability và governance consistency.

## 2) KPI table

| KPI | Target | Measurement | Actual | Status | Evidence ID | Owner |
|---|---:|---|---|---|---|---|
| Kill-switch response | `<=60s` | max response latency | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W19-201` | `ops` |
| Risk-off playbook pass rate | `100%` mandatory scenarios | passed scenarios / required scenarios | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W19-202` | `tester` |
| Rollback rehearsal success | `100%` | successful rollback drills / required drills | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W19-203` | `coder` |
| Triage completeness | `100%` | triaged incidents with owner+ETA+mitigation / total incidents | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W19-204` | `planner` |
| Risk boundary integrity | unmitigated breach `=0` | unmitigated breaches count | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W19-205` | `planner` |
| Fault-injection coverage | `100%` required scenarios | covered scenarios / required scenarios | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W19-206` | `tester` |
| Correlation coverage | `>=99%` | critical event sample coverage | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W19-207` | `tester` |
| Compliance findings | `0` | findings count | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W19-208` | `tester` |
| W09-W18 regression guard | `100%` | required slices pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W19-301..306` | `tester` |
| Artifact consistency | `100%` | baseline/issue/KPI/gate/final same verdict | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W19-401`,`EV-W19-402` | `planner` |

## 3) KPI rules

- `CAPTURED_PASS` chỉ hợp lệ khi `actual` có dữ liệu numeric hoặc output command tương ứng.
- `BLOCKED_ENV` bắt buộc có blocker, owner, ETA và điều kiện rerun.
- KPI mandatory fail/block thì verdict mặc định `NO-GO`.
