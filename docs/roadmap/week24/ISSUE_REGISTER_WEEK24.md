# Issue Register W24 - Final-Phase Gate 4

## 1) Status taxonomy

- Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`.
- Gate blockers: moi P0 open hoac P1 unowned deu chan `GO`.

## 2) Issues

| Issue ID | Severity | Status | Owner | ETA | Blocking of | Evidence ID | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| `W24-ISS-001` | P0 | `NEW` | `tester` | `Pha 3` | Full regression gate | `EV-W24-201` | close all regression blockers + rerun | regression pass `100%` |
| `W24-ISS-002` | P0 | `NEW` | `planner` | `Pha 3` | Controlled live ready gate | `EV-W24-202` | close release-readiness gaps | release gate pass `100%` |
| `W24-ISS-003` | P0 | `NEW` | `ops` | `Pha 3` | Rollback readiness | `EV-W24-203` | rerun rollback rehearsal and capture evidence | rollback readiness `100%` |
| `W24-ISS-004` | P1 | `NEW` | `planner` | `Pha 4` | Release blocker closure | `EV-W24-204` | map and close all blockers | blockers open `=0` |
| `W24-ISS-005` | P1 | `NEW` | `tester` | `Pha 4` | Correlation/compliance quality | `EV-W24-206` | fix coverage/findings and rerun audits | coverage>=99%, findings=0 |
| `W24-ISS-006` | P1 | `NEW` | `tester` | `Pha 5` | Regression guard | `EV-W24-301..306` | rerun W09-W23 guardrail slices | regression guard pass |
| `W24-ISS-007` | P1 | `NEW` | `planner` | `Pha 6` | Final verdict consistency | `EV-W24-401`,`EV-W24-402` | strict artifact reconciliation | one final verdict |
| `W24-ISS-008` | P1 | `NEW` | `planner` | `Pha 7` | Final approval | `EV-W24-205` | complete approval checklist | approval complete |
| `W24-ISS-009` | P1 | `NEW` | `planner` | `Pha 5` | Budget governance | `EV-W24-209` | add escalation record when required | budget within threshold or approved escalation |
| `W24-ISS-010` | P2 | `NEW` | `ops` | `Pha 5` | Release throughput | `EV-W24-210` | capture release toil watermark | throughput watermark captured |
| `W24-ISS-011` | P2 | `NEW` | `planner` | `Pha 6` | Audit linkage | `EV-W24-206`,`EV-W24-402` | complete evidence linkage | linkage complete |
| `W24-ISS-012` | P2 | `NEW` | `planner` | `Pha 7` | Post-roadmap watchlist | `EV-W24-208` | complete watchlist | watchlist complete |

## 3) Gate blocker policy

- `W24-ISS-001..003` phai `DONE` truoc gate lock.
- `P0 open = 0`, `P1 unowned = 0`.
- Khong con mandatory issue o trang thai `NEW/IN_PROGRESS/BLOCKED` tai gate cutoff.
