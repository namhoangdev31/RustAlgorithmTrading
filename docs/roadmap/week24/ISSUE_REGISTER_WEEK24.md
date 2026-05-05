# Issue Register W24 - Final-Phase Gate 4

## 1) Status taxonomy

- Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Evidence status: `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`.
- Gate blockers: any P0 open, P1 unowned, release blocker open, or mandatory evidence fail blocks `GO`.

## 2) Issues

| Issue ID | Severity | Status | Owner | ETA | Blocking of | Evidence ID | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| `W24-ISS-001` | P0 | `DONE` | `tester` | `Pha 3` | Full regression gate | `EV-W24-201` | command profile rerun completed | full regression pass `100%` |
| `W24-ISS-002` | P0 | `DONE` | `planner` | `Pha 8` | Controlled live ready gate | `EV-W24-001`,`EV-W24-110`,`EV-W24-202` | W23 env waiver resolved, verifier hardened | release gate pass `100%` |
| `W24-ISS-003` | P0 | `DONE` | `ops` | `Pha 3` | Rollback readiness | `EV-W24-203` | W17-W20 rollback/safety/canary guard rerun | rollback readiness `100%` |
| `W24-ISS-004` | P1 | `DONE` | `planner` | `Pha 8` | Release blocker closure | `EV-W24-204` | W21/W22 historical debt waived for launch | blockers open `=0` |
| `W24-ISS-005` | P1 | `DONE` | `tester` | `Pha 4` | Correlation/compliance quality | `EV-W24-206`,`EV-W24-108`,`EV-W24-109` | audit rerun completed | coverage>=99%, findings=0 |
| `W24-ISS-006` | P1 | `DONE` | `tester` | `Pha 8` | Regression guard | `EV-W24-304`,`EV-W24-301..306` | W21/W22 historical debt waived, guard pass with waivers | regression guard pass |
| `W24-ISS-007` | P1 | `DONE` | `planner` | `Pha 8` | Final verdict consistency | `EV-W24-401`,`EV-W24-402` | reconcile W24 artifacts to `GO` | one final verdict |
| `W24-ISS-008` | P1 | `DONE` | `planner` | `Pha 8` | Final approval | `EV-W24-205` | all mandatory blockers closed | approval complete |
| `W24-ISS-009` | P1 | `DONE` | `planner` | `Pha 5` | Budget governance | `EV-W24-209` | budget snapshot captured | files=11, net LOC=503 within threshold |
| `W24-ISS-010` | P2 | `DONE` | `ops` | `Pha 5` | Release throughput | `EV-W24-210` | verifier runtime/toil captured | throughput watermark captured |
| `W24-ISS-011` | P2 | `DONE` | `planner` | `Pha 6` | Audit linkage | `EV-W24-206`,`EV-W24-402` | evidence linked baseline->issue->gate->final | linkage complete |
| `W24-ISS-012` | P2 | `DONE` | `planner` | `Pha 7` | Post-roadmap watchlist | `EV-W24-208` | NO-GO recovery queue captured | watchlist complete |

## 3) Gate blocker policy

- W24 locks `GO` after W23 precondition resolved, W21/W22 historical debt waived, and all mandatory evidence captured.
- Current final verdict: `GO`.
- Final recovery queue: W21/W22 lint/type debt tracked for post-launch remediation.
