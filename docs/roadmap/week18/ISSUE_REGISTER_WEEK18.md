# Issue Register W18 - Canary Design

## 1) Status taxonomy

- Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`.
- Gate blockers: mọi P0 open hoặc P1 unowned đều chặn `GO`.

## 2) Issues

| Issue ID | Severity | Status | Owner | ETA | Blocking of | Evidence ID | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| `W18-ISS-001` | P0 | `NEW` | `tester` | `Pha 3` | Canary coverage | `EV-W18-201` | complete mandatory scenario matrix and rerun | coverage `100%` |
| `W18-ISS-002` | P0 | `NEW` | `coder` | `Pha 3` | Rollback recoverability | `EV-W18-202` | harden rollback flows and rerun required drills | rollback success `100%` |
| `W18-ISS-003` | P0 | `NEW` | `ops` | `Pha 3` | Breach handling determinism | `EV-W18-203` | enforce deterministic breach actions | breach handling pass |
| `W18-ISS-004` | P1 | `NEW` | `ops` | `Pha 4` | Kill-switch SLA | `EV-W18-204` | optimize risk-off response chain | response `<=60s` |
| `W18-ISS-005` | P1 | `NEW` | `planner` | `Pha 4` | Risk boundary integrity | `EV-W18-205` | lock boundaries + mitigation mapping | unmitigated breach `=0` |
| `W18-ISS-006` | P1 | `NEW` | `tester` | `Pha 4` | Fault-injection coverage | `EV-W18-206` | expand required scenario drills | coverage `100%` |
| `W18-ISS-007` | P1 | `NEW` | `tester` | `Pha 5` | Regression guard | `EV-W18-301..306` | rerun W09-W17 guardrail slices | regression guard pass |
| `W18-ISS-008` | P1 | `NEW` | `planner` | `Pha 6` | Final verdict consistency | `EV-W18-401`,`EV-W18-402` | strict artifact reconciliation | one final verdict |
| `W18-ISS-009` | P1 | `NEW` | `planner` | `Pha 7` | W19 handoff | `EV-W18-402` | complete W19 priorities/guardrails | start pack complete |
| `W18-ISS-010` | P1 | `NEW` | `planner` | `Pha 5` | Budget governance | `EV-W18-106`,`EV-W18-402` | track budget and add escalation record if needed | budget within threshold or approved escalation |
| `W18-ISS-011` | P2 | `NEW` | `ops` | `Pha 5` | Ops throughput | `EV-W18-209` | capture canary toil watermark | throughput watermark captured |
| `W18-ISS-012` | P2 | `NEW` | `planner` | `Pha 6` | Audit linkage | `EV-W18-207`,`EV-W18-208` | complete evidence linkage | linkage complete |

## 3) Gate blocker policy

- `W18-ISS-001..003` phải `DONE` trước gate lock.
- `P0 open = 0`, `P1 unowned = 0`.
- Không còn mandatory issue ở trạng thái `NEW/IN_PROGRESS/BLOCKED` tại gate cutoff.
