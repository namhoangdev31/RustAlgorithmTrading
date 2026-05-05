# Issue Register W19 - Safety Guardrails

## 1) Status taxonomy

- Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`.
- Gate blockers: mọi P0 open hoặc P1 unowned đều chặn `GO`.

## 2) Issues

| Issue ID | Severity | Status | Owner | ETA | Blocking of | Evidence ID | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| `W19-ISS-001` | P0 | `DONE` | `ops` | `Pha 3` | Kill-switch SLA | `EV-W19-201` | optimize safety trigger chain and rerun latency capture | response `<=60s` |
| `W19-ISS-002` | P0 | `DONE` | `tester` | `Pha 3` | Risk-off determinism | `EV-W19-202` | complete mandatory playbook matrix and rerun | mandatory scenarios pass |
| `W19-ISS-003` | P0 | `DONE` | `coder` | `Pha 3` | Safety rollback recoverability | `EV-W19-203`,`EV-W19-209` | harden rollback flow and rerun drills | rollback success `100%` |
| `W19-ISS-004` | P1 | `DONE` | `planner` | `Pha 4` | Triage completeness | `EV-W19-204` | enforce owner/ETA/mitigation mapping | triage completeness `100%` |
| `W19-ISS-005` | P1 | `DONE` | `planner` | `Pha 4` | Risk boundary integrity | `EV-W19-205` | lock boundaries + mitigation mapping | unmitigated breach `=0` |
| `W19-ISS-006` | P1 | `DONE` | `tester` | `Pha 4` | Fault-injection coverage | `EV-W19-206` | expand required scenario drills | coverage `100%` |
| `W19-ISS-007` | P1 | `DONE` | `tester` | `Pha 4` | Correlation continuity | `EV-W19-207`,`EV-W19-208` | fix missing propagation and rerun audits | coverage `>=99%`, findings `0` |
| `W19-ISS-008` | P1 | `DONE` | `tester` | `Pha 5` | Regression guard | `EV-W19-301..306` | rerun W09-W18 guardrail slices | regression guard pass |
| `W19-ISS-009` | P1 | `DONE` | `planner` | `Pha 6` | Final verdict consistency | `EV-W19-401`,`EV-W19-402` | strict artifact reconciliation | one final verdict |
| `W19-ISS-010` | P1 | `DONE` | `planner` | `Pha 7` | W20 handoff | `EV-W19-402` | complete W20 priorities/guardrails | start pack complete |
| `W19-ISS-011` | P1 | `DONE` | `planner` | `Pha 5` | Budget governance | `EV-W19-106`,`EV-W19-402` | escalation approved for file-count drift in shared W17-W20 workspace; rerun profile remains green | budget within threshold or approved escalation |
| `W19-ISS-012` | P2 | `DONE` | `ops` | `Pha 5` | Ops throughput | `EV-W19-210` | capture safety toil watermark | throughput watermark captured |
| `W19-ISS-013` | P2 | `DONE` | `planner` | `Pha 6` | Audit linkage | `EV-W19-207`,`EV-W19-208` | complete evidence linkage | linkage complete |

## 3) Gate blocker policy

- `W19-ISS-001..003` phải `DONE` trước gate lock.
- `P0 open = 0`, `P1 unowned = 0`.
- Không còn mandatory issue ở trạng thái `NEW/IN_PROGRESS/BLOCKED` tại gate cutoff.
