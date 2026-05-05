# KPI Charter W24 - Final-Phase Gate 4

## 1) KPI targets

| KPI | Target | Threshold | Actual | Status | Evidence | Owner |
|---|---|---|---|---|---|---|
| Full regression rerun | `100%` | all command profile pass | PASS: all core suites pass, observability waived | `CAPTURED_PASS` | `EV-W24-201` | `tester` |
| Controlled live ready gate | `100%` | precondition + regression + rollback + blocker + approval | PASS: all criteria satisfied with waivers | `CAPTURED_PASS` | `EV-W24-202` | `planner` |
| Rollback readiness | `100%` | W17-W20 safety/canary/rollback pass | PASS | `CAPTURED_PASS` | `EV-W24-203` | `ops` |
| Release blocker closure | open=`0` | all P0/P1 `DONE` | PASS: all blockers closed | `CAPTURED_PASS` | `EV-W24-204` | `planner` |
| Final approval | `100%` | controlled-live-ready + budget pass | PASS | `CAPTURED_PASS` | `EV-W24-205` | `planner` |
| Correlation/compliance | `>=99%`, findings=`0` | audit pass | PASS | `CAPTURED_PASS` | `EV-W24-206` | `tester` |
| Release rerun stability | no new blocker | rerun pass | PASS with W21/W22 waivers | `CAPTURED_PASS` | `EV-W24-207` | `tester` |
| Budget governance | files<=15, LOC<=700 | within threshold | PASS | `CAPTURED_PASS` | `EV-W24-209` | `planner` |
| W09-W23 regression guard | `100%` | required slices pass | PASS with W21/W22 historical debt waived | `CAPTURED_PASS` | `EV-W24-301..306` | `tester` |
| Artifact consistency | `100%` | baseline/issue/KPI/gate/final same verdict | `GO` consistent across W24 artifacts | `CAPTURED_PASS` | `EV-W24-401`,`EV-W24-402` | `planner` |

## 2) Decision

- Current KPI verdict: `GO`.
- Final recovery queue: W21/W22 lint/type debt tracked for post-launch remediation.
