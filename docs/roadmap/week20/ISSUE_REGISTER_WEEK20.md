# Issue Register W20 - Canary Launch (Hẹp)

## 1) Status taxonomy

- Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`.
- Gate blockers: mọi P0 open hoặc P1 unowned đều chặn `GO`.

## 2) Issues

| Issue ID | Severity | Status | Owner | ETA | Blocking of | Evidence ID | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| `W20-ISS-001` | P0 | `NEW` | `ops` | `Pha 3` | Risk boundary integrity | `EV-W20-202` | enforce boundary checks and rerun breach matrix | unmitigated breach `=0` |
| `W20-ISS-002` | P0 | `NEW` | `coder` | `Pha 3` | Kill-switch/rollback recoverability | `EV-W20-203`,`EV-W20-204` | harden launch safety path and rerun drills | kill-switch/rollback pass |
| `W20-ISS-003` | P0 | `NEW` | `tester` | `Pha 3` | Escalation correctness | `EV-W20-205` | enforce deterministic escalation states | mandatory scenarios pass |
| `W20-ISS-004` | P1 | `NEW` | `tester` | `Pha 4` | Launch scenario coverage | `EV-W20-201` | complete mandatory launch matrix | coverage `100%` |
| `W20-ISS-005` | P1 | `NEW` | `ops` | `Pha 4` | Boundary monitoring determinism | `EV-W20-209` | harden monitor signal mapping | deterministic outcomes |
| `W20-ISS-006` | P1 | `NEW` | `tester` | `Pha 4` | Fault-injection coverage | `EV-W20-206` | expand required scenario drills | coverage `100%` |
| `W20-ISS-007` | P1 | `NEW` | `tester` | `Pha 4` | Correlation continuity | `EV-W20-207`,`EV-W20-208` | fix missing propagation and rerun audits | coverage `>=99%`, findings `0` |
| `W20-ISS-008` | P1 | `NEW` | `tester` | `Pha 5` | Regression guard | `EV-W20-301..306` | rerun W09-W19 guardrail slices | regression guard pass |
| `W20-ISS-009` | P1 | `NEW` | `planner` | `Pha 6` | Final verdict consistency | `EV-W20-401`,`EV-W20-402` | strict artifact reconciliation | one final verdict |
| `W20-ISS-010` | P1 | `NEW` | `planner` | `Pha 7` | W21 handoff | `EV-W20-402` | complete W21 hard-gate priorities | start pack complete |
| `W20-ISS-011` | P1 | `NEW` | `planner` | `Pha 5` | Budget governance | `EV-W20-106`,`EV-W20-402` | track budget and add escalation record if needed | budget within threshold or approved escalation |
| `W20-ISS-012` | P2 | `NEW` | `ops` | `Pha 5` | Ops throughput | `EV-W20-210` | capture launch toil watermark | throughput watermark captured |
| `W20-ISS-013` | P2 | `NEW` | `planner` | `Pha 6` | Audit linkage | `EV-W20-207`,`EV-W20-208` | complete evidence linkage | linkage complete |

## 3) Gate blocker policy

- `W20-ISS-001..003` phải `DONE` trước gate lock.
- `P0 open = 0`, `P1 unowned = 0`.
- Không còn mandatory issue ở trạng thái `NEW/IN_PROGRESS/BLOCKED` tại gate cutoff.
