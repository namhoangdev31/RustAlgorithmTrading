# Issue Register W17 - Staging Hardening

## 1) Status taxonomy

- Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`.
- Gate blockers: mọi P0 open hoặc P1 unowned đều chặn `GO`.

## 2) Issues

| Issue ID | Severity | Status | Owner | ETA | Blocking of | Evidence ID | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| `W17-ISS-001` | P0 | `DONE` | `tester` | `Pha 3` | Soak stability | `EV-W17-201` | stabilize soak-critical path and rerun mandatory set | soak mandatory scenarios pass |
| `W17-ISS-002` | P0 | `DONE` | `ops` | `Pha 3` | Kill-switch SLA | `EV-W17-202` | optimize response chain and rerun latency capture | response `<=60s` |
| `W17-ISS-003` | P0 | `DONE` | `coder` | `Pha 3` | Rollback recoverability | `EV-W17-203` | harden rollback flow and rerun drills | rollback success `100%` |
| `W17-ISS-004` | P1 | `DONE` | `planner` | `Pha 4` | Triage completeness | `EV-W17-204` | enforce owner/ETA/mitigation mapping | triage completeness `100%` |
| `W17-ISS-005` | P1 | `DONE` | `ops` | `Pha 4` | Alert quality under soak | `EV-W17-206` | tune thresholds and validate sample method | FP<=15%, FN critical=0 |
| `W17-ISS-006` | P1 | `DONE` | `tester` | `Pha 4` | Recovery consistency | `EV-W17-205`,`EV-W17-207` | run deterministic recovery drills | consistency pass |
| `W17-ISS-007` | P1 | `DONE` | `tester` | `Pha 5` | Regression guard | `EV-W17-301..306` | rerun W09-W16 guardrail slices | regression guard pass |
| `W17-ISS-008` | P1 | `DONE` | `planner` | `Pha 6` | Final verdict consistency | `EV-W17-401`,`EV-W17-402` | strict artifact reconciliation | one final verdict |
| `W17-ISS-009` | P1 | `DONE` | `planner` | `Pha 7` | W18 handoff | `EV-W17-402` | complete W18 priorities/guardrails | start pack complete |
| `W17-ISS-010` | P1 | `DONE` | `planner` | `Pha 5` | Budget governance | `EV-W17-106`,`EV-W17-402` | escalation recorded for file-count overrun (`42 files`, `net +34 LOC`) | approved escalation captured before gate lock |
| `W17-ISS-011` | P2 | `DONE` | `ops` | `Pha 5` | Ops throughput | `EV-W17-210` | capture soak toil watermark | throughput watermark captured |
| `W17-ISS-012` | P2 | `DONE` | `planner` | `Pha 6` | Audit linkage | `EV-W17-208`,`EV-W17-209` | complete evidence linkage | linkage complete |

## 3) Gate blocker policy

- `W17-ISS-001..003` phải `DONE` trước gate lock.
- `P0 open = 0`, `P1 unowned = 0`.
- Không còn mandatory issue ở trạng thái `NEW/IN_PROGRESS/BLOCKED` tại gate cutoff.
