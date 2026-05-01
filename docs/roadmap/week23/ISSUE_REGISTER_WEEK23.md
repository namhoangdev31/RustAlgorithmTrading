# Issue Register W23 - Final-Phase Gate 3

## 1) Status taxonomy

- Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`.
- Gate blockers: moi P0 open hoac P1 unowned deu chan `GO`.

## 2) Issues

| Issue ID | Severity | Status | Owner | ETA | Blocking of | Evidence ID | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| `W23-ISS-001` | P0 | `NEW` | `tester` | `Pha 3` | Full cross-runtime/e2e gate | `EV-W23-201` | close all e2e blockers + rerun | e2e pass `100%` |
| `W23-ISS-002` | P0 | `NEW` | `ops` | `Pha 3` | Soak gate | `EV-W23-202` | stabilize soak path + rerun | soak pass `100%` |
| `W23-ISS-003` | P0 | `NEW` | `coder` | `Pha 3` | Fault-injection gate | `EV-W23-203` | harden recovery and rerun faults | fault-injection pass `100%` |
| `W23-ISS-004` | P1 | `NEW` | `tester` | `Pha 4` | E2E/fault debt closure | `EV-W23-204` | triage and close debt backlog | debt open `=0` |
| `W23-ISS-005` | P1 | `NEW` | `planner` | `Pha 4` | Release blocker taxonomy | `EV-W23-208` | complete blocker mapping | taxonomy complete |
| `W23-ISS-006` | P1 | `NEW` | `tester` | `Pha 4` | Correlation/compliance quality | `EV-W23-205`,`EV-W23-206` | fix coverage/findings and rerun audits | coverage>=99%, findings=0 |
| `W23-ISS-007` | P1 | `NEW` | `tester` | `Pha 5` | Regression guard | `EV-W23-301..306` | rerun W09-W22 guardrail slices | regression guard pass |
| `W23-ISS-008` | P1 | `NEW` | `planner` | `Pha 6` | Final verdict consistency | `EV-W23-401`,`EV-W23-402` | strict artifact reconciliation | one final verdict |
| `W23-ISS-009` | P1 | `NEW` | `planner` | `Pha 7` | W24 handoff | `EV-W23-402` | complete W24 priorities/guardrails | start pack complete |
| `W23-ISS-010` | P1 | `NEW` | `planner` | `Pha 5` | Budget governance | `EV-W23-209` | add escalation record when required | budget within threshold or approved escalation |
| `W23-ISS-011` | P2 | `NEW` | `ops` | `Pha 5` | Gate throughput | `EV-W23-210` | capture gate toil watermark | throughput watermark captured |
| `W23-ISS-012` | P2 | `NEW` | `planner` | `Pha 6` | Audit linkage | `EV-W23-205`,`EV-W23-206` | complete evidence linkage | linkage complete |

## 3) Gate blocker policy

- `W23-ISS-001..003` phai `DONE` truoc gate lock.
- `P0 open = 0`, `P1 unowned = 0`.
- Khong con mandatory issue o trang thai `NEW/IN_PROGRESS/BLOCKED` tai gate cutoff.
